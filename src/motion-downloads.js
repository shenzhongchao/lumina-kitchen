import { readFile, writeFile, mkdir, open, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const fail = message => Object.assign(new Error(message), { status: 400 })
export class MotionDownloads {
  constructor({ root, manifestPath, baseUrl = '', allowLocal = false, fetchImpl = fetch }) {
    Object.assign(this, { root, baseUrl, allowLocal, fetchImpl })
    this.entries = []; this.cached = new Set(); this.inflight = new Map(); this.failures = []
    this.phase = 'idle'; this.enabled = false; this.controller = null; this.task = null; this.actions = Promise.resolve()
    this.ready = this.initialize(manifestPath).catch(error => { this.error = error.message; this.phase = 'error' })
  }
  async initialize(path) {
    const manifest = JSON.parse(await readFile(path, 'utf8'))
    if (manifest.format !== 1 || !Array.isArray(manifest.entries) || manifest.entries.length > 500) throw fail('动态演示清单无效')
    const ids = new Set()
    this.entries = manifest.entries.map(e => {
      if (!/^[\w-]+$/.test(e.id) || ids.has(e.id) || e.file !== `${e.id}.gif` || !/^[a-f0-9]{64}$/.test(e.sha256) || !Number.isSafeInteger(e.bytes) || e.bytes < 6 || e.bytes > 64 * 1024 * 1024) throw fail('动态演示清单包含无效文件')
      ids.add(e.id); return e
    })
    await mkdir(this.root, { recursive: true })
    // Verify persisted bytes, not just filenames; corrupt files are downloaded again.
    for (const e of this.entries) {
      try { const b = await readFile(this.path(e)); if (this.valid(b, e)) this.cached.add(e.id) } catch {}
    }
    try { this.enabled = JSON.parse(await readFile(join(this.root, 'settings.json'), 'utf8')).enabled === true && this.complete() } catch {}
    this.phase = this.complete() ? 'complete' : 'idle'
  }
  path(e) { return join(this.root, `${e.sha256}.gif`) }
  valid(b, e) { return b.length === e.bytes && /^GIF8[79]a$/.test(b.subarray(0, 6).toString()) && createHash('sha256').update(b).digest('hex') === e.sha256 }
  complete() { return this.entries.length > 0 && this.cached.size === this.entries.length }
  url(file) {
    const url = new URL(file, this.baseUrl.endsWith('/') ? this.baseUrl : this.baseUrl + '/')
    if (url.username || url.password || url.hash || (url.protocol !== 'https:' && !(this.allowLocal && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) throw fail('动态演示源必须使用 HTTPS')
    return url
  }
  status() {
    const totalBytes = this.entries.reduce((n, e) => n + e.bytes, 0)
    const cachedBytes = this.entries.reduce((n, e) => n + (this.cached.has(e.id) ? e.bytes : 0), 0)
    return { phase: this.phase, enabled: this.enabled, configured: Boolean(this.baseUrl), total: this.entries.length,
      completed: this.cached.size, totalBytes, downloadedBytes: cachedBytes + [...this.inflight.values()].reduce((a, b) => a + b, 0),
      cachedBytes, failures: this.failures, error: this.error || null,
      assets: this.enabled ? Object.fromEntries(this.entries.filter(e => this.cached.has(e.id)).map(e => [e.id, `${e.sha256}.gif`])) : {} }
  }
  async saveEnabled(value) {
    await writeFile(join(this.root, 'settings.json.tmp'), JSON.stringify({ enabled: value }))
    await rename(join(this.root, 'settings.json.tmp'), join(this.root, 'settings.json'))
    this.enabled = value
  }
  action(action) {
    const task = this.actions.catch(() => {}).then(() => this.perform(action))
    this.actions = task
    return task
  }
  async perform(action) {
    await this.ready
    if (action === 'cancel') { if (this.controller) { this.phase = 'cancelling'; this.controller.abort() } return this.status() }
    if (this.task) return this.status()
    if (action === 'static') { await this.saveEnabled(false); return this.status() }
    if (action !== 'start') throw fail('不支持的动态演示操作')
    if (this.error && !this.entries.length) throw fail(this.error)
    if (!this.entries.length) throw fail('没有可下载的运镜演示')
    if (this.complete()) { await this.saveEnabled(true); this.phase = 'complete'; return this.status() }
    if (!this.baseUrl) throw fail('动态演示源尚未配置，当前可继续查看静态图')
    this.url(this.entries[0].file)
    this.phase = 'downloading'; this.error = null; this.failures = []
    this.controller = new AbortController()
    this.task = this.run(this.controller.signal).catch(error => { this.phase = 'error'; this.error = error.message })
      .finally(() => { this.inflight.clear(); this.controller = null; this.task = null })
    return this.status()
  }
  async run(signal) {
    const queue = this.entries.filter(e => !this.cached.has(e.id))
    const worker = async () => {
      while (queue.length && !signal.aborted) {
        const e = queue.shift()
        try { await this.download(e, signal) }
        catch (error) { if (!signal.aborted) this.failures.push({ id: e.id, message: error.message }) }
      }
    }
    await Promise.all([worker(), worker(), worker()])
    if (signal.aborted) this.phase = 'cancelled'
    else if (this.complete()) { await this.saveEnabled(true); this.phase = 'complete' }
    else this.phase = 'error'
  }
  async download(e, signal) {
    const part = this.path(e) + '.part'
    let handle
    const timed = AbortSignal.any([signal, AbortSignal.timeout(120_000)])
    try {
      // Redirects are allowed only to HTTPS (e.g. GitHub Release asset host).
      let url = this.url(e.file), response
      for (let i = 0; i < 6; i++) {
        response = await this.fetchImpl(url, { signal: timed, redirect: 'manual' })
        if (![301, 302, 303, 307, 308].includes(response.status)) break
        const location = response.headers.get('location')
        await response.body?.cancel()
        if (!location) throw fail('下载重定向无效')
        url = new URL(location, url)
        if (url.protocol !== 'https:' || url.username || url.password) throw fail('下载重定向不安全')
      }
      if (!response.ok || !response.body) throw fail(`下载失败（HTTP ${response.status}）`)
      const length = response.headers.get('content-length')
      if (length && Number(length) !== e.bytes) { await response.body.cancel(); throw fail('文件大小与清单不一致') }
      handle = await open(part, 'w')
      const hash = createHash('sha256'); let size = 0; let header = Buffer.alloc(0)
      for await (const chunk of response.body) {
        timed.throwIfAborted(); size += chunk.length
        if (size > e.bytes) throw fail('文件超过清单大小')
        if (header.length < 6) header = Buffer.concat([header, chunk]).subarray(0, 6)
        hash.update(chunk); await handle.writeFile(chunk); this.inflight.set(e.id, size)
      }
      if (size !== e.bytes || hash.digest('hex') !== e.sha256 || !/^GIF8[79]a$/.test(header.toString())) throw fail('文件校验失败，请重试')
      timed.throwIfAborted()
      await handle.close(); handle = null
      await rename(part, this.path(e)); this.cached.add(e.id); this.inflight.delete(e.id)
    } finally { await handle?.close(); await rm(part, { force: true }); this.inflight.delete(e.id) }
  }
  async asset(file) {
    await this.ready
    const e = this.entries.find(e => `${e.sha256}.gif` === file && this.cached.has(e.id))
    if (!e) throw Object.assign(new Error('动态演示尚未下载'), { status: 404 })
    return this.path(e)
  }
  async close() { this.controller?.abort(); await this.task }
}

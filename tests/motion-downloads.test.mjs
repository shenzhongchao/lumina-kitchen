import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { MotionDownloads } from '../src/motion-downloads.js'

async function fixture(t, fetchImpl, count = 4) {
  const root = await mkdtemp(join(tmpdir(), 'lumina-motion-test-'))
  const data = Buffer.from('GIF89a' + 'x'.repeat(100))
  const entries = Array.from({ length: count }, (_, i) => {
    const bytes = Buffer.concat([data, Buffer.from(String(i))])
    return { id: `motion-${i}`, file: `motion-${i}.gif`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
  })
  const manifestPath = join(root, 'manifest.json')
  await writeFile(manifestPath, JSON.stringify({ format: 1, entries }))
  const options = { root: join(root, 'cache'), manifestPath, baseUrl: 'https://example.test/v1/', fetchImpl: (url, options) => {
    const i = Number(url.pathname.match(/motion-(\d+)/)[1])
    return fetchImpl(Buffer.concat([data, Buffer.from(String(i))]), i, options)
  } }
  const service = new MotionDownloads(options)
  await service.ready
  t.after(async () => { await service.close(); await rm(root, { recursive: true, force: true }) })
  return { service, options, entries }
}

test('batch failures keep verified files; retry skips them; restart is offline and static mode persists', async t => {
  let fail = true; const calls = []
  const { service, options, entries } = await fixture(t, async (bytes, i) => {
    calls.push(i); return new Response(fail && i === 1 ? 'unavailable' : bytes, { status: fail && i === 1 ? 503 : 200 })
  })
  await Promise.all([service.action('start'), service.action('start')]); await service.task
  assert.equal(service.status().phase, 'error'); assert.equal(service.status().completed, 3)
  assert.equal(service.status().enabled, false); assert.deepEqual(service.status().assets, {})
  assert.equal(calls.length, 4)
  fail = false; await service.action('start'); await service.task
  assert.equal(calls.length, 5); assert.equal(calls.at(-1), 1)
  assert.equal(service.status().enabled, true)
  assert.equal(service.status().downloadedBytes, service.status().totalBytes)
  const restarted = new MotionDownloads({ ...options, baseUrl: '', fetchImpl: () => { throw new Error('offline') } })
  await restarted.ready
  assert.equal(restarted.status().enabled, true)
  assert.equal(Object.keys(restarted.status().assets).length, 4)
  assert.ok(await readFile(await restarted.asset(entries[0].sha256 + '.gif')))
  await restarted.action('static'); assert.equal(restarted.status().enabled, false)
  const again = new MotionDownloads({ ...options, baseUrl: '' }); await again.ready
  assert.equal(again.status().enabled, false)
  await again.action('start'); assert.equal(again.status().enabled, true)
})

test('cancel aborts streams, clears partials, and retry downloads only missing files', async t => {
  let slow = true; let started
  const firstChunk = new Promise(r => { started = r })
  const { service, options } = await fixture(t, async (bytes, i, { signal }) => {
    if (!slow) return new Response(bytes)
    return new Response(new ReadableStream({ start(controller) {
      controller.enqueue(bytes.subarray(0, 8)); started()
      signal.addEventListener('abort', () => controller.error(signal.reason), { once: true })
    } }))
  })
  await service.action('start'); await firstChunk
  await service.action('cancel'); await service.task
  assert.equal(service.status().phase, 'cancelled')
  assert.equal((await readdir(options.root)).filter(x => x.endsWith('.part')).length, 0)
  slow = false; await service.action('start'); await service.task
  assert.equal(service.status().phase, 'complete')
})

test('corrupt cached bytes and invalid download content never count as valid cache', async t => {
  const { service, options, entries } = await fixture(t, async bytes => new Response(bytes), 1)
  await service.action('start'); await service.task
  await writeFile(join(options.root, entries[0].sha256 + '.gif'), Buffer.alloc(entries[0].bytes))
  const corrupt = new MotionDownloads({ ...options, fetchImpl: async () => new Response(Buffer.alloc(entries[0].bytes)) })
  await corrupt.ready; assert.equal(corrupt.status().completed, 0); assert.equal(corrupt.status().enabled, false)
  await corrupt.action('start'); await corrupt.task
  assert.equal(corrupt.status().failures.length, 1); assert.equal(corrupt.status().completed, 0)
  await assert.rejects(corrupt.asset('../manifest.json'), { status: 404 })
})

test('missing source makes no request; unsafe redirects and oversize files are rejected', async t => {
  const { service, options } = await fixture(t, async () => new Response('x'.repeat(1000)), 1)
  service.baseUrl = ''; await assert.rejects(service.action('start'), /尚未配置/)
  service.baseUrl = 'http://127.0.0.1/'; await assert.rejects(service.action('start'), /HTTPS/)
  service.baseUrl = options.baseUrl
  await service.action('start'); await service.task; assert.equal(service.status().completed, 0)
  service.fetchImpl = async () => new Response('', { status: 302, headers: { location: 'http://127.0.0.1/private' } })
  await service.action('start'); await service.task; assert.match(service.status().failures[0].message, /重定向不安全/)
})

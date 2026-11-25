import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { mediaError } from './errors.js'
import { IMAGE_SIZES, IMAGE_QUALITIES, IMAGE_COMPLEXITIES } from './openai-image.js'
import { H3_MODEL } from './h3.js'
import { defaultProtocol, legacyProtocol, mediaPreset, MEDIA_PRESETS } from './providers.js'

const ENV = {
  image: { baseUrl: ['LUMINA_OPENAI_BASE_URL', 'OPENAI_BASE_URL'], model: ['LUMINA_IMAGE_MODEL'], size: ['LUMINA_IMAGE_SIZE'], quality: ['LUMINA_IMAGE_QUALITY'], complexity: ['LUMINA_IMAGE_COMPLEXITY'] },
  video: {},
}
const trimmed = value => typeof value === 'string' ? value.trim() : ''
const invalid = message => { throw mediaError(message, 400, 'SERVICE_CONFIG') }
const presetKeyEnvironment = preset => preset.keyEnv.find(name => trimmed(process.env[name]))
export function serviceUrl(value) {
  let url
  try { url = new URL(value) } catch { invalid('请填写完整的 API 地址') }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) invalid('API 地址必须使用 HTTPS，本机调试除外')
  if (url.username || url.password || url.search || url.hash) invalid('API 地址不能包含账号、密码、查询参数或片段；密钥请填在独立字段')
  return url.href.replace(/\/+$/, '')
}

function profileBaseUrl(value, protocol) {
  const baseUrl = serviceUrl(value)
  const path = protocol === 'ark-seedream' ? '/images/generations'
    : protocol === 'ark-seedance' ? '/contents/generations/tasks' : ''
  return path && baseUrl.endsWith(path) ? baseUrl.slice(0, -path.length) : baseUrl
}

// Credentials are host-only. Old credential versions remain available to unfinished jobs.
export class MediaSettings {
  constructor(root, legacy) {
    this.root = root
    this.file = join(root, 'media-services.json')
    this.legacy = legacy
    this.state = { version: 1, revision: 0, profiles: [], defaults: { image: null, video: null }, credentials: {} }
    this.writing = Promise.resolve()
    this.ready = this.load()
  }
  async load() {
    let normalized = false
    try {
      const state = JSON.parse(await readFile(this.file, 'utf8'))
      if (![1, 2].includes(state?.version) || !Number.isInteger(state.revision) || state.revision < 0 || !Array.isArray(state.profiles) || !state.defaults || !state.credentials || typeof state.credentials !== 'object' || Array.isArray(state.credentials)) throw new Error('invalid')
      const ids = new Set()
      for (const p of state.profiles) {
        if (!p || !['image', 'video'].includes(p.kind) || typeof p.id !== 'string' || ids.has(p.id) || !trimmed(p.name) || !trimmed(p.model)) throw new Error('invalid profile')
        const legacyRef = (p.protocol === legacyProtocol(p.kind) || p.protocol === 'minimax-video') && p.credentialRef === `legacy:${p.kind}`
        if (p.credentialRef != null && !legacyRef && (!Object.hasOwn(state.credentials, p.credentialRef) || !trimmed(state.credentials[p.credentialRef]))) throw new Error('invalid credential reference')
        if (mediaPreset(p.protocol)?.kind !== p.kind) throw new Error('invalid protocol')
        const baseUrl = profileBaseUrl(p.baseUrl, p.protocol)
        if (baseUrl !== p.baseUrl && ['ark-seedream', 'ark-seedance'].includes(p.protocol)) {
          p.baseUrl = baseUrl
          normalized = true
        }
        ids.add(p.id)
      }
      for (const kind of ['image', 'video']) if (state.defaults[kind] !== null && !state.profiles.some(p => p.id === state.defaults[kind] && p.kind === kind)) throw new Error('invalid default')
      this.state = state
    } catch (error) {
      if (error.code !== 'ENOENT') throw mediaError('生成服务配置无法读取，请先备份并检查 media-services.json', 500, 'SERVICE_STORE')
    }
    if (this.state.version === 1 || normalized) {
      const draft = structuredClone(this.state)
      if (draft.version === 1) {
        this.#migrateDefaults(draft)
        draft.version = 2
      }
      if (normalized) draft.revision++
      await this.#persist(draft)
    }
  }
  #legacyConnection(kind) {
    const c = this.legacy
    if (kind === 'image') {
      return { id: null, name: '原有图片配置', kind, protocol: 'openai-image', baseUrl: c.openaiBaseUrl, model: c.imageModel, size: c.imageSize || '', quality: c.imageQuality, complexity: c.imageComplexity || '', credentialRef: 'legacy:image' }
    }
    return { id: null, name: '原有视频配置', kind, protocol: 'minimax-video', baseUrl: MEDIA_PRESETS['minimax-video'].baseUrl, model: H3_MODEL, credentialRef: 'legacy:video' }
  }
  #migrateDefaults(draft) {
    for (const kind of ['image', 'video']) {
      if (draft.defaults[kind]) continue
      const connection = kind === 'video'
        ? { kind, protocol: 'minimax-video', baseUrl: MEDIA_PRESETS['minimax-video'].baseUrl, model: H3_MODEL, ...(this.legacy.minimaxKey ? { credentialRef: 'legacy:video' } : {}) }
        : this.#legacyConnection(kind)
      const preset = MEDIA_PRESETS[connection.protocol]
      if (!this.key(connection) && !preset.keyEnv.some(name => trimmed(process.env[name]))) continue
      try { connection.baseUrl = serviceUrl(connection.baseUrl) } catch { continue }
      const id = randomUUID()
      let name = preset.name
      for (let suffix = 2; draft.profiles.some(p => p.kind === kind && p.name === name); suffix++) name = `${preset.name} ${suffix}`
      draft.profiles.push({ ...connection, id, name })
      draft.defaults[kind] = id
    }
  }
  resolve(kind, legacyOnly = false) {
    const selected = legacyOnly ? this.#legacyConnection(kind) : this.state.profiles.find(p => p.kind === kind && p.id === this.state.defaults[kind])
    return selected ? this.#resolveConnection(selected) : null
  }
  #resolveConnection(selected) {
    const { kind } = selected
    const result = { ...selected, overrides: {} }
    const preset = MEDIA_PRESETS[result.protocol]
    const isLegacy = result.protocol === legacyProtocol(kind)
    if (isLegacy) {
      for (const [field, names] of Object.entries(ENV[kind])) {
        const name = names.find(name => trimmed(process.env[name]))
        if (!name) continue
        result.overrides[field] = name
        result[field] = trimmed(process.env[name])
      }
    }
    // Official provider keys must not follow a profile to a third-party host.
    if ((!selected.credentialRef || selected.credentialRef === `legacy:${kind}`) && (isLegacy || new URL(result.baseUrl).origin === new URL(preset.baseUrl).origin)) {
      const name = presetKeyEnvironment(preset)
      if (name) result.credentialRef = `env:${name}`
    }
    return result
  }
  key(connection) {
    const ref = connection?.credentialRef || ''
    if (ref.startsWith('env:')) return trimmed(process.env[ref.slice(4)])
    if (ref === 'legacy:image') return this.legacy.openaiKey
    if (ref === 'legacy:video') return this.legacy.minimaxKey
    return this.state.credentials[ref] || ''
  }
  publicConnection(connection) {
    if (!connection) return null
    const safe = Object.fromEntries(['id', 'name', 'kind', 'protocol', 'baseUrl', 'model', 'size', 'quality', 'complexity', 'overrides'].filter(key => connection[key] !== undefined).map(key => [key, connection[key]]))
    return {
      ...safe,
      configured: Boolean(this.key(connection)),
      ...(connection.credentialRef?.startsWith('env:') && { keyEnvironment: connection.credentialRef.slice(4) }),
    }
  }
  view() {
    const presets = Object.fromEntries(Object.entries(MEDIA_PRESETS).map(([protocol, preset]) => [protocol, {
      ...preset,
      keyEnvironment: presetKeyEnvironment(preset) ?? null,
      keyRequiresPresetOrigin: protocol !== legacyProtocol(preset.kind),
    }]))
    return {
      revision: this.state.revision,
      presets,
      defaults: { ...this.state.defaults },
      profiles: this.state.profiles.map(profile => {
        const connection = this.#resolveConnection(profile)
        return {
          ...this.publicConnection(profile),
          keyAvailable: Boolean(this.key(connection)),
          keyEnvironment: connection.credentialRef?.startsWith('env:') ? connection.credentialRef.slice(4) : null,
        }
      }),
      effective: Object.fromEntries(['image', 'video'].map(kind => [kind, this.publicConnection(this.resolve(kind))])),
    }
  }
  async #persist(draft) {
    await mkdir(this.root, { recursive: true })
    const temp = `${this.file}.${randomUUID()}.tmp`
    try {
      await writeFile(temp, JSON.stringify(draft, null, 2), { encoding: 'utf8', mode: 0o600 })
      await rename(temp, this.file)
    } finally { await rm(temp, { force: true }).catch(() => {}) }
    this.state = draft
  }
  async update(body) {
    await this.ready
    const task = this.writing.catch(() => {}).then(async () => {
      if (body.expectedRevision !== this.state.revision) throw mediaError('服务配置已在其他页面更新，请重新加载后再保存；当前草稿仍保留', 409, 'SERVICE_CONFLICT')
      const draft = structuredClone(this.state)
      const kind = body.kind
      if (!['image', 'video'].includes(kind)) invalid('请选择图片或视频服务')
      if (body.action === 'default') {
        if (body.id !== null && !draft.profiles.some(p => p.id === body.id && p.kind === kind)) invalid('找不到这个服务配置')
        draft.defaults[kind] = body.id
      } else if (body.action === 'save') {
        const input = body.profile || {}
        const previous = input.id ? draft.profiles.find(p => p.id === input.id && p.kind === kind) : null
        if (input.id && !previous) invalid('找不到这个服务配置')
        const protocol = input.protocol ?? previous?.protocol ?? defaultProtocol(kind)
        const preset = mediaPreset(protocol)
        if (preset?.kind !== kind) invalid('请选择适用于当前生成类型的服务')
        if (previous && previous.protocol !== protocol) invalid('更换服务类型时请添加一组新配置')
        const name = trimmed(input.name)
        if (!name || name.length > 60) invalid('服务名称须为 1–60 个字符')
        if (draft.profiles.some(p => p.id !== previous?.id && p.kind === kind && p.name === name)) invalid('同类服务名称已存在，请换一个名称')
        if (!previous && draft.profiles.length >= 50) invalid('最多保存 50 组服务配置')
        const apiKey = trimmed(input.apiKey)
        if (apiKey.length > 4096 || /[\r\n]/.test(apiKey)) invalid('密钥格式无效')
        let credentialRef = previous?.credentialRef
        if (apiKey) { credentialRef = randomUUID(); draft.credentials[credentialRef] = apiKey }
        const profile = {
          id: previous?.id || randomUUID(), kind, name,
          protocol,
          baseUrl: profileBaseUrl(trimmed(input.baseUrl), protocol), credentialRef,
          model: protocol === 'minimax-video' ? H3_MODEL : trimmed(input.model ?? preset.model),
        }
        if (!profile.model || profile.model.length > 160 || /[\r\n]/.test(profile.model)) invalid('请填写有效的模型 ID')
        if (protocol === 'openai-image') {
          profile.size = trimmed(input.size)
          profile.quality = trimmed(input.quality) || 'medium'
          profile.complexity = trimmed(input.complexity)
          if (profile.size && !IMAGE_SIZES.includes(profile.size)) invalid('不支持这个图片尺寸')
          if (!IMAGE_QUALITIES.includes(profile.quality)) invalid('不支持这个图片质量')
          if (profile.complexity && !IMAGE_COMPLEXITIES.includes(profile.complexity)) invalid('不支持这个图片复杂度')
        }
        draft.profiles = [...draft.profiles.filter(p => p.id !== profile.id), profile]
      } else if (body.action === 'delete') {
        if (!draft.profiles.some(p => p.id === body.id && p.kind === kind)) invalid('找不到这个服务配置')
        if (draft.defaults[kind] === body.id) invalid('请先切换默认服务，再删除此配置')
        draft.profiles = draft.profiles.filter(p => p.id !== body.id)
      } else invalid('不支持的配置操作')
      draft.revision++
      await this.#persist(draft)
      return this.view()
    })
    this.writing = task
    return task
  }
}

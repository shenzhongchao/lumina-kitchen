import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MediaSettings } from '../src/media/settings.js'
import { MediaService, mediaConfig } from '../src/media/service.js'
import { KitchenStore } from '../src/store.js'
import { resultBoard } from './fixtures/results.mjs'

for (const key of Object.keys(process.env)) if (/^(LUMINA_(OPENAI|IMAGE)_|OPENAI_)/.test(key)) delete process.env[key]
delete process.env.ARK_API_KEY
delete process.env.MINIMAX_API_KEY
const image = (name = '图片一') => ({ name, apiKey: 'test-image-secret', baseUrl: 'https://image.example/v1', model: 'image-test', quality: 'high', size: '', complexity: '' })
const video = (name = '视频一') => ({ name, apiKey: 'test-video-secret', baseUrl: 'https://video.example/v2' })
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'lumina-services-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const settings = new MediaSettings(root, mediaConfig())
  await settings.ready
  return { root, settings }
}
const update = (settings, body) => settings.update({ expectedRevision: settings.state.revision, ...body })

test('configured legacy defaults migrate once to editable profiles without copying keys', async t => {
  const { root, settings } = await fixture(t)
  await writeFile(settings.file, JSON.stringify({ version: 1, revision: 4, profiles: [], defaults: { image: null, video: null }, credentials: {} }))
  const legacy = mediaConfig({ openaiApiKey: 'legacy-image-secret' })
  process.env.MINIMAX_API_KEY = 'legacy-video-secret'
  t.after(() => { delete process.env.MINIMAX_API_KEY })
  const migrated = new MediaSettings(root, legacy)
  await migrated.ready
  const { profiles, defaults } = migrated.view()
  assert.deepEqual(profiles.map(profile => profile.id), [defaults.image, defaults.video])
  assert.equal(migrated.view().effective.video.protocol, 'minimax-video')
  assert.doesNotMatch(await readFile(migrated.file, 'utf8'), /legacy-image-secret|legacy-video-secret/)
  await update(migrated, { action: 'default', kind: 'video', id: null })
  await update(migrated, { action: 'delete', kind: 'video', id: defaults.video })
  const restarted = new MediaSettings(root, legacy)
  await restarted.ready
  assert.equal(restarted.resolve('video'), null)
  assert.equal(restarted.view().profiles.length, 1)
})

test('multiple profiles and independent defaults survive restart without returning credentials', async t => {
  const { root, settings } = await fixture(t)
  await update(settings, { action: 'save', kind: 'image', profile: image() })
  await update(settings, { action: 'save', kind: 'image', profile: image('图片二') })
  await update(settings, { action: 'save', kind: 'video', profile: video() })
  const [a, b, v] = settings.view().profiles
  await update(settings, { action: 'default', kind: 'image', id: b.id })
  await update(settings, { action: 'default', kind: 'video', id: v.id })
  const restarted = new MediaSettings(root, settings.legacy)
  await restarted.ready
  assert.equal(restarted.view().effective.image.name, b.name)
  assert.equal(restarted.view().effective.video.name, v.name)
  assert.equal(restarted.view().profiles.length, 3)
  assert.doesNotMatch(JSON.stringify(restarted.view()), /test-image-secret|test-video-secret|legacy-image|credentialRef/)
  await update(restarted, { action: 'default', kind: 'image', id: null })
  assert.equal(restarted.resolve('image'), null)
  assert.equal(restarted.resolve('video').id, v.id)
  assert.notEqual(a.id, b.id)
})

test('environment keys fill blank profiles and saved keys take priority', async t => {
  const { root, settings } = await fixture(t)
  await update(settings, { action: 'save', kind: 'image', profile: { ...image(), apiKey: '' } })
  const profileId = settings.view().profiles[0].id
  assert.equal(settings.view().profiles[0].keyAvailable, false)
  const values = { LUMINA_OPENAI_API_KEY: 'env-secret', OPENAI_API_KEY: 'generic-secret', LUMINA_OPENAI_BASE_URL: 'https://env.example/v1', LUMINA_IMAGE_MODEL: 'env-model', LUMINA_IMAGE_QUALITY: 'low' }
  Object.assign(process.env, values)
  t.after(() => { for (const key of Object.keys(values)) delete process.env[key] })
  assert.equal(settings.view().presets['openai-image'].keyEnvironment, 'LUMINA_OPENAI_API_KEY')
  assert.equal(settings.view().profiles[0].keyAvailable, true)
  assert.equal(settings.view().profiles[0].keyEnvironment, 'LUMINA_OPENAI_API_KEY')
  await update(settings, { action: 'default', kind: 'image', id: profileId })
  assert.equal(settings.key(settings.resolve('image')), 'env-secret')
  assert.equal(settings.view().effective.image.model, 'env-model')
  assert.equal(settings.view().effective.image.quality, 'low')
  assert.equal(settings.view().effective.image.keyEnvironment, 'LUMINA_OPENAI_API_KEY')
  assert.doesNotMatch(JSON.stringify(settings.view()), /env-secret|generic-secret/)
  assert.doesNotMatch(await readFile(join(root, 'media-services.json'), 'utf8'), /env-secret|generic-secret/)
  delete process.env.LUMINA_OPENAI_API_KEY
  assert.equal(settings.key(settings.resolve('image')), 'generic-secret')
  await update(settings, { action: 'save', kind: 'image', profile: { ...settings.view().profiles[0], apiKey: 'test-image-secret' } })
  assert.equal(settings.key(settings.resolve('image')), 'test-image-secret')
  assert.equal(settings.view().effective.image.keyEnvironment, undefined)
  assert.equal(settings.view().profiles[0].keyEnvironment, null)
})

test('Ark and MiniMax official profiles use host keys after restart and keep them off disk', async t => {
  const { root, settings: initialSettings } = await fixture(t)
  let settings = initialSettings
  for (const [protocol, variable, secret] of [
    ['ark-seedream', 'ARK_API_KEY', 'ark-test-secret'],
    ['ark-seedance', 'ARK_API_KEY', 'ark-test-secret'],
    ['minimax-image', 'MINIMAX_API_KEY', 'minimax-test-secret'],
    ['minimax-video', 'MINIMAX_API_KEY', 'minimax-test-secret'],
  ]) {
    const { kind, name, baseUrl, model } = settings.view().presets[protocol]
    const saved = await update(settings, { action: 'save', kind, profile: { protocol, name, baseUrl, model } })
    await update(settings, { action: 'default', kind, id: saved.profiles.at(-1).id })
    assert.equal(settings.view().effective[kind].configured, false)
    process.env[variable] = secret
    try {
      const restarted = new MediaSettings(root, settings.legacy)
      await restarted.ready
      assert.equal(restarted.view().effective[kind].keyEnvironment, variable)
      assert.equal(restarted.key(restarted.resolve(kind)), secret)
      assert.doesNotMatch(JSON.stringify(restarted.view()), /ark-test-secret|minimax-test-secret/)
      assert.doesNotMatch(await readFile(restarted.file, 'utf8'), /ark-test-secret|minimax-test-secret/)
      const profile = restarted.view().profiles.at(-1)
      assert.equal(profile.keyAvailable, true)
      assert.equal(restarted.view().presets[protocol].keyRequiresPresetOrigin, true)
      await update(restarted, { action: 'save', kind, profile: { ...profile, baseUrl: 'https://provider.example/v1' } })
      assert.equal(restarted.view().effective[kind].configured, false)
      assert.equal(restarted.view().profiles.at(-1).keyAvailable, false)
      settings = restarted
    } finally {
      delete process.env[variable]
    }
  }
})

test('Ark image and video configs save and reload with the same base URL', async t => {
  const { root, settings } = await fixture(t)
  const endpoints = {
    'ark-seedream': '/images/generations',
    'ark-seedance': '/contents/generations/tasks',
  }
  for (const [protocol, endpoint] of Object.entries(endpoints)) {
    const { kind, name, baseUrl, model } = settings.view().presets[protocol]
    const saved = await update(settings, { action: 'save', kind, profile: { protocol, name, baseUrl: baseUrl + endpoint + '/', model } })
    const profile = saved.profiles.at(-1)
    assert.equal(profile.baseUrl, baseUrl)
    await update(settings, { action: 'default', kind, id: profile.id })
  }
  const stored = JSON.parse(await readFile(settings.file, 'utf8'))
  for (const profile of stored.profiles) profile.baseUrl += endpoints[profile.protocol]
  await writeFile(settings.file, JSON.stringify(stored))
  const restarted = new MediaSettings(root, settings.legacy)
  await restarted.ready
  assert.equal(restarted.resolve('image').baseUrl, 'https://ark.cn-beijing.volces.com/api/v3')
  assert.equal(restarted.resolve('video').baseUrl, restarted.resolve('image').baseUrl)
  assert.deepEqual(restarted.view().defaults, stored.defaults)
  assert.doesNotMatch(await readFile(settings.file, 'utf8'), /images\/generations|contents\/generations\/tasks/)
})

test('edits retain blank keys, credential versions survive deletion, stale writes and invalid URLs fail safely', async t => {
  const { root, settings } = await fixture(t)
  await update(settings, { action: 'save', kind: 'image', profile: image() })
  const profile = settings.view().profiles[0]
  await update(settings, { action: 'default', kind: 'image', id: profile.id })
  const original = settings.resolve('image')
  await update(settings, { action: 'save', kind: 'image', profile: { ...profile, apiKey: '', name: '改名' } })
  assert.equal(settings.key(settings.resolve('image')), 'test-image-secret')
  await update(settings, { action: 'save', kind: 'image', profile: { ...profile, apiKey: 'replacement-key' } })
  assert.equal(settings.key(original), 'test-image-secret')
  assert.equal(settings.key(settings.resolve('image')), 'replacement-key')
  const before = await readFile(settings.file, 'utf8')
  for (const baseUrl of ['http://public.example/v1', 'https://user:password@api.example/v1', 'https://api.example/v1?key=secret', 'bad']) {
    await assert.rejects(update(settings, { action: 'save', kind: 'image', profile: { ...image('invalid'), baseUrl } }), /地址/)
  }
  await assert.rejects(settings.update({ expectedRevision: 0, action: 'default', kind: 'image', id: null }), /其他页面/)
  await assert.rejects(update(settings, { action: 'delete', kind: 'image', id: profile.id }), /先切换/)
  assert.equal(await readFile(settings.file, 'utf8'), before)
  await update(settings, { action: 'default', kind: 'image', id: null })
  await update(settings, { action: 'delete', kind: 'image', id: profile.id })
  const restarted = new MediaSettings(root, settings.legacy)
  await restarted.ready
  assert.equal(restarted.key(original), 'test-image-secret')
  assert.equal(restarted.view().profiles.length, 0)
})

test('serialized concurrent updates reject lost edits and corrupted storage is not overwritten', async t => {
  const { root, settings } = await fixture(t)
  const outcomes = await Promise.allSettled([
    settings.update({ expectedRevision: 0, action: 'save', kind: 'image', profile: image() }),
    settings.update({ expectedRevision: 0, action: 'save', kind: 'video', profile: video() }),
  ])
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1)
  assert.equal(settings.view().profiles.length, 1)
  await writeFile(settings.file, '{broken')
  const corrupt = new MediaSettings(root, settings.legacy)
  await assert.rejects(corrupt.ready, /无法读取/)
  await assert.rejects(update(corrupt, { action: 'save', kind: 'image', profile: image() }), /无法读取/)
  assert.equal(await readFile(settings.file, 'utf8'), '{broken')
})

test('image calls use saved defaults and video polling retains original endpoint and key after edits, switches and restart', async t => {
  const { root } = await fixture(t)
  const store = new KitchenStore(root)
  const board = resultBoard(); board.lab.runs = []
  await store.write({ activeId: board.id, boards: [board] })
  const seen = []
  const fetchImpl = async (url, init) => {
    seen.push({ url, key: init?.headers?.authorization, body: init?.body })
    if (url.endsWith('/images/generations')) return new Response(JSON.stringify({ data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=' }] }))
    if (url.endsWith('/video_generation')) return new Response(JSON.stringify({ task_id: '424010985700099' }))
    return new Response(JSON.stringify({ task: { status: 'running' } }))
  }
  let service = new MediaService({ root, store, config: {}, fetchImpl }); await service.ready
  await update(service.settings, { action: 'save', kind: 'image', profile: image() })
  await update(service.settings, { action: 'save', kind: 'video', profile: video() })
  const [i, v] = service.settings.view().profiles
  await update(service.settings, { action: 'default', kind: 'image', id: i.id })
  await update(service.settings, { action: 'default', kind: 'video', id: v.id })
  const request = { id: 'b1', expectedRevision: 0, planId: 'p1', variantId: 'A' }
  await assert.rejects(service.start({ ...request, kind: 'image', serviceRevision: 0 }), /配置已变化/)
  assert.equal(seen.length, 0)
  const imageJob = await service.start({ ...request, kind: 'image', serviceRevision: service.info().revision })
  const videoJob = await service.start({ ...request, kind: 'video' })
  for (let n = 0; n < 100 && (service.job(videoJob.job.id).status !== 'queued' || service.job(imageJob.job.id).status !== 'succeeded'); n++) await new Promise(r => setTimeout(r, 10))
  assert.equal(service.job(imageJob.job.id).status, 'succeeded')
  assert.equal(service.job(videoJob.job.id).status, 'queued')
  const imageCall = seen.find(c => c.url.endsWith('/images/generations'))
  assert.equal(imageCall.url, 'https://image.example/v1/images/generations')
  assert.equal(imageCall.key, 'Bearer test-image-secret')
  assert.equal(JSON.parse(imageCall.body).model, 'image-test')
  assert.equal(JSON.parse(imageCall.body).quality, 'high')
  await update(service.settings, { action: 'save', kind: 'video', profile: { ...v, apiKey: 'new-key', baseUrl: 'https://changed.example/v2' } })
  await update(service.settings, { action: 'default', kind: 'video', id: null })
  await update(service.settings, { action: 'delete', kind: 'video', id: v.id })
  await service.writing
  service = new MediaService({ root, store, config: {}, fetchImpl }); await service.ready
  await service.refresh(videoJob.job.id, { force: true })
  assert.equal(seen.at(-1).url, 'https://video.example/v2/query/video_generation/424010985700099')
  assert.equal(seen.at(-1).key, 'Bearer test-video-secret')
  assert.doesNotMatch(JSON.stringify(service.publicJob(videoJob.job.id)), /credentialRef|test-video-secret|connection/)
  assert.doesNotMatch(await readFile(join(root, 'media-jobs.json'), 'utf8'), /test-video-secret|test-image-secret/)
})

test('upgrading from 3.2.2 retires legacy video profile without breaking image or official video defaults', async t => {
  const { root } = await fixture(t)
  const store = new KitchenStore(root)
  const board = resultBoard(); board.lab.runs = []
  await store.write({ activeId: board.id, boards: [board] })
  await writeFile(join(root, 'media-services.json'), JSON.stringify({
    version: 2,
    revision: 5,
    profiles: [
      { id: 'img-1', kind: 'image', name: 'OpenAI 兼容', protocol: 'openai-image', baseUrl: 'https://image.example/v1', model: 'image-test', size: '', quality: 'medium', complexity: '', credentialRef: 'cred-img' },
      { id: 'vid-official', kind: 'video', name: 'MiniMax H3 · 官方', protocol: 'minimax-video', baseUrl: 'https://api.minimax.cn/v2', model: 'MiniMax-H3', credentialRef: 'cred-mm' },
      { id: 'vid-retired', kind: 'video', name: '旧视频配置', protocol: 'apiyi-h3', baseUrl: 'https://legacy.example/hailuo/v2', model: 'MiniMax-H3', credentialRef: 'cred-old' },
    ],
    defaults: { image: 'img-1', video: 'vid-official' },
    credentials: { 'cred-img': 'img-secret', 'cred-mm': 'mm-secret', 'cred-old': 'old-secret' },
  }))
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url, key: init?.headers?.authorization })
    if (url.endsWith('/images/generations')) return new Response(JSON.stringify({ data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=' }] }))
    if (url.endsWith('/video_generation')) return new Response(JSON.stringify({ task_id: '424010985700888' }))
    throw new Error(`unexpected ${url}`)
  }
  const service = new MediaService({ root, store, config: {}, fetchImpl })
  await service.ready
  assert.equal(service.initError, null)
  const view = service.settings.view()
  assert.deepEqual(view.profiles.map(p => p.id), ['img-1', 'vid-official'])
  assert.deepEqual(view.defaults, { image: 'img-1', video: 'vid-official' })
  assert.equal(view.effective.image.configured, true)
  assert.equal(view.effective.video.configured, true)
  assert.doesNotMatch(JSON.stringify(view), /vid-retired|old-secret|retiredProfiles/)

  const persisted = JSON.parse(await readFile(join(root, 'media-services.json'), 'utf8'))
  assert.equal(persisted.revision, 6)
  assert.deepEqual(persisted.retiredProfiles.map(p => p.id), ['vid-retired'])
  assert.equal(persisted.credentials['cred-old'], 'old-secret')

  const imgJob = await service.start({ kind: 'image', id: 'b1', expectedRevision: 0, planId: 'p1', variantId: 'A' })
  const vidJob = await service.start({ kind: 'video', id: 'b1', expectedRevision: 0, planId: 'p1', variantId: 'A' })
  for (let n = 0; n < 100; n++) {
    const runs = (await store.read()).boards[0].lab.runs || []
    if (runs.find(r => r.jobId === imgJob.job.id)?.status === 'succeeded' && runs.find(r => r.jobId === vidJob.job.id)?.status === 'queued') break
    await new Promise(r => setTimeout(r, 10))
  }
  await service.writing
  assert.equal(service.job(imgJob.job.id).status, 'succeeded')
  assert.equal(service.job(vidJob.job.id).status, 'queued')
  assert.equal(calls.find(c => c.url.endsWith('/video_generation')).key, 'Bearer mm-secret')

  // Second restart stays idempotent without bumping revision
  const restarted = new MediaSettings(root, mediaConfig())
  await restarted.ready
  assert.equal(restarted.state.revision, 6)
  assert.deepEqual(restarted.view().profiles.map(p => p.id), ['img-1', 'vid-official'])
})

test('upgrading from 3.2.2 when retired video profile was default clears only video default and preserves other profiles and jobs', async t => {
  const { root } = await fixture(t)
  const store = new KitchenStore(root)
  const board = resultBoard(); board.lab.runs = []
  await store.write({ activeId: board.id, boards: [board] })
  await writeFile(join(root, 'media-services.json'), JSON.stringify({
    version: 2,
    revision: 3,
    profiles: [
      { id: 'img-1', kind: 'image', name: 'OpenAI 兼容', protocol: 'openai-image', baseUrl: 'https://image.example/v1', model: 'image-test', size: '', quality: 'medium', complexity: '', credentialRef: 'cred-img' },
      { id: 'vid-retired', kind: 'video', name: '旧默认视频', protocol: 'apiyi-h3', baseUrl: 'https://legacy.example/hailuo/v2', model: 'MiniMax-H3', credentialRef: 'legacy:video' },
      { id: 'vid-ark', kind: 'video', name: 'Seedance 2.5 · 火山方舟', protocol: 'ark-seedance', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-seedance-2-5-260628', credentialRef: 'cred-ark' },
    ],
    defaults: { image: 'img-1', video: 'vid-retired' },
    credentials: { 'cred-img': 'img-secret', 'cred-ark': 'ark-secret' },
  }))
  await writeFile(join(root, 'media-jobs.json'), JSON.stringify({
    version: 1,
    jobs: [
      { id: 'job-active', kind: 'video', boardId: 'b1', runId: 'run-active', status: 'queued', taskId: 'task_old', connection: { protocol: 'apiyi-h3', baseUrl: 'https://legacy.example/hailuo/v2', model: 'MiniMax-H3' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'job-unlinked', kind: 'video', boardId: 'b1', runId: 'run-unlinked', status: 'uncertain', taskId: null, connection: { protocol: 'apiyi-h3', baseUrl: 'https://legacy.example/hailuo/v2', model: 'MiniMax-H3' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'job-done', kind: 'video', boardId: 'b1', runId: 'run-done', status: 'succeeded', taskId: 'task_done', connection: { protocol: 'apiyi-h3', baseUrl: 'https://legacy.example/hailuo/v2', model: 'MiniMax-H3' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
  }))
  const service = new MediaService({ root, store, config: {}, fetchImpl: async () => { throw new Error('must not call') } })
  await service.ready
  assert.equal(service.initError, null)
  const view = service.settings.view()
  assert.deepEqual(view.profiles.map(p => p.id), ['img-1', 'vid-ark'])
  assert.deepEqual(view.defaults, { image: 'img-1', video: null })
  assert.equal(view.effective.image.configured, true)
  assert.equal(view.effective.video, null)
  await assert.rejects(service.start({ kind: 'video', id: 'b1', expectedRevision: 0, planId: 'p1', variantId: 'A' }), { code: 'NO_MEDIA_SERVICE' })
  assert.equal(service.job('job-active').status, 'uncertain')
  assert.match(service.job('job-active').error, /已停用/)
  assert.equal(service.job('job-done').status, 'succeeded')
  await assert.rejects(service.recover('job-unlinked', '424010985700001'), { code: 'VIDEO_SERVICE_RETIRED' })
})

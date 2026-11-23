import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MediaService } from '../src/media/service.js'
import { KitchenStore } from '../src/store.js'
import { planKey } from '../src/lab-input.js'
import { generateImage, imageSizeForAspect } from '../src/media/openai-image.js'
import { h3Duration, h3Ratio, truncateH3 } from '../src/media/h3.js'
import { applyEdit } from '../src/shared-experiment.js'

// Keep the fixtures independent from a developer machine's real provider keys.
for (const key of ['LUMINA_OPENAI_API_KEY', 'OPENAI_API_KEY', 'LUMINA_APIYI_API_KEY', 'APIYI_API_KEY', 'MINIMAX_API_KEY']) delete process.env[key]

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII='
const imageResponse = () => new Response(JSON.stringify({
  data: [{ b64_json: PNG, revised_prompt: 'a revised prompt' }],
}), { status: 200, headers: { 'content-type': 'application/json' } })

test('continuing preserves output settings and appends a new local image without modifying prior assets', async t => {
  const { runResultsAction } = await import('../src/results.js')
  const requests = []
  const { store, service, root } = await fixture(t, async (_url, init) => { requests.push(JSON.parse(init.body)); return imageResponse() })
  const initial = await service.start({ kind: 'image', id: 'b1', expectedRevision: 0, planId: 'p1', variantId: 'A' })
  await until(() => service.job(initial.job.id).status === 'succeeded')
  let state
  for (let i = 0; i < 100; i++) { state = await store.read(); if (state.boards[0].lab.runs[0].status === 'succeeded') break; await new Promise(r => setTimeout(r, 20)) }
  const original = structuredClone(state.boards[0].lab.runs[0])
  state = await runResultsAction(store, { action: 'continue', id: 'b1', runId: original.id, expectedRevision: state.boards[0].revision })
  const board = state.boards[0]
  const next = await service.start({ kind: 'image', id: 'b1', expectedRevision: board.revision, planId: board.lab.comparison.id, variantId: 'A' })
  await until(() => service.job(next.job.id).status === 'succeeded')
  for (let i = 0; i < 100; i++) { state = await store.read(); if (state.boards[0].lab.runs[1]?.status === 'succeeded') break; await new Promise(r => setTimeout(r, 20)) }
  assert.deepEqual(requests[1], requests[0])
  assert.equal(state.boards[0].lab.runs.length, 2)
  assert.equal(state.boards[0].lab.runs[1].status, 'succeeded')
  assert.notEqual(state.boards[0].lab.runs[1].id, original.id)
  assert.deepEqual(state.boards[0].lab.runs[0], original)
  assert.deepEqual(await readFile(join(root, 'media', original.asset.file)), Buffer.from(PNG, 'base64'))
})

function boardFixture() {
  const board = {
    id: 'b1', title: '测试', idea: '雨夜站台', revision: 0, history: [],
    retained: {}, shot: {}, ingredients: [],
    constraints: { duration: 6, aspect: '9:16', platform: 'douyin', pacing: 3, mood: '' },
    lab: null,
  }
  board.lab = {
    comparison: {
      id: 'p1', inputKey: planKey(board), variable: '构图',
      baseline: [], assumptions: [], selectedId: 'A',
      variants: [
        { id: 'A', title: 'A', change: 'A', effect: 'A', tradeoff: 'A', observe: 'A', imagePrompt: 'image prompt A', videoPrompt: 'video prompt A', evidence: [] },
        { id: 'B', title: 'B', change: 'B', effect: 'B', tradeoff: 'B', observe: 'B', imagePrompt: 'image prompt B', videoPrompt: 'video prompt B', evidence: [] },
      ],
    },
  }
  return board
}

async function fixture(t, fetchImpl) {
  const root = await mkdtemp(join(tmpdir(), 'lumina-media-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = new KitchenStore(root)
  await store.write({ activeId: 'b1', boards: [boardFixture()] })
  const service = new MediaService({
    root,
    store,
    config: { openaiApiKey: 'sk-test', apiyiApiKey: 'ak-test' },
    fetchImpl,
  })
  await service.ready
  return { root, store, service }
}

async function until(check, timeout = 3000) {
  const started = Date.now()
  while (!(await check())) {
    if (Date.now() - started > timeout) throw new Error('等待超时')
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

async function selectPreset(service, protocol, apiKey = 'provider-test-key') {
  const settings = service.settings.view()
  const { kind, name, baseUrl, model } = settings.presets[protocol]
  const saved = await service.settings.update({
    action: 'save', kind, expectedRevision: settings.revision,
    profile: { name: `${name} 测试配置`, baseUrl, model, protocol, apiKey },
  })
  await service.settings.update({
    action: 'default', kind, expectedRevision: saved.revision, id: saved.profiles.at(-1).id,
  })
}

for (const [protocol, url, expected] of [
  ['ark-seedream', 'https://ark.cn-beijing.volces.com/api/v3/images/generations', {
    model: 'doubao-seedream-5-5-261028', size: '1584x2816',
  }],
  ['minimax-image', 'https://api.minimax.cn/v1/images/generations', {
    model: 'MiniMax-H3-Image', n: 1, area: '2K', aspect_ratio: '9:16',
  }],
]) {
  test(`${protocol} uses its official payload and saves a local image`, async t => {
    const calls = []
    const { root, service, store } = await fixture(t, async (address, init) => {
      calls.push({ address, key: init.headers.authorization, body: JSON.parse(init.body) })
      return imageResponse()
    })
    process.env.LUMINA_OPENAI_API_KEY = 'legacy-env-key'
    process.env.LUMINA_OPENAI_BASE_URL = 'https://legacy.example/v1'
    t.after(() => {
      delete process.env.LUMINA_OPENAI_API_KEY
      delete process.env.LUMINA_OPENAI_BASE_URL
    })
    await selectPreset(service, protocol)
    assert.deepEqual(service.info().image.overrides, {})
    assert.equal(service.info().image.size, '2K')
    assert.equal(calls.length, 0, 'saving and activating must not call the provider')
    const { job } = await service.start({ kind: 'image', id: 'b1', planId: 'p1', variantId: 'A' })
    await until(async () => (await store.read()).boards[0].lab.runs[0]?.status === 'succeeded')
    assert.deepEqual(calls, [{
      address: url, key: 'Bearer provider-test-key',
      body: { ...expected, prompt: 'image prompt A', response_format: 'b64_json' },
    }])
    assert.deepEqual(await readFile(join(root, 'media', job.asset.file)), Buffer.from(PNG, 'base64'))
  })
}

test('Seedream accepts the full generation URL and surfaces Ark model-access errors', async () => {
  const endpoint = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
  const options = { protocol: 'ark-seedream', apiKey: 'test-key', baseUrl: endpoint + '/', model: 'doubao-seedream-5-5-261028', prompt: 'test', size: '2816x1584' }
  const result = await generateImage({
    ...options,
    fetchImpl: async url => {
      assert.equal(url, endpoint)
      return imageResponse()
    },
  })
  assert.equal(result.mime, 'image/png')
  await assert.rejects(generateImage({
    ...options,
    fetchImpl: async () => Response.json({ error: { code: 'ModelNotOpen', message: 'private upstream response' } }, { status: 404 }),
  }), error => {
    assert.match(error.message, /HTTP 404 \/ ModelNotOpen.*开通所选模型/)
    assert.doesNotMatch(error.message, /private upstream response/)
    return true
  })
})

test('Seedance submits a 30-second video and polls the original profile after restart', async t => {
  const base = 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks'
  const videoUrl = 'https://cdn.example.com/seedance.mp4'
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url, method: init.method, key: init.headers?.authorization, body: init.body })
    if (url === base) return Response.json({ id: 'cgt-seedance-test' })
    if (url === `${base}/cgt-seedance-test`) return Response.json({ status: 'succeeded', content: { video_url: videoUrl } })
    if (url === videoUrl) return new Response('seedance-video', { headers: { 'content-type': 'video/mp4' } })
    throw new Error('unexpected provider URL')
  }
  const { root, store, service } = await fixture(t, fetchImpl)
  await selectPreset(service, 'ark-seedance')
  const state = await store.mutate(state => {
    const board = state.boards[0]
    board.constraints.duration = 30
    board.lab.comparison.inputKey = planKey(board)
    board.lab.comparison.promptSynced = true
    board.lab.comparison.variants[0].videoPrompt = 'CURRENT USER REQUIREMENTS (authoritative):\n{}\nVideo duration: 15 seconds. Aspect ratio: 9:16.'
    return state
  })
  assert.equal(service.info().video.maxDuration, 30)
  assert.equal(service.info().video.costPerSecondUsd, null)
  const { job } = await service.start({ kind: 'video', id: 'b1', expectedRevision: state.boards[0].revision, planId: 'p1', variantId: 'A' })
  await until(async () => (await store.read()).boards[0].lab.runs[0]?.status === 'queued')
  assert.equal(job.taskId, 'cgt-seedance-test')
  const submitted = JSON.parse(calls[0].body)
  assert.deepEqual(submitted, {
    model: 'doubao-seedance-2-5-260628', duration: 30, ratio: '9:16', resolution: '720p',
    content: [{ type: 'text', text: 'CURRENT USER REQUIREMENTS (authoritative):\n{}\nVideo duration: 30 seconds. Aspect ratio: 9:16.' }],
  })
  await service.settings.update({ action: 'default', kind: 'video', expectedRevision: service.info().revision, id: null })
  await service.writing
  const restarted = new MediaService({ root, store, fetchImpl })
  await restarted.ready
  const finished = await restarted.refresh(job.id, { force: true })
  assert.equal(calls[1].key, 'Bearer provider-test-key')
  assert.equal(calls[1].method, 'GET')
  assert.equal(calls[2].key, undefined)
  assert.equal(finished.status, 'succeeded')
  assert.equal(finished.costUsd, null)
  assert.equal(await readFile(join(root, 'media', finished.asset.file), 'utf8'), 'seedance-video')
})

test('Seedance recovers an uncertain submission and closes an expired provider task', async t => {
  const { service, store } = await fixture(t, async (url, init) => {
    if (init.method === 'POST') throw new Error('socket closed')
    assert.match(url, /\/contents\/generations\/tasks\/cgt-expired$/)
    return Response.json({ status: 'expired' })
  })
  await selectPreset(service, 'ark-seedance')
  const { job } = await service.start({ kind: 'video', id: 'b1', planId: 'p1', variantId: 'A' })
  await until(async () => (await store.read()).boards[0].lab.runs[0]?.status === 'uncertain')
  await assert.rejects(service.recover(job.id, 'task_wrong'), /cgt-/)
  const finished = await service.recover(job.id, 'cgt-expired')
  assert.equal(finished.status, 'failed')
  assert.match(finished.error, /超时/)
})

test('a synced prompt reaches the image request and never reuses a result generated before the edit', async t => {
  const requests=[]
  const {store,service}=await fixture(t,async (_url,init)=>{requests.push(JSON.parse(init.body));return imageResponse()})
  await store.mutate(s=>{s.boards[0].lab.comparison.variants=s.boards[0].lab.comparison.variants.slice(0,1);return s})
  let board=(await store.read()).boards[0]
  const original=await service.start({kind:'image',id:board.id,expectedRevision:board.revision,planId:'p1',variantId:'A'})
  await until(()=>service.job(original.job.id).status==='succeeded')
  for(let i=0;i<100;i++){board=(await store.read()).boards[0];if(board.lab.runs[0]?.status==='succeeded')break;await new Promise(r=>setTimeout(r,20))}
  const historical=structuredClone(board.lab.runs[0])
  const edited=await applyEdit(store,{id:board.id,expectedRevision:board.revision,changes:{motion:'缓慢推进'}})
  board=edited.boards[0]
  const current=await service.start({kind:'image',id:board.id,expectedRevision:board.revision,planId:board.lab.comparison.id,variantId:'A'})
  await until(async () => (await store.read()).boards[0].lab.runs.find(run => run.jobId === current.job.id)?.status === 'succeeded')
  assert.equal(requests.length,2)
  assert.notEqual(current.job.id,original.job.id)
  assert.equal(requests[1].prompt,board.lab.comparison.variants[0].imagePrompt)
  assert.match(requests[1].prompt,/缓慢推进/)
  assert.deepEqual((await store.read()).boards[0].lab.runs[0],historical)
})

test('synced video text and actual request agree on the latest duration and ratio', async t => {
  let request
  const {store,service}=await fixture(t,async (url,init)=>{
    if(url.endsWith('/video_generation')){request=JSON.parse(init.body);return new Response(JSON.stringify({task_id:'task_sync'}))}
    if(url.includes('/query/video_generation/'))return new Response(JSON.stringify({task:{status:'succeeded',content:{url:'https://cdn.example.com/sync.mp4'}}}))
    if(url==='https://cdn.example.com/sync.mp4')return new Response(Buffer.from('video'),{headers:{'content-type':'video/mp4'}})
    throw new Error('unexpected request')
  })
  await selectPreset(service, 'apiyi-h3')
  await store.mutate(s=>{s.boards[0].lab.comparison.variants=s.boards[0].lab.comparison.variants.slice(0,1);return s})
  const state=await store.mutate(s=>{Object.assign(s.boards[0].constraints,{duration:8,aspect:'16:9'});return s})
  const board=state.boards[0]
  const started=await service.start({kind:'video',id:board.id,expectedRevision:board.revision,planId:board.lab.comparison.id,variantId:'A'})
  await until(()=>service.job(started.job.id).status==='queued')
  assert.equal(request.content[0].text,board.lab.comparison.variants[0].videoPrompt)
  assert.match(request.content[0].text,/duration: 8 seconds.*16:9/)
  assert.equal(request.duration,8)
  assert.equal(request.ratio,'16:9')
  await service.refresh(started.job.id,{force:true})
})

test('a saved 30-second shot edited to 20 seconds stays intact when the video service changes', async t => {
  const requests = []
  const { store, service } = await fixture(t, async (url, init) => {
    requests.push(JSON.parse(init.body))
    return new Response(JSON.stringify({ id: 'cgt-20261120100000-abcde' }))
  })
  const initial = boardFixture()
  initial.constraints.duration = 30
  initial.lab.comparison.inputKey = planKey(initial)
  initial.lab.comparison.variants = initial.lab.comparison.variants.slice(0, 1)
  initial.lab.comparison.variants[0].videoPrompt = 'Continuous tracking shot across the alley for 30 seconds.'
  await store.write({ activeId: initial.id, boards: [initial] })
  const edited = await store.mutate(state => { state.boards[0].constraints.duration = 20; return state })
  const board = edited.boards[0]
  const args = { kind: 'video', id: board.id, expectedRevision: board.revision, planId: board.lab.comparison.id, variantId: 'A' }
  await selectPreset(service, 'apiyi-h3')
  await assert.rejects(service.start(args), { code: 'VIDEO_DURATION_UNSUPPORTED' })
  assert.equal(requests.length, 0)
  assert.equal((await store.read()).boards[0].constraints.duration, 20)
  assert.equal((await store.read()).boards[0].lab.runs?.length || 0, 0)
  await selectPreset(service, 'ark-seedance')
  const started = await service.start(args)
  await until(async () => (await store.read()).boards[0].lab.runs.find(run => run.jobId === started.job.id)?.status === 'queued')
  assert.equal(requests[0].duration, 20)
  assert.equal(requests[0].content[0].text, board.lab.comparison.variants[0].videoPrompt)
  assert.match(requests[0].content[0].text, /Video duration: 20 seconds/)
})

test('image job saves local bytes, records a run, and never duplicates a successful call', async t => {
  let calls = 0
  const fetchImpl = async (url, init) => {
    assert.match(url, /\/images\/generations$/)
    assert.equal(init.method, 'POST')
    assert.match(init.headers.authorization, /^Bearer sk-test$/)
    const body = JSON.parse(init.body)
    assert.equal(body.model, 'gpt-image-2.6-sunburst')
    assert.equal(body.size, '1024x1536')
    assert.equal(body.quality, 'medium')
    calls++
    return imageResponse()
  }
  const { root, store, service } = await fixture(t, fetchImpl)
  const started = await service.start({ kind: 'image', id: 'b1', expectedRevision: 0, planId: 'p1', variantId: 'A' })
  await until(() => service.job(started.job.id).status === 'succeeded')
  const job = service.job(started.job.id)
  assert.equal(job.asset.mime, 'image/png')
  assert.ok(job.asset.bytes > 0)
  assert.equal(job.revisedPrompt, 'a revised prompt')
  const saved = await readFile(join(root, 'media', job.asset.file))
  assert.deepEqual(saved, Buffer.from(PNG, 'base64'))
  let state = await store.read()
  for (let i = 0; i < 100 && state.boards[0].lab.runs.at(-1).status !== 'succeeded'; i++) {
    await new Promise(resolve => setTimeout(resolve, 5))
    state = await store.read()
  }
  const run = state.boards[0].lab.runs.at(-1)
  assert.equal(run.status, 'succeeded')
  assert.equal(run.asset.file, job.asset.file)
  assert.equal(run.kind, 'image')
  assert.equal(run.source.idea, '雨夜站台')
  assert.equal(run.source.plan.id, 'p1')
  assert.equal(run.source.variant.imagePrompt, 'image prompt A')
  assert.equal(state.boards[0].revision, 0, 'media attach must not invalidate pending text revisions')

  const again = await service.start({ kind: 'image', id: 'b1', planId: 'p1', variantId: 'A' })
  assert.equal(again.job.id, started.job.id)
  assert.equal(calls, 1)
})

test('video job submits once, polls to success, downloads bytes and records cost', async t => {
  let submits = 0
  let queries = 0
  const fetchImpl = async (url, init) => {
    if (url.endsWith('/video_generation')) {
      submits++
      const body = JSON.parse(init.body)
      assert.equal(body.model, 'MiniMax-H3')
      assert.equal(body.resolution, '768P')
      assert.equal(body.duration, 6)
      assert.equal(body.ratio, '9:16')
      assert.equal(body.content[0].type, 'text')
      return new Response(JSON.stringify({ task_id: 'task_abc123' }), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    if (url.includes('/query/video_generation/task_abc123')) {
      queries++
      return new Response(JSON.stringify({
        task: queries === 1
          ? { status: 'running' }
          : { status: 'succeeded', content: { url: 'https://cdn.example.com/clip.mp4' }, usage: { output_seconds: 6 } },
      }), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    if (url === 'https://cdn.example.com/clip.mp4') {
      return new Response(Buffer.from('fake-video-bytes'), { status: 200, headers: { 'content-type': 'video/mp4' } })
    }
    throw new Error(`unexpected url ${url}`)
  }
  const { root, store, service } = await fixture(t, fetchImpl)
  await selectPreset(service, 'apiyi-h3')
  const started = await service.start({ kind: 'video', id: 'b1', expectedRevision: 0, planId: 'p1', variantId: 'A' })
  await until(() => service.job(started.job.id).status === 'queued')
  assert.equal(service.job(started.job.id).taskId, 'task_abc123')

  let job = await service.refresh(started.job.id, { force: true })
  assert.equal(job.status, 'running')
  job = await service.refresh(started.job.id, { force: true })
  assert.equal(job.status, 'succeeded')
  assert.equal(job.costUsd, 0.18)
  assert.equal(job.remoteUrl, 'https://cdn.example.com/clip.mp4')
  assert.equal(job.asset.mime, 'video/mp4')
  const bytes = await readFile(join(root, 'media', job.asset.file))
  assert.equal(bytes.toString(), 'fake-video-bytes')
  const state = await store.read()
  assert.equal(state.boards[0].lab.runs.at(-1).status, 'succeeded')
  assert.equal(state.boards[0].lab.runs.at(-1).costUsd, 0.18)

  const again = await service.start({ kind: 'video', id: 'b1', planId: 'p1', variantId: 'A' })
  assert.equal(again.job.id, started.job.id)
  assert.equal(submits, 1)
})

test('network loss on video submit is uncertain until a task id is associated', async t => {
  let mode = 'fail'
  const fetchImpl = async (url) => {
    if (url.endsWith('/video_generation')) {
      if (mode === 'fail') throw new Error('socket closed')
      return new Response(JSON.stringify({ task_id: 'task_recovered' }), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    if (url.includes('/query/video_generation/task_recovered')) {
      return new Response(JSON.stringify({
        task: { status: 'succeeded', content: { url: 'https://cdn.example.com/recovered.mp4' }, usage: { output_seconds: 4 } },
      }), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    if (url === 'https://cdn.example.com/recovered.mp4') {
      return new Response(Buffer.from('recovered'), { status: 200, headers: { 'content-type': 'video/mp4' } })
    }
    throw new Error(`unexpected url ${url}`)
  }
  const { service } = await fixture(t, fetchImpl)
  await selectPreset(service, 'apiyi-h3')
  const started = await service.start({ kind: 'video', id: 'b1', expectedRevision: 0, planId: 'p1', variantId: 'A' })
  await until(() => service.job(started.job.id).status === 'uncertain')
  mode = 'recover'
  const job = await service.recover(started.job.id, 'task_recovered')
  assert.equal(job.status, 'succeeded')
  assert.equal(job.costUsd, 0.12)
})

test('configured MiniMax video uses the official API, numeric task IDs and the shared environment key', async t => {
  process.env.MINIMAX_API_KEY = 'official-video-test-key'
  t.after(() => { delete process.env.MINIMAX_API_KEY })
  const calls = []
  const taskId = '424010985738629'
  const videoUrl = 'https://cdn.example.com/minimax-h3.mp4'
  const { service, store } = await fixture(t, async (url, init) => {
    calls.push({ url, authorization: init.headers?.authorization, body: init.body })
    if (url.endsWith('/query/video_generation/' + taskId)) {
      return Response.json({ task: { status: 'succeeded', content: { url: videoUrl }, usage: { output_seconds: 6 } } })
    }
    if (url === videoUrl) return new Response('video', { headers: { 'content-type': 'video/mp4' } })
    return Response.json({ task_id: taskId })
  })
  await selectPreset(service, 'minimax-video', '')
  const video = service.info().video
  assert.equal(video.protocol, 'minimax-video')
  assert.equal(video.keyEnvironment, 'MINIMAX_API_KEY')
  assert.equal(video.costPerSecondUsd, null)
  assert.equal(service.settings.resolve('video', true).protocol, 'apiyi-h3')
  const { job } = await service.start({ kind: 'video', id: 'b1', planId: 'p1', variantId: 'A' })
  await until(async () => (await store.read()).boards[0].lab.runs[0]?.status === 'queued')
  assert.equal(job.taskId, taskId)
  assert.equal(job.provider, 'minimax')
  const finished = await service.refresh(job.id, { force: true })
  assert.equal(finished.status, 'succeeded')
  assert.equal(finished.costUsd, null)
  assert.deepEqual(calls.map(call => [call.url, call.authorization]), [
    ['https://api.minimax.cn/v2/video_generation', 'Bearer official-video-test-key'],
    [`https://api.minimax.cn/v2/query/video_generation/${taskId}`, 'Bearer official-video-test-key'],
    [videoUrl, undefined],
  ])
  assert.deepEqual(JSON.parse(calls[0].body), {
    model: 'MiniMax-H3', resolution: '768P', duration: 6, ratio: '9:16',
    content: [{ type: 'text', text: 'Video duration: 6 seconds. Aspect ratio: 9:16.\nUse this duration and aspect ratio wherever the shot description gives different values.\n\nvideo prompt A' }],
  })
})

test('restart marks an interrupted image run uncertain and syncs the experiment', async t => {
  const root = await mkdtemp(join(tmpdir(), 'lumina-media-restart-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = new KitchenStore(root)
  const board = boardFixture()
  board.lab.runs = [{ id: 'run_x', jobId: 'job_x', kind: 'image', planId: 'p1', variantId: 'A', status: 'running', prompt: 'x' }]
  await store.write({ activeId: 'b1', boards: [board] })
  await mkdir(join(root, 'media'), { recursive: true })
  await writeFile(join(root, 'media-jobs.json'), JSON.stringify({
    version: 1,
    jobs: [{ id: 'job_x', kind: 'image', boardId: 'b1', runId: 'run_x', status: 'running', prompt: 'x', createdAt: new Date().toISOString() }],
  }))
  const service = new MediaService({ root, store, config: {}, fetchImpl: async () => { throw new Error('must not call') } })
  await service.ready
  const state = await store.read()
  assert.equal(state.boards[0].lab.runs[0].status, 'uncertain')
  assert.match(state.boards[0].lab.runs[0].error, /服务重启/)
})

test('undo keeps generated runs that were recorded after the history snapshot', async t => {
  const root = await mkdtemp(join(tmpdir(), 'lumina-media-undo-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = new KitchenStore(root)
  const board = boardFixture()
  await store.write({ activeId: 'b1', boards: [board] })
  await store.mutate(state => { state.boards[0].title = '改过的标题'; return state })
  await store.mutate(state => {
    state.boards[0].lab.runs = [{ id: 'run_keep', jobId: 'job_keep', kind: 'image', planId: 'p1', variantId: 'A', status: 'succeeded', asset: { file: `${'c'.repeat(64)}.png`, bytes: 1 } }]
    return state
  }, { undoable: false })
  const { state } = await store.undo('b1', 2)
  assert.equal(state.boards[0].title, '测试')
  assert.equal(state.boards[0].lab.runs.length, 1)
  assert.equal(state.boards[0].lab.runs[0].id, 'run_keep')
})

test('missing keys fail closed; prompt and ratio helpers stay within provider limits', async t => {
  const { service } = await fixture(t, async () => { throw new Error('must not call') })
  const bare = new MediaService({ root: service.root, store: service.store, config: {}, fetchImpl: async () => { throw new Error('must not call') } })
  await bare.ready
  await assert.rejects(bare.start({ kind: 'image', id: 'b1', expectedRevision: 0, planId: 'p1', variantId: 'A' }), /密钥/)
  await assert.rejects(bare.start({ kind: 'video', id: 'b1', expectedRevision: 0, planId: 'p1', variantId: 'A' }), /密钥/)
  await bare.settings.update({ action: 'default', kind: 'video', id: null, expectedRevision: bare.info().revision })
  assert.equal(bare.info().video, null)
  await assert.rejects(bare.start({ kind: 'video', id: 'b1', expectedRevision: 0, planId: 'p1', variantId: 'A' }), /默认生成服务/)

  assert.equal(imageSizeForAspect('9:16'), '1024x1536')
  assert.equal(imageSizeForAspect('16:9'), '1536x1024')
  assert.equal(imageSizeForAspect('1:1'), '1024x1024')
  assert.equal(h3Ratio('21:9'), '21:9')
  assert.equal(h3Ratio('unknown'), '9:16')
  assert.equal(h3Duration(2), 4)
  assert.equal(h3Duration(30), 15)
  assert.equal([...truncateH3('字'.repeat(9000))].length <= 7000, true)
})

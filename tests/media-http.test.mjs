import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import plugin from '../src/host.js'
import { KitchenStore } from '../src/store.js'
import { planKey } from '../src/lab-input.js'

for (const key of ['LUMINA_OPENAI_API_KEY', 'OPENAI_API_KEY', 'LUMINA_APIYI_API_KEY', 'APIYI_API_KEY', 'MINIMAX_API_KEY']) delete process.env[key]
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII='

function boardFixture() {
  const board = {
    id: 'b1', title: '测试', idea: '雨夜站台', revision: 0, history: [], retained: {}, shot: {}, ingredients: [],
    constraints: { duration: 6, aspect: '9:16', platform: 'douyin', pacing: 3, mood: '' }, lab: null,
  }
  board.lab = {
    comparison: {
      id: 'p1', inputKey: planKey(board), variable: '构图', baseline: [], assumptions: [], selectedId: 'A',
      variants: [
        { id: 'A', title: 'A', change: 'A', effect: 'A', tradeoff: 'A', observe: 'A', imagePrompt: 'image prompt A', videoPrompt: 'video prompt A', evidence: [] },
        { id: 'B', title: 'B', change: 'B', effect: 'B', tradeoff: 'B', observe: 'B', imagePrompt: 'image prompt B', videoPrompt: 'video prompt B', evidence: [] },
      ],
    },
  }
  return board
}

test('authenticated panel route generates an image, polls it and serves the local asset', async t => {
  const root = await mkdtemp(join(tmpdir(), 'lumina-media-http-'))
  const originalHome = process.env.DSH_HOME
  const originalFetch = globalThis.fetch
  process.env.DSH_HOME = root
  t.after(async () => {
    globalThis.fetch = originalFetch
    if (originalHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = originalHome
    await rm(root, { recursive: true, force: true })
  })
  await new KitchenStore(join(root, 'lumina-kitchen')).write({ activeId: 'b1', boards: [boardFixture()] })
  const realFetch = originalFetch
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('https://api.openai.com/v1/images/generations')) {
      return new Response(JSON.stringify({ data: [{ b64_json: PNG }] }), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    return realFetch(url, init)
  }

  let handler
  const ctx = {
    effect: fn => fn(),
    webServer: { register: route => { handler = route.handler; return () => {} } },
    get: name => ({
      tools: { register: () => {} },
      connection: { requestRejection: ({ headers }) => headers['x-test-auth'] === 'yes' ? null : 403 },
      agentDefaultModel: { currentSelection: () => null },
    })[name],
  }
  plugin.apply(ctx, { dataDir: fileURLToPath(new URL('../resources/data', import.meta.url)), openaiApiKey: 'sk-test' })
  const server = createServer(handler)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}/lumina-kitchen`
  const request = (path, body) => fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'x-test-auth': 'yes', 'content-type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  assert.equal((await fetch(`${base}/services`)).status, 403)
  const configuration = await (await request('/services')).json()
  assert.equal(configuration.settings.profiles.length, 1)
  assert.equal(configuration.settings.profiles[0].id, configuration.settings.defaults.image)
  const saveBody = { action: 'save', kind: 'image', expectedRevision: 0, profile: { name: 'HTTP test', apiKey: 'never-return-this-secret', baseUrl: 'https://api.openai.com/v1', model: 'image-test' } }
  const blocked = await fetch(`${base}/services`, { method: 'POST', headers: { 'x-test-auth': 'yes', 'sec-fetch-site': 'cross-site', 'content-type': 'application/json' }, body: JSON.stringify(saveBody) })
  assert.equal(blocked.status, 403)
  const saved = await request('/services', saveBody)
  assert.equal(saved.status, 200)
  const savedText = await saved.text()
  assert.doesNotMatch(savedText, /never-return-this-secret|sk-test|credentialRef/)
  assert.equal(JSON.parse(savedText).settings.profiles.length, 2)
  assert.equal((await request('/services', saveBody)).status, 409)
  const wrongDefault = await request('/services', { action: 'default', kind: 'video', id: JSON.parse(savedText).settings.profiles[0].id, expectedRevision: 1 })
  assert.equal(wrongDefault.status, 400)

  const initial = await (await request('/boards')).json()
  assert.equal(initial.media.image.configured, true)
  const started = await request('/media/image', { id: 'b1', expectedRevision: 0, planId: 'p1', variantId: 'A' })
  const startedText = await started.text()
  assert.equal(started.status, 200, startedText)
  const first = JSON.parse(startedText)
  assert.equal(first.job.kind, 'image')
  let job = first.job
  for (let i = 0; i < 100 && job.status !== 'succeeded'; i++) {
    await new Promise(resolve => setTimeout(resolve, 20))
    const polled = await (await request(`/media/job?id=${job.id}`)).json()
    job = polled.job
    if (job.status === 'succeeded') {
      assert.equal(polled.boards[0].lab.runs.at(-1).status, 'succeeded')
    }
  }
  assert.equal(job.status, 'succeeded')
  assert.ok(job.asset.file)
  const asset = await request(`/assets/${job.asset.file}`)
  assert.equal(asset.status, 200)
  const imageBytes = (await asset.arrayBuffer()).byteLength
  assert.equal(imageBytes > 0, true)
  const ranged = await fetch(`${base}/assets/${job.asset.file}`, { headers: { 'x-test-auth': 'yes', range: 'bytes=0-3' } })
  assert.equal(ranged.status, 206)
  assert.equal(ranged.headers.get('content-range'), `bytes 0-3/${imageBytes}`)
  assert.equal((await fetch(`${base}/assets/${job.asset.file}`)).status, 403)
})

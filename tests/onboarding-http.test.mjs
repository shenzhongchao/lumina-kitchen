import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import plugin from '../src/host.js'

test('onboarding routes require auth, serve bundled media, preserve demo marker and block every paid route', async t => {
  const root = await mkdtemp(join(tmpdir(), 'lumina-onboarding-http-'))
  const before = process.env.DSH_HOME
  process.env.DSH_HOME = root
  t.after(async () => { if (before === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = before; await rm(root, { recursive: true, force: true }) })
  let handler, calls = 0
  plugin.apply({ effect: fn => fn(), webServer: { register: route => { handler = route.handler } }, get: name => {
    if (name === 'connection') return { requestRejection: ({ headers }) => headers['x-test'] ? null : 403 }
    if (name === 'llm') { calls++; throw Error('Never call a model in this test') }
    return null
  } }, { dataDir: fileURLToPath(new URL('../resources/data', import.meta.url)) })
  const server = createServer(handler)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}/lumina-kitchen`
  const request = (path, body, headers = {}) => fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'x-test': 'yes', 'content-type': 'application/json', ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) })
  assert.equal((await fetch(base + '/onboarding', { method: 'POST', body: '{}' })).status, 403)
  assert.equal((await request('/onboarding', { action: 'demo' }, { 'sec-fetch-site': 'cross-site' })).status, 403)
  const state = await (await request('/onboarding', { action: 'demo' })).json(), board = state.boards[0]
  assert.equal(state.bindings, undefined)
  const media = await request('/demo-media/A.svg')
  assert.match(media.headers.get('content-type'), /image\/svg/)
  assert.match(await media.text(), /构图示意/)
  assert.equal((await request('/demo-media/secret.svg')).status, 404)
  let changed = await (await request('/boards', { action: 'update', id: board.id, expectedRevision: 0, board: { demo: null, idea: '新想法' } })).json()
  assert.equal(changed.boards[0].demo, board.demo)
  const common = { id: board.id, expectedRevision: changed.boards[0].revision, planId: board.lab.comparison.id, variantId: 'A' }
  for (const [path, extra] of [['/lab', { action: 'compare' }], ['/lab', { action: 'recommend' }], ['/edit', { action: 'preview', field: 'framing', request: '靠近' }], ['/media/image', {}], ['/media/video', {}]]) {
    const response = await request(path, { ...common, ...extra })
    assert.equal(response.status, 403, `${path}: ${await response.text()}`)
  }
  assert.equal(calls, 0)
})

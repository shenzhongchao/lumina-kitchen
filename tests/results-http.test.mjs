import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import plugin from '../src/host.js'
import { KitchenStore } from '../src/store.js'
import { resultBoard, reviewInput } from './fixtures/results.mjs'

test('authenticated HTTP persists reviews, recipes and branches; rejects cross-site, stale and forged updates', async t => {
  const root = await mkdtemp(join(tmpdir(), 'lumina-results-http-'))
  const previous = process.env.DSH_HOME
  process.env.DSH_HOME = root
  t.after(async () => { if (previous === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = previous; await rm(root, { recursive: true, force: true }) })
  await new KitchenStore(join(root, 'lumina-kitchen')).write({ activeId: 'b1', boards: [resultBoard()], bindings: { secret: 'b1' } })
  let handler
  plugin.apply({ effect: fn => fn(), webServer: { register: r => { handler = r.handler } }, get: name => name === 'connection' ? { requestRejection: ({ headers }) => headers['x-test'] === 'yes' ? null : 403 } : null }, {})
  const server = createServer(handler)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}/lumina-kitchen`
  const request = (path, body, extra = {}) => fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'x-test': 'yes', 'content-type': 'application/json', ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) })
  assert.equal((await fetch(`${base}/boards`)).status, 403)
  assert.equal((await request('/results', reviewInput, { 'sec-fetch-site': 'cross-site' })).status, 403)
  let response = await request('/results', reviewInput)
  assert.equal(response.status, 200)
  let state = await response.json()
  assert.equal(state.bindings, undefined)
  assert.equal(state.boards[0].history, undefined)
  const reviewId = state.result.reviewId
  assert.equal((await request('/results', reviewInput)).status, 409)
  response = await request('/results', { action: 'save-recipe', id: 'b1', expectedRevision: 1, reviewId, title: 'HTTP 配方' })
  assert.equal(response.status, 200)
  state = await response.json()
  const recipeId = state.result.recipeId
  state = await (await request('/boards')).json()
  assert.equal(state.recipes[0].id, recipeId)
  response = await request('/boards', { action: 'update', id: 'b1', expectedRevision: 1, board: { lab: { reviews: [] }, recipes: [], lineage: { forged: true } } })
  state = await response.json()
  assert.equal(state.boards[0].lab.reviews.length, 1)
  assert.equal(state.boards[0].lineage, undefined)
  response = await request('/results', { action: 'reuse-recipe', id: 'b1', expectedRevision: state.boards[0].revision, recipeId })
  assert.equal(response.status, 200)
  state = await response.json()
  assert.equal(state.boards[0].lab?.runs?.length || 0, 0)
  assert.equal(state.boards[0].lab.comparison.variants.length, 1)
  assert.equal(state.boards[0].lineage.recipeId, recipeId)
  assert.equal(state.recipes.length, 1)
})

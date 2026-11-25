import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { KitchenStore } from '../src/store.js'
import { createBoard } from '../src/shared-experiment.js'
import { createDemoBoard, runOnboardingAction } from '../src/onboarding.js'
import { runResultsAction } from '../src/results.js'
import { recommend, compare, proposeLocalEdit } from '../src/lab.js'
import { MediaService } from '../src/media/service.js'
import { callModel } from '../src/chef.js'

async function setup(t) {
  const root = await mkdtemp(join(tmpdir(), 'lumina-onboarding-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = new KitchenStore(root), board = createBoard()
  await store.write({ boards: [board], activeId: board.id, bindings: { existing: board.id } })
  return { root, store, board }
}
test('first idea and skip persist; stale starts cannot overwrite work; demo entry is idempotent', async t => {
  const { store, board } = await setup(t)
  await runOnboardingAction(store, { action: 'skip', id: board.id, expectedRevision: 0 })
  assert.equal((await new KitchenStore(store.root).read()).boards[0].onboardingStarted, true)
  await assert.rejects(runOnboardingAction(store, { action: 'start', id: board.id, expectedRevision: 0, idea: 'stale' }), /另一处修改/)
  await runOnboardingAction(store, { action: 'start', id: board.id, expectedRevision: 1, idea: '雨夜站台' })
  const original = (await store.read()).boards[0]
  await Promise.all([runOnboardingAction(store, { action: 'demo' }), runOnboardingAction(store, { action: 'demo' })])
  const state = await store.read()
  assert.equal(state.boards.length, 2)
  assert.deepEqual(state.boards.find(b => b.id === board.id), original)
  assert.deepEqual(state.bindings, { existing: board.id })
})
test('free demo completes real review → recipe → reuse and branch; sample protection survives restart and edits', async t => {
  const { store } = await setup(t)
  let state = await runOnboardingAction(store, { action: 'demo' })
  const demo = state.boards[0], [a, b] = demo.lab.runs
  state = await runResultsAction(store, { action: 'review', id: demo.id, expectedRevision: 0,
    runIds: [a.id, b.id], preferredRunId: a.id, outcome: 'achieved', comparability: 'controlled',
    observed: '小人物周围的留白更多', reusableWhen: '想突出环境空旷时' })
  const reviewId = state.result.reviewId
  state = await runResultsAction(store, { action: 'save-recipe', id: demo.id, expectedRevision: 1, reviewId, title: '留白练习' })
  const recipeId = state.result.recipeId
  state = await runResultsAction(new KitchenStore(store.root), { action: 'reuse-recipe', id: demo.id, expectedRevision: 1, recipeId })
  assert.equal(state.boards[0].demo, demo.demo)
  assert.equal(state.boards[0].lab?.runs?.length || 0, 0)
  assert.equal(state.boards[0].lab.comparison.variants.length, 1)
  state = await runResultsAction(store, { action: 'branch', id: demo.id, expectedRevision: 1, runId: a.id })
  const branch = state.boards[0]
  assert.equal(branch.demo, demo.demo)
  await store.mutate(s => { s.boards[0].idea = '修改过的示例'; return s })
  await store.undo(branch.id, 1)
  assert.equal((await store.read()).boards[0].demo, demo.demo)
  assert.equal(state.recipes[0].source.demo, demo.demo)
  for (const run of demo.lab.runs) {
    assert.equal(run.costUsd, 0)
    assert.equal(run.jobId, undefined)
    const svg = await readFile(new URL(`../src/demo-media/${run.variantId}.svg`, import.meta.url), 'utf8')
    assert.match(svg, /<title>/)
    assert.doesNotMatch(svg, /<script|https?:\/\/(?!www.w3.org)/)
  }
})
test('sample rejects all text/image/video entrypoints before any model or transport call', async t => {
  const { store, root } = await setup(t)
  const board = createDemoBoard()
  await store.write({ activeId: board.id, boards: [board] })
  let calls = 0
  const trap = async () => { calls++; throw new Error('MODEL MUST NOT RUN') }
  for (const fn of [() => recommend({}, board, new Map(), trap), () => compare({}, board, new Map(), trap), () => proposeLocalEdit({}, board, 'framing', '靠近', trap)]) {
    await assert.rejects(fn(), e => e.code === 'GENERATION_DISABLED')
  }
  const media = new MediaService({ root, store, config: { openaiKey: 'fake', minimaxApiKey: 'fake' }, fetchImpl: trap })
  for (const kind of ['image', 'video']) await assert.rejects(media.start({ kind, id: board.id, expectedRevision: 0, planId: board.lab.comparison.id, variantId: 'A' }), e => e.code === 'GENERATION_DISABLED')
  assert.equal(calls, 0)
  assert.equal(media.jobs.size, 0)
})
test('offline verification blocks the actual DSH model bridge even if a model is configured', async t => {
  const before = process.env.LUMINA_OFFLINE
  process.env.LUMINA_OFFLINE = '1'
  t.after(() => { if (before === undefined) delete process.env.LUMINA_OFFLINE; else process.env.LUMINA_OFFLINE = before })
  let accessed = false
  await assert.rejects(callModel({ get: () => { accessed = true; throw Error('no') } }, 'system', 'user'), e => e.code === 'GENERATION_DISABLED')
  assert.equal(accessed, false)
})


test('completed practice creates a clean editable experiment with composition method and preserves original', async t => {
  const { store } = await setup(t)
  let state = await runOnboardingAction(store, { action: 'demo' })
  const demo = state.boards[0]
  await assert.rejects(runOnboardingAction(store, { action: 'practice', id: demo.id, expectedRevision: 0 }), /保存一次观察/)
  state = await runResultsAction(store, { action: 'review', id: demo.id, expectedRevision: 0,
    runIds: demo.lab.runs.map(r => r.id), outcome: 'partial', comparability: 'controlled', observed: '人物更小，留白更多，但不一定孤独' })
  const before = structuredClone(state.boards.find(b => b.id === demo.id))
  await assert.rejects(runOnboardingAction(store, { action: 'practice', id: demo.id, expectedRevision: 0 }), e => e.status === 409)
  state = await runOnboardingAction(store, { action: 'practice', id: demo.id, expectedRevision: before.revision })
  const own = state.boards.find(b => b.id === state.activeId)
  assert.equal(own.demo, undefined)
  assert.equal(own.lab, null)
  assert.equal(own.idea, '')
  assert.deepEqual(own.retained, {})
  assert.deepEqual(own.ingredients, [])
  assert.match(own.shot.framing, /人物.*占比/)
  assert.deepEqual(state.boards.find(b => b.id === demo.id), before)
  const { assertGenerationAllowed } = await import('../src/generation-policy.js')
  assert.doesNotThrow(() => assertGenerationAllowed(own))
  state = await runOnboardingAction(store, { action: 'start', id: own.id, expectedRevision: own.revision, idea: '一个人在海边等日出' })
  const restored = (await new KitchenStore(store.root).read()).boards.find(b => b.id === own.id)
  assert.equal(restored.idea, '一个人在海边等日出')
  assert.equal(restored.shot.framing, own.shot.framing)
  assert.equal(restored.onboardingStarted, true)
  await assert.rejects(runOnboardingAction(store, { action: 'practice', id: restored.id, expectedRevision: restored.revision }), /保存一次观察/)
})

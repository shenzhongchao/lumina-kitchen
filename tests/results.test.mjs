import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { KitchenStore } from '../src/store.js'
import { runResultsAction } from '../src/results.js'
import { createSharedTools } from '../src/shared-tools.js'
import { resultBoard, reviewInput } from './fixtures/results.mjs'

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'lumina-results-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = new KitchenStore(root)
  await store.write({ activeId: 'b1', boards: [resultBoard()], bindings: { chat: 'b1', other: 'b1' } })
  return { store, root }
}
test('review and immutable recipe survive restart, source edits/deletion, and reuse without copying generated runs', async t => {
  const { store, root } = await fixture(t)
  let state = await runResultsAction(store, reviewInput)
  const reviewId = state.result.reviewId
  state = await runResultsAction(store, { action: 'save-recipe', id: 'b1', expectedRevision: 1, reviewId, title: '夜景轮廓' })
  const recipeId = state.result.recipeId
  const saved = structuredClone(state.recipes[0])
  await store.mutate(s => { s.boards[0].idea = '全新场景'; s.boards[0].lab.comparison = null; return s })
  state = await runResultsAction(store, { action: 'save-recipe', id: 'b1', expectedRevision: 2, reviewId, title: '重复提交' })
  assert.equal(state.recipes.length, 1)
  assert.equal(state.result.recipeId, recipeId)
  state = await runResultsAction(store, { action: 'reuse-recipe', id: 'b1', expectedRevision: 2, recipeId })
  const branch = state.boards.find(b => b.id === state.result.boardId)
  assert.equal(branch.idea, '雨夜站台上的孤独人物')
  assert.equal(branch.shot.lighting, '暖色侧光')
  assert.equal(branch.retained.subject, '穿灰色外套的人物')
  assert.equal(branch.lab?.runs?.length || 0, 0)
  assert.equal(branch.lab.comparison.variants.length, 1)
  assert.equal(branch.revision, 0)
  assert.equal(state.bindings.chat, 'b1', 'panel actions do not retarget conversations')
  await store.mutate(s => { s.boards = s.boards.filter(b => b.id !== 'b1'); return s })
  const reopened = new KitchenStore(root)
  state = await reopened.read()
  assert.deepEqual(state.recipes[0], saved)
  state = await runResultsAction(reopened, { action: 'reuse-recipe', id: branch.id, expectedRevision: 0, recipeId })
  assert.equal(state.boards[0].lineage.recipeId, recipeId)
  assert.equal(state.boards[0].lineage.result.asset.file, saved.result.asset.file)
})
test('branch uses generation snapshot after edits and leaves original and other bindings unchanged', async t => {
  const { store } = await fixture(t)
  await store.mutate(s => { s.boards[0].idea = '白天'; s.boards[0].retained.subject = '另一个人'; return s })
  const before = (await store.read()).boards[0]
  const state = await runResultsAction(store, { action: 'branch', id: 'b1', expectedRevision: 1, runId: 'run_B' }, { owner: 'chat' })
  const branch = state.boards[0]
  assert.equal(branch.idea, '雨夜站台上的孤独人物')
  assert.equal(branch.shot.lighting, '冷色顶光')
  assert.deepEqual(branch.retained, { subject: '穿灰色外套的人物' })
  assert.deepEqual(state.boards.find(b => b.id === 'b1'), before)
  assert.equal(state.bindings.chat, branch.id)
  assert.equal(state.bindings.other, 'b1')
})
test('reject wrong result pairs, incomplete success claims, oversize notes and stale revisions without writes', async t => {
  const { store } = await fixture(t)
  const before = await store.read()
  for (const change of [
    { runIds: ['run_A', 'run_A'] }, { runIds: ['run_A', 'missing'] }, { preferredRunId: 'foreign' },
    { preferredRunId: '' }, { observed: ' ' }, { observed: 'a'.repeat(2001) }, { outcome: 'invented' }, { comparability: 'invented' },
  ]) await assert.rejects(runResultsAction(store, { ...reviewInput, ...change }))
  await assert.rejects(runResultsAction(store, { ...reviewInput, expectedRevision: 9 }), { status: 409 })
  await assert.rejects(runResultsAction(store, { action: 'save-recipe', id: 'b1', expectedRevision: 0, reviewId: 'missing', title: '伪造' }))
  assert.deepEqual(await store.read(), before)
  await store.mutate(s => { s.boards[0].lab.runs[1].kind = 'video'; return s }, { bumpRevision: false })
  await assert.rejects(runResultsAction(store, reviewInput), /同一类型/)
  await store.mutate(s => { s.boards[0].lab.runs[1].kind = 'image'; s.boards[0].lab.runs[1].status = 'failed'; return s }, { bumpRevision: false })
  await assert.rejects(runResultsAction(store, reviewInput), /已完成/)
})
test('concurrent review saves conflict and undo retains reviews and recipes', async t => {
  const { store } = await fixture(t)
  await store.mutate(s => { s.boards[0].idea = '修改后的想法'; return s })
  const attempts = await Promise.allSettled([1, 2].map(() => runResultsAction(store, { ...reviewInput, expectedRevision: 1 })))
  assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 1)
  assert.equal(attempts.find(r => r.status === 'rejected').reason.status, 409)
  const reviewId = attempts.find(r => r.status === 'fulfilled').value.result.reviewId
  await runResultsAction(store, { action: 'save-recipe', id: 'b1', expectedRevision: 2, reviewId, title: '保留配方' })
  const { state } = await store.undo('b1', 2)
  assert.equal(state.boards[0].idea, '雨夜站台上的孤独人物')
  assert.equal(state.boards[0].lab.reviews[0].id, reviewId)
  assert.equal(state.boards[0].lab.runs.length, 2)
  assert.equal(state.recipes.length, 1)
})
test('legacy results remain reviewable but cannot claim unavailable provenance', async t => {
  const { store } = await fixture(t)
  await store.mutate(s => { for (const run of s.boards[0].lab.runs) delete run.source; return s }, { bumpRevision: false })
  let state = await runResultsAction(store, { action: 'branch', id: 'b1', expectedRevision: 0, runId: 'run_A' })
  assert.equal(state.boards[0].shot.lighting, '暖色侧光')
  await store.mutate(s => { s.boards.find(b => b.id === 'b1').idea = '已变化'; return s })
  await assert.rejects(runResultsAction(store, { action: 'branch', id: 'b1', expectedRevision: 1, runId: 'run_A' }), /快照/)
  state = await runResultsAction(store, { ...reviewInput, expectedRevision: 1 })
  await assert.rejects(runResultsAction(store, { action: 'save-recipe', id: 'b1', expectedRevision: 2, reviewId: state.result.reviewId, title: '旧结果' }), /快照/)
})
test('recipes require explicit success and applicability; reviews remain immutable', async t => {
  const { store } = await fixture(t)
  let state = await runResultsAction(store, { ...reviewInput, outcome: 'partial' })
  await assert.rejects(runResultsAction(store, { action: 'save-recipe', id: 'b1', expectedRevision: 1, reviewId: state.result.reviewId, title: '部分达成' }), /达成目标/)
  state = await runResultsAction(store, { ...reviewInput, expectedRevision: 1, reusableWhen: '' })
  await assert.rejects(runResultsAction(store, { action: 'save-recipe', id: 'b1', expectedRevision: 2, reviewId: state.result.reviewId, title: '无条件' }), /适用条件/)
  assert.equal(state.boards[0].lab.reviews.length, 2)
  assert.equal(state.boards[0].lab.reviews[0].outcome, 'partial')
})
test('conversation result actions use trusted binding and return a new branch without private history', async t => {
  const { store } = await fixture(t)
  const tool = createSharedTools({ store, dataDirOf: () => { throw new Error('not needed') } }).find(t => t.name === 'lumina_results')
  const args = { action: 'branch', experiment_id: 'b1', expected_revision: 0, runId: 'run_A' }
  await assert.rejects(tool.execute(args, { agent: { id: 'unbound' } }), /未绑定/)
  const data = await tool.execute(args, { agent: { id: 'chat' } })
  assert.equal(data.experiment.id, data.result.boardId)
  assert.equal(data.experiment.history, undefined)
  assert.equal((await store.read()).bindings.other, 'b1')
})

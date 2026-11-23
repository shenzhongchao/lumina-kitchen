import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { KitchenStore } from '../src/store.js'
import { createBoard } from '../src/shared-experiment.js'
import { manageExperiments, autoTitle, displayWorkspace, activeWorkspace, editableBoard } from '../src/experiments.js'
import { runOnboardingAction } from '../src/onboarding.js'
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'lumina-manager-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  return new KitchenStore(root)
}
test('repeated new and skip keep a single virtual draft; first idea materializes and names it once', async t => {
  const store = await fixture(t)
  const first = await manageExperiments(store, { action: 'create' })
  const again = await manageExperiments(store, { action: 'create' })
  assert.equal(first.activeId, again.activeId)
  assert.equal((await store.read()).boards.length, 0)
  await runOnboardingAction(store, { action: 'skip', id: first.activeId, expectedRevision: 0 })
  assert.equal((await store.read()).boards.length, 0)
  assert.equal(displayWorkspace(await store.read()).boards[0].onboardingStarted, true)
  const state = await runOnboardingAction(store, { action: 'start', id: first.activeId, expectedRevision: 0, idea: '雨夜站台，等待回家的人' })
  assert.equal(state.boards[0].title, '雨夜站台，等待回家的人')
  assert.equal(state.boards[0].transient, undefined)
  await assert.rejects(runOnboardingAction(store, { action: 'start', id: first.activeId, expectedRevision: 0, idea: 'stale' }), /另一处/)
})
test('legacy empty experiments are reused, never silently removed; explicit names stay unchanged', async t => {
  const store = await fixture(t), a = createBoard(), b = createBoard()
  await store.write({ boards: [a, b], activeId: a.id })
  assert.equal((await manageExperiments(store, { action: 'create' })).activeId, a.id)
  assert.equal((await store.read()).boards.length, 2)
  await manageExperiments(store, { action: 'rename', id: a.id, expectedRevision: 0, title: '我的开场' })
  const saved = (await store.read()).boards[0]
  assert.equal(autoTitle({ ...saved, idea: '别的内容' }).title, '我的开场')
})
test('archive/restore/delete respect revisions, active selection and saved recipes', async t => {
  const store = await fixture(t), a = createBoard('A', '想法')
  await store.write({ activeId: a.id, boards: [a], recipes: [{ id: 'kept' }] })
  let state = await manageExperiments(store, { action: 'archive', id: a.id, expectedRevision: 0 })
  assert.notEqual(state.activeId, a.id)
  assert.equal(state.boards.find(b => b.id === state.activeId).transient, true)
  await assert.rejects(manageExperiments(store, { action: 'activate', id: a.id }), /归档/)
  await assert.rejects(store.mutate(s => { editableBoard(s, a.id, 1); return s }), /归档/)
  state = await manageExperiments(store, { action: 'restore', id: a.id, expectedRevision: 1 })
  assert.equal(state.boards.find(b => b.id === a.id).archivedAt, undefined)
  await assert.rejects(manageExperiments(store, { action: 'delete', id: a.id, expectedRevision: 1, confirmTitle: 'A' }), /另一处/)
  await assert.rejects(manageExperiments(store, { action: 'delete', id: a.id, expectedRevision: 2, confirmTitle: 'wrong' }), /确认/)
  await manageExperiments(store, { action: 'delete', id: a.id, expectedRevision: 2, confirmTitle: 'A' })
  state = await new KitchenStore(store.root).read()
  assert.equal(state.boards.length, 0)
  assert.equal(state.recipes[0].id, 'kept')
})
test('bound chats and running/uncertain jobs protect experiments from deletion', async t => {
  const store = await fixture(t), a = createBoard('A', '想法')
  await store.write({ activeId: a.id, boards: [a], bindings: { chat: a.id } })
  await assert.rejects(manageExperiments(store, { action: 'delete', id: a.id, expectedRevision: 0, confirmTitle: 'A' }), /绑定/)
  await store.write({ activeId: a.id, boards: [{ ...a, lab: { runs: [{ status: 'uncertain' }] } }] })
  await assert.rejects(manageExperiments(store, { action: 'delete', id: a.id, expectedRevision: 0, confirmTitle: 'A' }), /待核对/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { KitchenStore } from '../src/store.js'
import { runLabAction } from '../src/lab.js'
import { runResultsAction } from '../src/results.js'
import { isCurrentPlan, continuedImageSettings, panelIdeaBoard } from '../src/lab-input.js'
import { resultBoard } from './fixtures/results.mjs'
import { applyEdit, previewEdit } from '../src/shared-experiment.js'

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'lumina-creation-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = new KitchenStore(root), board = resultBoard()
  await store.write({ version: 2, activeId: board.id, boards: [board], recipes: [], bindings: {} })
  return { store, root, board }
}

test('legacy requirements merge once into the idea without changing historical generation inputs', () => {
  const old=resultBoard()
  const historical=structuredClone(old.lab.runs)
  const merged=panelIdeaBoard(old)
  assert.match(merged.idea,/穿灰色外套的人物/)
  assert.match(merged.idea,/人物位于画面右侧/)
  assert.deepEqual(merged.retained,{})
  assert.deepEqual(merged.shot,{})
  assert.ok(isCurrentPlan(merged.lab.comparison,merged))
  assert.deepEqual(panelIdeaBoard(merged),merged)
  assert.deepEqual(merged.lab.runs,historical)
  assert.notDeepEqual(old.retained,{})
  const already={...old,idea:`人物位于画面右侧，穿灰色外套的人物`}
  assert.equal(panelIdeaBoard(already).idea,already.idea)
  const long={...old,idea:'长'.repeat(1000),shot:{setting:'雨夜'.repeat(400)},retained:{}}
  assert.equal(panelIdeaBoard(long).idea.length,1804)
})

test('one-shot creation needs only an idea and retains every previous media snapshot', async t => {
  const { store, board } = await fixture(t)
  await store.mutate(s => { s.boards[0].ingredients = []; return s })
  const response = { title: '雨夜', description: '侧光下等车的人', image_prompt: 'rainy platform', video_prompt: 'rainy platform slow push', assumptions: [] }
  let calls = 0
  const state = await runLabAction({}, store, new Map(), { id: board.id, expectedRevision: 1, action: 'design' }, async () => { calls++; return { text: JSON.stringify(response), model: 'test' } })
  const next = state.boards[0]
  assert.equal(calls, 1)
  assert.equal(next.lab.comparison.variants.length, 1)
  assert.equal(next.lab.comparison.selectedId, 'A')
  assert.ok(isCurrentPlan(next.lab.comparison, next))
  assert.deepEqual(next.lab.runs, board.lab.runs)
  assert.match(next.lab.comparison.variants[0].imagePrompt, /穿灰色外套/)
})

test('continuing an old version restores exact prompt and settings without replacing history, including after restart', async t => {
  const { store, root, board } = await fixture(t)
  await store.mutate(s => { s.boards[0].idea = '新想法'; s.boards[0].lab.runs[0].request.quality = 'high'; return s })
  const before = (await store.read()).boards[0].lab.runs
  const state = await runResultsAction(store, { action: 'continue', id: board.id, runId: 'run_A', expectedRevision: 1 })
  const next = state.boards[0]
  assert.equal(next.idea, board.idea)
  assert.equal(next.shot.lighting, '暖色侧光')
  assert.equal(next.lab.comparison.variants[0].imagePrompt, before[0].prompt)
  assert.deepEqual(continuedImageSettings(next), { size: '1024x1024', quality: 'high', complexity: null })
  assert.deepEqual(next.lab.runs, before)
  assert.ok(isCurrentPlan(next.lab.comparison, next))
  assert.deepEqual((await new KitchenStore(root).read()).boards[0].lab.runs, before)
  await assert.rejects(runResultsAction(store, { action: 'continue', id: board.id, runId: 'run_B', expectedRevision: 1 }), { status: 409 })
  await store.mutate(s => { s.boards[0].idea = '再次调整'; return s })
  const undone = await store.undo(board.id, 3)
  assert.deepEqual(undone.state.boards[0].lab.runs, before)
})

test('failed or untraceable historical media cannot overwrite current creative settings', async t => {
  const { store, board } = await fixture(t)
  await store.mutate(s => { s.boards[0].lab.runs[0].status = 'failed'; delete s.boards[0].lab.runs[1].source; s.boards[0].idea = 'changed'; return s })
  const before = await store.read()
  for (const runId of ['run_A', 'run_B', 'missing']) {
    await assert.rejects(runResultsAction(store, { action: 'continue', id: board.id, runId, expectedRevision: 1 }))
  }
  assert.deepEqual(await store.read(), before)
})

test('continue → preserve requirements → edit → redesign keeps media and carries the requested change', async t => {
  const {store,board}=await fixture(t)
  let state=await runResultsAction(store,{action:'continue',id:board.id,runId:'run_A',expectedRevision:0})
  await store.mutate(s=>{s.boards[0].ingredients=[];return s})
  const before=(await store.read()).boards[0]
  assert.throws(()=>previewEdit(before,{subject:'另一个人'}),/保留/)
  state=await applyEdit(store,{id:board.id,expectedRevision:before.revision,changes:{lighting:'冷色背光'}})
  const edited=state.boards[0]
  assert.equal(isCurrentPlan(edited.lab.comparison,edited),false)
  assert.deepEqual(edited.retained,before.retained)
  let input
  state=await runLabAction({},store,new Map(),{id:board.id,expectedRevision:edited.revision,action:'design'},async (_ctx,_system,user)=>{
    input=JSON.parse(user)
    return {text:JSON.stringify({title:'调整后拍法',description:'冷色背光下的站台人物',image_prompt:'rainy platform, cool backlight',video_prompt:'rainy platform, cool backlight, static camera',assumptions:[]}),model:'test'}
  })
  const next=state.boards[0]
  assert.equal(input.fixed.lighting,'冷色背光')
  assert.equal(input.fixed.subject,before.retained.subject)
  assert.ok(isCurrentPlan(next.lab.comparison,next))
  assert.match(next.lab.comparison.variants[0].imagePrompt,/冷色背光/)
  assert.deepEqual(next.lab.runs,before.lab.runs)
})

test('single-shot edits and output settings sync prompts without a model call and preserve history', async t => {
  const {store,board}=await fixture(t)
  let state=await runResultsAction(store,{action:'continue',id:board.id,runId:'run_A',expectedRevision:0})
  const before=structuredClone(state.boards[0])
  state=await applyEdit(store,{id:board.id,expectedRevision:before.revision,changes:{motion:'缓慢推进'}})
  let next=state.boards[0]
  assert.ok(isCurrentPlan(next.lab.comparison,next))
  assert.notEqual(next.lab.comparison.id,before.lab.comparison.id)
  assert.match(next.lab.comparison.variants[0].imagePrompt,/缓慢推进/)
  assert.match(next.lab.comparison.variants[0].videoPrompt,/缓慢推进/)
  const base=structuredClone(next.lab.comparison.variants[0].promptBase)
  state=await store.mutate(s=>{s.boards[0].constraints={...s.boards[0].constraints,aspect:'16:9',duration:8};return s})
  next=state.boards[0]
  assert.ok(isCurrentPlan(next.lab.comparison,next))
  assert.match(next.lab.comparison.variants[0].videoPrompt,/duration: 8 seconds.*16:9/)
  assert.match(next.lab.comparison.variants[0].imagePrompt,/aspect ratio 16:9/)
  assert.deepEqual(next.lab.comparison.variants[0].promptBase,base)
  assert.equal(next.lab.comparison.variants[0].videoPrompt.match(/CURRENT USER REQUIREMENTS/g).length,1)
  assert.deepEqual(next.lab.runs,before.lab.runs)
  assert.equal(continuedImageSettings(next).size,undefined)
  const planId=next.lab.comparison.id
  state=await store.mutate(s=>{s.boards[0].title='改名';return s})
  assert.equal(state.boards[0].lab.comparison.id,planId)
  const undone=await store.undo(board.id,state.boards[0].revision)
  assert.deepEqual(undone.state.boards[0].lab.runs,before.lab.runs)
})

test('automatic prompt sync cannot make an outdated idea or ingredient selection current', async t => {
  const {store,board}=await fixture(t)
  await runResultsAction(store,{action:'continue',id:board.id,runId:'run_A',expectedRevision:0})
  await store.mutate(s=>{s.boards[0].idea='完全不同的镜头';return s})
  const state=await store.mutate(s=>{s.boards[0].constraints.duration=8;return s})
  assert.equal(isCurrentPlan(state.boards[0].lab.comparison,state.boards[0]),false)
})

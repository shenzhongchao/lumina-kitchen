import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { KitchenStore } from '../src/store.js'
import { createSharedTools } from '../src/shared-tools.js'
import { applyEdit, previewEdit, createBoard } from '../src/shared-experiment.js'
import { planKey } from '../src/lab-input.js'
import { proposeLocalEdit } from '../src/lab.js'

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'lumina-shared-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = new KitchenStore(root)
  const tools = new Map(createSharedTools({ store, dataDirOf: () => fileURLToPath(new URL('../resources/data', import.meta.url)) }).map(t => [t.name, t]))
  const call = (name, args, owner = 'chat-a') => tools.get(name).execute(args, { agent: { id: owner } })
  const { experiment } = await call('lumina_context', { action: 'create', source_text: '雨夜巷道中的追逐', title: '追逐' })
  return { store, call, experiment }
}

test('conversation binds shared panel experiment explicitly and stays bound across panel switching', async t => {
  const {store, call, experiment:a} = await fixture(t)
  const b = createBoard('另一实验')
  await store.mutate(s => { s.boards.push(b); s.activeId = b.id; return s })
  assert.equal((await call('lumina_context', {action:'current'})).experiment.id, a.id)
  assert.equal((await call('lumina_context', {action:'current'}, 'chat-b')).experiment, null)
  await assert.rejects(call('lumina_save_intent', {experiment_id:a.id,expected_revision:0,idea:'不应写入'}, 'chat-b'), /未绑定/)
  await call('lumina_context', {action:'bind',experiment_id:b.id}, 'chat-b')
  assert.equal((await call('lumina_context', {action:'current'},'chat-b')).experiment.id,b.id)
})

test('retained fields are editable separately; local preview and apply preserve all other inputs', async t => {
  const {store, call, experiment} = await fixture(t)
  const {experiment:locked} = await call('lumina_save_intent',{experiment_id:experiment.id,expected_revision:0,retained:{subject:'同一个穿灰色大衣的人',setting:'狭窄雨巷'}})
  const before = await store.read()
  const preview = await call('lumina_edit',{experiment_id:locked.id,expected_revision:locked.revision,action:'preview',changes:{motion:'低机位贴身跟拍'}})
  assert.deepEqual(await store.read(), before)
  const {experiment:after} = await call('lumina_edit',{experiment_id:locked.id,expected_revision:preview.expectedRevision,action:'apply',changes:preview.changes})
  assert.deepEqual(after.retained,locked.retained)
  assert.equal(after.idea,locked.idea)
  assert.deepEqual(after.constraints,locked.constraints)
  assert.equal(after.shot.motion,'低机位贴身跟拍')
  assert.notEqual(planKey(after),planKey(locked))
  await assert.rejects(applyEdit(store,{id:after.id,expectedRevision:after.revision,changes:{subject:'换一个人'}}),/已保留/)
  const {experiment:unlocked}=await call('lumina_save_intent',{experiment_id:after.id,expected_revision:after.revision,retained:{setting:'狭窄雨巷'}})
  await applyEdit(store,{id:after.id,expectedRevision:unlocked.revision,changes:{subject:'新人物'}})
})

test('stale previews and concurrent writes fail without overwriting newer edits', async t => {
  const {store, experiment} = await fixture(t)
  const preview=previewEdit(experiment,{motion:'稳定跟拍'})
  await store.mutate(s=>{s.boards[0].idea='新的想法';return s})
  await assert.rejects(applyEdit(store,preview),/另一处修改/)
  const board=(await store.read()).boards[0]
  const attempts=await Promise.allSettled(['侧向跟拍','向前推进'].map(motion=>applyEdit(store,{id:board.id,expectedRevision:board.revision,changes:{motion}})))
  assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1)
  assert.equal((await store.read()).boards[0].idea,'新的想法')
})

test('undo survives restart, increases revision and never rolls back another experiment', async t => {
  const {store, experiment:a} = await fixture(t)
  const b=createBoard('B')
  await store.mutate(s=>{s.boards.push(b);return s})
  await applyEdit(store,{id:a.id,expectedRevision:0,changes:{motion:'跟拍'}})
  await applyEdit(store,{id:b.id,expectedRevision:0,changes:{lighting:'侧光'}})
  const reopened=new KitchenStore(store.root)
  const {state}=await reopened.undo(a.id,1)
  assert.equal(state.boards.find(x=>x.id===a.id).revision,2)
  assert.deepEqual(state.boards.find(x=>x.id===a.id).shot,{})
  assert.equal(state.boards.find(x=>x.id===b.id).shot.lighting,'侧光')
  await assert.rejects(reopened.undo(a.id,1),/另一处修改/)
})

test('AI local edit is restricted to target field and failures never mutate storage', async t => {
  const {store,experiment} = await fixture(t)
  const result=await proposeLocalEdit({},experiment,'motion','加强紧张感',async (_ctx,_system,user)=>{
    assert.equal(JSON.parse(user).field,'motion')
    return {text:JSON.stringify({value:'低机位跟拍'}),model:'fixture'}
  })
  assert.deepEqual(result,{motion:'低机位跟拍'})
  assert.equal((await store.read()).boards[0].revision,0)
  await assert.rejects(proposeLocalEdit({}, {...experiment,retained:{motion:'固定机位'}},'motion','跟拍',()=>{throw new Error('不应调用')}),/已保留/)
  await assert.rejects(proposeLocalEdit({},experiment,'motion','跟拍',async()=>({text:'bad'})),/重试/)
  assert.deepEqual((await store.read()).boards[0].shot,{})
})

test('invalid fields, missing identity, cancelled requests and corrupt storage fail closed', async t => {
  const {store,call,experiment}=await fixture(t)
  await assert.rejects(call('lumina_edit',{action:'apply',experiment_id:experiment.id,expected_revision:0,changes:{unknown:'x'}}),/不支持/)
  assert.throws(()=>previewEdit(experiment,JSON.parse('{"__proto__":"bad"}')),/未知/)
  const tools=createSharedTools({store,dataDirOf:()=>''})
  await assert.rejects(tools[0].execute({action:'current'},{}),/身份/)
  await assert.rejects(tools[0].execute({action:'current'},{agent:{id:'chat-a'},signal:AbortSignal.abort()}))
  await writeFile(store.file,'bad')
  await assert.rejects(store.mutate(s=>s))
})

test('new workspace does not load legacy boards', async t => {
  const {store}=await fixture(t)
  await writeFile(join(store.root,'boards.json'),JSON.stringify({boards:[{id:'old'}]}))
  assert.ok((await store.read()).boards.every(b=>b.id!=='old'))
})

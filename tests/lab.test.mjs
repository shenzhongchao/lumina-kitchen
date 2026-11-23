import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { KitchenStore } from '../src/store.js'
import { loadKnowledge } from '../src/knowledge.js'
import { runLabAction, validateComparison } from '../src/lab.js'
import { planKey, intentKey } from '../src/lab-input.js'

const records = await loadKnowledge(fileURLToPath(new URL('../resources/data', import.meta.url)))
const ids = ['1-1-extreme-long-shot', '1-3-negative-space']
const selected = new Map(ids.map(id => [id, records.get(id)]))
const board = () => ({ id: 'test', idea: '雨夜站台，让人物显得孤独', title: '测试', constraints: { duration: 6, aspect: '16:9' }, ingredients: ids.map(slug => ({ slug, weight: 2 })) })
const comparison = () => ({
  variable_field: 'framing', summary: '通过人物占比与留白强调孤独', variable: '人物占画面高度的比例',
  baseline: [{ label: '人物', value: '穿灰色大衣的同一个人' }, { label: '场景', value: '雨夜站台，固定机位' }], assumptions: ['没有参考图，外观暂定'],
  image_base_en: 'Same person in a grey coat, rainy platform, 16:9, static camera.', video_base_en: 'Same person in a grey coat, rainy platform, 16:9, 6 seconds, static camera.',
  variants: ['one third', 'one tenth'].map((size, i) => ({ title: `比例${i}`, change: `人物大小${size}`, effect: '人物相对环境的比例改变孤独感', tradeoff: '表情可读性下降', observe: '看人物高度占比和留白', image_change_en: `Person height ${size} of frame.`, video_change_en: `Keep person height ${size} of frame.`, concept_ids: [ids[i]] })),
})
const response = data => ({ text: JSON.stringify(data), model: 'test-native-model' })
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'lumina-lab-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = new KitchenStore(root)
  await store.write({ activeId: 'test', boards: [board()] })
  return store
}

test('panel recommendation retrieves real knowledge, never adds or reweights ingredients', async t => {
  const store = await fixture(t)
  let calls = 0
  const model = async (ctx, system, user) => {
    calls++
    if (calls === 1) return response({ understanding: '让人物被空旷站台包围', queries: ['大远景', '负空间'], assumptions: [], question: null })
    const payload = JSON.parse(user)
    assert.ok(payload.knowledge.some(r => r.id === ids[0]))
    return response({ items: ids.map(id => ({ id, effect: '人物显得渺小', why: '环境占据更多画面', tradeoff: '表情不易辨认' })) })
  }
  const saved = await runLabAction({}, store, records, { id: 'test', action: 'recommend' }, model)
  assert.equal(calls, 2)
  assert.deepEqual(saved.boards[0].ingredients, board().ingredients)
  assert.equal(saved.boards[0].lab.recommendation.items.length, 2)
  assert.ok(saved.boards[0].lab.recommendation.items[0].evidence.digest)
  assert.equal(saved.boards[0].lab.recommendation.inputKey, intentKey(board()))
})

test('clarification does not auto-pick ingredients or pretend to have recommendations', async t => {
  const store = await fixture(t)
  const model = async () => response({ understanding: '孤独感', queries: ['孤独', '构图'], assumptions: [], question: { prompt: '看清表情还是突出空旷？', options: ['表情', '空旷', '帮我比较'] } })
  const saved = await runLabAction({}, store, records, { id: 'test', action: 'recommend' }, model)
  assert.equal(saved.boards[0].lab.recommendation.items.length, 0)
  assert.deepEqual(saved.boards[0].ingredients, board().ingredients)
})

test('comparison and explicit adoption persist; changed inputs reject adoption', async t => {
  const store = await fixture(t)
  let saved = await runLabAction({}, store, records, { id: 'test', action: 'compare' }, async () => response(comparison()))
  const plan = saved.boards[0].lab.comparison
  assert.equal(plan.mediaStatus, 'not_generated')
  assert.equal(plan.selectedId, null)
  assert.ok(plan.variants.every(v => v.imagePrompt.startsWith(comparison().image_base_en)))
  saved = await runLabAction({}, store, records, { id: 'test', action: 'adopt', planId: plan.id, variantId: 'B' })
  assert.equal(saved.boards[0].lab.comparison.selectedId, 'B')
  assert.equal((await new KitchenStore(store.root).read()).boards[0].lab.comparison.selectedId, 'B')
  await store.mutate(s => { s.boards[0].ingredients[0].weight = 3; return s })
  await assert.rejects(runLabAction({}, store, records, { id: 'test', action: 'adopt', planId: plan.id, variantId: 'A' }), /变化/)
})

test('retiming writes the duration and redesigned shot together only after successful model output', async t => {
  const store = await fixture(t)
  const previousRun = { id: 'old-media', kind: 'video', request: { duration: 30 } }
  await store.mutate(state => {
    const current = state.boards[0]
    current.constraints.duration = 30
    current.lab = { runs: [previousRun] }
    return state
  })
  const shot = (duration, stop) => ({ title: '站台跟拍', description: `跟拍至第 ${stop} 秒后减速，共 ${duration} 秒。`,
    image_prompt: 'Rainy platform side-lit portrait', video_prompt: `Track until second ${stop}, ease to a stop.`, duration_seconds: duration, assumptions: [] })
  const prepared = (await runLabAction({}, store, records, { id: 'test', action: 'design' }, async (ctx, system, input) => {
    assert.equal(JSON.parse(input).constraints.duration, 30)
    return response(shot(30, 24))
  })).boards[0]
  const previousPlan = prepared.lab.comparison
  const args = { id: 'test', action: 'retime', duration: 20, planId: previousPlan.id, expectedRevision: prepared.revision }
  let calls = 0
  const mock = async (ctx, system, input) => {
    calls++
    const data = JSON.parse(input)
    assert.equal(data.constraints.duration, 20)
    assert.match(data.previous_shot.description, /第 24 秒/)
    return response(shot(20, 14))
  }
  await assert.rejects(runLabAction({}, store, records, args, mock, { videoInfo: { minDuration: 4, maxDuration: 15 } }), /可用范围/)
  assert.equal(calls, 0)
  await assert.rejects(runLabAction({}, store, records, args, async () => response(shot(30, 24))), /本次视频时长应为 20 秒/)
  assert.deepEqual((await store.read()).boards[0], prepared)
  const updated = (await runLabAction({}, store, records, args, mock)).boards[0]
  assert.equal(calls, 1)
  assert.equal(updated.constraints.duration, 20)
  assert.equal(updated.lab.comparison.inputKey, planKey(updated))
  assert.notEqual(updated.lab.comparison.id, previousPlan.id)
  assert.match(updated.lab.comparison.variants[0].effect, /第 14 秒/)
  assert.match(updated.lab.comparison.variants[0].videoPrompt, /Video duration: 20 seconds.*\n[\s\S]*until second 14/)
  assert.equal(updated.lab.comparison.variants[0].imagePrompt, previousPlan.variants[0].imagePrompt)
  assert.deepEqual(updated.lab.runs, [previousRun])
})

test('answered clarification proceeds to recommendations even if model asks again', async t => {
  const store = await fixture(t)
  const question = { prompt: '表情还是空旷？', options: ['空旷', '表情'] }
  await store.mutate(s => { s.boards[0].lab = { recommendation: { question, inputKey: intentKey(s.boards[0]) } }; return s })
  let calls = 0
  const saved = await runLabAction({}, store, records, { id: 'test', action: 'recommend', answer: { prompt: question.prompt, option: '空旷' } }, async (ctx, system, user) => {
    assert.equal(JSON.parse(user).idea, board().idea)
    assert.equal(JSON.parse(user).clarification.option, '空旷')
    calls++
    return calls === 1 ? response({ understanding: '突出空旷', queries: ['大远景', '留白'], assumptions: [], question })
      : response({ items: ids.map(id => ({ id, effect: '人物更小', why: '突出环境', tradeoff: '表情变小' })) })
  })
  assert.equal(calls, 2)
  assert.equal(saved.boards[0].lab.recommendation.question, null)
  assert.equal(saved.boards[0].lab.recommendation.clarified, true)
  assert.equal(saved.boards[0].lab.recommendation.items.length, 2)
  assert.equal(saved.boards[0].idea, board().idea)
  assert.equal(saved.boards[0].lab.clarification.option, '空旷')
  await runLabAction({}, store, records, {id:'test', action:'compare'}, async (ctx, system, user) => {
    assert.equal(JSON.parse(user).clarification.option, '空旷')
    return response(comparison())
  })
  await store.mutate(s => { s.boards[0].idea = '新的画面'; return s })
  await runLabAction({}, store, records, {id:'test', action:'compare'}, async (ctx, system, user) => {
    assert.equal(JSON.parse(user).clarification, null)
    return response(comparison())
  })
})

test('reject fabricated citations, identical variants and incomplete outputs', () => {
  const fake = comparison(); fake.variants[0].concept_ids = ['invented']
  assert.throws(() => validateComparison(fake, selected), /未提供/)
  const same = comparison(); same.variants[1].change = same.variants[0].change
  assert.throws(() => validateComparison(same, selected), /差异/)
  assert.throws(() => validateComparison({}, selected))
})

test('comparison rejects retained variables and carries fixed values into both prompts', () => {
  const b = { ...board(), retained: { subject: '同一个穿灰色大衣的人物' }, shot: { motion: '沿人物侧面稳定跟拍' } }
  const result = validateComparison(comparison(), selected, b)
  for (const variant of result.variants) {
    assert.ok(variant.imagePrompt.includes(b.retained.subject))
    assert.ok(variant.videoPrompt.includes(b.shot.motion))
  }
  assert.throws(() => validateComparison(comparison(), selected, { ...b, retained: { framing: '始终保持全景' } }), /保留条件/)
})

test('in-flight input changes do not overwrite new work; failures preserve old result', async t => {
  const store = await fixture(t)
  await assert.rejects(runLabAction({}, store, records, { id: 'test', action: 'compare' }, async () => {
    await store.mutate(s => { s.boards[0].idea = '新想法'; return s })
    return response(comparison())
  }), /变化/)
  assert.equal((await store.read()).boards[0].idea, '新想法')
  assert.equal((await store.read()).boards[0].lab, undefined)
  let calls = 0
  await assert.rejects(runLabAction({}, store, records, { id: 'test', action: 'compare' }, async () => { calls++; return { text: 'not json' } }), /重试/)
  assert.equal(calls, 2)
  assert.equal((await store.read()).boards[0].lab, undefined)
})

test('serialized board writes retain concurrent fields and corrupt storage fails closed', async t => {
  const store = await fixture(t)
  await Promise.all([
    store.mutate(async s => { await new Promise(r => setTimeout(r, 10)); s.boards[0].title = 'new title'; return s }),
    store.mutate(s => { s.boards[0].lab = { example: true }; return s }),
  ])
  const saved = await store.read()
  assert.equal(saved.boards[0].title, 'new title')
  assert.equal(saved.boards[0].lab.example, true)
  assert.notEqual(planKey({ ...board(), idea: 'different' }), planKey(board()))
  await writeFile(store.file, '{bad')
  await assert.rejects(store.read())
  await assert.rejects(store.mutate(s => s))
})


test('stale clarification is rejected and failed answers remain retryable', async t => {
  const store = await fixture(t)
  const question = { prompt: '表情还是环境？', options: ['表情', '环境'] }
  await store.mutate(s => { s.boards[0].lab = { recommendation: { question, inputKey: intentKey(s.boards[0]) } }; return s })
  const args = { id: 'test', action: 'recommend', answer: {prompt: question.prompt, option: '环境'} }
  await assert.rejects(runLabAction({}, store, records, args, async () => { throw new Error('请求失败') }), /重试/)
  assert.equal((await store.read()).boards[0].lab.clarification, undefined)
  let calls = 0
  await runLabAction({}, store, records, args, async () => ++calls === 1
    ? response({understanding:'环境', queries:['大远景','留白'], assumptions:[], question:null})
    : response({items:ids.map(id=>({id,effect:'更小',why:'环境',tradeoff:'表情'}))}))
  assert.equal((await store.read()).boards[0].idea, board().idea)
  await store.mutate(s => { s.boards[0].idea = '新的想法'; return s })
  await assert.rejects(runLabAction({}, store, records, args, async () => { throw new Error('不应调用模型') }), /澄清问题已变化/)
})


test('compose fills an editable list without replacing manual choices, settings or media', async t => {
  const store = await fixture(t)
  await store.mutate(s => {
    const b=s.boards[0]; b.ingredients=[{slug:ids[0],weight:3,locked:true}]
    b.retained={subject:'同一个人'}; b.shot={lighting:'暖光'}; b.lab={runs:[{id:'keep',kind:'image',status:'succeeded'}]}
    return s
  })
  const before=(await store.read()).boards[0]
  let calls=0
  const saved=await runLabAction({},store,records,{id:'test',action:'compose'},async()=>++calls===1
    ? response({understanding:'突出空旷',queries:['大远景','负空间'],assumptions:[],question:{prompt:'不再追问',options:['一','二']}})
    : response({items:ids.map(id=>({id,effect:'突出环境',why:'呼应孤独',tradeoff:'表情变小'}))}))
  const after=saved.boards[0]
  assert.equal(calls,2)
  assert.deepEqual(after.ingredients,[...before.ingredients,{slug:ids[1],weight:2}])
  for(const key of ['constraints','retained','shot']) assert.deepEqual(after[key],before[key])
  assert.deepEqual(after.lab.runs,before.lab.runs)
  assert.equal(after.lab.recommendation.question,null)
})

test('compose rejects stale recommendation after a concurrent manual edit', async t => {
  const store=await fixture(t)
  let calls=0
  await assert.rejects(runLabAction({},store,records,{id:'test',action:'compose'},async()=>{
    if(++calls===1) return response({understanding:'突出空旷',queries:['大远景','负空间'],assumptions:[],question:null})
    await store.mutate(s=>{s.boards[0].ingredients[0].weight=1;return s})
    return response({items:ids.map(id=>({id,effect:'突出环境',why:'呼应孤独',tradeoff:'表情变小'}))})
  }),/生成期间输入发生变化/)
  const after=(await store.read()).boards[0]
  assert.equal(after.ingredients[0].weight,1)
  assert.equal(after.lab?.recommendation,undefined)
})

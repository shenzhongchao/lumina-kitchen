import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createBoard } from '../src/shared-experiment.js'
import { createDemoBoard } from '../src/onboarding.js'
const source = await readFile(new URL('../src/client/86-onboarding.js', import.meta.url), 'utf8')
test('new and unfinished creations open atlas; existing plans and results open details', () => {
  const { firstView } = new Function(source + '; return {firstView}')()
  const board = createBoard()
  assert.equal(firstView(board), 'atlas')
  for (const change of [{ onboardingStarted: true }, { idea: 'my idea' }, { lab: {} }, { ingredients: [{ slug: 'x' }] }]) assert.equal(firstView({ ...board, ...change }), 'atlas')
  assert.equal(firstView(createDemoBoard()), 'create')
})
test('every text request explains model, output and unknown cost; cancel denies, demo never prompts', () => {
  let message, answer = false
  const { confirmTextCall } = new Function('window', source + '; return {confirmTextCall}')({ confirm: text => { message = text; return answer } })
  for (const action of ['recommend', 'compose', 'compare', 'edit']) {
    assert.equal(confirmTextCall({}, { label: 'TEST MODEL' }, action), false)
    assert.match(message, /TEST MODEL/)
    assert.match(message, /费用未知/)
    assert.match(message, /不会生成图片或视频/)
    assert.match(message, /多次模型请求/)
  }
  answer = true
  assert.equal(confirmTextCall({}, null, 'compare'), true)
  assert.throws(() => confirmTextCall({ demo: 'yes' }, null, 'compare'), /入门练习不调用模型/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { planKey, legacyPlanKey, planChangeLabels } from '../src/lab-input.js'
test('outdated plan explains changed inputs without inventing a cause for missing history', () => {
  const board = { idea: '雨夜', constraints: { duration: 8 }, ingredients: [{ slug: 'x', weight: 2 }], retained: {}, shot: {} }
  const plan = { inputKey: planKey(board) }
  assert.deepEqual(planChangeLabels(plan, board), [])
  assert.deepEqual(planChangeLabels(plan, { ...board, idea: '清晨' }), ['镜头想法'])
  assert.deepEqual(planChangeLabels(plan, { ...board, constraints: { duration: 10 }, ingredients: [{ slug: 'x', weight: 3 }] }), ['实验设置', '配料或影响程度'])
  assert.deepEqual(planChangeLabels({ inputKey: legacyPlanKey(board) }, board), [])
  assert.deepEqual(planChangeLabels({}, board), [])
  assert.deepEqual(planChangeLabels({ inputKey: 'broken' }, board), [])
})

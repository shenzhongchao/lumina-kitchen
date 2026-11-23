import { createBoard } from '../../src/shared-experiment.js'
import { captureSource } from '../../src/results.js'
import { planKey } from '../../src/lab-input.js'

export function resultBoard() {
  const board = createBoard('雨夜站台 · 验证样例', '雨夜站台上的孤独人物')
  board.id = 'b1'
  board.retained = { subject: '穿灰色外套的人物' }
  board.shot = { subject: board.retained.subject, framing: '人物位于画面右侧' }
  board.ingredients = [{ slug: 'long-shot', weight: 2 }]
  const plan = { id: 'p1', variable: '灯光方向', variableField: 'lighting', inputKey: planKey(board),
    baseline: [{ label: '人物', value: board.retained.subject }], assumptions: [], summary: '观察光线对人物轮廓的影响', selectedId: 'A',
    variants: ['A', 'B'].map(id => ({ id, title: id === 'A' ? '暖色侧光' : '冷色顶光', change: id === 'A' ? '暖色侧光' : '冷色顶光',
      observe: '观察轮廓与背景分离', effect: '突出人物轮廓', tradeoff: '环境细节减少', evidence: [], imagePrompt: `rainy platform ${id}`, videoPrompt: `rainy platform motion ${id}` })) }
  const runs = plan.variants.map((variant, i) => ({ id: `run_${variant.id}`, kind: 'image', planId: plan.id, variantId: variant.id, status: 'succeeded',
    model: '测试模型（非付费生成）', provider: 'fixture', prompt: variant.imagePrompt, request: { size: '1024x1024' },
    createdAt: `2026-11-15T00:0${i}:00Z`, source: captureSource(board, plan, variant), asset: { file: `${String(i + 1).repeat(64)}.png`, mime: 'image/png' } }))
  board.lab = { comparison: plan, runs }
  return board
}
export const reviewInput = { action: 'review', id: 'b1', expectedRevision: 0, runIds: ['run_A', 'run_B'], preferredRunId: 'run_A',
  outcome: 'achieved', comparability: 'changed', observed: '暖色侧光的人物轮廓更清晰', deviations: '姿势也有变化，不能确定全由灯光造成',
  nextChange: '只降低背景亮度', reusableWhen: '单人夜景，强调孤独感' }

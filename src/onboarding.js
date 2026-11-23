import { editableBoard, autoTitle, displayWorkspace } from './experiments.js'
import { createBoard, checkRevision } from './shared-experiment.js'
import { captureSource } from './results.js'
import { planKey } from './lab-input.js'

export const COMPOSITION_METHOD = '比较人物在画面中的占比：人物更小、周围留白更多时，环境可能显得更空旷，但人物细节会减少。保持其他条件尽量一致，观察这种变化是否符合你的表达目标。'

export const DEMO_ID = 'composition-space-v1'
export function createDemoBoard() {
  const board = createBoard('入门练习 · 让人物显得孤独', '通过人物与环境的大小关系，让一个独处的人显得孤独。')
  board.demo = DEMO_ID
  board.onboardingStarted = true
  board.constraints.aspect = '16:9'
  board.retained = { subject: '橙色图形代表同一个人物', color: '深青色背景与橙色主体' }
  const plan = { id: `${board.id}_plan`, inputKey: planKey(board), variable: '人物在画面中的占比', variableField: 'framing',
    baseline: [{ label: '共同条件', value: '相同画幅、背景颜色、人物位置与色彩' }], assumptions: [],
    summary: '这是构图原理示意，不是照片或 AI 生成效果。比较人物占比对环境空旷感的影响。', selectedId: null,
    variants: ['A', 'B'].map(id => ({ id, title: id === 'A' ? '小人物，大环境' : '靠近人物',
      change: id === 'A' ? '缩小人物在画面中的占比' : '放大人物在画面中的占比',
      effect: id === 'A' ? '环境更空旷，人物更渺小' : '注意力更集中在人物上',
      tradeoff: id === 'A' ? '看不清人物细节' : '环境的空旷感减弱', observe: '哪张让你更注意到人物周围的空白？',
      evidence: [], imagePrompt: '本地构图示意，无模型调用', videoPrompt: '本示例没有视频生成' })) }
  board.lab = { comparison: plan, reviews: [], runs: plan.variants.map(v => ({
    id: `${board.id}_${v.id}`, kind: 'image', status: 'succeeded', planId: plan.id, variantId: v.id,
    provider: 'local-demo', model: '本地构图示意（非 AI 生成）', costUsd: 0,
    request: { size: '960x540' }, createdAt: new Date().toISOString(), prompt: v.imagePrompt,
    remoteUrl: `/lumina-kitchen/demo-media/${v.id}.svg`, source: captureSource(board, plan, v),
  })) }
  return board
}

export async function runOnboardingAction(store, input) {
  const saved = await store.mutate(state => {
    if (input.action === 'demo') {
      let demo = state.boards.find(b => b.demo === DEMO_ID && !b.lineage)
      if (!demo) { demo = createDemoBoard(); state.boards.unshift(demo) }
      if (demo.title === '免费示例 · 让人物显得孤独') demo.title = '入门练习 · 让人物显得孤独'
      delete demo.archivedAt
      state.activeId = demo.id
      return state
    }
    if (input.action === 'practice') {
      const source = state.boards.find(b => b.id === input.id)
      checkRevision(source, input.expectedRevision)
      if (source.demo !== DEMO_ID || source.archivedAt || !source.lab?.reviews?.length) {
        throw Object.assign(new Error('请先在入门练习中保存一次观察，再开始自己的实验。'), { status: 400 })
      }
      const board = createBoard()
      board.shot.framing = COMPOSITION_METHOD
      board.constraints.aspect = '16:9'
      state.boards.unshift(board)
      state.activeId = board.id
      return state
    }
    if (!['start', 'skip'].includes(input.action)) throw Object.assign(new Error('不支持的开始方式'), { status: 400 })
    if (input.action === 'skip' && input.id === state.activeId && !state.boards.some(b => b.id === input.id)) { state.draftSkipped = input.id; return state }
    const board = editableBoard(state, input.id, input.expectedRevision)
    if (input.action === 'start') {
      if (typeof input.idea !== 'string' || !input.idea.trim() || input.idea.length > 1000) throw Object.assign(new Error('请用 1000 字以内描述你的镜头'), { status: 400 })
      board.idea = input.idea.trim()
      autoTitle(board)
    }
    board.onboardingStarted = true
    state.activeId = board.id
    return state
  }, { undoable: false })
  return displayWorkspace(saved)
}

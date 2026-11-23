// Results retain the exact inputs used to generate them, independently of later edits.
import { createBoard, checkRevision } from './shared-experiment.js'
import { newId } from './store.js'
import { isCurrentPlan, planKey } from './lab-input.js'

const bad = message => { throw Object.assign(new Error(message), { status: 400 }) }
const copy = value => structuredClone(value)
function text(value, label, max = 2000, required = true) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) bad(`${label}须填写${max}字以内的文字`)
  return value.trim()
}
export function captureSource(board, plan, variant) {
  return copy({
    ...(board.demo ? { demo: board.demo } : {}), boardId: board.id, revision: board.revision, title: board.title,
    idea: board.idea, constraints: board.constraints, ingredients: board.ingredients,
    retained: board.retained || {}, shot: board.shot || {}, targets: board.targets || {},
    plan: { id: plan.id, variable: plan.variable, variableField: plan.variableField,
      baseline: plan.baseline || [], assumptions: plan.assumptions || [], summary: plan.summary || '' },
    variant,
  })
}
function successfulRun(board, id) {
  const run = board.lab?.runs?.find(r => r.id === id)
  if (!run || run.status !== 'succeeded' || (!run.asset?.file && !run.remoteUrl)) bad('请选择当前实验中已完成且有媒体的结果')
  return run
}
function sourceFor(board, run) {
  if (run.source) return copy(run.source)
  // Legacy runs can only be enriched while their original inputs are still current.
  const plan = board.lab?.comparison
  const variant = plan?.variants?.find(v => v.id === run.variantId)
  if (plan?.id === run.planId && variant && isCurrentPlan(plan, board)) return captureSource(board, plan, variant)
  bad('这个旧结果缺少生成时的条件快照，可复盘，但不能据此创建分支或保存配方')
}
function newFromSource(source, title, lineage) {
  const board = createBoard(title, source.idea)
  Object.assign(board, copy({ constraints: source.constraints, ingredients: source.ingredients,
    retained: source.retained, shot: source.shot, targets: source.targets }))
  const field = source.plan.variableField
  if (field && !board.retained[field]) board.shot[field] = source.variant.change
  if (source.demo) board.demo = source.demo
  board.lineage = copy(lineage)
  board.createdAt = new Date().toISOString()
  const variant = copy(source.variant)
  board.lab = { comparison: { ...copy(source.plan), id: newId('plan'), mode: 'create', variableField: null,
    variants: [variant], selectedId: variant.id, inputKey: planKey(board), createdAt: board.createdAt } }
  if (lineage.result) {
    const run = lineage.result
    if (run.prompt) variant[run.kind === 'video' ? 'videoPrompt' : 'imagePrompt'] = run.prompt
    if (run.kind === 'video' && run.request?.duration) board.constraints.duration = run.request.duration
    if (run.kind === 'video' && run.request?.ratio) board.constraints.aspect = run.request.ratio
    board.lab.continuedFrom = { runId: run.id, kind: run.kind, request: copy(run.request || {}), model: run.model, service: copy(run.service || {}) }
    board.lab.comparison.inputKey = planKey(board)
  }
  return board
}

export async function runResultsAction(store, input, { owner } = {}) {
  let result
  const state = await store.mutate(state => {
    const board = state.boards.find(b => b.id === input.id) || (input.action === 'reuse-recipe' && input.id === state.activeId && input.id?.startsWith('draft_') ? { id: input.id, revision: 0 } : null)
    checkRevision(board, input.expectedRevision)
    state.recipes ||= []
    const now = new Date().toISOString()
    if (input.action === 'review') {
      if (!Array.isArray(input.runIds) || input.runIds.length !== 2 || new Set(input.runIds).size !== 2) bad('请选择两个不同的生成结果')
      const runs = input.runIds.map(id => successfulRun(board, id))
      if (runs[0].kind !== runs[1].kind) bad('请比较同一类型的结果：两张图片或两条视频')
      if (!['achieved', 'partial', 'not_achieved'].includes(input.outcome)) bad('请选择目标达成情况')
      if (!['controlled', 'changed', 'unsure'].includes(input.comparability)) bad('请确认其他条件是否也发生变化')
      if (input.preferredRunId && !input.runIds.includes(input.preferredRunId)) bad('偏好结果必须来自本次比较')
      if (input.outcome === 'achieved' && !input.preferredRunId) bad('目标达成时请选择要保留的结果')
      const review = {
        id: newId('review'), runIds: [...input.runIds], preferredRunId: input.preferredRunId || null,
        outcome: input.outcome, comparability: input.comparability,
        observed: text(input.observed, '观察与依据'), deviations: text(input.deviations || '', '偏差', 2000, false),
        nextChange: text(input.nextChange || '', '下一次修改', 2000, false),
        reusableWhen: text(input.reusableWhen || '', '适用条件', 2000, false),
        author: 'user', createdAt: now,
      }
      board.lab.reviews ||= []
      board.lab.reviews.push(review)
      result = { reviewId: review.id }
    } else if (input.action === 'continue') {
      const run = successfulRun(board, input.runId)
      const source = sourceFor(board, run)
      const restored = newFromSource(source, board.title, { result: run })
      for (const key of ['idea', 'constraints', 'ingredients', 'retained', 'shot', 'targets']) board[key] = copy(restored[key])
      // Keep every run in this creation; only restore editable inputs and a fresh plan.
      delete board.lab.clarification
      delete board.lab.recommendation
      const variant = copy(source.variant)
      if (run.kind === 'image') variant.imagePrompt = run.prompt || variant.imagePrompt
      else variant.videoPrompt = run.prompt || variant.videoPrompt
      board.lab.comparison = { ...copy(source.plan), id: newId('plan'), mode: 'create', variableField: null,
        variants: [variant], selectedId: variant.id, inputKey: planKey(board), createdAt: now }
      board.lab.continuedFrom = { runId: run.id, kind: run.kind, request: copy(run.request || {}), model: run.model, service: copy(run.service || {}), createdAt: now }
      result = { continuedRunId: run.id }
    } else if (input.action === 'branch') {
      const run = successfulRun(board, input.runId)
      const source = sourceFor(board, run)
      const branch = newFromSource(source, text(input.title || `${source.title} · 分支`.slice(0, 40), '分支名称', 40), {
        type: 'branch', boardId: board.id, boardTitle: source.title, runId: run.id, createdAt: now,
        source, result: copy(run),
      })
      state.boards.unshift(branch); state.activeId = branch.id
      result = { boardId: branch.id }
    } else if (input.action === 'save-recipe') {
      const review = board.lab?.reviews?.find(r => r.id === input.reviewId)
      if (!review || review.outcome !== 'achieved' || !review.preferredRunId) bad('先保存已达成目标且选定结果的用户复盘')
      if (!review.reusableWhen?.trim()) bad('请在复盘中填写配方适用条件')
      const existing = state.recipes.find(r => r.boardId === board.id && r.review?.id === review.id)
      if (existing) { result = { recipeId: existing.id }; return state }
      const run = successfulRun(board, review.preferredRunId)
      const recipe = { id: newId('recipe'), title: text(input.title, '配方名称', 60), boardId: board.id,
        source: sourceFor(board, run), result: copy(run), review: copy(review), createdAt: now }
      state.recipes.unshift(recipe)
      result = { recipeId: recipe.id }
    } else if (input.action === 'reuse-recipe') {
      const recipe = state.recipes.find(r => r.id === input.recipeId)
      if (!recipe) bad('找不到这份成功配方')
      const branch = newFromSource(recipe.source, text(input.title || `${recipe.title} · 复用`.slice(0, 40), '实验名称', 40), {
        type: 'recipe', recipeId: recipe.id, recipeTitle: recipe.title, boardId: recipe.boardId,
        runId: recipe.result.id, source: recipe.source, result: recipe.result, review: recipe.review, createdAt: now,
      })
      state.boards.unshift(branch); state.activeId = branch.id
      result = { boardId: branch.id }
    } else bad('不支持的结果操作')
    if (owner && result?.boardId) state.bindings[owner] = result.boardId
    return state
  }, { undoable: false, label: '保存结果与复盘' })
  return { ...state, result }
}

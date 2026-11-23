// Shared by the host and panel: generated results belong to exact inputs.
export const SHOT_FIELDS = { subject: '人物 / 主体', setting: '场景', framing: '构图', lighting: '光线', color: '色彩', optics: '镜头与景深', texture: '材质', motion: '运镜', style: '风格' }

// The panel has one editable brief. Bring legacy structured requirements into
// that text before clearing them, so no invisible rule can override later edits.
export function panelIdeaBoard(board) {
  if (!board || board.demo) return board
  if (!Object.keys({ ...board.shot, ...board.retained }).length && (board.idea || '').length <= 1000) return board
  let idea = board.idea || ''
  for (const [key, value] of Object.entries({ ...board.shot, ...board.retained })) {
    const text = String(value || '').trim()
    if (text && !idea.includes(text)) idea += `${idea ? '\n' : ''}${SHOT_FIELDS[key] || key}：${text}`
  }
  const next = { ...board, idea, retained: {}, shot: {}, panelIdeaOnly: true }
  const plan = board.lab?.comparison
  if (plan && isCurrentPlan(plan, board)) next.lab = { ...board.lab, comparison: { ...plan, inputKey: planKey(next) } }
  return next
}
// Restore output settings, but never resurrect old credentials or silently switch services.
export function continuedImageSettings(board) {
  const prior = board.lab?.continuedFrom
  if (prior?.kind !== 'image') return {}
  const request = prior.request || {}
  const sourceAspect = board.lab?.runs?.find(run => run.id === prior.runId)?.source?.constraints?.aspect
  const sameAspect = !sourceAspect || sourceAspect === board.constraints?.aspect
  return { ...(request.size && sameAspect ? { size: request.size } : {}), ...(request.quality ? { quality: request.quality } : {}), complexity: request.complexity || null }
}
export function baseIntentKey(board) {
  return JSON.stringify({ idea: board.idea?.trim() || '', constraints: board.constraints || {}, retained: board.retained || {}, shot: board.shot || {} })
}
export function currentClarification(board) {
  const clarification = board.lab?.clarification
  return clarification?.sourceKey === baseIntentKey(board) ? clarification : null
}
export function intentKey(board) {
  const clarification = currentClarification(board)
  return clarification ? JSON.stringify({ input: baseIntentKey(board), clarification: { prompt: clarification.prompt, option: clarification.option } }) : baseIntentKey(board)
}
function ingredientsKey(board) {
  return (board.ingredients || []).map(i => ({ slug: i.slug, weight: i.weight, locked: Boolean(i.locked) }))
}

// Plans saved before 2.0 used the old schema, where intent was a JSON string
// and retained/shot did not exist. Keep those experiments usable without
// rewriting their stored record on read.
export function legacyIntentKey(board) {
  return JSON.stringify({ idea: board.idea?.trim() || '', constraints: board.constraints || {} })
}
export function legacyPlanKey(board) {
  return JSON.stringify({ intent: legacyIntentKey(board), ingredients: ingredientsKey(board) })
}
function legacyBoardShape(board) {
  return !Object.keys(board.retained || {}).length && !Object.keys(board.shot || {}).length
}
export function isCurrentIntent(record, board) {
  return record?.inputKey === intentKey(board) || (legacyBoardShape(board) && record?.inputKey === legacyIntentKey(board))
}
export function isCurrentPlan(plan, board) {
  return plan?.inputKey === planKey(board) || (legacyBoardShape(board) && plan?.inputKey === legacyPlanKey(board))
}

export function planKey(board) {
  return JSON.stringify({ intent: intentKey(board), ingredients: ingredientsKey(board) })
}

export function targetVideoDuration(board) {
  return Number(board.constraints?.duration) || 15
}

export function videoDurationSupported(duration, { minDuration = 4, maxDuration = 30 } = {}) {
  return Number.isInteger(duration) && duration >= minDuration && duration <= maxDuration
}

export function videoPromptForOutput(prompt, duration, aspect) {
  const output = `Video duration: ${duration} seconds. Aspect ratio: ${aspect}.`
  const header = /^(CURRENT USER REQUIREMENTS \(authoritative\):\n[^\n]*\n)?Video duration: [^\n]+/
  return header.test(prompt) ? prompt.replace(header, (_, prefix) => (prefix || '') + output)
    : `${output}\nUse this duration and aspect ratio wherever the shot description gives different values.\n\n${prompt}`
}

// Local edits are explicit overrides on one prepared shot, not a new model call.
// Keep the original prose separately so repeated edits replace the override layer.
export function syncPlanPrompts(before, board, nextId) {
  const plan = board.lab?.comparison
  const previous = before?.lab?.comparison
  if (!plan || plan.id !== previous?.id || plan.variants?.length !== 1 || !isCurrentPlan(previous, before)) return false
  if ((before.idea || '') !== (board.idea || '') || JSON.stringify(ingredientsKey(before)) !== JSON.stringify(ingredientsKey(board))) return false
  const ordered = value => Object.fromEntries(Object.entries(value || {}).sort(([a], [b]) => a.localeCompare(b)))
  const rest = constraints => ordered(Object.fromEntries(Object.entries(constraints || {}).filter(([key]) => !['aspect', 'platform', 'duration'].includes(key))))
  if (JSON.stringify(rest(before.constraints)) !== JSON.stringify(rest(board.constraints))) return false
  const editable = value => JSON.stringify({ constraints: ordered(value.constraints), retained: ordered(value.retained), shot: ordered(value.shot) })
  if (editable(before) === editable(board)) return false
  const variant = plan.variants[0]
  if (!variant.imagePrompt?.trim() || !variant.videoPrompt?.trim()) return false
  const base = prompt => {
    const marker = '\nRequired user conditions: '
    const at = prompt.lastIndexOf(marker)
    if (at < 0) return prompt
    try {
      const fields = JSON.parse(prompt.slice(at + marker.length))
      if (fields && !Array.isArray(fields) && Object.keys(fields).every(key => Object.hasOwn(SHOT_FIELDS, key))) return prompt.slice(0, at)
    } catch {}
    return prompt
  }
  const promptBase = variant.promptBase || { image: base(variant.imagePrompt), video: base(variant.videoPrompt) }
  const conditions = JSON.stringify({ ...board.shot, ...board.retained })
  const aspect = board.constraints?.aspect || '9:16'
  const duration = targetVideoDuration(board)
  const compile = kind => {
    const header = `CURRENT USER REQUIREMENTS (authoritative):\n${conditions}\n${kind === 'video' ? `Video duration: ${duration} seconds. Aspect ratio: ${aspect}.` : `Compose the image for aspect ratio ${aspect}.`}\nThese requirements replace conflicting details in the original context below. Keep its non-conflicting creative content.\nORIGINAL CREATIVE CONTEXT:\n`
    const budget = kind === 'video' ? 6900 : 20000
    const room = budget - [...header].length
    if (room < 100) throw Object.assign(new Error('画面要求过长，请缩短后再保存，以免生成提示词丢失条件。'), { status: 400 })
    return header + [...promptBase[kind]].slice(0, room).join('')
  }
  const synced = { ...variant, promptBase, imagePrompt: compile('image'), videoPrompt: compile('video') }
  board.lab = { ...board.lab, comparison: {
    ...plan, id: nextId, inputKey: planKey(board), variants: [synced], promptSynced: true,
    originalDuration: plan.promptSynced ? plan.originalDuration : targetVideoDuration(before),
  } }
  return true
}

export function planChangeLabels(plan, board) {
  try {
    const previous = JSON.parse(plan.inputKey)
    const current = JSON.parse(planKey(board))
    const unpack = value => {
      const intent = JSON.parse(value.intent)
      return intent.input ? { ...JSON.parse(intent.input), clarification: intent.clarification } : intent
    }
    const before = unpack(previous), after = unpack(current)
    const changes = []
    for (const [key, label] of [['idea', '镜头想法'], ['constraints', '实验设置'], ['retained', '保留条件'], ['shot', '画面处理'], ['clarification', '补充回答']]) {
      const fallback = key === 'idea' ? '' : {}
      if (JSON.stringify(before[key] ?? fallback) !== JSON.stringify(after[key] ?? fallback)) changes.push(label)
    }
    if (JSON.stringify(previous.ingredients) !== JSON.stringify(current.ingredients)) changes.push('配料或影响程度')
    return changes
  } catch { return [] }
}

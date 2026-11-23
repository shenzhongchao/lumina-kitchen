import { newId } from './store.js'
import { SHOT_FIELDS } from './lab-input.js'

const bad = message => { throw Object.assign(new Error(message), { status: 400 }) }
export function checkRevision(board, revision) {
  if (!board || board.revision !== revision) throw Object.assign(new Error('实验已在另一处修改，请读取最新内容后重试'), { status: 409 })
}
export function validateFields(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) bad('条件必须是字段与文字')
  for (const [key, text] of Object.entries(value)) {
    if (!Object.hasOwn(SHOT_FIELDS, key) || typeof text !== 'string' || text.length > 800) bad('未知画面字段或文字超过 800 字')
  }
  return Object.fromEntries(Object.entries(value).filter(([, text]) => text.trim()).map(([key, text]) => [key, text.trim()]))
}
export function createBoard(title = '新的镜头实验', idea = '') {
  return { id: newId('exp'), title: title.slice(0, 40), idea: idea.slice(0, 10000), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revision: 0, history: [],
    retained: {}, shot: {}, ingredients: [], constraints: { platform: 'douyin', aspect: '9:16', duration: 15, pacing: 3, mood: '' }, lab: null }
}
export function previewEdit(board, changes) {
  const values = validateFields(changes)
  if (!Object.keys(values).length) bad('请填写要修改的画面处理')
  const diff = Object.entries(values).map(([field, after]) => {
    if (board.retained?.[field]) bad(`“${SHOT_FIELDS[field]}”已保留，请先单独编辑或解除保留条件`)
    return { field, label: SHOT_FIELDS[field], before: board.shot?.[field] || '未指定', after }
  }).filter(row => board.shot?.[row.field] !== row.after)
  if (!diff.length) bad('内容没有变化')
  return { id: board.id, expectedRevision: board.revision, changes: values, diff, retained: board.retained || {} }
}
export async function applyEdit(store, { id, expectedRevision, changes }) {
  return store.mutate(state => {
    const board = state.boards.find(b => b.id === id)
    checkRevision(board, expectedRevision)
    const preview = previewEdit(board, changes)
    board.shot = { ...board.shot, ...preview.changes }
    return state
  }, { label: '局部修改画面' })
}
export function publicBoard(board) {
  if (!board) return null
  const { history, ...value } = board
  return { ...value, canUndo: Boolean(history?.length), undoLabel: history?.at(-1)?.label || '' }
}

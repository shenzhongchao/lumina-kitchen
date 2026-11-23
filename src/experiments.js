import { createBoard, checkRevision } from './shared-experiment.js'
import { newId } from './store.js'

export const isEmptyExperiment = b => !b.idea?.trim() && !b.ingredients?.length && !b.lab && !b.lineage && !b.demo && !Object.keys(b.retained || {}).length && !Object.keys(b.shot || {}).length
export function autoTitle(board) {
  if (board.idea?.trim() && (!board.title || board.title === '新的镜头实验') && !board.titleEdited) board.title = board.idea.trim().replace(/\s+/g, ' ').slice(0, 28)
  return board
}
export function activeWorkspace(state) {
  if (!state.boards.some(b => b.id === state.activeId && !b.archivedAt) && !(state.activeId?.startsWith('draft_') && !state.boards.some(b => b.id === state.activeId))) state.activeId = state.boards.find(b => !b.archivedAt)?.id || newId('draft')
  return state
}
export function displayWorkspace(state) {
  activeWorkspace(state)
  if (state.boards.some(b => b.id === state.activeId)) return state
  const draft = createBoard()
  Object.assign(draft, { id: state.activeId, transient: true, onboardingStarted: state.draftSkipped === state.activeId })
  return { ...state, boards: [draft, ...state.boards] }
}
export function editableBoard(state, id, revision) {
  let board = state.boards.find(b => b.id === id)
  let created = false
  if (!board && id === state.activeId && id?.startsWith('draft_') && revision === 0) {
    board = createBoard(); board.id = id; board.revision = 0
    state.boards.unshift(board); created = true
  }
  checkRevision(board, revision)
  if (board.archivedAt) throw Object.assign(new Error('实验已归档，请先恢复后再编辑'), { status: 409 })
  if (created) board.revision = 1
  return board
}
export async function manageExperiments(store, input) {
  const state = await store.mutate(s => {
    if (input.action === 'create') {
      const existing = s.boards.find(b => !b.archivedAt && isEmptyExperiment(b))
      s.activeId = existing?.id || (s.activeId?.startsWith('draft_') && !s.boards.some(b => b.id === s.activeId) ? s.activeId : newId('draft'))
      return s
    }
    const b = s.boards.find(b => b.id === input.id)
    if (!b) throw Object.assign(new Error('实验不存在，请刷新列表'), { status: 404 })
    if (input.action === 'activate') {
      if (b.archivedAt) throw Object.assign(new Error('请先恢复已归档的实验'), { status: 400 })
      b.lastOpenedAt = new Date().toISOString(); s.activeId = b.id
      return s
    }
    checkRevision(b, input.expectedRevision)
    if (input.action === 'rename') {
      if (typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 40) throw Object.assign(new Error('名称须为 1–40 个字'), { status: 400 })
      b.title = input.title.trim(); b.titleEdited = true
    } else if (input.action === 'archive') {
      if (Object.values(s.bindings || {}).includes(b.id)) throw Object.assign(new Error('此实验仍绑定着 DSH 对话，请先将该对话绑定到其他实验'), { status: 409 })
      if (b.lab?.runs?.some(r => ['submitting', 'queued', 'running'].includes(r.status))) throw Object.assign(new Error('实验仍有生成任务，请等待结束后再归档'), { status: 409 })
      b.archivedAt = new Date().toISOString()
    } else if (input.action === 'restore') {
      delete b.archivedAt
    } else if (input.action === 'delete') {
      if (input.confirmTitle !== b.title) throw Object.assign(new Error('删除确认与实验名称不一致，请重新确认'), { status: 400 })
      if (Object.values(s.bindings || {}).includes(b.id)) throw Object.assign(new Error('此实验仍绑定着 DSH 对话，请先将该对话绑定到其他实验'), { status: 409 })
      if (b.lab?.runs?.some(r => ['submitting', 'queued', 'running', 'uncertain'].includes(r.status))) throw Object.assign(new Error('请先处理此实验未结束或待核对的生成任务'), { status: 409 })
      s.boards = s.boards.filter(x => x.id !== b.id)
      if (s.activeId === b.id) s.activeId = null
    } else throw Object.assign(new Error('不支持的实验操作'), { status: 400 })
    return activeWorkspace(s)
  }, { undoable: false, label: '管理实验' })
  return displayWorkspace(state)
}

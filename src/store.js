// 面板和对话共用的实验存储；撤销按实验隔离并持久化。
import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { syncPlanPrompts } from './lab-input.js'

const EMPTY = () => ({ version: 2, activeId: null, boards: [], bindings: {}, recipes: [] })
const content = board => { const { revision, history, updatedAt, ...value } = board; return value }

export function newId(prefix) {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`
}

// boards.json was the v1 workspace. It is imported once, without deleting the
// original file, so an update does not silently discard the user's experiments.
function migrateBoard(board) {
  const source = board && typeof board === 'object' ? board : {}
  const constraints = source.constraints && typeof source.constraints === 'object' ? source.constraints : {}
  return {
    ...source,
    id: typeof source.id === 'string' && source.id ? source.id : newId('board'),
    title: typeof source.title === 'string' ? source.title.slice(0, 40) : '未命名的一道菜',
    idea: typeof source.idea === 'string' ? source.idea.slice(0, 1000) : '',
    constraints: {
      platform: typeof constraints.platform === 'string' && constraints.platform ? constraints.platform : 'douyin',
      duration: Math.min(180, Math.max(3, Number(constraints.duration) || 15)),
      aspect: typeof constraints.aspect === 'string' && constraints.aspect ? constraints.aspect : '9:16',
      pacing: Math.min(5, Math.max(1, Number(constraints.pacing) || 3)),
      mood: typeof constraints.mood === 'string' ? constraints.mood.slice(0, 40) : '',
    },
    ingredients: (Array.isArray(source.ingredients) ? source.ingredients : [])
      .filter(item => item && typeof item.slug === 'string')
      .slice(0, 24)
      .map(item => ({ slug: item.slug, weight: Math.min(3, Math.max(1, Number(item.weight) || 2)), locked: Boolean(item.locked) })),
    retained: source.retained && typeof source.retained === 'object' ? source.retained : {},
    shot: source.shot && typeof source.shot === 'object' ? source.shot : {},
    revision: Number.isInteger(source.revision) && source.revision >= 0 ? source.revision : 0,
    history: [],
    lab: source.lab && typeof source.lab === 'object' ? source.lab : null,
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : new Date().toISOString(),
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : new Date().toISOString(),
  }
}

export class KitchenStore {
  /** @param {string} root 插件数据目录。 */
  constructor(root) {
    this.root = root
    this.file = join(root, 'workspace-v2.json')
    this.queue = Promise.resolve()
  }

  async read() {
    try {
      const raw = await readFile(this.file, 'utf8')
      const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''))
      if (!parsed || !Array.isArray(parsed.boards)) throw new Error('配料表文件格式无效，请先恢复备份')
      parsed.bindings ||= {}
      parsed.recipes ||= []
      for (const board of parsed.boards) { board.revision ??= 0; board.history ||= [] }
      this.latest = parsed
      return parsed
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      const migrated = await this.#migrateLegacy()
      return migrated || EMPTY()
    }
  }

  async #migrateLegacy() {
    const legacyFile = join(this.root, 'boards.json')
    let parsed
    try {
      parsed = JSON.parse((await readFile(legacyFile, 'utf8')).replace(/^\uFEFF/, ''))
    } catch (error) {
      if (error.code !== 'ENOENT') console.warn(`[lumina-kitchen] 旧工作区无法读取，未导入：${error.message}`)
      return null
    }
    if (!parsed || !Array.isArray(parsed.boards) || !parsed.boards.length) return null
    const boards = parsed.boards.map(migrateBoard)
    const activeId = boards.some(board => board.id === parsed.activeId) ? parsed.activeId : boards[0].id
    const state = { version: 2, activeId, boards, bindings: {} }
    await this.write(state)
    return state
  }

  async write(state) {
    await mkdir(dirname(this.file), { recursive: true })
    state.version = 2
    state.bindings ||= {}
    state.recipes ||= []
    for (const board of state.boards) { board.revision ??= 0; board.history ||= [] }
    const tmp = `${this.file}.${randomUUID()}.tmp`
    await writeFile(tmp, JSON.stringify(state, null, 2), 'utf8')
    await rename(tmp, this.file)
    this.latest = structuredClone(state)
  }

  /** 可撤销的写操作：先拍快照，再交给 fn 改。 */
  async mutate(fn, { undoable = true, label = '', bumpRevision = true } = {}) {
    return this.serial(async () => {
    const state = await this.read()
    const previous = JSON.parse(JSON.stringify(state))
    const next = (await fn(state)) || state
    for (const board of next.boards) {
      const before = previous.boards.find(b => b.id === board.id)
      if (before) syncPlanPrompts(before, board, newId('plan'))
      if (!before || JSON.stringify(content(before)) === JSON.stringify(content(board))) continue
      if (bumpRevision) board.revision = (before.revision || 0) + 1
      board.history = before.history || []
      if (undoable) board.history = [...board.history, { label, value: content(before) }].slice(-20)
      board.updatedAt = new Date().toISOString()
    }
    next.updatedAt = new Date().toISOString()
    await this.write(next)
    return next
    })
  }

  serial(fn) {
    const next = this.queue.catch(() => {}).then(fn)
    this.queue = next
    return next
  }

  canUndo(id = this.latest?.activeId) {
    return Boolean(this.latest?.boards.find(b => b.id === id)?.history?.length)
  }

  undoLabel(id = this.latest?.activeId) {
    return this.latest?.boards.find(b => b.id === id)?.history?.at(-1)?.label || ''
  }

  async undo(id, revision, owner) {
    return this.serial(async () => {
    const state = await this.read()
    if (owner && state.bindings[owner] !== id) throw Object.assign(new Error('对话绑定已变化，请重新读取'), { status: 409 })
    const board = state.boards.find(b => b.id === id)
    if (!board) throw Object.assign(new Error('找不到当前实验'), { status: 404 })
    if (board.revision !== revision) throw Object.assign(new Error('实验已在另一处修改，请刷新后再撤销'), { status: 409 })
    const entry = board.history.at(-1)
    if (!entry) return { state, label: '' }
    // Generated media is not an edit: undo must not orphan runs recorded after the snapshot.
    const previousLab = entry.value.lab || null
    const runs = [...(previousLab?.runs || []), ...(board.lab?.runs || [])]
    const mergedRuns = [...new Map(runs.map(run => [run.id, run])).values()]
    const reviews = board.lab?.reviews || []
    const lab = previousLab ? { ...previousLab, runs: mergedRuns, reviews } : (mergedRuns.length || reviews.length ? { runs: mergedRuns, reviews } : null)
    state.boards[state.boards.indexOf(board)] = {
      ...entry.value,
      ...(lab ? { lab } : {}),
      revision: board.revision + 1,
      history: board.history.slice(0, -1),
      updatedAt: new Date().toISOString(),
    }
    await this.write(state)
    return { state, label: entry.label }
    })
  }

}

export async function removeStoreFile(root) {
  await rm(join(root, 'workspace-v2.json'), { force: true })
}

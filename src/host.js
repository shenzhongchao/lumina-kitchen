import { manageExperiments, displayWorkspace, activeWorkspace, editableBoard, autoTitle } from './experiments.js'
import { runOnboardingAction } from './onboarding.js'
import { fileURLToPath } from 'node:url'
import { MediaService } from './media/service.js'
// Host 半边：/lumina-kitchen/* 路由 + 配料表存储 + 主厨调用。
import { join, resolve, isAbsolute, dirname, extname } from 'node:path'
import { homedir } from 'node:os'
import { stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { buildShelf, shelfIndex } from './shelf.js'
import { KitchenStore, newId } from './store.js'
import { analyze } from './taste.js'
import { modelInfo } from './chef.js'
import { registerSharedTools } from './shared-tools.js'
import { createBoard, checkRevision, validateFields, previewEdit, applyEdit, publicBoard } from './shared-experiment.js'
import { loadKnowledge } from './knowledge.js'
import { runLabAction, proposeLocalEdit } from './lab.js'
import { runResultsAction } from './results.js'
import { MotionDownloads } from './motion-downloads.js'
import { DEFAULT_MOTION_BASE_URL } from './motion-source.js'
import { panelIdeaBoard, syncPlanPrompts, targetVideoDuration } from './lab-input.js'

const MAX_BODY = 8_000_000
const MEDIA_PATH = /^assets\/(?:(concept-thumbs|concept-previews|topic-images)\/[\w./-]+\.(webp|png|jpe?g|gif)|concept-samples\/[\w-]+\.gif)$/i
const MEDIA_TYPES = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
}
const PLATFORMS = {
  douyin: { cn: '抖音', aspect: '9:16' },
  reels: { cn: 'Reels', aspect: '9:16' },
  shorts: { cn: 'Shorts', aspect: '9:16' },
  tiktok: { cn: 'TikTok', aspect: '9:16' },
  youtube: { cn: 'YouTube', aspect: '16:9' },
  linkedin: { cn: 'LinkedIn', aspect: '16:9' },
  cinematic: { cn: '电影宽银幕', aspect: '21:9' },
}

function dshHome() {
  return process.env.DSH_HOME || join(homedir(), '.dsh')
}

function json(res, status, body) {
  if (body?.boards) { const { bindings, ...rest } = body; body = { ...rest, boards: body.boards.map(publicBoard) } }
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) throw Object.assign(new Error('请求太大'), { status: 413 })
    chunks.push(chunk)
  }
  if (!size) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw Object.assign(new Error('请求不是有效的 JSON'), { status: 400 })
  }
}

async function candidateDirs(ctx, config) {
  const list = []
  const push = value => {
    if (typeof value !== 'string' || !value.trim()) return
    list.push(isAbsolute(value) ? value : resolve(value))
  }
  push(process.env.LUMINA_KITCHEN_DATA)
  push(config?.dataDir)
  // 发布包自带只读快照，不依赖用户工作区；显式配置仍优先。
  push(fileURLToPath(new URL('../resources/data/', import.meta.url)))
  // 面板没有会话绑定，所以按「已登记的工作区」找图谱写真源
  try {
    for (const workspace of ctx.get('workspaceRegistry')?.list?.() || []) {
      if (workspace?.path) push(join(workspace.path, 'web', 'data'))
    }
  } catch {
    // 没有 workspaceRegistry 时继续用后面的候选
  }
  push(join(process.cwd(), 'web', 'data'))
  try {
    const base = ctx.get('workingDirectory')?.defaultDirectory
    if (base) push(join(base, 'web', 'data'))
  } catch {
    // ignore
  }
  return [...new Set(list)]
}

async function findDataDir(ctx, config) {
  const candidates = await candidateDirs(ctx, config)
  for (const dir of candidates) {
    try {
      await stat(join(dir, 'taxonomy.json'))
      return dir
    } catch {
      // 试下一个候选
    }
  }
  const error = new Error(`找不到 LUMINA 图谱数据。找过：${candidates.join('、')}`)
  error.code = 'SHELF_MISSING'
  error.candidates = candidates
  throw error
}

function sanitizeBoard(input, previous) {
  const base = input.panelIdeaOnly === true ? panelIdeaBoard(previous || {}) : (previous || {})
  const constraints = { ...(base.constraints || {}), ...(input.constraints || {}) }
  const platform = PLATFORMS[constraints.platform] ? constraints.platform : 'douyin'
  const duration = Math.min(180, Math.max(3, Number(constraints.duration) || 15))
  if (input.panelIdeaOnly === true && base.lab?.comparison && duration !== targetVideoDuration(base)) {
    throw Object.assign(new Error('已有拍法，请在拍法旁选择「改时长」后一起更新'), { status: 400 })
  }
  const pacing = Math.min(5, Math.max(1, Number(constraints.pacing) || 3))
  const ingredients = Array.isArray(input.ingredients ?? base.ingredients) ? (input.ingredients ?? base.ingredients) : []
  const seen = new Set()
  const cleaned = []
  for (const item of ingredients) {
    if (!item || typeof item.slug !== 'string' || seen.has(item.slug)) continue
    seen.add(item.slug)
    cleaned.push({
      slug: item.slug,
      weight: Math.min(3, Math.max(1, Number(item.weight) || 2)),
      locked: Boolean(item.locked),
    })
    if (cleaned.length >= 24) break
  }
  const next = {
    ...base,
    id: base.id || newId('exp'),
    retained: input.panelIdeaOnly === true ? {} : validateFields(input.retained ?? base.retained ?? {}),
    shot: input.panelIdeaOnly === true ? {} : { ...(base.shot || {}), ...validateFields(input.retained ?? base.retained ?? {}) },
    ...(input.panelIdeaOnly === true ? { panelIdeaOnly: true } : {}),
    titleEdited: base.titleEdited || (typeof input.title === 'string' && input.title !== base.title && input.title !== '新的镜头实验'),
    title: typeof input.title === 'string' ? input.title.slice(0, 40) : (base.title || '未命名的一道菜'),
    idea: typeof input.idea === 'string' ? input.idea.slice(0, input.panelIdeaOnly === true ? Math.max(10000, (base.idea || '').length) : 1000) : (base.idea || ''),
    constraints: {
      ...(base.constraints || {}),
      platform,
      duration,
      aspect: typeof constraints.aspect === 'string' && constraints.aspect ? constraints.aspect : PLATFORMS[platform].aspect,
      pacing,
      mood: typeof constraints.mood === 'string' ? constraints.mood.slice(0, 40) : (base.constraints?.mood || ''),
    },
    ingredients: cleaned,
    targets: { model: input.targets?.model || base.targets?.model || 'veo' },
    lab: base.lab || null,
    createdAt: base.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  if (input.panelIdeaOnly === true) syncPlanPrompts(base, next, newId('plan'))
  return next
}

function seedBoard() {
  return createBoard()
}

function buildAnalysis(board, byId, dims) {
  return analyze(board, byId, dims)
}

async function ensureBoards(store) {
  const state = await store.read()
  const id = state.activeId
  activeWorkspace(state)
  if (id !== state.activeId) return displayWorkspace(await store.mutate(activeWorkspace, { undoable: false }))
  return displayWorkspace(state)
}

export function requestRejection(ctx, req) {
  const connection = ctx.get('connection')
  if (typeof connection?.requestRejection !== 'function') return 403
  return connection.requestRejection({ headers: req.headers })
}

export const name = '@local/lumina-kitchen'

export default {
  inject: ['webServer', 'connection'],
  apply(ctx, config) {
    const store = new KitchenStore(join(dshHome(), 'lumina-kitchen'))
    const media = new MediaService({ root: join(dshHome(), 'lumina-kitchen'), store, config })
    const motion = new MotionDownloads({ root: join(dshHome(), 'lumina-kitchen', 'motion-cache'),
      manifestPath: config?.motionManifest || fileURLToPath(new URL('../resources/data/motion-manifest.json', import.meta.url)),
      baseUrl: config?.motionBaseUrl ?? process.env.LUMINA_MOTION_BASE_URL ?? DEFAULT_MOTION_BASE_URL, allowLocal: config?.allowLocalMotionSource === true })
    ctx.effect(() => () => { void motion.close() }, 'lumina-kitchen: cancel motion downloads on unload')
    let warnedMissing = false
    let dirCache = null

    async function dataDirOf() {
      if (dirCache) return dirCache
      dirCache = await findDataDir(ctx, config)
      return dirCache
    }

    async function shelfFor() {
      const dataDir = await dataDirOf()
      const shelf = await buildShelf(dataDir)
      const byId = shelfIndex(shelf)
      const dims = new Map(shelf.dimensions.map(d => [d.id, d]))
      return { shelf, byId, dims, dataDir }
    }

    async function route(req, res) {
      const url = new URL(req.url || '/', 'http://local')
      const path = url.pathname.replace(/^\/lumina-kitchen\/?/, '')
      const method = req.method || 'GET'

      await media.ready
      if (path === 'services' && media.initError) throw media.initError

      if (method === 'GET') {
        if (path === 'motion') { await motion.ready; return json(res, 200, motion.status()) }
        if (path.startsWith('motion/assets/')) {
          const file = await motion.asset(path.slice('motion/assets/'.length))
          res.setHeader('content-type', 'image/gif')
          res.setHeader('cache-control', 'private, max-age=31536000, immutable')
          return createReadStream(file).on('error', () => res.destroy()).pipe(res)
        }
        if (path === 'services') return json(res, 200, { settings: media.settings.view(), media: media.info() })
        if (path === '' || path === 'health') {
          let dataDir = null
          let shelf = null
          let error = null
          try {
            dataDir = await dataDirOf()
            shelf = await buildShelf(dataDir)
          } catch (err) {
            error = String(err?.message || err)
            if (!dataDir) dataDir = (err.candidates || [])[0] || null
          }
          return json(res, shelf ? 200 : 503, {
            ok: Boolean(shelf),
            dataDir,
            concepts: shelf ? shelf.concepts.length : 0,
            dimensions: shelf ? shelf.dimensions.length : 0,
            model: modelInfo(ctx),
            media: media.info(),
            error,
          })
        }
        if (/^demo-media\/[AB]\.svg$/.test(path)) {
          res.setHeader('content-type', 'image/svg+xml')
          res.setHeader('cache-control', 'private, max-age=86400')
          return createReadStream(fileURLToPath(new URL(`./${path}`, import.meta.url))).pipe(res)
        }
        if (path.startsWith('assets/')) {
          let file
          try { file = decodeURIComponent(path.slice('assets/'.length)) } catch { return json(res, 404, { error: '找不到这个媒体文件' }) }
          return media.serveAsset(req, res, file)
        }
        if (path === 'media/job') {
          const job = await media.refresh(url.searchParams.get('id') || '')
          const state = await store.read()
          return json(res, 200, {
            job: media.publicJob(job),
            ...state,
            canUndo: store.canUndo(),
            media: media.info(),
          })
        }
        if (path.startsWith('media/')) {
          const rel = decodeURIComponent(path.slice('media/'.length))
          if (!MEDIA_PATH.test(rel) || rel.includes('..')) return json(res, 404, { error: '没有这张图' })
          const webRoot = dirname(await dataDirOf())
          const file = join(webRoot, rel)
          let info
          try {
            info = await stat(file)
          } catch {
            return json(res, 404, { error: '没有这张图' })
          }
          if (!info.isFile()) return json(res, 404, { error: '没有这张图' })
          res.statusCode = 200
          res.setHeader('content-type', MEDIA_TYPES[extname(file).toLowerCase()] || 'application/octet-stream')
          res.setHeader('content-length', info.size)
          res.setHeader('cache-control', 'private, max-age=86400')
          return createReadStream(file).pipe(res)
        }
        if (path === 'shelf') {
          try {
            const { shelf, dataDir } = await shelfFor()
            return json(res, 200, { ...shelf, dataDir, model: modelInfo(ctx) })
          } catch (err) {
            if (!warnedMissing) {
              warnedMissing = true
              console.warn(`[lumina-kitchen] ${err.message}`)
            }
            return json(res, 503, { error: err.message, detail: err.detail || null, dataDir: (err.candidates || [])[0] || null })
          }
        }
        if (path === 'boards') {
          const state = await ensureBoards(store)
          return json(res, 200, {
            activeId: state.activeId,
            boards: state.boards,
            recipes: state.recipes || [],
            model: modelInfo(ctx),
            media: media.info(),
            canUndo: store.canUndo(),
            undoLabel: store.undoLabel(),
          })
        }
        return json(res, 404, { error: '接口不存在' })
      }

      if (method !== 'POST') return json(res, 405, { error: '不支持的方法' })
      const site = req.headers['sec-fetch-site']
      if (site && site !== 'same-origin' && site !== 'none') return json(res, 403, { error: '拒绝跨站请求' })

      const body = await readJson(req)
      if (path === 'motion') return json(res, 200, await motion.action(body.action))
      if (path === 'services') {
        const settings = await media.settings.update(body)
        return json(res, 200, { settings, media: media.info() })
      }

      if (path === 'onboarding') {
        const saved = await runOnboardingAction(store, body)
        return json(res, 200, { ...saved, canUndo: store.canUndo() })
      }

      if (path === 'results') {
        const saved = await runResultsAction(store, body)
        return json(res, 200, { ...saved, canUndo: store.canUndo() })
      }


      if (path === 'media/image' || path === 'media/video') {
        const kind = path.endsWith('image') ? 'image' : 'video'
        const { job, state } = await media.start({
          kind,
          id: body.id,
          expectedRevision: body.expectedRevision,
          planId: body.planId,
          variantId: body.variantId,
          force: Boolean(body.force),
          serviceRevision: body.serviceRevision,
        })
        return json(res, 200, {
          ...state,
          job: media.publicJob(job),
          media: media.info(),
          canUndo: store.canUndo(),
        })
      }

      if (path === 'media/recover') {
        const job = await media.recover(body.id, body.taskId)
        const state = await store.read()
        return json(res, 200, {
          ...state,
          job: media.publicJob(job),
          media: media.info(),
          canUndo: store.canUndo(),
        })
      }

      if (path === 'boards') {
        const action = String(body.action || 'update')
        if (action === 'undo') {
          const { state, label } = await store.undo(body.id, body.expectedRevision)
          return json(res, 200, { activeId: state.activeId, boards: state.boards, canUndo: store.canUndo(), undoLabel: store.undoLabel(), label })
        }
        if (['create', 'activate', 'rename', 'archive', 'restore', 'delete'].includes(action)) {
          const state = await manageExperiments(store, body)
          return json(res, 200, { ...state, canUndo: store.canUndo() })
        }
        if (action !== 'update') throw Object.assign(new Error('不支持的实验操作'), { status: 400 })
        // update
        const state = await store.mutate(draft => {
          const previous = editableBoard(draft, body.id, body.expectedRevision ?? body.board?.revision)
          const index = draft.boards.indexOf(previous)
          const merged = autoTitle(sanitizeBoard(body.board || {}, previous))
          draft.boards[index] = merged
          draft.activeId = merged.id
          return draft
        }, { label: typeof body.label === 'string' ? body.label : '改配料表' })
        return json(res, 200, { activeId: state.activeId, boards: state.boards, canUndo: store.canUndo(), undoLabel: store.undoLabel() })
      }

      if (path === 'edit') {
        if (body.action === 'apply') {
          const saved = await applyEdit(store, body)
          return json(res, 200, { ...saved, canUndo: store.canUndo() })
        }
        const state = await store.read()
        const board = state.boards.find(b => b.id === body.id)
        checkRevision(board, body.expectedRevision)
        if (body.action !== 'preview') return json(res, 400, { error: '不支持的修改操作' })
        const changes = body.changes || await proposeLocalEdit(ctx, board, body.field, body.request)
        return json(res, 200, previewEdit(board, changes))
      }

      if (path === 'lab') {
        const mediaInfo = media.info()
        if (body.action === 'retime' && body.serviceRevision !== mediaInfo.revision) {
          return json(res, 409, { error: '视频服务已变化，请重新选择时长', media: mediaInfo })
        }
        const saved = await runLabAction(ctx, store, await loadKnowledge(await dataDirOf()), body, undefined, { videoInfo: mediaInfo.video })
        return json(res, 200, { ...saved, canUndo: store.canUndo(), model: modelInfo(ctx) })
      }

      return json(res, 404, { error: '接口不存在' })
    }

    ctx.effect(() => ctx.webServer.register({
      kind: 'prefix',
      path: '/lumina-kitchen',
      handler: async (req, res) => {
        try {
          const rejection = requestRejection(ctx, req)
          if (rejection) return json(res, rejection, { error: '未授权' })
          await route(req, res)
        } catch (err) {
          if (res.headersSent) {
            res.end()
            return
          }
          json(res, err.status || 500, { error: err?.message || '服务器错误' })
        }
      },
    }), 'lumina-kitchen: /lumina-kitchen routes')

    registerSharedTools(ctx, { store, dataDirOf })
  },
}

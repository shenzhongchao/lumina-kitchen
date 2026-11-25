import { MediaSettings } from './settings.js'
import { assertGenerationAllowed } from '../generation-policy.js'
// Media orchestration: durable jobs, explicit uncertainty, local assets.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { AssetStore } from './assets.js'
import { generateImage, imageRequest, normalizeImageSize, DEFAULT_IMAGE_MODEL, MAX_IMAGE_BYTES, IMAGE_SIZES, IMAGE_QUALITIES, IMAGE_COMPLEXITIES } from './openai-image.js'
import { H3Client, H3_RESOLUTION, h3Ratio, truncateH3, assertVideoUrl, isH3TaskId } from './h3.js'
import { SeedanceClient, SEEDANCE_RESOLUTION, SEEDANCE_MAX_DURATION, isSeedanceTaskId } from './seedance.js'
import { mediaError } from './errors.js'
import { checkRevision } from '../shared-experiment.js'
import { isCurrentPlan, continuedImageSettings, targetVideoDuration, videoDurationSupported, videoPromptForOutput } from '../lab-input.js'
import { captureSource } from '../results.js'

const ACTIVE = new Set(['submitting', 'queued', 'running'])
const MAX_JOBS = 3
const MAX_VIDEO_BYTES = 300 * 1024 * 1024

const pick = (...values) => values.find(value => typeof value === 'string' && value.trim())?.trim() || ''
const isSeedance = connection => connection?.protocol === 'ark-seedance'
const videoDurationRange = connection => ({ minDuration: 4, maxDuration: isSeedance(connection) ? SEEDANCE_MAX_DURATION : 15 })
const providerIds = { 'openai-image': 'openai', 'ark-seedream': 'ark', 'ark-seedance': 'ark', 'minimax-image': 'minimax', 'minimax-video': 'minimax' }

export function mediaConfig(config = {}) {
  const nested = config.media && typeof config.media === 'object' ? config.media : {}
  const image = config.image && typeof config.image === 'object' ? config.image : {}
  const video = config.video && typeof config.video === 'object' ? config.video : {}
  return {
    openaiKey: pick(process.env.LUMINA_OPENAI_API_KEY, process.env.OPENAI_API_KEY, nested.openaiApiKey, image.apiKey, config.openaiApiKey),
    openaiBaseUrl: pick(process.env.LUMINA_OPENAI_BASE_URL, process.env.OPENAI_BASE_URL, nested.openaiBaseUrl, image.baseUrl, config.openaiBaseUrl) || 'https://api.openai.com/v1',
    imageModel: pick(process.env.LUMINA_IMAGE_MODEL, nested.imageModel, image.model, config.imageModel) || DEFAULT_IMAGE_MODEL,
    imageSize: pick(process.env.LUMINA_IMAGE_SIZE, nested.imageSize, image.size, config.imageSize),
    imageQuality: pick(process.env.LUMINA_IMAGE_QUALITY, nested.imageQuality, image.quality, config.imageQuality) || 'medium',
    imageComplexity: pick(process.env.LUMINA_IMAGE_COMPLEXITY, nested.imageComplexity, image.complexity, config.imageComplexity),
    minimaxKey: pick(process.env.MINIMAX_API_KEY, nested.minimaxApiKey, video.apiKey, config.minimaxApiKey),
  }
}

function publicJob(job) {
  return {
    id: job.id,
    kind: job.kind,
    runId: job.runId,
    status: job.status,
    provider: job.provider,
    model: job.model,
    prompt: job.prompt,
    request: job.request || {},
    taskId: job.taskId || null,
    asset: job.asset || null,
    remoteUrl: job.remoteUrl || null,
    costUsd: typeof job.costUsd === 'number' ? job.costUsd : null,
    revisedPrompt: job.revisedPrompt || '',
    error: job.error || '',
    downloadError: job.downloadError || '',
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt || null,
  }
}

function fromRun(run) {
  return {
    id: run.jobId,
    kind: run.kind,
    runId: run.id,
    status: run.status,
    provider: run.provider,
    model: run.model,
    prompt: run.prompt,
    request: run.request || {},
    taskId: run.taskId || null,
    asset: run.asset || null,
    remoteUrl: run.remoteUrl || null,
    costUsd: typeof run.costUsd === 'number' ? run.costUsd : null,
    error: run.error || '',
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  }
}

export class MediaService {
  constructor({ root, store, config = {}, fetchImpl = fetch }) {
    this.root = root
    this.store = store
    this.config = mediaConfig(config)
    this.settings = new MediaSettings(root, this.config)
    this.fetchImpl = fetchImpl
    this.assets = new AssetStore(join(root, 'media'))
    this.file = join(root, 'media-jobs.json')
    this.jobs = new Map()
    this.writing = Promise.resolve()
    this.initError = null
    this.ready = this.init().catch(error => {
      this.initError = error
      console.warn(`[lumina-kitchen] 媒体任务存储无法读取：${error.message}`)
    })
  }

  async init() {
    await this.settings.ready
    await mkdir(this.root, { recursive: true })
    await this.assets.init()
    let parsed
    try {
      parsed = JSON.parse(await readFile(this.file, 'utf8'))
    } catch (error) {
      if (error.code === 'ENOENT') return
      throw error
    }
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.jobs)) throw new Error('媒体任务存储格式无效')
    let changed = false
    for (const job of parsed.jobs) {
      if (!job || typeof job.id !== 'string') continue
      if (job.kind === 'image' && ACTIVE.has(job.status) && job.status !== 'queued') {
        job.status = 'uncertain'
        job.error = '服务重启，无法确认图像是否已生成；请先查看服务商账单再重试。'
        job.updatedAt = new Date().toISOString()
        changed = true
      }
      if (job.kind === 'video' && job.status === 'submitting') {
        job.status = 'uncertain'
        job.error = '服务重启，无法确认视频是否已提交；请先查看服务商任务记录。'
        job.updatedAt = new Date().toISOString()
        changed = true
      }
      if (!job.connection) {
        job.connection = this.settings.resolve(job.kind, true)
        changed = true
      }
      this.jobs.set(job.id, job)
    }
    if (changed) await this.persist()
    for (const job of this.jobs.values()) await this.#syncRun(job)
  }

  info() {
    const image = this.settings.resolve('image')
    const video = this.settings.resolve('video')
    return {
      revision: this.settings.state.revision,
      image: image ? {
        ...this.settings.publicConnection(image),
        ...(image.protocol === 'openai-image' ? {
          size: normalizeImageSize(image.size) || null,
          sizes: IMAGE_SIZES,
          quality: IMAGE_QUALITIES.includes(image.quality) ? image.quality : 'medium',
          complexity: IMAGE_COMPLEXITIES.includes(image.complexity) ? image.complexity : null,
        } : { size: '2K' }),
      } : null,
      video: video ? {
        ...this.settings.publicConnection(video),
        resolution: isSeedance(video) ? SEEDANCE_RESOLUTION : H3_RESOLUTION,
        ...videoDurationRange(video),
        costPerSecondUsd: null,
      } : null,
    }
  }

  activeCount() {
    return [...this.jobs.values()].filter(job => ACTIVE.has(job.status)).length
  }

  job(id) {
    const job = this.jobs.get(String(id || ''))
    if (!job) throw mediaError('找不到这个生成任务', 404, 'MEDIA_JOB_NOT_FOUND')
    return job
  }

  publicJob(input) {
    const job = typeof input === 'string' ? this.job(input) : input
    if (!job) throw mediaError('找不到这个生成任务', 404, 'MEDIA_JOB_NOT_FOUND')
    return publicJob(job)
  }

  async persist() {
    this.writing = this.writing.catch(() => {}).then(async () => {
      await mkdir(this.root, { recursive: true })
      const temp = `${this.file}.${randomUUID()}.tmp`
      await writeFile(temp, JSON.stringify({ version: 1, jobs: [...this.jobs.values()] }, null, 2), { encoding: 'utf8', mode: 0o600 })
      await rename(temp, this.file)
    })
    return this.writing
  }

  async #syncRun(job) {
    await this.attach(job, {
      status: job.status,
      taskId: job.taskId || null,
      asset: job.asset || null,
      remoteUrl: job.remoteUrl || null,
      costUsd: typeof job.costUsd === 'number' ? job.costUsd : null,
      revisedPrompt: job.revisedPrompt || '',
      downloadError: job.downloadError || '',
      error: job.error || '',
    })
  }

  async attach(job, patch) {
    const values = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined))
    try {
      await this.store.mutate(state => {
        const board = state.boards.find(item => item.id === job.boardId)
        if (!board) return state
        board.lab ||= {}
        board.lab.runs ||= []
        const run = board.lab.runs.find(item => item.id === job.runId)
        if (!run) return state
        let changed = false
        for (const [key, value] of Object.entries(values)) {
          if (JSON.stringify(run[key]) !== JSON.stringify(value)) { run[key] = value; changed = true }
        }
        if (changed) run.updatedAt = new Date().toISOString()
        return state
      }, { undoable: false, label: '更新生成结果', bumpRevision: false })
    } catch (error) {
      // A deleted board or a locked store must not erase the durable job record.
      console.warn(`[lumina-kitchen] 无法写回生成结果：${error.message}`)
    }
  }

  #startRun({ board, plan, variant, kind, prompt, request, connection }) {
    const id = `run_${randomUUID().replace(/-/g, '').slice(0, 12)}`
    const jobId = `job_${randomUUID().replace(/-/g, '').slice(0, 12)}`
    const now = new Date().toISOString()
    const provider = providerIds[connection.protocol]
    const model = connection.model
    const status = kind === 'image' ? 'running' : 'submitting'
    return {
      run: {
        id, kind, planId: plan.id, variantId: variant.id, jobId, status, provider, model, prompt,
        source: captureSource(board, plan, variant),
        service: { id: connection.id, name: connection.name, protocol: connection.protocol },
        request, createdAt: now, updatedAt: now,
      },
      job: {
        id: jobId, kind, boardId: board.id, runId: id, status, provider, model, prompt, connection,
        request, createdAt: now, updatedAt: now,
      },
    }
  }

  async start({ kind, id, expectedRevision, planId, variantId, force = false, serviceRevision }) {
    await this.ready
    if (this.initError?.code === 'SERVICE_STORE') throw this.initError
    if (this.initError) throw mediaError('媒体任务存储损坏，请先备份并检查 media-jobs.json', 500, 'MEDIA_STORE')
    if (!['image', 'video'].includes(kind)) throw mediaError('不支持的生成类型', 400, 'MEDIA_KIND')
    if (serviceRevision !== undefined && serviceRevision !== this.settings.state.revision) throw mediaError('生成服务配置已变化，请刷新方案并重新确认服务与费用', 409, 'SERVICE_CHANGED')
    let connection = this.settings.resolve(kind)
    const key = this.settings.key(connection)


    const state = await this.store.read()
    const board = state.boards.find(item => item.id === id)
    if (connection?.protocol === 'openai-image' && board) connection = { ...connection, ...continuedImageSettings(board) }
    if (!board) throw mediaError('找不到这份实验', 404, 'BOARD_NOT_FOUND')
    assertGenerationAllowed(board)
    if (!connection) throw mediaError('请在 API 配置中选择默认生成服务。', 503, 'NO_MEDIA_SERVICE')
    if (!key) throw mediaError('当前服务缺少 API 密钥。请在 API 配置中填写，或设置对应的 DSH 环境变量。', 503, 'NO_MEDIA_KEY')
    if (expectedRevision !== undefined && expectedRevision !== null) checkRevision(board, expectedRevision)
    const plan = board.lab?.comparison
    if (!plan || plan.id !== planId || !isCurrentPlan(plan, board)) {
      throw mediaError('想法或设置已变化，请更新拍法', 409, 'PLAN_STALE')
    }
    const variant = plan.variants.find(item => item.id === variantId)
    if (!variant) throw mediaError('找不到这个方案', 400, 'VARIANT_NOT_FOUND')

    const existing = (board.lab?.runs || []).filter(run => run.kind === kind && run.planId === planId && run.variantId === variantId).at(-1)
    if (existing && ACTIVE.has(existing.status)) {
      const job = this.jobs.get(existing.jobId)
      if (!job) {
        await this.attach({ boardId: board.id, runId: existing.id }, {
          status: 'uncertain',
          error: '任务记录缺失，已标记待核对；请先查看服务商账单或任务记录后再重试。',
        })
        throw mediaError('生成任务记录缺失，已标记待核对；请确认服务商账单后重试', 409, 'MEDIA_JOB_LOST')
      }
      return { job, state }
    }
    if (existing && existing.status === 'succeeded' && !force) {
      const job = this.jobs.get(existing.jobId)
      return { job: job || fromRun(existing), state }
    }
    if (this.activeCount() >= MAX_JOBS) throw mediaError('已有 3 个生成任务在运行，请等一个完成后再试', 429, 'MEDIA_BUSY')

    const aspect = board.constraints?.aspect
    const seedance = isSeedance(connection)
    const duration = targetVideoDuration(board)
    const range = videoDurationRange(connection)
    if (kind === 'video' && !videoDurationSupported(duration, range)) {
      throw mediaError(`当前视频服务支持 ${range.minDuration}–${range.maxDuration} 秒的整数时长。请调整视频时长或切换默认视频服务。`, 400, 'VIDEO_DURATION_UNSUPPORTED')
    }
    const ratio = h3Ratio(aspect)
    const request = kind === 'image' ? imageRequest(connection, aspect) : { duration, ratio, ...(seedance && { resolution: SEEDANCE_RESOLUTION }) }
    const rawPrompt = kind === 'image' ? variant.imagePrompt : variant.videoPrompt
    if (typeof rawPrompt !== 'string' || !rawPrompt.trim()) throw mediaError('方案缺少提示词', 400, 'PROMPT_MISSING')
    const prompt = kind === 'video' ? truncateH3(videoPromptForOutput(rawPrompt, duration, ratio)) : rawPrompt.trim()
    const { run, job } = this.#startRun({ board, plan, variant, kind, prompt, request, connection })

    const next = await this.store.mutate(draft => {
      const current = draft.boards.find(item => item.id === id)
      if (!current) throw mediaError('找不到这份实验', 404, 'BOARD_NOT_FOUND')
      if (expectedRevision !== undefined && expectedRevision !== null) checkRevision(current, expectedRevision)
      if (current.lab?.comparison?.id !== plan.id || !isCurrentPlan(plan, current)) throw mediaError('生成前方案已变化，请重新读取实验', 409, 'PLAN_STALE')
      current.lab ||= {}
      current.lab.runs ||= []
      current.lab.runs.push(run)
      return draft
    }, { undoable: false, label: '提交生成任务', bumpRevision: false })

    this.jobs.set(job.id, job)
    await this.persist()
    if (kind === 'image') this.#runImage(job).catch(error => this.#fail(job, error))
    else this.#submitVideo(job).catch(error => this.#fail(job, error))
    return { job, state: next }
  }

  async #runImage(job) {
    try {
      const result = await generateImage({
        apiKey: this.settings.key(job.connection),
        baseUrl: job.connection.baseUrl,
        model: job.model,
        prompt: job.prompt,
        protocol: job.connection.protocol,
        ...job.request,
        fetchImpl: this.fetchImpl,
        signal: AbortSignal.timeout(job.connection.protocol === 'minimax-image' ? 610_000 : 180_000),
      })
      const asset = await this.assets.putBuffer(result.buffer, result.mime, { maxBytes: MAX_IMAGE_BYTES })
      job.status = 'succeeded'
      job.asset = asset
      job.revisedPrompt = result.revisedPrompt
      job.completedAt = new Date().toISOString()
      job.updatedAt = job.completedAt
      await this.persist()
      await this.#syncRun(job)
    } catch (error) {
      await this.#fail(job, error)
    }
  }

  async #submitVideo(job) {
    try {
      const client = this.#videoClient(job)
      const { taskId } = await client.submit({ prompt: job.prompt, duration: job.request.duration, ratio: job.request.ratio })
      if (job.taskId && job.taskId !== taskId) return // A recovered task won the race; keep it.
      job.taskId = taskId
      job.status = 'queued'
      job.updatedAt = new Date().toISOString()
      delete job.error
      await this.persist()
      await this.#syncRun(job)
    } catch (error) {
      job.status = error.rejected ? 'rejected' : 'uncertain'
      job.error = error.message
      job.updatedAt = new Date().toISOString()
      job.completedAt = job.updatedAt
      await this.persist()
      await this.#syncRun(job)
    }
  }

  #videoClient(job) {
    const connection = job.connection || this.settings.resolve('video', true)
    const options = { apiKey: this.settings.key(connection), baseUrl: connection.baseUrl, model: connection.model, fetchImpl: this.fetchImpl }
    return isSeedance(connection) ? new SeedanceClient(options) : new H3Client(options)
  }

  async #fail(job, error) {
    job.status = error?.uncertain ? 'uncertain' : 'failed'
    job.error = error?.message || '生成失败'
    job.updatedAt = new Date().toISOString()
    job.completedAt = job.updatedAt
    await this.persist()
    await this.#syncRun(job)
  }

  async #downloadVideo(job, url) {
    const response = await this.fetchImpl(url, { redirect: 'error', signal: AbortSignal.timeout(180_000) })
    if (!response.ok || !response.body) throw mediaError('无法下载生成的视频', 502, 'VIDEO_DOWNLOAD')
    const type = String(response.headers.get('content-type') || '').split(';')[0].trim()
    const ext = type.includes('webm') ? 'webm' : 'mp4'
    return this.assets.putStream(Readable.fromWeb(response.body), type || 'video/mp4', { maxBytes: MAX_VIDEO_BYTES, fallbackExt: ext })
  }

  async refresh(id, { force = false } = {}) {
    await this.ready
    if (this.initError?.code === 'SERVICE_STORE') throw this.initError
    if (this.initError) throw mediaError('媒体任务存储损坏，请先备份并检查 media-jobs.json', 500, 'MEDIA_STORE')
    const job = this.job(id)
    if (job.kind !== 'video' || !job.taskId || !['queued', 'running'].includes(job.status)) {
      await this.#syncRun(job)
      return job
    }
    if (!force && Date.now() - (job.lastChecked || 0) < 4_000) return job
    job.lastChecked = Date.now()
    try {
      const client = this.#videoClient(job)
      const task = await client.query(job.taskId)
      if (task.status === 'queued' || task.status === 'running') {
        job.status = task.status
        delete job.error
        job.updatedAt = new Date().toISOString()
        await this.persist()
        await this.#syncRun(job)
        return job
      }
      if (['failed', 'cancelled', 'expired'].includes(task.status)) {
        job.status = 'failed'
        job.error = {
          failed: '视频生成失败。请在服务商控制台查看原因。',
          cancelled: '视频任务已取消。',
          expired: '视频任务已超时。',
        }[task.status]
        job.updatedAt = new Date().toISOString()
        job.completedAt = job.updatedAt
        await this.persist()
        await this.#syncRun(job)
        return job
      }
      let remoteUrl
      try {
        remoteUrl = assertVideoUrl(task.content?.url)
      } catch (error) {
        job.status = 'running'
        job.error = '任务已完成但未返回有效视频地址，正在继续查询。'
        job.updatedAt = new Date().toISOString()
        await this.persist()
        await this.#syncRun(job)
        return job
      }
      job.remoteUrl = remoteUrl
      job.costUsd = null
      try {
        job.asset = await this.#downloadVideo(job, remoteUrl)
        delete job.downloadError
      } catch (error) {
        job.downloadError = `视频已生成，但本地保存失败：${error.message}。源链接可能过期，请尽快打开保存。`
      }
      job.status = 'succeeded'
      job.completedAt = new Date().toISOString()
      job.updatedAt = job.completedAt
      delete job.error
      await this.persist()
      await this.#syncRun(job)
      return job
    } catch (error) {
      job.error = `查询失败：${error.message}`
      job.updatedAt = new Date().toISOString()
      await this.persist()
      return job
    }
  }

  async recover(id, taskId) {
    await this.ready
    if (this.initError?.code === 'SERVICE_STORE') throw this.initError
    if (this.initError) throw mediaError('媒体任务存储损坏，请先备份并检查 media-jobs.json', 500, 'MEDIA_STORE')
    const job = this.job(id)
    if (job.kind !== 'video') throw mediaError('只有视频任务可以关联任务编号', 400, 'MEDIA_RECOVER')
    if (job.taskId) throw mediaError('这个任务已经有关联的任务编号', 409, 'MEDIA_RECOVER')
    if (!['uncertain', 'submitting'].includes(job.status)) throw mediaError('这个任务不需要关联', 409, 'MEDIA_RECOVER')
    const seedance = isSeedance(job.connection)
    const valid = seedance ? isSeedanceTaskId(taskId) : isH3TaskId(taskId)
    if (!valid) {
      const format = seedance ? 'cgt- 开头的任务编号' : '纯数字任务编号'
      throw mediaError(`请输入服务商返回的${format}`, 400, 'VIDEO_TASK_ID')
    }
    if ([...this.jobs.values()].some(item => item.id !== id && item.taskId === taskId)) {
      throw mediaError('这个视频任务已关联其他实验', 409, 'H3_TASK_USED')
    }
    job.taskId = taskId
    job.status = 'queued'
    delete job.error
    job.updatedAt = new Date().toISOString()
    await this.persist()
    await this.attach(job, { status: 'queued', taskId, error: '' })
    return this.refresh(id, { force: true })
  }

  async serveAsset(req, res, file) {
    await this.ready
    const info = await this.assets.info(file)
    res.setHeader('content-type', info.mime)
    res.setHeader('cache-control', 'private, max-age=86400')
    res.setHeader('accept-ranges', 'bytes')
    const range = req.headers.range
    if (!range) {
      res.statusCode = 200
      res.setHeader('content-length', info.bytes)
      this.assets.stream(file).pipe(res)
      return
    }
    const match = /^bytes=(\d*)-(\d*)$/.exec(String(range))
    if (!match) {
      res.statusCode = 416
      res.setHeader('content-range', `bytes */${info.bytes}`)
      res.end()
      return
    }
    let start = match[1] ? Number(match[1]) : 0
    let end = match[2] ? Number(match[2]) : info.bytes - 1
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= info.bytes) {
      res.statusCode = 416
      res.setHeader('content-range', `bytes */${info.bytes}`)
      res.end()
      return
    }
    end = Math.min(end, info.bytes - 1)
    res.statusCode = 206
    res.setHeader('content-range', `bytes ${start}-${end}/${info.bytes}`)
    res.setHeader('content-length', end - start + 1)
    this.assets.stream(file, { start, end }).pipe(res)
  }
}

export { publicJob }

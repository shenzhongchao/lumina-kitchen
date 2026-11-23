import { mediaError } from './errors.js'
import { serviceUrl } from './settings.js'

export const SEEDANCE_RESOLUTION = '720p'
export const SEEDANCE_MAX_DURATION = 30
const TASK_PATH = '/contents/generations/tasks'

export function isSeedanceTaskId(id) {
  return typeof id === 'string' && /^cgt-[\w-]{1,180}$/.test(id)
}

export class SeedanceClient {
  constructor({ apiKey, baseUrl, model, fetchImpl }) {
    if (!apiKey) throw mediaError('未配置火山方舟密钥', 503, 'NO_VIDEO_KEY')
    this.apiKey = apiKey
    this.base = serviceUrl(baseUrl)
    this.model = model
    this.fetchImpl = fetchImpl
  }

  async #json(path, body) {
    let response
    try {
      response = await this.fetchImpl(this.base + path, {
        method: body ? 'POST' : 'GET',
        redirect: 'error',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          ...(body && { 'content-type': 'application/json' }),
        },
        ...(body && { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(body ? 60_000 : 30_000),
      })
    } catch {
      const message = body ? '未收到提交响应，请先核对火山方舟任务记录' : '暂时无法查询火山方舟任务，请稍后重试'
      throw mediaError(message, 502, 'SEEDANCE_NETWORK', { uncertain: Boolean(body) })
    }
    if (!response.ok) {
      const error = mediaError(`火山方舟请求失败（HTTP ${response.status}），请检查模型权限、密钥与额度。`, 502, 'SEEDANCE_PROVIDER')
      error.rejected = response.status >= 400 && response.status < 500
      throw error
    }
    try { return await response.json() }
    catch { throw mediaError('火山方舟响应无法解析，请核对任务记录', 502, 'SEEDANCE_RESPONSE') }
  }

  async submit({ prompt, duration, ratio }) {
    const result = await this.#json(TASK_PATH, {
      model: this.model, duration, ratio, resolution: SEEDANCE_RESOLUTION,
      content: [{ type: 'text', text: prompt }],
    })
    if (!isSeedanceTaskId(result?.id)) throw mediaError('未收到有效的火山方舟任务编号，请先核对任务记录', 502, 'SEEDANCE_TASK_ID')
    return { taskId: result.id }
  }

  async query(taskId) {
    if (!isSeedanceTaskId(taskId)) throw mediaError('火山方舟任务编号无效', 400, 'SEEDANCE_TASK_ID')
    const task = await this.#json(`${TASK_PATH}/${encodeURIComponent(taskId)}`)
    if (!['queued', 'running', 'succeeded', 'failed', 'cancelled', 'expired'].includes(task?.status)) {
      throw mediaError('火山方舟返回未知任务状态，请稍后重新查询', 502, 'SEEDANCE_STATUS')
    }
    return { ...task, content: { url: task.content?.video_url } }
  }
}

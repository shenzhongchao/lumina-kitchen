// Official MiniMax-H3 v2 video adapter. Only text-to-video is exposed.
import { mediaError, isAbort } from './errors.js'

export const MINIMAX_H3_BASE = 'https://api.minimax.cn/v2'
export const H3_MODEL = 'MiniMax-H3'
export const H3_RESOLUTION = '768P'
export const H3_RATIOS = ['16:9', '9:16', '21:9', '4:3', '1:1', '3:4']
export const H3_MAX_PROMPT = 7000

export function isH3TaskId(value) {
  return typeof value === 'string' && /^\d{1,32}$/.test(value)
}

export function h3Ratio(aspect) {
  const value = String(aspect || '').trim()
  if (H3_RATIOS.includes(value)) return value
  return '9:16'
}

export function h3Duration(value) {
  const number = Math.round(Number(value) || 6)
  return Math.min(15, Math.max(4, number))
}

export function truncateH3(text, max = H3_MAX_PROMPT - 100) {
  const value = String(text || '').trim()
  const chars = [...value]
  if (chars.length <= max) return value
  const cut = chars.slice(0, max).join('')
  const boundary = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('\n'))
  return `${(boundary > max * 0.6 ? cut.slice(0, boundary + 1) : cut).trim()} …`
}

function assertBaseUrl(value, provider) {
  let url
  try { url = new URL(value) } catch { throw mediaError(`${provider}服务地址无效`, 500, 'H3_BASE_URL') }
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
    throw mediaError(`${provider}服务地址必须使用 HTTPS（本机调试除外）`, 500, 'H3_BASE_URL')
  }
  return url.href.replace(/\/+$/, '')
}

export class H3Client {
  constructor({ apiKey, baseUrl = MINIMAX_H3_BASE, fetchImpl = fetch }) {
    this.provider = 'MiniMax'
    if (!apiKey) throw mediaError(`未配置 ${this.provider} 视频密钥`, 503, 'NO_VIDEO_KEY')
    this.apiKey = apiKey
    this.base = assertBaseUrl(baseUrl, this.provider)
    this.fetchImpl = fetchImpl
  }

  async #json(path, body, timeoutMs) {
    let response
    try {
      response = await this.fetchImpl(this.base + path, {
        method: body ? 'POST' : 'GET',
        redirect: 'error',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          ...(body ? { 'content-type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      if (isAbort(error) || error?.name === 'TimeoutError') {
        throw mediaError(body ? `${this.provider} 提交超时，请先核对任务记录，勿重复提交` : `${this.provider} 查询超时，稍后重试`, body ? 504 : 502, 'H3_TIMEOUT', {
          network: true, uncertain: Boolean(body),
        })
      }
      throw mediaError(body ? `提交响应未收到，请先核对 ${this.provider} 任务记录，勿重复生成` : '暂时无法查询，稍后重试', 502, 'H3_NETWORK', {
        network: true, uncertain: Boolean(body),
      })
    }
    if (!response.ok) {
      const message = `MiniMax 视频请求失败（HTTP ${response.status}），请核对密钥、模型权限和账户额度。`
      const error = mediaError(message, response.status === 429 ? 429 : 502, 'H3_PROVIDER')
      error.rejected = response.status >= 400 && response.status < 500
      throw error
    }
    try { return await response.json() } catch { throw mediaError(`${this.provider} 响应无法解析，请核对任务记录`, 502, 'H3_RESPONSE') }
  }

  async submit({ prompt, duration, ratio }) {
    const request = {
      model: H3_MODEL,
      resolution: H3_RESOLUTION,
      duration: h3Duration(duration),
      ratio: h3Ratio(ratio),
      content: [{ type: 'text', text: truncateH3(prompt) }],
    }
    const result = await this.#json('/video_generation', request, 60_000)
    if (!isH3TaskId(result?.task_id)) {
      throw mediaError(`未收到有效的 ${this.provider} 任务编号，请先核对任务记录，勿重复生成`, 502, 'H3_TASK', { uncertain: true })
    }
    return { taskId: result.task_id, request }
  }

  async query(taskId) {
    if (!isH3TaskId(taskId)) throw mediaError('任务编号无效', 400, 'H3_TASK_ID')
    const result = await this.#json(`/query/video_generation/${encodeURIComponent(taskId)}`, null, 30_000)
    const task = result?.task
    if (!task || !['queued', 'running', 'succeeded', 'failed', 'cancelled'].includes(task.status)) {
      throw mediaError(`${this.provider} 返回未知任务状态，稍后重新查询`, 502, 'H3_STATUS')
    }
    return task
  }
}

/** Only provider-returned HTTPS URLs are fetched; redirects and local hosts are rejected. */
export function assertVideoUrl(value) {
  let url
  try { url = new URL(value) } catch { throw mediaError('服务商返回了无效的视频地址', 502, 'H3_VIDEO_URL') }
  if (url.protocol !== 'https:' || url.username || url.password) throw mediaError('视频地址不安全', 502, 'H3_VIDEO_URL')
  const host = url.hostname.toLowerCase()
  if (/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/.test(host) || !host.includes('.')) {
    throw mediaError('视频地址指向本机或内网', 502, 'H3_VIDEO_URL')
  }
  return url.href
}

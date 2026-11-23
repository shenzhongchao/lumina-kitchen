// Image generation adapters sharing the same single-image JSON response shape.
import { mediaError, isAbort } from './errors.js'
import { sniffImageMime } from './assets.js'

export const DEFAULT_IMAGE_MODEL = 'gpt-image-2.6-sunburst'
export const IMAGE_SIZES = ['1024x1024', '1536x1024', '1024x1536']
export const IMAGE_QUALITIES = ['low', 'medium', 'high', 'auto']
export const IMAGE_COMPLEXITIES = ['low', 'medium', 'high']
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024
const SEEDREAM_2K = {
  '1:1': '2048x2048', '4:3': '2368x1776', '3:4': '1776x2368',
  '16:9': '2816x1584', '9:16': '1584x2816', '21:9': '3136x1344',
}

export function imageRequest(connection, aspect) {
  const supportedAspect = Object.hasOwn(SEEDREAM_2K, aspect) ? aspect : '1:1'
  if (connection.protocol === 'ark-seedream') {
    return { size: SEEDREAM_2K[supportedAspect] }
  }
  if (connection.protocol === 'minimax-image') {
    return { area: '2K', ratio: supportedAspect }
  }
  return {
    size: normalizeImageSize(connection.size) || imageSizeForAspect(aspect),
    quality: IMAGE_QUALITIES.includes(connection.quality) ? connection.quality : 'medium',
    complexity: IMAGE_COMPLEXITIES.includes(connection.complexity) ? connection.complexity : null,
  }
}

export function imageSizeForAspect(aspect) {
  if (aspect === '9:16' || aspect === '3:4') return '1024x1536'
  if (aspect === '16:9' || aspect === '21:9' || aspect === '4:3') return '1536x1024'
  return '1024x1024'
}

export function normalizeImageSize(value) {
  return IMAGE_SIZES.includes(value) ? value : ''
}

function assertBaseUrl(value) {
  let url
  try { url = new URL(value) } catch { throw mediaError('OpenAI 服务地址无效', 500, 'IMAGE_BASE_URL') }
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
    throw mediaError('OpenAI 服务地址必须使用 HTTPS（本机调试除外）', 500, 'IMAGE_BASE_URL')
  }
  return url.href.replace(/\/+$/, '')
}

function providerMessage(status) {
  return {
    400: 'OpenAI 拒绝了图像参数，请检查模型名、尺寸与提示词。',
    401: 'OpenAI 密钥无效或已失效，请检查 LUMINA_OPENAI_API_KEY。',
    403: 'OpenAI 拒绝访问，请检查项目权限与账单状态。',
    404: 'OpenAI 找不到图像模型；2.6 在 API 中通常写作 gpt-image-2.6-sunburst 或 gpt-image-2.6-flare，请用 LUMINA_IMAGE_MODEL 指定账号可用模型。',
    429: 'OpenAI 请求过于频繁或额度不足，请稍后再试。',
  }[status] || `OpenAI 暂时不可用（HTTP ${status}）。`
}

async function arkImageError(response) {
  const payload = await response.json().catch(() => null)
  const code = payload?.error?.code
  const safeCode = typeof code === 'string' && /^[A-Z][A-Za-z0-9.]{0,79}$/.test(code) ? code : ''
  const details = {
    ModelNotOpen: '请先在火山方舟控制台开通所选模型。',
    'InvalidEndpointOrModel.NotFound': '请核对模型或接入点 ID，以及当前 API 密钥的访问权限。',
    'InvalidEndpointOrModel.ModelIDAccessDisabled': '请在模型 ID 字段填写有权限的推理接入点 ID（ep- 开头）。',
  }
  const hint = Object.hasOwn(details, safeCode)
    ? details[safeCode]
    : '请到火山方舟控制台核对失败原因。'
  return `火山方舟图像请求失败（HTTP ${response.status}${safeCode ? ` / ${safeCode}` : ''}）。${hint}`
}

async function downloadImage(url, fetchImpl, signal, provider) {
  let parsed
  try { parsed = new URL(url) } catch { throw mediaError(`${provider} 返回了无效的图像地址`, 502, 'IMAGE_URL') }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw mediaError(`${provider} 返回了不安全的图像地址`, 502, 'IMAGE_URL')
  const host = parsed.hostname.toLowerCase()
  if (/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/.test(host) || !host.includes('.')) {
    throw mediaError(`${provider} 图像地址指向本机或内网`, 502, 'IMAGE_URL')
  }
  let response
  try {
    response = await fetchImpl(parsed.href, { signal, redirect: 'error' })
  } catch (error) {
    if (isAbort(error)) throw mediaError('图像下载超时', 504, 'IMAGE_TIMEOUT', { uncertain: true })
    throw mediaError(`无法下载 ${provider} 生成的图像`, 502, 'IMAGE_DOWNLOAD', { network: true, uncertain: true })
  }
  if (!response.ok) throw mediaError(`无法下载 ${provider} 生成的图像`, 502, 'IMAGE_DOWNLOAD', { uncertain: true })
  const buffer = Buffer.from(await response.arrayBuffer())
  if (!buffer.length) throw mediaError(`${provider} 返回了空图像`, 502, 'EMPTY_IMAGE')
  if (buffer.length > MAX_IMAGE_BYTES) throw mediaError(`${provider} 图像超过大小限制`, 502, 'IMAGE_TOO_LARGE')
  const declared = String(response.headers.get('content-type') || '').split(';')[0].trim()
  const mime = declared.startsWith('image/') ? declared : sniffImageMime(buffer)
  if (!mime) throw mediaError(`${provider} 返回的内容不是可识别的图像`, 502, 'IMAGE_FORMAT')
  return { buffer, mime }
}

/**
 * Generate exactly one image. Returns bytes instead of a temporary URL.
 * @returns {Promise<{buffer: Buffer, mime: string, revisedPrompt: string}>}
 */
export async function generateImage({
  apiKey,
  baseUrl,
  model = DEFAULT_IMAGE_MODEL,
  prompt,
  size,
  quality,
  complexity,
  protocol = 'openai-image',
  area,
  ratio,
  fetchImpl = fetch,
  signal,
}) {
  const provider = { 'ark-seedream': '火山方舟', 'minimax-image': 'MiniMax' }[protocol] || 'OpenAI'
  if (!apiKey) throw mediaError(`未配置 ${provider} 图像密钥`, 503, 'NO_IMAGE_KEY')
  if (typeof prompt !== 'string' || !prompt.trim()) throw mediaError('图像提示词为空', 400, 'IMAGE_PROMPT')
  if (prompt.length > 20_000) throw mediaError('图像提示词过长', 400, 'IMAGE_PROMPT')
  const base = assertBaseUrl(baseUrl)
  const path = '/images/generations'
  const endpoint = base.endsWith(path) ? base : base + path
  const body = { model, prompt: prompt.trim() }
  if (protocol === 'ark-seedream') {
    Object.assign(body, { size, response_format: 'b64_json' })
  } else if (protocol === 'minimax-image') {
    Object.assign(body, { n: 1, area, aspect_ratio: ratio, response_format: 'b64_json' })
  } else {
    if (size && !normalizeImageSize(size)) throw mediaError('不支持的图像尺寸', 400, 'IMAGE_SIZE')
    if (quality && !IMAGE_QUALITIES.includes(quality)) throw mediaError('不支持的图像质量', 400, 'IMAGE_QUALITY')
    if (complexity && !IMAGE_COMPLEXITIES.includes(complexity)) throw mediaError('不支持的图像复杂度', 400, 'IMAGE_COMPLEXITY')
    Object.assign(body, { n: 1, ...(size && { size }), ...(quality && { quality }), ...(complexity && { complexity }) })
  }

  let response
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      redirect: 'error',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (isAbort(error) || error?.name === 'TimeoutError') {
      throw mediaError(`${provider} 图像请求超时，请先核对账单再重试`, 504, 'IMAGE_TIMEOUT', { uncertain: true })
    }
    throw mediaError(`未能连接 ${provider} 图像服务，请先核对账单再重试`, 502, 'IMAGE_NETWORK', { network: true, uncertain: true })
  }

  if (!response.ok) {
    const status = response.status
    const message = protocol === 'ark-seedream'
      ? await arkImageError(response)
      : protocol === 'openai-image' ? providerMessage(status) : `${provider} 图像请求失败（HTTP ${status}），请检查模型权限、密钥与额度。`
    const error = mediaError(message, status === 429 ? 429 : 502, 'IMAGE_PROVIDER', { uncertain: protocol !== 'openai-image' && status >= 500 })
    error.rejected = status >= 400 && status < 500
    throw error
  }

  let payload
  try { payload = await response.json() } catch { throw mediaError(`${provider} 返回了无法解析的响应`, 502, 'IMAGE_RESPONSE', { uncertain: protocol !== 'openai-image' }) }
  const item = Array.isArray(payload?.data) ? payload.data[0] : null
  if (!item || item.error) throw mediaError(`${provider} 没有生成可用图像，请到服务商后台查看结果。`, 502, 'IMAGE_EMPTY')

  let buffer
  let mime
  if (typeof item.b64_json === 'string' && item.b64_json) {
    const base64 = item.b64_json.replace(/^data:[^;]+;base64,/, '')
    buffer = Buffer.from(base64, 'base64')
    if (!buffer.length) throw mediaError(`${provider} 返回了空图像`, 502, 'EMPTY_IMAGE')
    if (buffer.length > MAX_IMAGE_BYTES) throw mediaError(`${provider} 图像超过大小限制`, 502, 'IMAGE_TOO_LARGE')
    mime = sniffImageMime(buffer)
    if (!mime) throw mediaError(`${provider} 返回的内容不是可识别的图像`, 502, 'IMAGE_FORMAT')
  } else if (typeof item.url === 'string' && item.url) {
    ({ buffer, mime } = await downloadImage(item.url, fetchImpl, signal, provider))
  } else {
    throw mediaError(`${provider} 没有返回图像内容`, 502, 'IMAGE_EMPTY')
  }

  return {
    buffer,
    mime,
    revisedPrompt: typeof item.revised_prompt === 'string' ? item.revised_prompt : '',
  }
}

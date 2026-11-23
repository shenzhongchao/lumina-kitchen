import { H3_BASE, H3_MODEL, MINIMAX_H3_BASE } from './h3.js'
import { DEFAULT_IMAGE_MODEL } from './openai-image.js'

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3'

export const MEDIA_PRESETS = {
  'openai-image': { kind: 'image', name: 'OpenAI 兼容', baseUrl: 'https://api.openai.com/v1', model: DEFAULT_IMAGE_MODEL, keyEnv: ['LUMINA_OPENAI_API_KEY', 'OPENAI_API_KEY'] },
  'ark-seedream': { kind: 'image', name: 'Seedream 5.5 · 火山方舟', baseUrl: ARK_BASE, model: 'doubao-seedream-5-5-261028', keyEnv: ['ARK_API_KEY'] },
  'minimax-image': { kind: 'image', name: 'MiniMax H3 Image · 官方', baseUrl: 'https://api.minimax.cn/v1', model: 'MiniMax-H3-Image', keyEnv: ['MINIMAX_API_KEY'] },
  'minimax-video': { kind: 'video', name: 'MiniMax H3 · 官方', baseUrl: MINIMAX_H3_BASE, model: H3_MODEL, keyEnv: ['MINIMAX_API_KEY'] },
  'apiyi-h3': { kind: 'video', name: 'MiniMax H3 · API易', baseUrl: H3_BASE, model: H3_MODEL, keyEnv: ['LUMINA_APIYI_API_KEY', 'APIYI_API_KEY'] },
  'ark-seedance': { kind: 'video', name: 'Seedance 2.5 · 火山方舟', baseUrl: ARK_BASE, model: 'doubao-seedance-2-5-260628', keyEnv: ['ARK_API_KEY'] },
}

export function legacyProtocol(kind) {
  return kind === 'image' ? 'openai-image' : 'apiyi-h3'
}

export function mediaPreset(protocol) {
  return Object.hasOwn(MEDIA_PRESETS, protocol) ? MEDIA_PRESETS[protocol] : null
}

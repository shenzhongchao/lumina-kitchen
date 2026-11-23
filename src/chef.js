import { assertGenerationAllowed } from './generation-policy.js'
// 主厨：把配料表 + 想法交给 DSH 当前默认模型，换回结构化的分镜意图。
// 模型只负责「拍什么」，提示词字符串交给 build.js。
import { randomUUID } from 'node:crypto'
import { DIMENSIONS, DIM_META, WEIGHT_CN } from './taste.js'
import {
  DOFS, LIGHTING_KEYS, MOVEMENTS, SHOT_SIZES, TEMPS,
  masterStyle, negativePrompt, packageAll,
} from './build.js'

const PLUGIN_SESSION_ID = `lumina-kitchen-${randomUUID()}`
const LENSES = [14, 24, 35, 50, 85, 135, 200]
export const ROLES = ['establish_context', 'introduce_subject', 'build_tension', 'deliver_payload', 'transition', 'emotional_beat', 'evidence', 'comparison', 'resolution', 'call_to_action']

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

export function selectionOf(ctx) {
  try {
    const s = ctx.get('agentDefaultModel')?.currentSelection()
    return s?.provider && s?.model ? { provider: s.provider, model: s.model } : null
  } catch {
    return null
  }
}

export function modelInfo(ctx) {
  const route = selectionOf(ctx)
  if (!route) return null
  return { provider: route.provider, model: route.model, label: route.model }
}

export function shotPlan(duration, pacing) {
  const secondsPerShot = [0, 6, 5, 4, 3, 2.5][clamp(Number(pacing) || 3, 1, 5)]
  const count = clamp(Math.round(duration / secondsPerShot), 3, 12)
  const each = Math.round((duration / count) * 2) / 2
  const seconds = new Array(count).fill(each)
  const drift = Math.round((duration - each * count) * 10) / 10
  seconds[count - 1] = Math.round((seconds[count - 1] + drift) * 10) / 10
  return { count, seconds }
}

// 交给模型的配料按 LUMINA 的 7 个维度分组，键名就是维度 id——
// 模型和图谱、和用户看到的是同一套词，不需要中间再翻译一次。
function boardBrief(board, analysis) {
  const ingredients = {}
  for (const dim of DIMENSIONS) {
    const items = analysis.byDim?.[dim] || []
    if (!items.length) continue
    ingredients[dim] = {
      cn: DIM_META[dim]?.cn || dim,
      items: items.map(c => ({
        id: c.id,
        cn: c.cn,
        en: c.en,
        weight: c.weight,
        weight_cn: WEIGHT_CN[c.weight] || '',
        syntax: c.syntax,
        tags: c.tags,
      })),
    }
  }
  return {
    idea: board.idea || '',
    title: board.title || '',
    platform: board.constraints?.platform || 'douyin',
    duration: board.constraints?.duration || 15,
    aspect: board.constraints?.aspect || '9:16',
    pacing: board.constraints?.pacing || 3,
    mood: board.constraints?.mood || '',
    ingredients,
    conflicts: analysis.conflicts.map(c => ({ between: [c.a.cn, c.b.cn], why: c.why, fix: c.fix })),
    missing: analysis.missing,
  }
}

function systemPrompt(plan, brief) {
  return `你是 LUMINA 视频厨房的主厨。你把一份「视觉配料表」写成可直接投喂视频模型的分镜意图。

硬性规则：
1. 只能使用 ingredients 里给出的配料（按 LUMINA 的 7 个维度分组）。可以补充通用摄影词（如 35mm lens、rain、steam、wet asphalt），但不得引入未列出的 LUMINA 概念、新的流派或新的颜色体系。
2. 情绪必须写成看得见的成因。「孤独」不是形容词，而是「空街、单个人影、湿地面反光」。
3. 每一镜都要写清四件事：主体（谁/什么，含 3–6 个可识别的外观特征）、动作（按时间顺序）、场景（地点 + 时间 + 天气/氛围）、以及这一镜为什么存在（role）。
4. 所有镜头共享同一套风格、光位与色板，不要逐镜换风格。
5. 运动必须诚实：写 static 就不能有变焦、焦点变化或任何位移；有运动就写清是哪一类。
6. 镜头数固定 ${plan.count} 个，第 i 镜的秒数固定为 ${plan.seconds.join(' / ')}，总时长必须等于 ${brief.duration} 秒。
7. 出现人物时，每一镜重复同一组识别特征（同样的措辞），否则模型会换脸。
8. 配料表里如果有焦段、景深、光位、运动这类硬参数，每一镜都要服从它，不要自行换掉。
9. 只输出一个 JSON 对象，不要解释、不要 Markdown 代码块、不要前后缀。

输出结构（字段顺序照写）：
{
  "title": "不超过 14 个中文字的片名",
  "logline": "一句话故事，中文，不超过 40 字",
  "mood": { "primary": "中文情绪词", "secondary": "中文情绪词" },
  "synergy": "为什么这些配料放在一起成立，中文，不超过 80 字，要具体到画面",
  "style_phrase_en": "整体风格的英文短语，不超过 12 词；没有补充就留空",
  "lighting_phrase_en": "整体光位的英文短语，不超过 12 词；没有补充就留空",
  "palette_phrase_en": "整体色板的英文短语，不超过 10 词；没有补充就留空",
  "texture_phrase_en": "整体质感的英文短语，不超过 10 词；没有补充就留空",
  "shots": [
    {
      "no": 1,
      "seconds": ${plan.seconds[0]},
      "role": "从 ${ROLES.join('|')} 里选一个",
      "hero": false,
      "description_cn": "这一镜的中文描述，不超过 40 字",
      "subject_en": "主体与可识别特征，英文",
      "action_en": "按时间顺序的动作，英文",
      "setting_en": "地点 + 时间 + 天气/氛围，英文",
      "shot_size": "从 ${SHOT_SIZES.join('|')} 里选一个",
      "camera_movement": "从 ${MOVEMENTS.join('|')} 里选一个",
      "lens_mm": "从 ${LENSES.join('|')} 里选一个",
      "lighting_key": "从 ${LIGHTING_KEYS.join('|')} 里选一个",
      "dof": "从 ${DOFS.join('|')} 里选一个",
      "color_temperature": "从 ${TEMPS.join('|')} 里选一个",
      "audio_en": "环境声与音效，英文，可留空",
      "overlay": "画面文字，没有就留空",
      "used_ingredients": ["这一镜真正用到的配料 id"]
    }
  ]
}`
}

function userPrompt(brief, plan) {
  return `现在要做一条 ${brief.duration} 秒、${brief.aspect} 的 ${brief.platform} 视频。

<配料表>
${JSON.stringify(brief)}
</配料表>

镜头计划：共 ${plan.count} 镜，秒数依次为 ${plan.seconds.join('、')}。
${brief.missing.length ? `缺少这些维度：${brief.missing.map(d => `${DIM_META[d]?.cn || d}（${d}）`).join('、')}。用通用摄影词补足，但不要新增 LUMINA 概念。` : ''}
${brief.conflicts.length ? `已知冲突：${brief.conflicts.map(c => `${c.between.join(' × ')}（${c.why}）`).join('；')}。选一个保留，不要两边都写。` : ''}

只输出 JSON。`
}

function extractJson(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text)
  const body = fenced ? fenced[1] : text
  const start = body.search(/[{[]/)
  const end = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'))
  if (start < 0 || end < start) throw new Error('模型没有返回 JSON')
  return JSON.parse(body.slice(start, end + 1))
}

function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

function asText(value, max = 400) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export function normalize(raw, board, analysis, plan) {
  const obj = raw && typeof raw === 'object' ? raw : {}
  const ids = new Set(analysis.chosen.map(c => c.id))
  const shotsIn = Array.isArray(obj.shots) ? obj.shots.filter(s => s && typeof s === 'object') : []
  const shots = shotsIn.slice(0, 16).map((s, i) => {
    const used = Array.isArray(s.used_ingredients) ? s.used_ingredients.filter(id => ids.has(id)) : []
    return {
      no: i + 1,
      seconds: Number(plan.seconds[i]) || Number(s.seconds) || 3,
      role: pick(s.role, ROLES, 'emotional_beat'),
      hero: Boolean(s.hero),
      description: asText(s.description_cn, 200),
      subject: asText(s.subject_en, 400),
      action: asText(s.action_en, 400),
      setting: asText(s.setting_en, 400),
      shot_size: pick(s.shot_size, SHOT_SIZES, 'medium'),
      camera_movement: pick(s.camera_movement, MOVEMENTS, 'static'),
      lens_mm: LENSES.includes(Number(s.lens_mm)) ? Number(s.lens_mm) : 35,
      lighting_key: pick(s.lighting_key, LIGHTING_KEYS, 'natural'),
      dof: pick(s.dof, DOFS, 'medium'),
      color_temperature: pick(s.color_temperature, TEMPS, 'neutral'),
      audio: asText(s.audio_en, 200),
      overlay: asText(s.overlay, 80),
      used,
    }
  })

  // 时长与计划对齐：模型多给或少给都能落地
  if (shots.length) {
    const total = shots.reduce((n, s) => n + s.seconds, 0) || 1
    const target = Number(board.constraints?.duration) || total
    let acc = 0
    shots.forEach((s, i) => {
      if (i === shots.length - 1) {
        s.seconds = Math.max(1, Math.round((target - acc) * 10) / 10)
      } else {
        s.seconds = Math.max(1, Math.round((s.seconds / total) * target * 10) / 10)
        acc += s.seconds
      }
    })
  }

  return {
    title: asText(obj.title, 40) || board.title || '未命名',
    logline: asText(obj.logline, 200),
    mood: { primary: asText(obj.mood?.primary, 20), secondary: asText(obj.mood?.secondary, 20) },
    synergy: asText(obj.synergy, 400),
    stylePhrase: asText(obj.style_phrase_en, 120),
    lightingPhrase: asText(obj.lighting_phrase_en, 120),
    palettePhrase: asText(obj.palette_phrase_en, 100),
    texturePhrase: asText(obj.texture_phrase_en, 100),
    shots,
  }
}

function staticRisk(shots) {
  const still = shots.filter(s => s.camera_movement === 'static').length
  return { staticShots: still, total: shots.length, level: shots.length && still / shots.length >= 0.6 ? 'warn' : 'ok' }
}

export function fallbackRecipe(board, analysis, plan) {
  const sizes = ['wide', 'medium', 'close_up', 'medium_close', 'extreme_close_up', 'medium_wide']
  const moves = ['dolly_in', 'pan_right', 'tracking_right', 'static', 'dolly_out', 'tilt_up']
  const shots = plan.seconds.map((seconds, i) => ({
    no: i + 1,
    seconds,
    role: i === 0 ? 'establish_context' : 'emotional_beat',
    hero: false,
    description: `${board.title || '未命名'} · 第 ${i + 1} 镜（结构草稿）`,
    subject: analysis.chosen.map(c => c.en).slice(0, 3).join(', ') || 'the subject of the idea',
    action: 'a slow, continuous action that carries the shot',
    setting: board.idea || 'the world of the idea',
    shot_size: sizes[i % sizes.length],
    camera_movement: moves[i % moves.length],
    lens_mm: 35,
    lighting_key: 'natural',
    dof: 'medium',
    color_temperature: 'neutral',
    audio: '',
    overlay: '',
    used: analysis.chosen.map(c => c.id),
  }))
  return {
    title: board.title || '未命名',
    logline: board.idea || '',
    mood: { primary: board.constraints?.mood || '', secondary: '' },
    synergy: '当前没有连上模型，这是一份结构草稿：配料与镜头骨架已经就位，镜头描述需要你补全。',
    stylePhrase: '',
    lightingPhrase: '',
    palettePhrase: '',
    texturePhrase: '',
    shots,
  }
}

export async function callModel(ctx, system, user, signal) {
  assertGenerationAllowed()
  const info = modelInfo(ctx)
  if (!info) throw Object.assign(new Error('当前没有可用模型'), { code: 'NO_MODEL' })
  const llm = ctx.get('llm')
  if (!llm) throw Object.assign(new Error('这个 Harness 没有 llm 服务'), { code: 'NO_LLM' })
  const call = await llm.prepareCall({ provider: info.provider, model: info.model, maxTokens: 4000 }, signal, (controls, model) => {
    const effort = model.reasoning?.efforts?.[0]?.id
    return effort === undefined ? controls : { ...controls, reasoningEffort: effort }
  })
  let text = ''
  for await (const chunk of call.stream({
    ...call.config,
    system,
    messages: [{ role: 'user', content: [{ type: 'text', text: user }], source: { kind: 'lumina-kitchen' } }],
    sessionId: `${PLUGIN_SESSION_ID}-${randomUUID()}`,
    signal,
  })) {
    if (chunk.type === 'text-delta') text += chunk.text
    else if (chunk.type === 'finish' && ['error', 'aborted'].includes(chunk.reason?.kind)) {
      throw new Error(chunk.reason.failure?.message || '模型调用失败')
    }
  }
  if (!text.trim()) throw new Error('模型返回了空内容')
  return { text, model: info.label }
}

/**
 * 生成一份菜谱（含每个镜头的多目标提示词）。
 * @returns {Promise<{recipe:object, model:string|null, degraded:null|{reason:string}}>}
 */
export async function generateRecipe(ctx, { board, analysis }) {
  const plan = shotPlan(Number(board.constraints?.duration) || 15, board.constraints?.pacing)
  const brief = boardBrief(board, analysis)
  let normalized
  let model = null
  let degraded = null

  try {
    const signal = AbortSignal.timeout(120_000)
    let text
    try {
      const result = await callModel(ctx, systemPrompt(plan, brief), userPrompt(brief, plan), signal)
      text = result.text
      model = result.model
      normalized = normalize(extractJson(text), board, analysis, plan)
    } catch (first) {
      const retry = `${userPrompt(brief, plan)}\n\n上一次的输出无法使用：${String(first.message).slice(0, 300)}\n只输出合法 JSON。`
      const result = await callModel(ctx, systemPrompt(plan, brief), retry, AbortSignal.timeout(120_000))
      model = result.model
      normalized = normalize(extractJson(result.text), board, analysis, plan)
    }
    if (!normalized.shots.length) throw new Error('模型没有给出镜头')
  } catch (err) {
    normalized = fallbackRecipe(board, analysis, plan)
    degraded = { reason: String(err?.message || err) }
  }

  const shots = packageAll(normalized.shots, analysis, normalized)
  const recipe = {
    version: 1,
    title: normalized.title,
    logline: normalized.logline,
    mood: normalized.mood,
    synergy: normalized.synergy,
    stylePhrase: normalized.stylePhrase,
    lightingPhrase: normalized.lightingPhrase,
    palettePhrase: normalized.palettePhrase,
    texturePhrase: normalized.texturePhrase,
    masterStyle: masterStyle(analysis),
    negative: negativePrompt(analysis),
    shots,
    risk: staticRisk(shots),
    plan,
    model,
    degraded,
    generatedAt: new Date().toISOString(),
    ingredients: analysis.chosen.map(c => ({ id: c.id, cn: c.cn, en: c.en, dim: c.dim, dim_cn: c.dimCn, weight: c.weight })),
  }
  return { recipe, model, degraded }
}

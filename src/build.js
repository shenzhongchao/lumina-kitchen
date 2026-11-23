// 把结构化的镜头意图，按不同视频模型的口味打包成提示词。
// 结构与词表移植自 OpenMontage：lib/shot_prompt_builder.py 与
// skills/creative/video-gen-prompting.md。LLM 只给意图，字符串在这里拼。

export const TARGETS = [
  { id: 'veo', cn: 'Veo', note: '5 段 + 音频，约 250 词' },
  { id: 'kling', cn: 'Kling', note: '4 段 + 强调，约 120 词' },
  { id: 'ltx', cn: 'LTX', note: '紧句，≤ 80 词' },
  { id: 'runway', cn: 'Runway', note: '运动优先，≤ 60 词' },
  { id: 'seedance', cn: 'Seedance', note: '长结构化，200–400 词' },
  { id: 'image', cn: '图像', note: '关键词串，30–60 词' },
]

const SHOT_SIZE = {
  extreme_wide: 'extreme wide shot showing the vast environment',
  wide: 'wide shot capturing the full scene',
  medium_wide: 'medium-wide shot framing the subject with surroundings',
  medium: 'medium shot from the waist up',
  medium_close: 'medium close-up from the chest up',
  close_up: 'close-up on the face or the key detail',
  extreme_close_up: 'extreme close-up on a fine detail',
  over_shoulder: 'over-the-shoulder framing',
  insert: 'insert shot of a specific detail',
  establishing: 'establishing shot that sets the location',
}

const MOVEMENT = {
  static: 'locked-off static camera',
  pan_left: 'smooth pan to the left',
  pan_right: 'smooth pan to the right',
  tilt_up: 'gentle tilt upward',
  tilt_down: 'gentle tilt downward',
  dolly_in: 'slow dolly in toward the subject',
  dolly_out: 'slow dolly out from the subject',
  tracking_left: 'tracking shot moving left alongside the subject',
  tracking_right: 'tracking shot moving right alongside the subject',
  crane_up: 'crane shot rising upward',
  crane_down: 'crane shot descending',
  handheld: 'handheld camera with natural movement',
  steadicam: 'smooth steadicam following the movement',
  whip_pan: 'fast whip pan',
  orbital: 'orbital camera circling the subject',
  zoom_in: 'slow zoom in',
  zoom_out: 'slow zoom out',
  rack_focus: 'rack focus between foreground and background',
}

const LIGHTING = {
  high_key: 'bright high-key lighting with minimal shadows',
  low_key: 'dramatic low-key lighting with deep shadows',
  natural: 'natural ambient lighting',
  golden_hour: 'warm golden hour sunlight with long shadows',
  blue_hour: 'cool blue hour twilight',
  tungsten_warm: 'warm tungsten interior light',
  neon: 'neon-lit with vibrant color spill',
  silhouette: 'backlit silhouette',
  rim_lit: 'rim light separating the subject from the background',
  volumetric: 'volumetric light with visible rays',
  overcast_soft: 'soft overcast diffused light',
}

const DOF = {
  shallow: 'shallow depth of field with soft bokeh',
  medium: 'medium depth of field',
  deep: 'deep focus, foreground to background sharp',
}

const TEMP = {
  cool: 'cool blue-toned palette',
  neutral: 'neutral balanced colour',
  warm: 'warm amber-toned palette',
  mixed: 'mixed colour temperatures for contrast',
}

export const SHOT_SIZES = Object.keys(SHOT_SIZE)
export const MOVEMENTS = Object.keys(MOVEMENT)
export const LIGHTING_KEYS = Object.keys(LIGHTING)
export const DOFS = Object.keys(DOF)
export const TEMPS = Object.keys(TEMP)

const clean = list => [...new Set(list.filter(s => typeof s === 'string' && s.trim()))]

/**
 * 把若干段提示语拆成短语去重：同一句里的重复关键词、互相包含的短语只留最长的那个。
 * 概念的 ai_prompt_syntax_en 之间本来就有大量重叠，不去重会把提示词撑满车轱辘话。
 */
function fragmentsOf(list) {
  const all = []
  for (const item of list) {
    if (typeof item !== 'string') continue
    for (const raw of item.split(/[,;]/)) {
      const frag = raw.trim().replace(/\s+/g, ' ').toLowerCase()
      if (frag) all.push(frag)
    }
  }
  const uniq = [...new Set(all)]
  return uniq.filter(f => !uniq.some(other => other !== f && other.includes(f)))
}

function phrase(map, key, fallback = '') {
  return map[key] || fallback
}

// 按 LUMINA 的 7 个维度归位：光归光、色归色、风格归风格；
// 构图 / 光学 / 运镜都进 frame，因为它们共同决定「怎么拍」这一段。
function conceptBuckets(shot, analysis) {
  const out = { style: [], light: [], palette: [], frame: [], texture: [] }
  if (!analysis) return out
  const used = new Set(shot.used || [])
  for (const c of analysis.chosen) {
    if (!used.has(c.id)) continue
    const text = c.syntax || c.en
    if (!text) continue
    if (c.dim === 'lighting') out.light.push(text)
    else if (c.dim === 'color') out.palette.push(text)
    else if (c.dim === 'texture') out.texture.push(text)
    else if (c.dim === 'style') out.style.push(text)
    else out.frame.push(text)
  }
  // 主味即使这一镜没点名，也进风格块——风格必须逐镜一致
  for (const c of (analysis.byDim?.style || [])) {
    if (c.weight >= 3 && c.syntax) out.style.push(c.syntax)
  }
  for (const key of Object.keys(out)) out[key] = clean(out[key])
  return out
}

export function masterStyle(analysis) {
  if (!analysis) return ''
  const parts = (analysis.byDim?.style || []).filter(c => c.weight >= 2 && c.syntax).map(c => c.syntax)
  return fragmentsOf(parts).join(', ')
}

function texturePhrase(analysis, buckets) {
  const fromConcepts = buckets.texture
  const fromBoard = (analysis?.byDim?.texture || []).map(c => c.syntax).filter(Boolean)
  return fragmentsOf([...fromConcepts, ...fromBoard]).join(', ')
}

function lightingPhrase(shot) {
  const parts = [phrase(LIGHTING, shot.lighting_key, shot.lighting_key || '')]
  if (shot.color_temperature) parts.push(phrase(TEMP, shot.color_temperature))
  return parts.filter(Boolean).join(', ')
}

function cameraPhrase(shot) {
  const parts = []
  if (shot.lens_mm) parts.push(`${shot.lens_mm}mm lens`)
  if (shot.dof) parts.push(phrase(DOF, shot.dof))
  return parts.filter(Boolean).join(', ')
}

function spatialPhrase(shot) {
  const parts = [phrase(SHOT_SIZE, shot.shot_size, shot.shot_size || '')]
  if (shot.position) parts.push(shot.position)
  return parts.filter(Boolean).join(', ')
}

function motionPhrase(shot) {
  return phrase(MOVEMENT, shot.camera_movement, shot.camera_movement || '')
}

const subjectText = shot => [shot.subject, shot.action].filter(Boolean).join(', ')
const sceneText = shot => [shot.setting, shot.overlay ? `overlay: ${shot.overlay}` : ''].filter(Boolean).join('; ')

/** 按词数裁切，优先在句子/分句边界断开，并收干净末尾标点。 */
export function cap(text, maxWords) {
  const words = String(text).trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return String(text).trim()
  const clipped = words.slice(0, maxWords).join(' ')
  const tidy = value => value.replace(/[\s,;:.…]+$/, '')
  const cut = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('; '), clipped.lastIndexOf(', '))
  if (cut > maxWords * 3) return `${tidy(clipped.slice(0, cut))}.`
  return `${tidy(clipped)}…`
}

function join(parts) {
  return parts.map(p => String(p || '').trim()).filter(Boolean).join(', ')
}

/**
 * 为一份镜头生成所有目标的提示词。
 * @param {object} shot
 * @param {object} analysis analyze() 的结果
 * @param {object} recipe 生成结果（取全局风格与色板）
 */
export function packageShot(shot, analysis, recipe) {
  const buckets = conceptBuckets(shot, analysis)
  const style = fragmentsOf([...(buckets.style || []), recipe?.stylePhrase]).join(', ') || masterStyle(analysis)
  const palette = fragmentsOf([...(buckets.palette || []), recipe?.palettePhrase]).join(', ')
  const texture = fragmentsOf([texturePhrase(analysis, buckets), recipe?.texturePhrase]).join(', ')
  const light = fragmentsOf([lightingPhrase(shot), ...(buckets.light || []), recipe?.lightingPhrase]).join(', ')
  const camera = cameraPhrase(shot)
  const spatial = spatialPhrase(shot)
  const motion = motionPhrase(shot)
  const subject = subjectText(shot)
  const scene = sceneText(shot)
  const audio = shot.audio || ''

  const image = join([spatial, camera, subject, scene, light, palette, texture, style])
  const veo = [
    `Subject: ${subject}.`,
    scene ? `Scene: ${scene}.` : '',
    `Camera: ${spatial}, ${camera}, ${motion}.`,
    `Light: ${light}.`,
    `Style: ${join([palette, texture, style])}.`,
    audio ? `Audio: ${audio}.` : '',
  ].filter(Boolean).join(' ')

  const kling = [
    `++${subject}++`,
    scene ? `, ${scene}` : '',
    `. Camera: ${motion}${camera ? `, ${camera}` : ''}, ${spatial}`,
    light ? `. Light: ${light}` : '',
    `. Style: ${join([palette, texture, style])}`,
  ].filter(Boolean).join('')

  const ltx = join([subject, scene, `${spatial}`, motion, light, join([palette, style])])
  const runway = join([motion, shot.action, shot.subject, shot.setting])
  const seedance = [
    `[Shot] ${spatial}.`,
    `[Camera] ${camera}${camera ? ', ' : ''}${motion}.`,
    `[Subject] ${shot.subject || ''}.`,
    `[Action] ${shot.action || ''}.`,
    `[Scene] ${scene}.`,
    `[Lighting] ${light}.`,
    `[Style] ${join([palette, texture, style])}.`,
    audio ? `[Audio] ${audio}.` : '',
  ].filter(Boolean).join(' ')

  const img = cap(image, 60)
  const out = {
    veo: { image: cap(image, 70), video: cap(veo, 250) },
    kling: { image: cap(image, 60), video: cap(kling, 120) },
    ltx: { image: cap(image, 50), video: cap(ltx, 80) },
    runway: { image: cap(image, 50), video: cap(runway, 60) },
    seedance: { image: cap(image, 80), video: cap(seedance, 400) },
    image: { image: img, video: img },
  }
  for (const key of Object.keys(out)) out[key].words = countWords(out[key].video)
  return out
}

function countWords(text) {
  return String(text).trim().split(/\s+/).filter(Boolean).length
}

const BASE_NEGATIVE = ['text', 'watermark', 'logo', 'extra limbs', 'deformed hands', 'blurry']

export function negativePrompt(analysis, extra = []) {
  const fromData = (analysis?.chosen || []).flatMap(c => c.wrong || []).slice(0, 8)
  return clean([...BASE_NEGATIVE, ...fromData, ...extra]).join(', ')
}

export function packageAll(shots, analysis, recipe) {
  return shots.map(shot => ({ ...shot, packages: packageShot(shot, analysis, recipe) }))
}

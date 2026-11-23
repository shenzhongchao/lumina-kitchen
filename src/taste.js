// 味觉引擎：按维度归堆、相生、冲突、缺口。全部本地计算，不消耗 token。
//
// 这里只有一套词：知识库自己的 7 个维度（framing / lighting / color / optics /
// texture / motion / style）。四层（锚点/氛围/骨架/触感）已经废弃——它是知识库
// 之上多套的一层翻译，和维度不是一对一，还把运镜漏在外面。

export const DIMENSIONS = ['framing', 'lighting', 'color', 'optics', 'texture', 'motion', 'style']

export const DIM_META = {
  framing: { cn: '构图', en: 'Framing' },
  lighting: { cn: '光影', en: 'Lighting' },
  color: { cn: '色彩', en: 'Color' },
  optics: { cn: '光学', en: 'Optics' },
  texture: { cn: '材质', en: 'Texture' },
  motion: { cn: '运镜', en: 'Motion' },
  style: { cn: '风格', en: 'Style' },
}

// 视频里最先影响成片的四个维度。缺了才提示；色彩 / 光学 / 材质缺了不催，
// 否则托盘天天在喊「还缺材质」，逼人加不相干的料。
export const CORE_DIMS = ['motion', 'lighting', 'framing', 'style']

export const WEIGHT_CN = { 3: '主味', 2: '一份', 1: '一撮' }

const CONFLICT_RULES = [
  {
    id: 'macro-vs-deep',
    a: /macro|微距/,
    b: /deep focus|deep_focus|全景深|深焦|深景深/,
    why: '微距配深焦，模型会把背景也画清楚，微距特有的虚化就没了',
    fix: '把景深改成浅景深，或去掉微距',
  },
  {
    id: 'shallow-vs-deep',
    a: /shallow|浅景深|bokeh|焦外|虚化/,
    b: /deep focus|deep_focus|全景深|深焦|深景深/,
    why: '浅景深与深焦是相反的焦点承诺，写在一起模型只会照其中一个',
    fix: '按「隔离主体」还是「交代环境」二选一',
  },
  {
    id: 'golden-vs-cool',
    a: /golden hour|golden_hour|黄金时刻|黄金时段|sunset|日落/,
    b: /blue hour|blue_hour|蓝调|冷色|冷调/,
    tension: true,
    why: '暖光配冷掉，色温会互相抵消（也可能是故意的冷暖对撞）',
    fix: '确认是刻意张力；否则统一色温，或改成「暖主体 + 冷环境」',
  },
  {
    id: 'static-vs-move',
    a: /static|固定|locked[- ]off/,
    b: /handheld|whip|手持|甩镜|斯坦尼康|steadicam|摇臂/,
    why: '静止与移动是互斥的运动承诺，写在一起等于没有运动',
    fix: '去掉其中一个；或把这一镜换成另一种运动',
  },
  {
    id: 'high-vs-low',
    a: /high[- ]key|高调/,
    b: /low[- ]key|低调/,
    why: '高调与低调是相反的光比，同时出现模型只会照其中一个',
    fix: '按情绪二选一',
  },
  {
    id: 'tele-vs-wide',
    a: /telephoto|长焦|远摄|135mm|200mm/,
    b: /wide[- ]angle|广角|fisheye|鱼眼|14mm|24mm/,
    why: '长焦压缩与广角畸变是相反的镜头语言',
    fix: '按「贴近」还是「疏远」的意图二选一',
  },
  {
    id: 'hard-vs-soft',
    a: /hard light|硬光/,
    b: /soft light|柔光|diffus/,
    why: '硬光与柔光是互斥的光质',
    fix: '主光只留一种，另一种写成补光',
  },
  {
    id: 'sym-vs-dutch',
    a: /symmetr|对称构图/,
    b: /dutch|canted|荷兰角|倾斜/,
    tension: true,
    why: '对称追求稳定，荷兰角追求失衡（也可能是有意的张力）',
    fix: '确认是刻意张力；否则换掉其中一个',
  },
]

function haystack(c) {
  // 只匹配名字（中英文名）：定义与示例里顺带提到「wide angle」不算这一味。
  return `${c.en} ${c.cn}`.toLowerCase()
}

function tagsOf(c) {
  return new Set((c.tags || []).map(t => String(t).toLowerCase()))
}

/** 0..1 的搭配度：风味标签重合 + 显式搭配建议。 */
export function affinity(candidate, selected, selectedTags, comboRefs) {
  if (!selected.length) return 0.5
  const tags = tagsOf(candidate)
  let inter = 0
  for (const t of tags) if (selectedTags.has(t)) inter += 1
  const union = tags.size + selectedTags.size - inter
  const jac = union > 0 ? inter / union : 0
  let combo = 0
  if (comboRefs.has(candidate.id)) combo += 0.5
  for (const id of candidate.combo || []) if (selected.has(id)) combo += 0.25
  return Math.min(1, jac * 0.75 + combo)
}

function whyText(candidate, selectedById) {
  const shared = []
  const mine = tagsOf(candidate)
  for (const c of selectedById.values()) {
    for (const t of mine) if (tagsOf(c).has(t) && !shared.includes(t)) shared.push(t)
  }
  if (shared.length) return `同属 ${shared.slice(0, 3).join(' / ')}`
  for (const c of selectedById.values()) {
    if ((c.combo || []).includes(candidate.id)) return `「${c.cn}」的现成搭配`
    if ((candidate.combo || []).includes(c.id)) return `常和「${c.cn}」一起用`
  }
  return ''
}

/**
 * @param {object} board 配料表
 * @param {Map<string, object>} byId 货架索引
 * @param {Map<string, object>} dims 维度 id → 维度
 */
export function analyze(board, byId, dims) {
  const chosen = []
  for (const item of board.ingredients || []) {
    const c = byId.get(item.slug)
    if (!c) continue
    chosen.push({
      ...c,
      weight: Number(item.weight) || 2,
      dimCn: DIM_META[c.dim]?.cn || dims.get(c.dim)?.cn || c.dim,
      hay: haystack(c),
    })
  }

  const byDim = Object.fromEntries(DIMENSIONS.map(d => [d, []]))
  for (const c of chosen) (byDim[c.dim] || (byDim[c.dim] = [])).push(c)
  for (const key of Object.keys(byDim)) byDim[key].sort((a, b) => b.weight - a.weight)

  const conflicts = []
  for (const rule of CONFLICT_RULES) {
    const left = chosen.find(c => rule.a.test(c.hay))
    const right = chosen.find(c => rule.b.test(c.hay) && c.id !== left?.id)
    if (left && right) {
      conflicts.push({
        id: rule.id,
        level: rule.tension ? 'tension' : 'conflict',
        a: { id: left.id, cn: left.cn },
        b: { id: right.id, cn: right.cn },
        why: rule.why,
        fix: rule.fix,
      })
    }
  }

  const counts = Object.fromEntries(DIMENSIONS.map(d => [d, byDim[d].length]))
  // 缺的维度：核心维度排前面，其余按维度表顺序
  const missing = DIMENSIONS
    .filter(d => counts[d] === 0)
    .sort((a, b) => {
      const ca = CORE_DIMS.indexOf(a) === -1 ? 99 : CORE_DIMS.indexOf(a)
      const cb = CORE_DIMS.indexOf(b) === -1 ? 99 : CORE_DIMS.indexOf(b)
      return ca - cb || DIMENSIONS.indexOf(a) - DIMENSIONS.indexOf(b)
    })

  const selectedTags = new Set()
  for (const c of chosen) for (const t of tagsOf(c)) selectedTags.add(t)
  const selectedIds = new Set(chosen.map(c => c.id))
  const selectedById = new Map(chosen.map(c => [c.id, c]))
  const comboRefs = new Set(chosen.flatMap(c => c.combo || []))

  const suggestions = {}
  for (const dim of missing) {
    const pool = []
    for (const c of byId.values()) {
      if (selectedIds.has(c.id) || c.dim !== dim) continue
      pool.push({ c, score: affinity(c, selectedIds, selectedTags, comboRefs) })
    }
    pool.sort((a, b) => b.score - a.score)
    suggestions[dim] = pool.slice(0, 3).map(({ c, score }) => ({
      id: c.id,
      cn: c.cn,
      en: c.en,
      why: whyText(c, selectedById) || `补一味${DIM_META[dim]?.cn || dim}`,
      score: Number(score.toFixed(2)),
    }))
  }

  const warnings = []
  const leads = chosen.filter(c => c.weight === 3)
  if (leads.length > 3) warnings.push({ kind: 'leads', text: `${leads.length} 味标成了主味，留 1–2 味就够，多了会互相盖住` })
  if (!leads.length && chosen.length) warnings.push({ kind: 'leads', text: '还没有主味（份量 3），模型会平均对待每一味' })
  for (const dim of DIMENSIONS) {
    if (counts[dim] > 3) {
      const name = DIM_META[dim]?.cn || dims.get(dim)?.cn || dim
      warnings.push({ kind: 'repeat', text: `${name} 已经有 ${counts[dim]} 味，同类太多会让镜头语言变单调` })
    }
  }

  return {
    byDim,
    chosen,
    conflicts,
    counts,
    missing,
    suggestions,
    warnings,
    stats: { total: chosen.length, dimsUsed: chosen.length ? DIMENSIONS.filter(d => counts[d] > 0).length : 0 },
    comboRefs,
    selectedTags,
  }
}

/** 货架排序：没选东西时按字母，选过之后按搭配度。 */
export function rank(concepts, analysis) {
  if (!analysis || !analysis.chosen.length) return concepts
  const selectedIds = new Set(analysis.chosen.map(c => c.id))
  return concepts
    .filter(c => !selectedIds.has(c.id))
    .map(c => ({ c, score: affinity(c, selectedIds, analysis.selectedTags, analysis.comboRefs) }))
    .sort((a, b) => b.score - a.score || a.c.en.localeCompare(b.c.en))
    .map(row => ({ ...row.c, affinity: Number(row.score.toFixed(2)) }))
}

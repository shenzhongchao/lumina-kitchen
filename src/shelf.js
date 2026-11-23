// 把 web/data 的图谱投影成「货架」：只保留厨房真正会用到、且足够短字段。
// 开发数据来自 web/data；独立安装使用构建时生成的只读快照。
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const CACHE_TTL_MS = 60_000
const cache = { key: '', at: 0, value: null }

const unique = list => [...new Set(list.filter(v => typeof v === 'string' && v.trim()))]

function project(entry, concept, media) {
  const scenarios = Array.isArray(concept.use_case_scenarios) ? concept.use_case_scenarios : []
  const mistakes = Array.isArray(concept.common_mistakes) ? concept.common_mistakes : []
  const variations = Array.isArray(concept.concept_variations) ? concept.concept_variations : []
  return {
    id: entry.slug,
    dim: entry.dimension_id,
    topic: entry.batch_id,
    cn: entry.term_cn || concept.term_cn || '',
    en: entry.term_en || concept.term_en || '',
    def: entry.definition_cn || concept.definition_cn || '',
    tags: unique(concept.visual_intent_tags_en || []).slice(0, 8),
    tagsCn: unique(concept.visual_intent_tags_cn || []).slice(0, 8),
    syntax: concept.ai_prompt_syntax_en || '',
    case: concept.prompt_case_en || '',
    combo: unique(scenarios.flatMap(s => s.recommended_combination || [])).slice(0, 10),
    moods: unique(scenarios.flatMap(s => s.mood_tags || [])).slice(0, 8),
    wrong: unique(mistakes.map(m => m.example_comparison?.wrong_prompt || m.wrong_prompt)).slice(0, 3),
    variants: variations.slice(0, 3).map(v => ({
      cn: v.variation_name_cn || '',
      en: v.variation_name_en || '',
      syntax: v.modified_syntax || '',
      level: Number(v.intensity_level) || 0,
    })),
    diff: Number(concept.difficulty) || 0,
    review: entry.review_status || '',
    thumb: media?.thumbnail || '',
    preview: media?.preview || '',
    mediaKind: media?.format || '',
  }
}

function dimsFromTaxonomy(taxonomy) {
  const dims = Array.isArray(taxonomy) ? taxonomy : taxonomy?.dimensions
  if (!Array.isArray(dims)) throw new Error('taxonomy.json 里没有 dimensions 数组')
  return dims.map(d => ({
    id: d.id,
    cn: d.name_cn,
    en: d.name_en,
    def: d.definition_cn || '',
    count: Number(d.count) || 0,
    topics: (d.batches || []).map(b => ({
      id: b.id,
      cn: b.topic_cn,
      en: b.topic_en,
      count: Number(b.count) || 0,
    })),
  }))
}

/**
 * @param {string} dataDir 绝对路径，指向 web/data。
 * @returns {Promise<{version:number, dimensions:Array, concepts:Array, builtAt:string}>}
 */
export async function buildShelf(dataDir) {
  const taxonomyPath = join(dataDir, 'taxonomy.json')
  const indexPath = join(dataDir, 'index.json')
  let info
  let mediaMtime = 0
  try {
    info = await Promise.all([stat(taxonomyPath), stat(indexPath)])
  } catch (err) {
    const error = new Error(`找不到 LUMINA 图谱数据：${dataDir}`)
    error.code = 'SHELF_MISSING'
    error.detail = String(err?.message || err)
    throw error
  }
  try {
    mediaMtime = (await stat(join(dataDir, 'media-index.json'))).mtimeMs
  } catch {
    mediaMtime = 0
  }
  const key = `${dataDir}:${info[0].mtimeMs}:${info[1].mtimeMs}:${mediaMtime}`
  if (cache.key === key && cache.value && Date.now() - cache.at < CACHE_TTL_MS) return cache.value

  const taxonomy = JSON.parse(await readFile(taxonomyPath, 'utf8'))
  const index = JSON.parse(await readFile(indexPath, 'utf8'))
  const entries = Array.isArray(index) ? index : index.entries
  if (!Array.isArray(entries)) throw new Error('index.json 里没有 entries 数组')

  const media = new Map()
  try {
    const raw = JSON.parse(await readFile(join(dataDir, 'media-index.json'), 'utf8'))
    for (const [slug, row] of Object.entries(raw.entries || {})) media.set(slug, row)
  } catch {
    // 没有图片索引时照常给文字卡片
  }

  // 动态演示由用户批量下载后单独切换，图谱始终提供静态后备。

  const parts = unique(entries.map(e => e.part))
  const catalogs = new Map()
  await Promise.all(parts.map(async part => {
    if (!/^[\w.-]+\.json$/.test(part)) return
    try {
      const parsed = JSON.parse(await readFile(join(dataDir, part), 'utf8'))
      const rows = Array.isArray(parsed) ? parsed : parsed?.entries
      if (Array.isArray(rows)) for (const row of rows) catalogs.set(row.entry_id || row.slug, row)
    } catch {
      // 单个分片缺失时仍然给出其余概念，不整页失败
    }
  }))

  const concepts = []
  for (const entry of entries) {
    const row = catalogs.get(entry.entry_id) || catalogs.get(entry.slug)
    const concept = row?.concept || {}
    concepts.push(project({ ...entry, ...(row || {}) }, concept, media.get(entry.slug)))
  }
  concepts.sort((a, b) => (a.dim === b.dim ? (a.topic === b.topic ? a.en.localeCompare(b.en) : a.topic.localeCompare(b.topic)) : a.dim.localeCompare(b.dim)))

  const value = {
    version: 1,
    dimensions: dimsFromTaxonomy(taxonomy),
    concepts,
    builtAt: new Date().toISOString(),
  }
  cache.key = key
  cache.at = Date.now()
  cache.value = value
  return value
}

export function shelfIndex(shelf) {
  const byId = new Map()
  for (const c of shelf.concepts) byId.set(c.id, c)
  return byId
}

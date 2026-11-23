// Read-only knowledge access. Full records are returned only on explicit read.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const strings = value => typeof value === 'string' ? value : Array.isArray(value)
  ? value.map(strings).join(' ') : value && typeof value === 'object' ? Object.values(value).map(strings).join(' ') : ''
const norm = value => String(value).normalize('NFKC').toLowerCase().replace(/[_-]/g, ' ')
export function terms(text) {
  const parts = norm(text).match(/[a-z0-9]+|[\p{Script=Han}]+/gu) || []
  return [...new Set(parts.flatMap(p => /\p{Script=Han}/u.test(p) && p.length > 2
    ? [p, ...Array.from({ length: p.length - 1 }, (_, i) => p.slice(i, i + 2))] : [p]))]
}

export async function loadKnowledge(directory) {
  const index = JSON.parse((await readFile(join(directory, 'index.json'), 'utf8')).replace(/^\uFEFF/, ''))
  const entries = Array.isArray(index) ? index : index.entries
  if (!Array.isArray(entries)) throw new Error('知识索引格式无效')
  const catalogs = new Map()
  for (const part of new Set(entries.map(e => e.part))) {
    if (!/^[\w.-]+\.json$/.test(part)) throw new Error('知识分片路径无效')
    const parsed = JSON.parse((await readFile(join(directory, part), 'utf8')).replace(/^\uFEFF/, ''))
    for (const row of (Array.isArray(parsed) ? parsed : parsed.entries)) catalogs.set(row.entry_id || row.slug, row)
  }
  const records = entries.map(entry => {
    const row = catalogs.get(entry.entry_id) || catalogs.get(entry.slug)
    if (!row) throw new Error(`知识记录缺失：${entry.slug}`)
    const c = row.concept || {}
    const record = {
      id: entry.slug, name: row.term_cn || entry.term_cn, name_en: row.term_en || entry.term_en,
      dimension: entry.dimension_id, topic: entry.batch_id,
      aliases: [...new Set([...(entry.alias_cn || []), ...(entry.alias_en || []), ...(c.alias_cn || []), ...(c.alias_en || [])])],
      definition: c.definition_cn || row.definition_cn || entry.definition_cn || '',
      definition_en: c.definition_en || '',
      tags: [...new Set([...(entry.intent_tags || []), ...(c.visual_intent_tags_cn || []), ...(c.visual_intent_tags_en || [])])],
      scenarios: c.use_case_scenarios || [], mistakes: c.common_mistakes || [],
      variations: c.concept_variations || [], syntax: c.ai_prompt_syntax_en || '', example: c.prompt_case_en || '',
      review_status: row.review_status || entry.review_status || 'unknown',
      source: { file: entry.part, entry_id: entry.entry_id, original: entry.source_file || '' },
    }
    return { ...record, digest: createHash('sha256').update(JSON.stringify(record)).digest('hex') }
  })
  return new Map(records.map(r => [r.id, r]))
}

export function searchKnowledge(records, query, { dimension, limit = 10 } = {}) {
  if (typeof query !== 'string' || !query.trim() || query.length > 500) throw new Error('查询须为 1–500 字符')
  const tokens = terms(query)
  const scored = []
  for (const r of records.values()) {
    if (dimension && r.dimension !== dimension) continue
    const fields = { name: `${r.name} ${r.name_en}`, aliases: strings(r.aliases), tags: strings(r.tags), definition: `${r.definition} ${r.definition_en}`, scenarios: strings(r.scenarios) }
    const weights = { name: 12, aliases: 10, tags: 5, definition: 2, scenarios: 1 }
    const matches = []
    let score = 0
    for (const [field, value] of Object.entries(fields)) {
      const text = norm(value)
      const hits = tokens.filter(t => /\p{Script=Han}/u.test(t) ? text.includes(t) : text.split(/[^a-z0-9]+/).includes(t))
      if (hits.length) { score += hits.length * weights[field]; matches.push({ field, terms: hits }) }
      if (text.includes(norm(query.trim()))) score += weights[field] * 3
    }
    if (score > 0) scored.push({ id: r.id, name: r.name, name_en: r.name_en, dimension: r.dimension,
      definition: r.definition, review_status: r.review_status, score, matches })
  }
  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
  return { query, total: scored.length, results: scored.slice(0, Math.max(1, Math.min(20, Number(limit) || 10))),
    note: '分数仅表示文本匹配，不代表摄影适用性；使用前请 read_concepts 阅读原文。' }
}

export function evidenceText(record) { return strings(record) }

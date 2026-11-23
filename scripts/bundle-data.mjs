// Explicit allowlist: ship knowledge and referenced previews, never workspace/user data.
import { readFile, mkdir, copyFile, writeFile, rm, rename, access } from 'node:fs/promises'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { loadKnowledge } from '../src/knowledge.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const source = resolve(process.argv[2] || join(root, '../../web'))
const target = join(root, 'resources')
const stage = join(root, '.resources-staging')
const json = async path => JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''))
// A standalone checkout ships the reviewed snapshot; packaging never needs the parent repo.
let externalSource = true
try { await access(join(source, 'data/index.json')) } catch { externalSource = false }
if (!externalSource && !process.argv[2]) {
  const manifest = await json(join(target, 'manifest.json'))
  for (const [file, sha256] of Object.entries(manifest.files)) {
    if (!/^(data|assets)\/[\w./-]+$/.test(file) || file.includes('..')) throw new Error('Invalid resource path')
    if (createHash('sha256').update(await readFile(join(target, file))).digest('hex') !== sha256) throw new Error(`Resource hash mismatch: ${file}`)
  }
  const knowledge = await loadKnowledge(join(target, 'data'))
  if (knowledge.size !== manifest.concepts) throw new Error('Knowledge snapshot count mismatch')
  console.log(JSON.stringify({ source: 'bundled snapshot', concepts: knowledge.size, files: Object.keys(manifest.files).length }))
  process.exit(0)
}
const index = await json(join(source, 'data/index.json'))
const entries = Array.isArray(index) ? index : index.entries
const media = await json(join(source, 'data/media-index.json'))
const files = new Set(['data/index.json', 'data/taxonomy.json', 'data/media-index.json'])
for (const entry of entries) {
  if (!/^[\w-]+\.json$/.test(entry.part)) throw new Error(`Invalid catalog: ${entry.part}`)
  files.add(`data/${entry.part}`)
  const row = media.entries?.[entry.slug]
  for (const key of ['thumbnail', 'preview']) {
    const path = row?.[key]
    if (!path) continue
    if (!/^assets\/(concept-thumbs|concept-previews|topic-images)\/[\w/-]+\.(webp|png|jpe?g|gif)$/.test(path)) throw new Error(`Invalid media: ${path}`)
    files.add(path)
  }
}
// Only these fixed, package-local generated directories are replaced.
await rm(stage, { recursive: true, force: true })
const hashes = {}
let bytes = 0
for (const file of [...files].sort()) {
  const destination = join(stage, file)
  await mkdir(dirname(destination), { recursive: true })
  await copyFile(join(source, file), destination)
  const buffer = await readFile(destination)
  bytes += buffer.length
  hashes[file] = createHash('sha256').update(buffer).digest('hex')
}
const knowledge = await loadKnowledge(join(stage, 'data'))
const motionEntries = []
for (const e of entries.filter(e => e.dimension_id === 'motion')) {
  if (!/^[\w-]+$/.test(e.slug)) throw new Error('Invalid motion id')
  let buffer
  try { buffer = await readFile(join(source, 'assets/concept-samples', `${e.slug}.gif`)) }
  catch (error) { if (error.code === 'ENOENT') continue; throw error }
  if (!/^GIF8[79]a$/.test(buffer.subarray(0, 6).toString())) throw new Error(`Invalid GIF: ${e.slug}`)
  motionEntries.push({ id: e.slug, file: `${e.slug}.gif`, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex') })
}
const motionFile = 'data/motion-manifest.json'
const motionBuffer = Buffer.from(JSON.stringify({ format: 1, entries: motionEntries }, null, 2) + '\n')
await writeFile(join(stage, motionFile), motionBuffer)
hashes[motionFile] = createHash('sha256').update(motionBuffer).digest('hex')
bytes += motionBuffer.length; files.add(motionFile)
if (knowledge.size !== entries.length) throw new Error('Duplicate or missing knowledge records')
const manifest = { format: 1, source: 'lumina_lab/web', concepts: knowledge.size, files: hashes, bytes,
  mediaPolicy: 'Referenced static previews only; original motion GIFs are not bundled.' }
await writeFile(join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
await rm(target, { recursive: true, force: true })
await rename(stage, target)
console.log(JSON.stringify({ concepts: knowledge.size, files: files.size, bytes, motionGifs: motionEntries.length, motionBytes: motionEntries.reduce((n, e) => n + e.bytes, 0) }))

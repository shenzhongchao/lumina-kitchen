// Local-only real GIF source for manual/UI verification. Never shipped or deployed.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
const root = fileURLToPath(new URL('../', import.meta.url))
const manifest = JSON.parse(await readFile(join(root, 'resources/data/motion-manifest.json'), 'utf8'))
let failFirst = true, delay = 80, requests = 0
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1')
  if (url.pathname === '/__control') {
    if (url.searchParams.has('fail')) failFirst = url.searchParams.get('fail') === '1'
    if (url.searchParams.has('delay')) delay = Math.max(0, Math.min(1000, Number(url.searchParams.get('delay')) || 0))
    res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ failFirst, delay, requests }))
  }
  const entry = manifest.entries.find(e => '/' + e.file === url.pathname)
  if (!entry) { res.statusCode = 404; return res.end() }
  requests++
  if (failFirst && entry.id === manifest.entries[0].id) { res.statusCode = 503; return res.end('Local failure fixture') }
  const bytes = await readFile(join(process.env.LUMINA_MOTION_SOURCE_DIR || join(root, '../../web/assets/concept-samples'), entry.file))
  res.setHeader('content-type', 'image/gif'); res.setHeader('content-length', bytes.length)
  let offset = 0
  const timer = setInterval(() => {
    if (res.destroyed) return clearInterval(timer)
    res.write(bytes.subarray(offset, offset + 262144)); offset += 262144
    if (offset >= bytes.length) { clearInterval(timer); res.end() }
  }, delay)
  res.on('close', () => clearInterval(timer))
}).listen(4399, '127.0.0.1', () => console.log('Local GIF verification source on 127.0.0.1:4399'))

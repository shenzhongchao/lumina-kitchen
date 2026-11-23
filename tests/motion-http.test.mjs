import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import plugin from '../src/host.js'

test('motion HTTP uses authenticated host routes, rejects cross-site actions, serves only completed cache', async t => {
  const root = await mkdtemp(join(tmpdir(), 'lumina-motion-http-'))
  const original = process.env.DSH_HOME; process.env.DSH_HOME = root
  const bytes = Buffer.from('GIF89a-test-fixture')
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const manifestPath = join(root, 'manifest.json')
  await writeFile(manifestPath, JSON.stringify({ format: 1, entries: [{ id: 'motion-demo', file: 'motion-demo.gif', bytes: bytes.length, sha256 }] }))
  let calls = 0
  const source = createServer((req, res) => { calls++; res.end(bytes) })
  await new Promise(r => source.listen(0, '127.0.0.1', r))
  let handler; const disposers = []
  plugin.apply({ effect: fn => disposers.push(fn()), webServer: { register: r => { handler = r.handler } },
    get: name => name === 'connection' ? { requestRejection: ({ headers }) => headers['x-test-auth'] === 'yes' ? null : 403 } : null },
  { motionManifest: manifestPath, motionBaseUrl: `http://127.0.0.1:${source.address().port}/`, allowLocalMotionSource: true })
  const server = createServer(handler); await new Promise(r => server.listen(0, '127.0.0.1', r))
  t.after(async () => {
    disposers.forEach(f => f?.())
    await Promise.all([new Promise(r => server.close(r)), new Promise(r => source.close(r))])
    if (original === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = original
    await rm(root, { recursive: true, force: true })
  })
  const base = `http://127.0.0.1:${server.address().port}/lumina-kitchen/motion`
  const auth = { 'x-test-auth': 'yes', 'content-type': 'application/json' }
  assert.equal((await fetch(base)).status, 403)
  assert.equal((await fetch(base + '/assets/' + sha256 + '.gif', { headers: auth })).status, 404)
  assert.equal((await fetch(base, { method: 'POST', headers: { ...auth, 'sec-fetch-site': 'cross-site' }, body: JSON.stringify({ action: 'start' }) })).status, 403)
  assert.equal(calls, 0)
  assert.equal((await fetch(base, { method: 'POST', headers: auth, body: JSON.stringify({ action: 'start' }) })).status, 200)
  const deadline = Date.now() + 5000
  let status
  do { status = await (await fetch(base, { headers: auth })).json(); if (status.phase === 'complete') break; await new Promise(r => setTimeout(r, 10)) } while (Date.now() < deadline)
  assert.equal(status.phase, 'complete'); assert.equal(calls, 1)
  const response = await fetch(base + '/assets/' + sha256 + '.gif', { headers: auth })
  assert.equal(response.headers.get('content-type'), 'image/gif')
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes)
  assert.equal((await fetch(base + '/assets/' + sha256 + '.gif')).status, 403)
})

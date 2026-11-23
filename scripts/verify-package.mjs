// Run against an installed tarball in a fresh directory, never the source tree.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import vm from 'node:vm'

const root = resolve(process.argv[2] || '.')
assert.ok(process.env.DSH_HOME, 'Use an isolated DSH_HOME')
assert.equal(process.env.LUMINA_KITCHEN_DATA, undefined, 'Clear external knowledge override')
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const manifest = JSON.parse(await readFile(join(root, 'resources/manifest.json'), 'utf8'))
for (const [file, hash] of Object.entries(manifest.files)) {
  assert.equal(createHash('sha256').update(await readFile(join(root, 'resources', file))).digest('hex'), hash, file)
}
const client = await readFile(join(root, 'dist/client.js'), 'utf8')
let clientId
vm.runInNewContext(client, { window: { __ModuleLoader__: { load: ({ id }) => { clientId = id } } } })
assert.equal(clientId, pkg.name)
assert.ok((await readFile(join(root, 'cordis.patch.yml'), 'utf8')).includes(`name: '${pkg.name}'`))
const { default: plugin, name } = await import(pathToFileURL(join(root, pkg.main)))
assert.equal(name, pkg.name)
let handler
const registered = new Map()
const ctx = {
  effect: fn => fn(),
  webServer: { register: route => { handler = route.handler; return () => {} } },
  get: name => ({
    connection: { requestRejection: ({ headers }) => headers['x-test-auth'] === 'yes' ? null : 403 },
    tools: { register: tool => registered.set(tool.name, tool) },
    workspaceRegistry: { list: () => { throw new Error('No source workspace allowed') } },
  })[name],
}
plugin.apply(ctx, {})
const server = createServer(handler)
await new Promise(r => server.listen(0, '127.0.0.1', r))
try {
  const base = `http://127.0.0.1:${server.address().port}/lumina-kitchen`
  const get = path => fetch(base + path, { headers: { 'x-test-auth': 'yes' } })
  assert.equal((await fetch(base + '/shelf')).status, 403)
  const response = await get('/shelf')
  assert.equal(response.status, 200)
  const shelf = await response.json()
  assert.equal(resolve(shelf.dataDir), join(root, 'resources/data'))
  assert.equal(shelf.dimensions.length, 7)
  assert.equal(shelf.concepts.length, manifest.concepts)
  let images = 0
  for (const path of new Set(shelf.concepts.flatMap(c => [c.thumb, c.preview]).filter(Boolean))) {
    const response = await get('/media/' + path)
    assert.equal(response.status, 200, path)
    assert.ok((await response.arrayBuffer()).byteLength > 0)
    images++
  }
  const exec = { agent: { id: 'isolated-package-test' } }
  const result = await registered.get('lumina_search_knowledge').execute({ query: '大远景' }, exec)
  assert.ok(result.results.length)
  const concepts = await registered.get('lumina_read_concepts').execute({ ids: [result.results[0].id] }, exec)
  assert.equal(concepts.concepts.length, 1)
  assert.ok(concepts.concepts[0].definition)
  const boards = await (await get('/boards')).json()
  assert.ok(boards.boards.length)
  assert.equal((await get('/services')).status, 200)
  const motion = await (await get('/motion')).json()
  assert.ok(motion.total > 0)
  assert.equal(motion.enabled, false)
  assert.equal(motion.completed, 0)
  assert.equal((await get('/demo-media/A.svg')).status, 200)
  console.log(JSON.stringify({ package: pkg.name, version: pkg.version, concepts: shelf.concepts.length,
    dimensions: shelf.dimensions.length, images, tools: registered.size, hashes: Object.keys(manifest.files).length,
    result: 'PASS', scope: 'Installed package HTTP + tool smoke; simulated host, no paid APIs' }, null, 2))
} finally { await new Promise(r => server.close(r)) }

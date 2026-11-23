import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import plugin from '../src/host.js'

test('authenticated panel HTTP → native DSH LLM stream → knowledge → saved recommendation', async t => {
  const root = await mkdtemp(join(tmpdir(), 'lumina-http-'))
  const original = process.env.DSH_HOME
  process.env.DSH_HOME = root
  t.after(async () => { if (original === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = original; await rm(root, { recursive: true, force: true }) })
  let handler, calls = 0
  const tools = new Map()
  const ctx = {
    effect: fn => fn(), webServer: { register: route => { handler = route.handler; return () => {} } },
    get: name => ({
      tools: { register: tool => tools.set(tool.name, tool) },
      connection: { requestRejection: ({ headers }) => headers['x-test-auth'] === 'yes' ? null : 403 },
      agentDefaultModel: { currentSelection: () => ({ provider: 'native', model: 'fixture' }) },
      llm: { prepareCall: async () => ({ config: {}, stream: async function* (args) {
        assert.ok(args.sessionId.startsWith('lumina-kitchen-'))
        assert.equal(args.messages[0].role, 'user')
        calls++
        const data = calls === 1 ? { understanding: '人物在空旷环境中显得孤独', queries: ['大远景', '留白'], assumptions: [], question: null }
          : { items: ['1-1-extreme-long-shot', '1-3-negative-space'].map(id => ({ id, effect: '突出人物与环境比例', why: '用空旷表达孤独', tradeoff: '表情细节变少' })) }
        yield { type: 'text-delta', text: JSON.stringify(data) }
        yield { type: 'finish', reason: { kind: 'stop' } }
      } }) },
    })[name],
  }
  plugin.apply(ctx, { dataDir: fileURLToPath(new URL('../resources/data', import.meta.url)) })
  const server = createServer(handler)
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  t.after(() => new Promise(r => server.close(r)))
  const base = `http://127.0.0.1:${server.address().port}/lumina-kitchen`
  assert.equal((await fetch(`${base}/boards`)).status, 403)
  const request = (path, body) => fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'x-test-auth': 'yes', 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
  let state = await (await request('/boards')).json()
  const board = state.boards[0]
  await request('/boards', { action: 'update', id: board.id, board: { ...board, idea: '雨夜站台，一个人孤独地等车' } })
  const response = await request('/lab', { action: 'recommend', id: board.id })
  assert.equal(response.status, 200)
  state = await response.json()
  assert.equal(calls, 2)
  assert.equal(state.boards[0].ingredients.length, 0)
  assert.equal(state.boards[0].lab.recommendation.items.length, 2)
  assert.equal(tools.size, 8)
  assert.ok(tools.has('lumina_results'))
  const exec = {agent:{id:'shared-http-chat'}}
  const toolCall = (name, args) => tools.get(name).execute(args, exec)
  await toolCall('lumina_context', {action:'bind',experiment_id:board.id})
  const {experiment:read} = await toolCall('lumina_context', {action:'current'})
  assert.equal(read.lab.recommendation.items.length,2)
  await toolCall('lumina_edit',{action:'apply',experiment_id:board.id,expected_revision:read.revision,changes:{motion:'侧面跟拍'}})
  // A stale autosave must fail, including after conversation edits.
  assert.equal((await request('/boards', { action: 'update', id: board.id, board: { ...board, idea: '新想法', lab: null } })).status,409)
  const fresh = await (await request('/boards')).json()
  assert.equal(fresh.boards[0].lab.recommendation.items.length, 2)
  assert.equal(fresh.boards[0].shot.motion,'侧面跟拍')
  assert.equal(fresh.boards[0].idea,'雨夜站台，一个人孤独地等车')
  assert.equal(fresh.bindings,undefined)
  assert.equal(fresh.boards[0].history,undefined)
  assert.equal((await request('/edit',{action:'preview',id:board.id,expectedRevision:fresh.boards[0].revision,changes:{lighting:'侧逆光'}})).status,200)
  assert.notEqual(fresh.boards[0].lab.recommendation.inputKey, JSON.stringify({ idea: fresh.boards[0].idea, constraints: fresh.boards[0].constraints }))
})

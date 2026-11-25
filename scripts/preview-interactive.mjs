// Local verification harness: real React + plugin routes/tools, isolated temporary data.
// npm install --prefix <temp-deps> react@18 react-dom@18
// node scripts/preview-interactive.mjs <temp-deps>/node_modules
import { createServer } from 'node:http'
import { readFile, mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import plugin from '../src/host.js'
import { KitchenStore } from '../src/store.js'
const pipelineFixture = process.argv.includes('--pipeline-fixture')
const modules = process.argv[2]
if (!modules) throw new Error('Provide an isolated node_modules path containing React 18')
process.env.LUMINA_OFFLINE = pipelineFixture ? '0' : '1'
const root = fileURLToPath(new URL('../', import.meta.url))
process.env.DSH_HOME = await mkdtemp(join(tmpdir(), 'lumina-interactive-'))
for (const key of ['LUMINA_OPENAI_API_KEY', 'OPENAI_API_KEY', 'ARK_API_KEY', 'MINIMAX_API_KEY']) delete process.env[key]
if (process.argv.includes('--results-fixture')) {
  const { resultBoard } = await import('../tests/fixtures/results.mjs')
  const board = resultBoard()
  const home = join(process.env.DSH_HOME, 'lumina-kitchen')
  await mkdir(join(home, 'media'), { recursive: true })
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=', 'base64')
  for (const run of board.lab.runs) await writeFile(join(home, 'media', run.asset.file), png)
  const videoIndex = process.argv.indexOf('--video-fixture')
  if (videoIndex >= 0) {
    const video = await readFile(process.argv[videoIndex + 1])
    const videoRuns = board.lab.runs.map((run, i) => ({ ...structuredClone(run), id: `video_${run.variantId}`, kind: 'video',
      prompt: run.source.variant.videoPrompt, request: { duration: 2, ratio: '16:9' },
      asset: { file: `${String(i + 3).repeat(64)}.mp4`, mime: 'video/mp4', bytes: video.length } }))
    for (const run of videoRuns) await writeFile(join(home, 'media', run.asset.file), video)
    board.lab.runs.unshift(...videoRuns)
  }
  await new KitchenStore(home).write({ activeId: board.id, boards: [board] })
}
let handler
const tools = new Map()
const ctx = {
  effect: fn => fn(), webServer: { register: route => { handler = route.handler } },
  get: name => ({ agentDefaultModel: pipelineFixture ? { currentSelection: () => ({provider:'fixture',model:'本地模拟模型（不联网）'}) } : null, connection: { requestRejection: () => null }, tools: { register: tool => tools.set(tool.name, tool) } })[name],
}
plugin.apply(ctx, { dataDir: resolve(root, 'resources/data'),
  ...(process.argv.includes('--motion-fixture') ? { motionBaseUrl: 'http://127.0.0.1:4399/', allowLocalMotionSource: true } : {}) })
const html = `<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LUMINA isolated interactive verification</title><style>body{margin:0}#app{height:100vh}</style><div id="app"></div><script src="/react.js"></script><script src="/react-dom.js"></script><script>
window.__ModuleLoader__ = {load({factory}) {
  const plugin = factory(name => React);
  const slots = {inject: (name, fn) => fn(), register: (props, Component) => {
    if (Component && props.name === 'main') ReactDOM.createRoot(document.getElementById('app')).render(React.createElement(Component));
  }};
  plugin.apply({get: () => null, slots});
}};
</script><script src="/client.js"></script></html>`
const server = createServer(async (req, res) => {
  try {
    if (pipelineFixture && req.url.startsWith('/lumina-kitchen/media/') && req.method === 'POST') {
      res.statusCode=403; res.setHeader('content-type','application/json'); return res.end(JSON.stringify({error:'隔离预览不调用媒体服务'}))
    }
    if (pipelineFixture && req.url === '/lumina-kitchen/lab' && req.method === 'POST') {
      // Explicit test-only interception: exercise real validation/storage without any model network calls.
      const { runLabAction } = await import('../src/lab.js')
      const { loadKnowledge } = await import('../src/knowledge.js')
      let raw = ''; for await (const chunk of req) raw += chunk
      const records = await loadKnowledge(resolve(root, 'resources/data'))
      const store = new KitchenStore(join(process.env.DSH_HOME, 'lumina-kitchen'))
      const mock = async (ctx, system, user) => {
        const data=JSON.parse(user)
        const result = system.includes('image_prompt:')
          ? {title:'雨夜里的孤独身影',description:`前 ${Math.floor(data.constraints.duration / 2)} 秒缓慢跟拍，最后在站台尽头停住，共 ${data.constraints.duration} 秒。`,image_prompt:'A solitary figure on a rainy platform, negative space, cinematic lighting.',video_prompt:`Track slowly for the first ${Math.floor(data.constraints.duration / 2)} seconds. Come to rest at the edge of the rainy platform. Total duration ${data.constraints.duration} seconds.`,duration_seconds:data.constraints.duration,assumptions:[]}
          : data.knowledge
            ? {items:data.knowledge.slice(0,2).map(item=>({id:item.id,effect:'让环境衬托人物',why:'呼应画面里的孤独感',tradeoff:'人物表情会较小'}))}
            : {understanding:'用空旷站台衬托孤独',queries:['大远景','负空间'],assumptions:[],question:null}
        return {text:JSON.stringify(result),model:'本地模拟模型（不联网）'}
      }
      const saved=await runLabAction(ctx,store,records,JSON.parse(raw),mock)
      res.setHeader('content-type','application/json'); return res.end(JSON.stringify({...saved,canUndo:store.canUndo()}))
    }
    if (req.url.startsWith('/lumina-kitchen')) return handler(req, res)
    if (req.url === '/__tool' && req.method === 'POST') {
      let raw = ''; for await (const chunk of req) raw += chunk
      const {name, args, owner = 'verification-chat'} = JSON.parse(raw)
      const result = await tools.get(name).execute(args, { agent: { id: owner } })
      res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(result))
    }
    const files = { '/react.js': join(modules, 'react/umd/react.development.js'), '/react-dom.js': join(modules, 'react-dom/umd/react-dom.development.js'), '/client.js': join(root, 'dist/client.js') }
    res.setHeader('content-type', files[req.url] ? 'application/javascript' : 'text/html; charset=utf-8')
    res.end(files[req.url] ? await readFile(files[req.url]) : html)
  } catch (error) { res.statusCode = 500; res.end(JSON.stringify({ error: error.message })) }
})
const port = Number(process.env.LUMINA_PREVIEW_PORT) || 4398
server.listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port} · isolated data · ${pipelineFixture ? 'mock model, no network calls' : 'no model configured'}`))

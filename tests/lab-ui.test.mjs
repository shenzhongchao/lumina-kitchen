import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const root = new URL('../', import.meta.url)
const React = {
  createElement: (type, props, ...children) => ({ type, props: { ...props, children: children.flat(Infinity) } }),
  useState: init => [typeof init === 'function' ? init() : init, () => {}], useRef: v => ({ current: v }),
  useEffect: () => {}, useMemo: fn => fn(), useCallback: fn => fn,
}
let source = ''
for (const file of ['lab-input.js', 'taste.js', 'build.js']) source += (await readFile(new URL(`src/${file}`, root), 'utf8')).replace(/^export /gm, '') + '\n'
for (const file of ['00-head.js', '80-workbench.js', '85-guided.js', '10-atlas.js', '87-results.js', '88-create.js']) source += await readFile(new URL(`src/client/${file}`, root), 'utf8')
const { CreationWorkspace, IngredientEditor, UtilityPanel, nextAction, planKey, panelIdeaBoard } = new Function('React', source + '\nreturn {CreationWorkspace, IngredientEditor, UtilityPanel, nextAction, planKey, panelIdeaBoard}')(React)
function expand(node) {
  if (!node || typeof node !== 'object') return node
  if (typeof node.type === 'function') return expand(node.type(node.props))
  return { ...node, props: { ...node.props, children: node.props.children.map(expand) } }
}
function nodes(tree, type) {
  if (!tree || typeof tree !== 'object') return []
  return [...(tree.type === type ? [tree] : []), ...tree.props.children.flatMap(n => nodes(n, type))]
}
function label(node) { return typeof node === 'object' && node ? node.props.children.map(label).join('') : node || '' }
const base = () => ({ idea: '雨夜站台', constraints: { duration: 6 }, ingredients: [] })

function generationView(props) {
  let kind = 'video'
  return () => {
    const useState = React.useState
    React.useState = init => init === 'video' ? [kind, value => { kind = value }] : useState(init)
    try { return expand(CreationWorkspace(props)) }
    finally { React.useState = useState }
  }
}

test('utility drawer closes only for backdrop clicks while idle', () => {
  const backdrop = {}
  let closed = 0
  const props = { title: '生成服务配置', onClose: () => closed++ }
  const drawer = UtilityPanel(props)
  drawer.props.onClick({ target: {}, currentTarget: backdrop })
  assert.equal(closed, 0)
  UtilityPanel({ ...props, busy: true }).props.onClick({ target: backdrop, currentTarget: backdrop })
  assert.equal(closed, 0)
  drawer.props.onClick({ target: backdrop, currentTarget: backdrop })
  assert.equal(closed, 1)
})

test('atlas only enters details after idea and ingredients are ready', () => {
  const board = base()
  board.idea = ' '
  assert.equal(nextAction(board).action, 'idea')
  assert.equal(nextAction(board).disabled, true)
  board.idea = '雨夜站台'
  assert.equal(nextAction(board).action, 'ingredients')
  assert.equal(nextAction(board).disabled, true)
  board.ingredients = [{slug:'x',weight:2}]
  assert.equal(nextAction(board).action, 'detail')
  assert.equal(nextAction(board).label, '进入创作详情')
  board.lab = {comparison:{inputKey:'old', selectedId:'A'}}
  assert.equal(nextAction(board).action, 'detail')
})

test('atlas separates explicit model recommendation from navigation', () => {
  const board = {...base(), constraints:{aspect:'9:16',duration:6}, title:'创作'}
  let action
  const props = { board, analysis:{chosen:[]}, model:{}, onRecommend:()=>{action='compose'}, onNavigate:view=>{action=view} }
  const button = name => nodes(expand(IngredientEditor(props)), 'button').find(b=>label(b)===name)
  assert.equal(button('进入创作详情').props.disabled,true)
  button('生成推荐配料表').props.onClick(); assert.equal(action,'compose')
  props.model=null
  assert.equal(button('生成推荐配料表').props.disabled,true)
  board.ingredients=[{slug:'x',weight:2}]
  assert.ok(!button('进入创作详情').props.disabled)
  button('进入创作详情').props.onClick(); assert.equal(action,'create')
  props.generating=true; assert.equal(button('进入创作详情').props.disabled,true)
})

test('creation details keep generation controls visible and disable them until the plan is current', async () => {
  const board=base(); board.ingredients=[{slug:'x',weight:2}]
  let designs=0, submissions=0
  const props={board,concepts:[],model:{},onDesign:()=>designs++,onGenerate:()=>submissions++,mediaInfo:{image:{configured:true},video:{configured:true}}}
  const render = generationView(props)
  const button = (view, title) => nodes(view, 'button').find(b => label(b) === title)
  const section = (view, title) => nodes(view, 'section').find(n => n.props['aria-label'] === title)
  let view = render()
  assert.ok(section(view, '作品与历史'))
  assert.match(label(view), /第一版作品会出现在这里/)
  assert.ok(!nodes(view, 'details').some(n => n.props['aria-label'] === '调整当前拍法'))
  assert.equal(button(view, '视频生成').props['aria-pressed'], true)
  assert.ok(section(view, '视频生成'))
  assert.ok(!section(view, '图片生成'))
  assert.ok(button(view, '生成视频').props.disabled)
  assert.match(label(view), /先在上方准备拍法/)
  button(view, '准备拍法').props.onClick()
  assert.equal(designs, 1)
  button(view, '图片生成').props.onClick()
  view = render()
  assert.equal(button(view, '图片生成').props['aria-pressed'], true)
  assert.ok(section(view, '图片生成'))
  assert.ok(!section(view, '视频生成'))
  assert.ok(button(view, '生成图片').props.disabled)

  board.lab={comparison:{id:'p',inputKey:planKey(board),selectedId:'A',variants:[{id:'A',title:'拍法',effect:'孤独',imagePrompt:'image',videoPrompt:'video'}]}}
  view = render()
  assert.equal(button(view, '生成图片').props.disabled, false)
  button(view, '视频生成').props.onClick()
  view = render()
  assert.equal(button(view, '生成 6 秒视频').props.disabled, false)
  assert.ok(!button(view, '根据调整更新拍法'))
  board.idea = '新想法'
  view = render()
  assert.match(label(view), /更新拍法后再生成/)
  assert.ok(button(view, '生成视频').props.disabled)
  await button(view, '生成视频').props.onClick()
  button(view, '图片生成').props.onClick()
  view = render()
  assert.ok(button(view, '生成图片').props.disabled)
  await button(view, '生成图片').props.onClick()
  assert.equal(submissions, 0)
})

test('the panel has one idea field and brings legacy requirements into its text', () => {
  const board=panelIdeaBoard({...base(),retained:{subject:'短发人物'},shot:{motion:'固定机位'}})
  const view=expand(IngredientEditor({board,analysis:{chosen:[]}}))
  const idea=nodes(view,'section').find(n=>n.props['aria-labelledby']==='ll-idea-label')
  assert.equal(nodes(view,'textarea').length,1)
  assert.match(nodes(idea,'textarea')[0].props.value,/短发人物/)
  assert.match(nodes(idea,'textarea')[0].props.value,/固定机位/)
  assert.ok(!nodes(idea,'section').some(n=>n.props['aria-label']==='明确要求'))
  assert.ok(!nodes(view,'div').some(n=>n.props['aria-label']==='这次改什么'))
  assert.ok(!label(view).includes('修改哪里'))
})

test('an edited 30-second plan cannot silently submit a 20-second target as 15 seconds', () => {
  const board = { ...base(), constraints: { duration: 20, aspect: '9:16' } }
  board.lab = { comparison: { id: 'p', inputKey: planKey(board), selectedId: 'A', promptSynced: true,
    variants: [{ id: 'A', title: '窄巷跟拍', effect: '连续跟拍30秒', videoPrompt: 'original' }] } }
  const video = { configured: true, minDuration: 4, maxDuration: 15 }
  const render = () => expand(CreationWorkspace({ board, concepts: [], mediaInfo: { video } }))
  let view = render()
  assert.equal(nodes(view, 'button').find(b => label(b) === '生成视频').props.disabled, true)
  assert.ok(nodes(view, 'button').some(b => label(b) === '去调整时长'))
  assert.ok(nodes(view, 'button').some(b => label(b) === '改时长' && !b.props['aria-expanded']))
  assert.equal(nodes(view, 'select').filter(s => s.props.id === 'lp-new-duration' || s.props.id === 'll-planning-duration').length, 0)
  assert.ok(nodes(view, 'details').some(n => label(n).includes('原始拍法说明') && label(n).includes('连续跟拍30秒')))
  video.maxDuration = 30
  view = render()
  assert.equal(nodes(view, 'button').find(b => label(b) === '生成 20 秒视频').props.disabled, false)
  assert.match(label(view), /下次生成 · 20 秒/)
})

test('the planning page can choose a service-supported duration only before a shot is prepared', () => {
  const board = base()
  const render = () => expand(IngredientEditor({ board, analysis: { chosen: [] }, videoInfo: { maxDuration: 15 } }))
  const field = nodes(render(), 'select').find(s => s.props.id === 'll-planning-duration')
  assert.equal(field.props.value, 6)
  assert.equal(nodes(field, 'option').some(o => o.props.value === 20), false)
  board.lab = { comparison: { id: 'prepared' } }
  assert.equal(nodes(render(), 'select').some(s => s.props.id === 'll-planning-duration'), false)
})

test('a version offers continue and file access but no saved-look entry', () => {
  const board=base(); board.ingredients=[{slug:'x',weight:2}]
  board.lab={runs:[{id:'r1',kind:'image',planId:'p',variantId:'A',status:'succeeded',asset:{file:`${'a'.repeat(64)}.png`},prompt:'p'}]}
  const view=expand(CreationWorkspace({board,concepts:[],model:{}}))
  const names=nodes(view,'button').map(label).concat(nodes(view,'a').map(n=>n.props.children?.map(label).join('')||''))
  assert.ok(names.includes('从这一版继续'))
  assert.ok(!names.some(name=>/收藏/.test(name)))
})

test('generation controls do not duplicate image/video results or historical prompts', () => {
  const board=base()
  board.lab={comparison:{id:'p',inputKey:planKey(board),selectedId:'A',variants:[{id:'A',title:'拍法',imagePrompt:'image',videoPrompt:'video'}]},runs:['image','video'].map((kind,index)=>({id:kind,kind,planId:'p',variantId:'A',status:'succeeded',asset:{file:`${String(index+1).repeat(64)}.${kind==='image'?'png':'mp4'}`},prompt:`historical ${kind}`}))}
  const render = generationView({ board, concepts: [], model: {}, mediaInfo: { image: { configured: true }, video: { configured: true } } })
  let view = render()
  const controls = () => nodes(view, 'section').find(n => n.props['aria-label'] === '生成作品')
  assert.match(label(controls()), /重新生成视频/)
  nodes(view, 'button').find(b => label(b) === '图片生成').props.onClick()
  view = render()
  assert.equal(nodes(controls(), 'img').length, 0)
  assert.equal(nodes(controls(), 'video').length, 0)
  assert.equal(nodes(controls(), 'pre').length, 0)
  assert.match(label(controls()), /已完成/)
  assert.match(label(controls()), /重新生成图片/)
  assert.doesNotMatch(label(controls()), /重新生成视频/)
  assert.ok(nodes(view, 'section').some(n => n.props['aria-label'] === '作品与历史'))
})

const ONBOARDING_CSS = `
.lo-start{flex:1;min-height:0;overflow:auto;padding:clamp(28px,5vw,64px) clamp(20px,4vw,48px) 64px;
  animation:lk-rise .42s var(--ease);background:
    radial-gradient(90% 60% at 8% 0%,#fbf8f0 0%,transparent 55%),
    radial-gradient(70% 50% at 100% 0%,#f7efe6 0%,transparent 60%)}
.lo-wrap{max-width:780px;margin:0 auto}
.lo-start h2{font-size:clamp(32px,4.4vw,52px);line-height:1.08;letter-spacing:-.035em;margin:12px 0 14px;max-width:16ch}
.lo-lead{max-width:54ch;margin:0 0 26px;font-size:13.5px;line-height:1.85;color:var(--muted)}
.lo-card{padding:18px;border:1px solid var(--rule);border-radius:var(--r-lg);background:var(--card);
  box-shadow:var(--shadow-1)}
.lo-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.lo-card-head .lk-label{margin:0}
.lo-start textarea{width:100%;min-height:150px;padding:14px 15px;border:1px solid var(--rule-2);
  border-radius:var(--r-md);resize:vertical;background:var(--paper-2);color:var(--ink);
  font:inherit;font-size:14px;line-height:1.85;transition:border-color var(--fast),box-shadow var(--fast)}
.lo-start textarea:focus{outline:none;border-color:var(--ink);box-shadow:0 0 0 3px #1a1d1b14}
.lo-examples{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.lo-examples button{display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:0 10px;
  border:1px dashed var(--rule-2);border-radius:999px;color:var(--muted);font-size:11.5px;
  transition:border-color var(--fast),color var(--fast),background var(--fast)}
.lo-examples button:hover,.lo-examples button[aria-pressed="true"]{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
.lo-actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px}
.lo-actions .lk-primary{min-height:46px;padding:0 20px}
.lo-meta{font:10px/1.5 var(--mono);letter-spacing:.08em;color:var(--faint)}
.lo-cost{font-size:11px;line-height:1.65;color:var(--faint);margin:12px 0 0}@container(max-width:720px){
  .lo-start{padding:24px 16px 48px}
  .lo-start h2{font-size:32px;max-width:none;text-wrap:balance}
}@container(max-width:460px){
  .lo-start h2{font-size:30px}
  .lo-actions{align-items:flex-start;flex-direction:column}
  .lo-actions .lk-primary{width:100%}
  .lo-actions .lk-btn{min-height:44px}
  .lo-examples button{min-height:44px}
}@media(prefers-reduced-motion:reduce){.lo-start{animation:none!important}}
`
function firstView(board) {
  return board?.lab?.comparison || board?.lab?.runs?.length || board?.lineage ? 'create' : 'atlas'
}
function textCallPurpose(action) {
  return { compose: '生成推荐配料表', design: '准备一种拍法', recommend: '获取摄影配料建议', compare: '设计两种文字拍法', edit: '提出一项文字修改建议' }[action] || '调用文字模型'
}
function textCallMessage(board, model, action) {
  if (board.demo) throw new Error('入门练习不调用模型。请新建自己的实验后再使用生成。')
  const purpose = textCallPurpose(action)
  return `${purpose}？\n将调用 DSH 文字模型：${model?.label || '当前默认模型'}。\n会发送当前想法与摄影条件；不会生成图片或视频。\n费用未知，按 DSH 模型服务计费；一次操作可能包含多次模型请求。取消不会发起请求。`
}
function confirmTextCall(board, model, action) {
  return window.confirm(textCallMessage(board, model, action))
}
function textCallOptions(board, model, action, duration = targetVideoDuration(board)) {
  const retiming = action === 'retime'
  const purpose = textCallPurpose(action)
  const output = retiming ? '更新后的拍法和视频提示词' : action === 'design' ? '一种拍法和对应的生成提示词' : action === 'compare' ? '两种可比较的文字拍法' : action === 'compose' ? '可编辑的推荐配料表，保留已有配料' : action === 'recommend' ? '一组摄影配料建议与理由' : '一项画面字段的修改建议'
  const title = retiming ? `按 ${duration} 秒更新拍法` : action === 'design' ? `准备 ${duration} 秒拍法` : purpose
  const nativeText = textCallMessage(board, model, action === 'retime' ? 'design' : action)
  return {
    tone: 'cost',
    icon: 'sparkle',
    eyebrow: 'MODEL CALL',
    title: `${title}？`,
    message: retiming ? '会发送当前想法、摄影条件与适用的原拍法，按新时长重排镜头节奏。已有作品保留，本次不会生成图片或视频。' : action === 'compose' ? '根据想法把推荐概念加入配料表，已有配料不删除。不会生成图片或视频。' : '会发送当前想法、保留条件和已选配料；不会生成图片或视频。',
    facts: [
      ['模型', model?.label || 'DSH 当前默认模型'],
      ['产物', output],
      ['费用', '未知，按 DSH 模型服务计费', true],
      ['数据', '当前想法与摄影条件'],
    ],
    note: '一次操作可能包含多次模型请求；取消不会发起请求。',
    confirmLabel: retiming ? '确认更新拍法' : '确认调用',
    nativeText: retiming || action === 'design' ? `${title}？\n${nativeText.split('\n').slice(1).join('\n')}${retiming ? '\n更新成功后才会保存新时长，已有作品保留。' : ''}` : nativeText,
  }
}
const START_EXAMPLES = [
  ['雨夜站台', '雨夜站台，一个人等车。让环境显得空旷，人物显得孤独。'],
  ['香水静物', '一瓶香水放在桌面上，希望画面简洁、精致，突出玻璃质感。'],
  ['巷道追逐', '一个人在狭窄巷道里奔跑，希望观众感到追逐的紧张。'],
]
function StartWorkspace({ board, busy, onStart, onSkip, onDirty }) {
  const [idea, setIdea] = React.useState(board.idea || '')
  const dirty = idea !== (board.idea || '')
  React.useEffect(() => { onDirty?.(dirty); return () => onDirty?.(false) }, [dirty])
  React.useEffect(() => {
    if (!dirty) return
    const leave = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', leave)
    return () => window.removeEventListener('beforeunload', leave)
  }, [dirty])
  return h('section', { className: 'lo-start', 'aria-label': '开始使用' },
    h('div', { className: 'lo-wrap' },
      h('span', { className: 'lk-kicker' }, 'FIRST TAKE · 第一步'),
      h('h2', null, '你想拍一个怎样的镜头？'),
      h('p', { className: 'lo-lead' }, '写下想法，准备拍法，再生成图片或视频。'),
      h('form', { className: 'lo-card', onSubmit: e => { e.preventDefault(); onStart(idea) } },
        h('div', { className: 'lo-card-head' },
          h('label', { className: 'lk-label', htmlFor: 'lo-idea' }, '人物 · 场景 · 想要的感觉'),
          h('span', { className: 'lk-counter' }, `${idea.length} / 1000`)),
        h('textarea', {
          id: 'lo-idea', value: idea, maxLength: 1000, required: true, disabled: busy,
          placeholder: '例如：一个人在雨夜站台等车，希望观众感到孤独。',
          onChange: e => setIdea(e.target.value),
        }),
        h('div', { className: 'lo-examples', role: 'group', 'aria-label': '填入想法示例' }, START_EXAMPLES.map(([label, text]) => h('button', {
          key: label, type: 'button', disabled: busy,
          title: '填入示例，可继续修改',
          onClick: () => { setIdea(text); document.getElementById('lo-idea')?.focus() },
        }, h(Icon, { name: 'pencil', size: 13 }), label))),
        h('div', { className: 'lo-actions' },
          h(Btn, { variant: 'primary', type: 'submit', disabled: busy || !idea.trim(), icon: 'arrow' }, '开始创作'),
          h('span', { className: 'lo-meta' }, '只保存在本机 · 不调用模型'))),
      h('div', { className: 'lo-actions' }, h(Btn, { onClick: onSkip, disabled: busy, icon: 'layers' }, '先浏览摄影图谱'))))
}

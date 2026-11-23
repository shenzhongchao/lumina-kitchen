const RESULTS_CSS = `
.ll-panel .ll-success{color:var(--ok)}
.ll-panel[data-results="true"] .ll-layout{grid-template-columns:minmax(0,1fr)}
.ll-panel[data-results="true"] .ll-mobile{display:none}
.lr-workspace{flex:1;min-height:0;overflow:auto;padding:24px 32px 80px;line-height:1.7;
  animation:lk-rise .34s var(--ease)}
.lr-head{max-width:980px;margin-bottom:14px}
.lr-workspace h2{font-size:clamp(26px,2.4vw,34px);line-height:1.14;letter-spacing:-.03em;margin:9px 0 8px}
.lr-workspace h3{font-size:19px;line-height:1.35;margin:0 0 6px}
.lr-workspace p{margin:6px 0 12px;max-width:78ch;font-size:13px;line-height:1.75;color:var(--ink-2)}
.lr-muted{color:var(--muted)}
.lr-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:14px 0 18px}
.lr-seg{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--rule);border-radius:999px;background:var(--paper-2)}
.lr-seg button{min-height:32px;padding:0 14px;border-radius:999px;font-size:12px;color:var(--muted);
  transition:background var(--fast),color var(--fast)}
.lr-seg button:hover{color:var(--ink)}
.lr-seg button[aria-pressed="true"]{background:var(--ink);color:var(--paper-2)}
.lr-pair,.lr-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.lr-pair>article,.lr-fields>label{min-width:0}
.lr-slot-caption .lk-label{margin:0}
.lr-frame{position:relative;display:grid;place-items:center;width:100%;height:clamp(250px,36vh,390px);
  border:1px solid #ffffff12;border-radius:var(--r-md);overflow:hidden;color:var(--stage-muted);
  background:radial-gradient(110% 90% at 50% 8%,#232825 0%,#0e1110 76%);font-size:12px;line-height:1.6}
/* Keep portrait media inside the preview: intrinsic image height must not grow the grid row. */
.lr-frame:not(.lr-muted){grid-template: minmax(0,1fr) / minmax(0,1fr)}
.lr-frame>:is(button,a,video){min-width:0;min-height:0;max-width:100%;max-height:100%}
.lr-frame :is(img,video){display:block;width:100%;height:100%;min-width:0;min-height:0;object-fit:contain}
.lr-frame video{background:#000}
.lr-contact-head .lk-kicker{color:var(--accent)}
.lr-frame-open{position:relative;display:block;width:100%;height:100%;padding:0;border:0;background:none;cursor:zoom-in}
.lr-frame-open img{width:100%;height:100%;object-fit:contain}
.lr-frame-hint{position:absolute;right:8px;bottom:8px;display:inline-flex;align-items:center;gap:4px;
  padding:4px 8px;border-radius:999px;background:#0c0f0ecc;color:#efe9dc;font:10px/1 var(--mono);
  opacity:0;transition:opacity var(--fast)}
.lr-frame-open:hover .lr-frame-hint,.lr-frame-open:focus-visible .lr-frame-hint{opacity:1}

/* full-screen media inspection */
.lk-lightbox{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:12px;padding:24px;background:#0a0c0bd9;backdrop-filter:blur(11px);animation:lk-fade .18s ease}
.lk-lightbox-stage{display:grid;place-items:center;max-width:92vw;max-height:80vh;overflow:auto}
.lk-lightbox-media{display:block;max-width:92vw;max-height:80vh;object-fit:contain;background:#000;
  transition:transform .18s var(--ease)}
.lk-lightbox-bar{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:999px;
  background:#181c1acc;border:1px solid #ffffff1f;color:#efe9dc;backdrop-filter:blur(8px)}
.lk-lightbox-meta{display:flex;flex-direction:column;gap:1px;min-width:0;padding:0 8px;
  font:10px/1.4 var(--mono);color:#a9aea7}
.lk-lightbox-meta strong{font:500 11.5px/1.3 var(--sans);color:#efe9dc}
.lk-lightbox .lk-iconbtn{width:36px;height:36px;color:#efe9dc}
.lk-lightbox .lk-iconbtn:hover{background:#ffffff1a;color:#fff}@media(max-width:620px){
  .lk-lightbox{padding:12px;padding-bottom:calc(12px + env(safe-area-inset-bottom))}
  .lk-lightbox-bar{width:100%;justify-content:space-between}
  .lk-lightbox .lk-iconbtn{width:44px;height:44px}
}
.lr-frame.lr-muted{padding:24px;text-align:center;color:#9aa19a}
.lr-workspace label{display:flex;flex-direction:column;gap:6px;font:500 10px/1.4 var(--mono);
  letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}
.lr-workspace :is(select,input,textarea){width:100%;min-height:42px;padding:9px 11px;border:1px solid var(--rule-2);
  border-radius:var(--r-md);background:var(--card);color:var(--ink);
  font:400 13px/1.65 var(--sans);letter-spacing:0;text-transform:none;
  transition:border-color var(--fast),box-shadow var(--fast)}
.lr-workspace :is(select,input,textarea):focus{outline:none;border-color:var(--ink);box-shadow:0 0 0 3px #1a1d1b14}
.lr-workspace textarea{resize:vertical;min-height:88px;line-height:1.7}
.lr-actions .lk-primary{min-height:44px;padding:0 20px}
.lr-error{color:var(--danger)!important}
.lr-workspace :is(a,button,input,textarea,select,summary):focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.lr-workspace ::selection{background:#e7c2b6;color:#41160d}
.lr-outcome-chip{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:999px;
  border:1px solid var(--rule);font:10px/1.5 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.lr-outcome-chip[data-outcome="achieved"]{border-color:#c9ddd0;background:var(--ok-soft);color:#1f4c37}
.lr-outcome-chip[data-outcome="partial"]{border-color:#e1cfa8;background:var(--warn-soft);color:#5c3c0c}
.lr-recipe .lr-frame{height:100%;min-height:190px}
.lr-empty-note{display:flex;align-items:flex-start;gap:12px;max-width:760px;padding:18px;border:1px dashed var(--rule-2);
  border-radius:var(--r-lg);background:#fffdf880;color:var(--muted);font-size:12.5px;line-height:1.7}
.lr-empty-note .lk-icon{color:var(--accent);flex:none;margin-top:2px}

/* experiment manager */
.lr-workspace label.lr-searchbox{display:flex;flex-direction:row;align-items:center;gap:8px;max-width:340px;
  min-width:200px;flex:1;height:40px;padding:0 12px;border:1px solid var(--rule-2);border-radius:999px;
  background:var(--card);box-shadow:var(--shadow-1);font:400 12.5px/1.4 var(--sans);letter-spacing:0;text-transform:none}
.lr-workspace label.lr-searchbox:focus-within{border-color:var(--ink);box-shadow:0 0 0 3px #1a1d1b14}
.lr-searchbox .lk-icon{color:var(--muted);flex:none}
.lr-workspace label.lr-searchbox input{flex:1;width:100%;height:100%;min-height:0;padding:0;border:0;
  background:none;box-shadow:none;font-size:12.5px}
.lr-workspace label.lr-searchbox input:focus{outline:none;box-shadow:none}
.lr-list{display:flex;flex-direction:column;gap:10px;margin-top:6px;max-width:1120px}
.lr-exp{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;padding:16px 18px;
  border:1px solid var(--rule);border-radius:var(--r-lg);background:var(--card);box-shadow:var(--shadow-1);
  transition:border-color var(--fast),transform var(--med) var(--ease),box-shadow var(--med) var(--ease)}
.lr-exp:hover{border-color:var(--rule-2);transform:translateY(-1px)}
.lr-exp[data-active="true"]{border-color:var(--accent-line);box-shadow:0 0 0 1px var(--accent-line),0 18px 32px -30px #a83e2b66}
.lr-exp-main{min-width:0}
.lr-exp-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;
  font:10px/1.5 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.lr-status{display:inline-flex;align-items:center;gap:5px;padding:3px 7px;border:1px solid var(--rule);
  border-radius:999px;font:10px/1.3 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.lr-status[data-status="result"],.lr-status[data-status="reviewed"]{border-color:#c9ddd0;background:var(--ok-soft);color:#1f4c37}
.lr-status[data-status="drafting"]{border-color:#e1cfa8;background:var(--warn-soft);color:#5c3c0c}
.lr-exp h3{font-size:20px;line-height:1.32;margin:0 0 4px;letter-spacing:-.015em}
.lr-exp p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  margin:0;font-size:12.5px;line-height:1.65;color:var(--muted)}
.lr-exp-actions{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:12px}
.lr-exp-actions .lk-btn{min-height:32px}
.lr-exp-actions .lk-primary{min-height:32px;padding:0 12px;font-size:12px}
.lr-exp-side{display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:10px;padding-top:2px}
.lr-exp-index{font:400 32px/1 var(--serif);letter-spacing:-.04em;color:#1a1d1b12}
.lr-exp-side .lk-icon{color:var(--rule-2)}@container(max-width:1180px){.lr-workspace{padding:20px 24px 72px}}@container(max-width:980px){
  .lr-pair{grid-template-columns:1fr}
  .lr-frame{height:clamp(230px,42vh,360px)}
}@container(max-width:860px){
  .lr-workspace{padding:18px 16px 64px}
  .lr-recipe .lr-frame{height:230px;min-height:0}
}@container(max-width:620px){
  .lr-workspace{padding:16px}
  .lr-frame{height:230px}
  .lr-actions .lk-primary{width:100%}
  .lr-seg button{min-height:40px}
  .lr-actions .lk-btn{min-height:44px}
}

/* Keep the observation beside the images, with a single reading order on narrow panels. */
.lr-results .lr-head{margin-bottom:12px}
.lr-results .lr-head h2{margin-top:0}
.lr-results .lr-head p{max-width:90ch;overflow-wrap:anywhere}
.lr-results .lr-frame{height:clamp(230px,32vh,380px)}
.lr-results .lk-label{font-size:12px;letter-spacing:0}
.lr-results .lr-message .lk-btn{margin-top:8px}
.lr-results .lr-contact-head .lr-seg button{min-height:40px}@container(max-width:620px){
  .lr-results .lr-pair{grid-template-columns:1fr;gap:14px}
  .lr-results .lr-frame{height:250px}
  .lr-results .lr-toolbar{position:sticky;top:-16px;z-index:2;background:var(--paper);padding:8px 0;margin:0 0 12px;border-bottom:1px solid var(--rule)}
  .lr-results .lr-toolbar .lk-btn,.lr-results .lr-seg button{min-height:44px}
  .lr-results .lr-contact-head .lr-seg{width:100%;justify-content:center}
}
.lr-recipes .lr-head h2{margin-top:0}
.lr-recipe-preview .lr-frame{height:240px}@container(max-width:720px){
  .lr-recipe-entry .lr-actions .lk-btn{min-height:44px}
  .lr-recipe-entry .lr-actions .lk-primary{width:100%}
  .lr-recipe-preview .lr-frame{height:200px}
}@media(prefers-reduced-motion:reduce){.lr-workspace{animation:none!important}}
`
function resultLabel(run) {
  return `${run.variantId || '结果'} · ${run.source?.variant?.title || run.model || '历史生成'} · ${new Date(run.createdAt).toLocaleString('zh-CN')} · ${run.id.slice(-5)}`
}
function canReuseResult(board, run) {
  return Boolean(run?.source || (run && board.lab?.comparison?.id === run.planId && isCurrentPlan(board.lab.comparison, board)))
}
function ResultMedia({ run, videoRef, onOpen }) {
  const [failed, setFailed] = React.useState(false)
  const src = assetSrc(run?.asset) || run?.remoteUrl
  React.useEffect(() => setFailed(false), [src])
  if (!run) return h('div', { className: 'lr-frame lr-muted' }, h(Icon, { name: 'image', size: 24 }), h('span', null, '选择一个已生成的结果'))
  if (!src || failed) return h('div', { className: 'lr-frame lr-muted', role: 'status' }, h(Icon, { name: 'alert', size: 22 }), h('span', null, '媒体无法读取。请检查本机文件，远程链接可能已过期。'))
  return h('div', { className: 'lr-frame' }, run.kind === 'video'
    ? h('video', { ref: videoRef, src, controls: true, playsInline: true, preload: 'metadata', onError: () => setFailed(true), 'aria-label': resultLabel(run) })
    : onOpen
      ? h('button', { type: 'button', className: 'lr-frame-open', onClick: () => onOpen(run), 'aria-label': `放大查看 ${resultLabel(run)}` },
        h('img', { src, alt: resultLabel(run), onError: () => setFailed(true) }),
        h('span', { className: 'lr-frame-hint' }, h(Icon, { name: 'search', size: 12 }), '放大'))
      : h('a', { href: src, target: '_blank', rel: 'noreferrer', title: '打开完整图片', style: { width: '100%', height: '100%', display: 'block' } }, h('img', { src, alt: resultLabel(run), onError: () => setFailed(true) })))
}

function Lightbox({ run, onClose, onPrev, onNext }) {
  const container = React.useRef(null)
  const previous = React.useRef(null)
  const actions = React.useRef({})
  actions.current = { onClose, onPrev, onNext }
  const [zoom, setZoom] = React.useState(1)
  const src = assetSrc(run?.asset) || run?.remoteUrl
  const isVideo = run?.kind === 'video'
  React.useEffect(() => {
    previous.current = document.activeElement
    container.current?.focus()
    const keys = event => {
      const act = actions.current
      if (event.key === 'Escape') { event.preventDefault(); act.onClose?.() }
      else if (event.key === 'ArrowLeft' && act.onPrev) { event.preventDefault(); act.onPrev() }
      else if (event.key === 'ArrowRight' && act.onNext) { event.preventDefault(); act.onNext() }
      else if ((event.key === '+' || event.key === '=') && !isVideo) { event.preventDefault(); setZoom(value => Math.min(3, value + .5)) }
      else if (event.key === '-' && !isVideo) { event.preventDefault(); setZoom(value => Math.max(1, value - .5)) }
      else if (event.key === 'Tab') {
        const controls = [...(container.current?.querySelectorAll('button:not(:disabled)') || [])]
        if (!controls.length) return
        const first = controls[0], last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', keys, true)
    return () => {
      window.removeEventListener('keydown', keys, true)
      if (previous.current && document.contains(previous.current)) previous.current.focus?.()
    }
  }, [isVideo])
  React.useEffect(() => setZoom(1), [run?.id])
  if (!run || !src) return null
  return h('div', {
    className: 'lk-lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': resultLabel(run),
    tabIndex: -1, ref: container, onClick: onClose,
  },
  h('div', { className: 'lk-lightbox-stage', onClick: event => event.stopPropagation() },
    isVideo
      ? h('video', { className: 'lk-lightbox-media', src, controls: true, autoPlay: true, playsInline: true })
      : h('img', { className: 'lk-lightbox-media', src, alt: resultLabel(run), style: { transform: `scale(${zoom})` } })),
  h('div', { className: 'lk-lightbox-bar', onClick: event => event.stopPropagation() },
    onPrev ? h('button', { type: 'button', className: 'lk-iconbtn', onClick: onPrev, 'aria-label': '上一个结果' }, h(Icon, { name: 'back', size: 17 })) : null,
    h('div', { className: 'lk-lightbox-meta' },
      h('strong', null, `${run.variantId || '结果'} · ${isVideo ? '视频' : '图片'}`),
      h('span', null, resultLabel(run))),
    onNext ? h('button', { type: 'button', className: 'lk-iconbtn', onClick: onNext, 'aria-label': '下一个结果' }, h(Icon, { name: 'arrow', size: 17 })) : null,
    !isVideo ? h('button', { type: 'button', className: 'lk-iconbtn', onClick: () => setZoom(value => value >= 2 ? 1 : value + .5), 'aria-label': zoom > 1 ? '重置缩放' : '放大' }, h(Icon, { name: 'search', size: 17 })) : null,
    h('button', { type: 'button', className: 'lk-iconbtn', onClick: onClose, 'aria-label': '关闭' }, h(Icon, { name: 'close', size: 17 }))))
}
function recipeConditions(recipe, concepts = []) {
  const source = recipe.source || {}, shot = { ...source.shot }
  const field = source.plan?.variableField
  if (field && !source.retained?.[field] && source.variant?.change) shot[field] = source.variant.change
  const fields = value => Object.entries(value || {}).filter(([,v]) => v).map(([k,v]) => `${SHOT_FIELDS[k] || k}：${v}`).join('；')
  const ingredients = (source.ingredients || []).map(i => `${concepts.find(c => (c.id || c.slug) === i.slug)?.cn || i.name || i.slug}${i.weight ? `（影响程度 ${i.weight}）` : ''}`).join('、')
  const constraints = source.constraints || {}, request = recipe.result?.request || {}
  return [
    ['原始想法', source.idea], ['保留条件', fields(source.retained)], ['画面处理', fields(shot)], ['摄影配料', ingredients],
    ['创作设置', [constraints.aspect && `画幅 ${constraints.aspect}`, constraints.duration && `视频 ${constraints.duration} 秒`, constraints.mood && `情绪 ${constraints.mood}`].filter(Boolean).join(' · ')],
    ['这次生成', [recipe.result?.model, request.size, request.ratio && `画幅 ${request.ratio}`, request.duration && `${request.duration} 秒`, request.quality && `质量 ${{auto:'自动',low:'低',medium:'中',high:'高'}[request.quality] || request.quality}`].filter(Boolean).join(' · ')],
  ].filter(([, value]) => value)
}

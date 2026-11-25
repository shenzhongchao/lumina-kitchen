// 创作台的工作区外壳与品牌标识。
const SHELL_CSS = `
.lumina-shell{height:100%;display:flex;flex-direction:column;min-height:0;overflow:hidden;
  background:var(--paper);color:var(--ink);font-family:var(--sans);color-scheme:light}
.lm-identity{display:flex;align-items:center;gap:14px;min-width:0}
.lm-brand{display:flex;align-items:center;gap:9px;min-width:0}
.lm-word{padding-left:.04em;font:500 14px/1 var(--serif);letter-spacing:.18em;color:var(--ink)}
.lm-sub{font:500 10.5px/1 var(--mono);letter-spacing:.22em;color:var(--muted);white-space:nowrap}
.lumina-surface{flex:1;min-height:0;overflow:hidden}
.lumina-surface>.lk-root{height:100%}@media(max-width:640px){.lm-word{font-size:12.5px;letter-spacing:.12em}}
`
function WorkspaceIdentity() {
  return h('div', { className: 'lm-identity' },
    h('div', { className: 'lm-brand' }, h(BrandMark, { size: 20 }), h('span', { className: 'lm-word' }, '光影厨房')),
    h('span', { className: 'lm-sub' }, 'LUMINA'))
}
function LuminaPage() {
  return h('div', { className: 'lumina-shell' }, h('style', null, SHELL_CSS + DARK_CSS),
    h('div', { className: 'lumina-surface' }, h(KitchenPage)))
}

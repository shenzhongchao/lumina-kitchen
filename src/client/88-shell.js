// 创作台的工作区外壳与品牌标识。
const SHELL_CSS = `
.lumina-shell{height:100%;display:flex;flex-direction:column;min-height:0;overflow:hidden;
  background:var(--paper);color:var(--ink);font-family:var(--sans);color-scheme:light}
.lm-identity{display:flex;align-items:center;gap:14px;min-width:0}
.lm-brand{display:flex;align-items:center;gap:9px;min-width:0}
.lm-word{padding-left:.08em;font:400 12.5px/1 var(--serif);letter-spacing:.44em;color:var(--ink)}
.lm-sub{font-size:12px;color:var(--muted);white-space:nowrap}
.lumina-surface{flex:1;min-height:0;overflow:hidden}
.lumina-surface>.lk-root{height:100%}@media(max-width:640px){.lm-word{font-size:11px;letter-spacing:.32em}}
`
function WorkspaceIdentity() {
  return h('div', { className: 'lm-identity' },
    h('div', { className: 'lm-brand' }, h(BrandMark, { size: 20 }), h('span', { className: 'lm-word' }, 'LUMINA')),
    h('span', { className: 'lm-sub' }, '创作台'))
}
function LuminaPage() {
  return h('div', { className: 'lumina-shell' }, h('style', null, SHELL_CSS + DARK_CSS),
    h('div', { className: 'lumina-surface' }, h(KitchenPage)))
}

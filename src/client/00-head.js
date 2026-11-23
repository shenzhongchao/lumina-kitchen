// 常量、文案、样式与小组件。构建时被拼进 client bundle 的同一个工厂作用域。
const ID = '@local/lumina-kitchen'
const BASE = '/lumina-kitchen'

const LANGS = {
  zh: {
    'pane.tree': '目录',
    'pane.atlas': '图谱',
    'atlas.label': 'KNOWLEDGE ATLAS',
    'atlas.scale': '{d} 个维度 / {t} 个主题',
    'atlas.dim.scale': '{t} 个主题 · {n} 条概念记录',
    'atlas.search': '搜索概念、标签、英文…',
    'atlas.search.hit': '搜索「{q}」',
    'atlas.search.none': '没有匹配的概念',
    'atlas.search.count': '{n} 条匹配',
    'atlas.records': '{n} 条概念',
    'atlas.group.count': '{n} 条',
    'card.add': '＋ 加入配料表',
    'card.added': '✓ 已在配料表',
    'tray.title': '配料表',
    'tray.stat': '{n} 味 · {d} 维',
    'tray.empty': '还没挑料 — 在中间点「＋」',
    'tray.missing': '还缺',
    'tray.undo': '撤销',
    'tray.clear': '清空',
    'tray.open': '出菜',
    'tray.hint': '4–6 味比较稳',
    'weight.3': '主导',
    'weight.2': '辅助',
    'weight.1': '点缀',
    'atlas.density.line': '密',
    'atlas.density.card': '疏',
    'atlas.density': '浏览密度',
    'dim.framing': '构图',
    'dim.lighting': '光影',
    'dim.color': '色彩',
    'dim.optics': '光学',
    'dim.texture': '材质',
    'dim.motion': '运镜',
    'dim.style': '风格',
    'stove.idea': '视频想法',
    'idea.label': '想法',
    'stove.idea.placeholder': '例如：雨夜，一个送信的人在霓虹城市里找一扇门。',
    'stove.platform': '平台',
    'stove.duration': '时长',
    'stove.pacing': '火候',
    'stove.pacing.slow': '慢',
    'stove.pacing.fast': '快',
    'stove.fire': '开火 · 写菜谱',
    'stove.firing': '正在出菜…',
    'stove.model': '{model}',
    'stove.nomodel': '没有可用模型',
    'stove.need.idea': '先写一句想法',
    'stove.need.ingredients': '先挑几味',
    'serve.back': '← 回图谱',
    'serve.shots': '分镜表',
    'serve.style': '全局风格',
    'serve.negative': '负面词',
    'serve.target': '目标模型',
    'serve.copy': '复制',
    'serve.copied': '已复制',
    'serve.image': '图像提示词',
    'serve.video': '视频提示词',
    'serve.used': '本镜用到',
    'serve.words': '{n} 词',
    'serve.risk': '本片 {s}/{t} 镜是静止画面，更像幻灯片',
    'serve.synergy': '为什么这样配',
    'serve.master': '风格锚点',
    'serve.light': '光位与色板',
    'serve.texture': '质感',
    'serve.negative.hint': '来自所选概念的常见误区，反向写进负面词。',
    'serve.degraded': '没有拿到模型结果：{reason}',
    'serve.regenerate': '重新生成',
    'serve.empty': '还没有镜头方案',
    'serve.empty.hint': '在右侧写下想法、加入配料，再点击“生成镜头方案”。',
    'serve.empty.fire': '浏览摄影图谱',
    'detail.def': '定义',
    'detail.syntax': '提示语原句',
    'detail.case': '示例',
    'detail.wrong': '常见误区',
    'detail.combo': '常这样搭',
    'detail.variants': '变体',
    'detail.tags': '风味',
    'detail.add': '加入配料表',
    'detail.remove': '已在配料表',
    'detail.close': '关闭',
    'error.title': '加载图谱失败',
    'error.retry': '重试',
    'error.dataDir': '数据目录',
    'error.hint': '确认这个路径下有 taxonomy.json 与 index.json；也可以在插件配置里设置 dataDir，或用环境变量 LUMINA_KITCHEN_DATA 指定。',
    'loading': '正在读取图谱…',
  },
  en: {
    'pane.tree': 'Contents',
    'pane.atlas': 'Atlas',
    'atlas.label': 'KNOWLEDGE ATLAS',
    'atlas.scale': '{d} dimensions / {t} topics',
    'atlas.dim.scale': '{t} topics · {n} records',
    'atlas.search': 'Search concepts, tags, English…',
    'atlas.search.hit': 'Results for “{q}”',
    'atlas.search.none': 'No matching concept',
    'atlas.search.count': '{n} matches',
    'atlas.records': '{n} concepts',
    'atlas.group.count': '{n}',
    'card.add': '+ Add',
    'card.added': '✓ Added',
    'tray.title': 'Ingredients',
    'tray.stat': '{n} · {d} dims',
    'tray.empty': 'Nothing picked yet — press + in the atlas',
    'tray.missing': 'Missing',
    'tray.undo': 'Undo',
    'tray.clear': 'Clear',
    'tray.open': 'Plate',
    'tray.hint': '4–6 works well',
    'weight.3': 'Lead',
    'weight.2': 'One part',
    'weight.1': 'A pinch',
    'atlas.density.line': 'List',
    'atlas.density.card': 'Cards',
    'atlas.density': 'Density',
    'dim.framing': 'Framing',
    'dim.lighting': 'Lighting',
    'dim.color': 'Color',
    'dim.optics': 'Optics',
    'dim.texture': 'Texture',
    'dim.motion': 'Motion',
    'dim.style': 'Style',
    'stove.idea': 'Idea',
    'idea.label': 'Idea',
    'stove.idea.placeholder': 'e.g. A courier looks for a door in a neon city on a rainy night.',
    'stove.platform': 'Platform',
    'stove.duration': 'Duration',
    'stove.pacing': 'Heat',
    'stove.pacing.slow': 'slow',
    'stove.pacing.fast': 'fast',
    'stove.fire': 'Cook · write the recipe',
    'stove.firing': 'Cooking…',
    'stove.model': '{model}',
    'stove.nomodel': 'No model',
    'stove.need.idea': 'Write the idea first',
    'stove.need.ingredients': 'Pick some ingredients',
    'serve.back': '← Back to atlas',
    'serve.shots': 'Shots',
    'serve.style': 'Style',
    'serve.negative': 'Negative',
    'serve.target': 'Target',
    'serve.copy': 'Copy',
    'serve.copied': 'Copied',
    'serve.image': 'Image prompt',
    'serve.video': 'Video prompt',
    'serve.used': 'Uses',
    'serve.words': '{n} words',
    'serve.risk': '{s}/{t} shots are static — closer to a slideshow',
    'serve.synergy': 'Why it works',
    'serve.master': 'Style anchor',
    'serve.light': 'Light and palette',
    'serve.texture': 'Texture',
    'serve.negative.hint': 'Built from the selected concepts’ common mistakes.',
    'serve.degraded': 'No model result: {reason}',
    'serve.regenerate': 'Cook again',
    'serve.empty': 'Nothing plated yet',
    'serve.empty.hint': 'Pick ingredients, write the idea, then press Cook.',
    'serve.empty.fire': 'Back',
    'detail.def': 'Definition',
    'detail.syntax': 'Prompt syntax',
    'detail.case': 'Example',
    'detail.wrong': 'Common mistakes',
    'detail.combo': 'Often paired with',
    'detail.variants': 'Variations',
    'detail.tags': 'Flavour',
    'detail.add': 'Add',
    'detail.remove': 'Added',
    'detail.close': 'Close',
    'error.title': 'Could not load the atlas',
    'error.retry': 'Retry',
    'error.dataDir': 'Data directory',
    'error.hint': 'Check that taxonomy.json and index.json exist there, or set dataDir in the plugin config (or LUMINA_KITCHEN_DATA).',
    'loading': 'Loading the atlas…',
  },
}

let LANG = 'zh'
function t(key, vars) {
  const dict = LANGS[LANG] || LANGS.zh
  let text = dict[key] ?? LANGS.zh[key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v))
  return text
}

const PLATFORMS = [
  { id: 'douyin', cn: '抖音', aspect: '9:16' },
  { id: 'reels', cn: 'Reels', aspect: '9:16' },
  { id: 'shorts', cn: 'Shorts', aspect: '9:16' },
  { id: 'tiktok', cn: 'TikTok', aspect: '9:16' },
  { id: 'youtube', cn: 'YouTube', aspect: '16:9' },
  { id: 'linkedin', cn: 'LinkedIn', aspect: '16:9' },
  { id: 'cinematic', cn: '宽银幕', aspect: '21:9' },
]

// ─────────────────────────────────────────────────────────────────────────────
// LUMINA Atelier — one design system for every surface of the plugin.
// Warm paper, cinema ink, a single cinnabar accent. Scoped to the plugin root;
// DSH chrome is never touched. No remote fonts, no decorative effects that
// compete with the work.
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
/* Shared native disclosure affordance, including nested and initially open sections. */
.lk-root details>summary.lk-disclosure{display:flex;align-items:center;justify-content:flex-start;gap:10px;min-height:44px;padding:10px 8px;box-sizing:border-box;cursor:pointer;list-style:none;border-radius:var(--r-sm);font:500 13px/1.5 var(--sans);letter-spacing:0;text-transform:none;color:var(--ink)}
.lk-root details>summary.lk-disclosure::-webkit-details-marker{display:none}
.lk-root details>summary.lk-disclosure::marker{content:''}
.lk-root details>summary.lk-disclosure::before,.lk-root details>summary.lk-disclosure::after{content:none;display:none}
.lk-disclosure-label{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;flex:1;min-width:0;overflow-wrap:anywhere}
.lk-disclosure-label>span{min-width:0}
.lk-disclosure-state{flex:none;font-size:12px;color:var(--muted);white-space:nowrap}
.lk-disclosure>.lk-icon{flex:none;transition:transform .15s ease}
.lk-disclosure-close{display:none}
details[open]>.lk-disclosure>.lk-disclosure-state>.lk-disclosure-open{display:none}
details[open]>.lk-disclosure>.lk-disclosure-state>.lk-disclosure-close{display:inline}
details[open]>.lk-disclosure>.lk-icon{transform:rotate(180deg)}
.lk-root details>summary.lk-disclosure:hover{background:var(--paper-2);color:var(--accent)}
.lk-root details>summary.lk-disclosure:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media(prefers-reduced-motion:reduce){.lk-disclosure>.lk-icon{transition:none}}

.lk-root,.lumina-shell{
  /* Paper, ink, one cinnabar accent. Every colour below is a semantic token:
     screens never hard-code a hex. */
  --paper:#f2efe6;--paper-2:#f8f5ee;--card:#fffdf9;
  --ink:#171a18;--ink-2:#3b423d;--muted:#59615a;--faint:#666d66;
  --rule:#ddd5c4;--rule-2:#c5bca8;--rule-soft:#e9e3d5;
  --accent:#a13b27;--accent-2:#812d1d;--accent-soft:#f3e2db;--accent-line:#e3c5ba;
  --stage:#0e1110;--stage-2:#171b19;--stage-3:#232823;--stage-ink:#efe9dc;--stage-muted:#a7ada5;
  --well:#ece8dd;
  --ok:#2c6a4b;--ok-soft:#e7efe9;--warn:#8a5a12;--warn-soft:#f7ecd7;--danger:#9c2f24;--danger-soft:#f7e2de;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,"Songti SC","STSong",Georgia,serif;
  --sans:"Segoe UI","Microsoft YaHei UI","Microsoft YaHei",system-ui,sans-serif;
  --mono:"Cascadia Mono","SFMono-Regular","SF Mono",Consolas,"Liberation Mono",monospace;
  /* Radius scale: 4 / 8 / 12 / 16 / pill */
  --r-xs:4px;--r-sm:8px;--r-md:12px;--r-lg:16px;--r-xl:22px;
  /* 4px spacing rhythm */
  --sp-1:4px;--sp-2:8px;--sp-3:12px;--sp-4:16px;--sp-5:24px;--sp-6:32px;--sp-7:48px;--sp-8:64px;
  /* Type scale — ratio 1.22, tuned for a 13.5px UI base */
  --text-2xs:10.5px;--text-xs:11.5px;--text-sm:12.5px;--text-base:13.5px;--text-md:15px;
  --text-lg:17px;--text-xl:21px;--text-2xl:26px;--text-3xl:33px;--text-4xl:42px;
  --shadow-1:0 1px 0 #ffffffb3 inset,0 1px 2px #2b261b12;
  --shadow-2:0 24px 48px -32px #2b261b59,0 3px 10px #2b261b14;
  --shadow-3:0 40px 80px -40px #171a1873,0 12px 24px -18px #171a1833;
  --ring:0 0 0 3px #a13b2724;
  --ease:cubic-bezier(.16,1,.3,1);--ease-out:cubic-bezier(.22,.8,.24,1);
  --fast:.14s;--med:.24s;--slow:.4s;
}
.lk-root{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;
  background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:14px;line-height:1.62;
  color-scheme:light;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;font-variant-numeric:tabular-nums}
.lumina-shell{font-family:var(--sans);color:var(--ink);background:var(--paper);font-variant-numeric:tabular-nums}
.lk-root *{box-sizing:border-box}
.lk-root h1,.lk-root h2,.lk-root h3,.lk-root h4{margin:0;font-family:var(--serif);font-weight:400;line-height:1.24;letter-spacing:-.012em;text-wrap:balance}
.lk-root p{margin:0}
.lk-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.lk-root img{max-width:100%}
.lk-root :is(button,input,select,textarea,summary,a):focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
.lk-root .lk-input:focus-visible,.lk-root .lk-textarea:focus-visible{outline:none}
.lk-root ::selection{background:#e7c2b6;color:#41160d}
.lk-root ::-webkit-scrollbar{width:10px;height:10px}
.lk-root ::-webkit-scrollbar-track{background:transparent}
.lk-root ::-webkit-scrollbar-thumb{background:#cabfaa;border:3px solid var(--paper);border-radius:8px}
.lk-root ::-webkit-scrollbar-thumb:hover{background:#b3a58d}
.lk-root textarea,.lk-root input,.lk-root select{caret-color:var(--accent)}

/* ── typographic atoms ─────────────────────────────────────────────── */
.lk-kicker{display:inline-flex;align-items:center;gap:8px;font:500 10.5px/1.4 var(--mono);letter-spacing:.18em;
  text-transform:uppercase;color:var(--accent);white-space:nowrap}
.lk-kicker::before{content:"";width:16px;height:1px;background:currentColor;opacity:.5}
.lk-kicker[data-plain="true"]::before{display:none}
.lk-mono{font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--muted)}
.lk-muted{color:var(--muted)}
.lk-icon{display:block;flex:none}
.lk-brandmark{display:block;flex:none;color:var(--accent)}
.lk-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--faint);flex:none}
.lk-dot[data-tone="ok"]{background:var(--ok);box-shadow:0 0 0 3px #2e6a4d1f}
.lk-dot[data-tone="busy"]{background:var(--accent);box-shadow:0 0 0 3px #a83e2b21;animation:lk-pulse 1.6s var(--ease) infinite}
.lk-dot[data-tone="warn"]{background:var(--warn);box-shadow:0 0 0 3px #8a5a121f}
.lk-dot[data-tone="error"]{background:var(--danger);box-shadow:0 0 0 3px #9c2f241f}
.lk-eyebrow{display:block;font:500 var(--text-2xs)/1.4 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--faint)}
.lk-rule{height:1px;border:0;margin:0;background:var(--rule)}
.lk-kbd{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border:1px solid var(--rule);
  border-bottom-width:2px;border-radius:5px;background:var(--paper-2);color:var(--faint);
  font:500 10px/1 var(--mono);letter-spacing:.02em}

/* ── buttons ───────────────────────────────────────────────────────── */
.lk-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:34px;padding:0 13px;
  border:1px solid var(--rule-2);border-radius:var(--r-sm);background:var(--card);color:var(--ink);
  font-size:13px;font-weight:500;letter-spacing:.005em;box-shadow:var(--shadow-1);white-space:nowrap;
  text-decoration:none;
  transition:background var(--fast),border-color var(--fast),color var(--fast),transform var(--fast),box-shadow var(--fast)}
.lk-btn:hover:not(:disabled){background:#fffef9;border-color:var(--ink)}
.lk-btn:active:not(:disabled){transform:translateY(1px);box-shadow:none}
.lk-btn:disabled{opacity:.42;cursor:not-allowed;box-shadow:none}
.lk-btn.sm{min-height:29px;padding:0 10px;font-size:12px;gap:6px}
.lk-btn.ghost{background:transparent;border-color:transparent;box-shadow:none;color:var(--muted)}
.lk-btn.ghost:hover:not(:disabled){background:#1a1d1b0a;border-color:transparent;color:var(--ink)}
.lk-btn.quiet{background:transparent;border-color:var(--rule);box-shadow:none;color:var(--ink-2)}
.lk-btn.quiet:hover:not(:disabled){background:var(--card);border-color:var(--ink)}
.lk-btn.danger{color:var(--danger);border-color:var(--accent-line);background:var(--card)}
.lk-btn.danger:hover:not(:disabled){background:var(--danger-soft);border-color:var(--danger);color:var(--danger)}
.lk-iconbtn{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:var(--r-sm);border:1px solid transparent;
  color:var(--muted);background:transparent;transition:background var(--fast),color var(--fast),border-color var(--fast);flex:none}
.lk-iconbtn:hover{background:#1a1d1b0a;color:var(--ink)}
.lk-iconbtn[aria-pressed="true"]{background:var(--accent-soft);color:var(--accent);border-color:var(--accent-line)}
.lk-primary{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:0 18px;
  border:1px solid var(--ink);border-radius:var(--r-md);background:var(--ink);color:var(--paper-2);
  font-family:var(--sans);font-size:14px;font-weight:600;letter-spacing:.005em;line-height:1.2;cursor:pointer;
  box-shadow:0 1px 0 #ffffff1f inset,0 14px 28px -20px #1a1d1b;transition:background var(--fast),border-color var(--fast),transform var(--fast),box-shadow var(--fast)}
.lk-primary:hover:not(:disabled){background:#000;border-color:#000;transform:translateY(-1px);box-shadow:0 1px 0 #ffffff1f inset,0 18px 32px -20px #1a1d1b}
.lk-primary:active:not(:disabled){transform:translateY(0)}
.lk-primary:disabled{background:#e9e4d7;color:#8b8f88;border-color:#ded7c7;box-shadow:inset 0 0 0 1px #ffffff80;cursor:not-allowed}
.lk-primary .lk-icon{opacity:.9}
.lk-copy[aria-live] .lk-icon{color:currentColor}

/* ── form controls ─────────────────────────────────────────────────── */
.lk-input,.lk-textarea,.lk-select{width:100%;min-height:38px;padding:9px 11px;border:1px solid var(--rule-2);
  border-radius:var(--r-sm);background:var(--card);color:var(--ink);font:inherit;font-size:13.5px;
  box-shadow:var(--shadow-1);transition:border-color var(--fast),box-shadow var(--fast),background var(--fast)}
.lk-textarea{min-height:120px;resize:vertical;line-height:1.75}
.lk-select{padding-right:32px;appearance:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666d68' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='m6.5 9.5 5.5 5.5 5.5-5.5'/></svg>");
  background-repeat:no-repeat;background-position:right 10px center;background-size:14px}
.lk-input:focus,.lk-textarea:focus,.lk-select:focus{outline:none;border-color:var(--ink);box-shadow:var(--ring)}
.lk-input::placeholder,.lk-textarea::placeholder{color:#727970}
.lk-label{display:block;margin:0 0 6px;font:500 10.5px/1.4 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.lk-hint{font-size:12px;line-height:1.65;color:var(--muted)}
.lk-counter{font:10.5px/1 var(--mono);letter-spacing:.06em;color:var(--faint);font-variant-numeric:tabular-nums}
.lk-note{display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border:1px solid var(--rule);border-radius:var(--r-md);
  background:var(--paper-2);font-size:12.5px;line-height:1.65;color:var(--ink-2)}
.lk-note .lk-icon{margin-top:2px;color:var(--muted)}
.lk-note[data-tone="warn"]{border-color:#e6d3aa;background:var(--warn-soft);color:#5c3c0c}
.lk-note[data-tone="danger"]{border-color:var(--accent-line);background:var(--danger-soft);color:#6d2119}
.lk-note[data-tone="ok"]{border-color:#c9ddd0;background:var(--ok-soft);color:#1f4c37}

/* ── decision sheet: in-panel replacement for native confirm ───────── */
.lk-overlay[data-kind="sheet"]{z-index:140;align-items:center;justify-content:center;padding:22px;
  background:#1417145c;backdrop-filter:blur(7px)}
.lk-sheet{width:min(540px,100%);max-height:min(88vh,760px);display:flex;flex-direction:column;
  background:var(--paper-2);border:1px solid var(--rule);border-radius:var(--r-lg);
  box-shadow:var(--shadow-2);overflow:hidden;animation:lk-sheet-in .24s var(--ease)}
.lk-sheet-head{display:flex;align-items:flex-start;gap:14px;padding:22px 24px 0}
.lk-sheet-mark{display:grid;place-items:center;width:40px;height:40px;flex:none;border-radius:50%;
  background:var(--accent-soft);color:var(--accent)}
.lk-sheet[data-tone="danger"] .lk-sheet-mark{background:var(--danger-soft);color:var(--danger)}
.lk-sheet-eyebrow{display:block;margin-bottom:6px;font:500 10px/1.4 var(--mono);letter-spacing:.18em;
  text-transform:uppercase;color:var(--accent)}
.lk-sheet[data-tone="danger"] .lk-sheet-eyebrow{color:var(--danger)}
.lk-sheet-title{margin:0;font:400 25px/1.2 var(--serif);letter-spacing:-.02em;color:var(--ink)}
.lk-sheet-body{padding:12px 24px 0;overflow:auto;overscroll-behavior:contain}
.lk-sheet-message{margin:0 0 13px;font-size:13px;line-height:1.75;color:var(--ink-2)}
.lk-sheet-facts{display:grid;grid-template-columns:78px minmax(0,1fr);gap:9px 14px;
  margin:0 0 14px;padding:13px 14px;border:1px solid var(--rule);border-radius:var(--r-md);background:var(--paper)}
.lk-sheet-facts dt{margin:0;padding-top:1px;font:500 10px/1.5 var(--mono);letter-spacing:.12em;
  text-transform:uppercase;color:var(--faint)}
.lk-sheet-facts dd{margin:0;font-size:12.5px;line-height:1.65;color:var(--ink);overflow-wrap:anywhere}
.lk-sheet-facts dd[data-emphasis="true"]{color:var(--accent);font-weight:600}
.lk-sheet[data-tone="danger"] .lk-sheet-facts dd[data-emphasis="true"]{color:var(--danger)}
.lk-sheet-note{display:flex;align-items:flex-start;gap:7px;margin:0 0 10px;font-size:11.5px;
  line-height:1.6;color:var(--muted)}
.lk-sheet-note .lk-icon{flex:none;margin-top:2px}
.lk-sheet-actions{display:flex;justify-content:flex-end;gap:9px;padding:16px 24px calc(18px + env(safe-area-inset-bottom));
  border-top:1px solid var(--rule);background:var(--paper-2)}
.lk-sheet-actions .lk-btn,.lk-sheet-actions .lk-primary{min-height:42px}
.lk-primary.lk-danger{background:var(--danger);border-color:var(--danger);color:#fff8f4;
  box-shadow:0 1px 0 #ffffff1f inset,0 14px 28px -20px var(--danger)}
.lk-primary.lk-danger:hover:not(:disabled){background:#8d241b;border-color:#8d241b}
@media(max-width:560px){
  .lk-overlay[data-kind="sheet"]{align-items:flex-end;padding:0}
  .lk-sheet{width:100%;max-height:92vh;border-radius:18px 18px 0 0;animation:lk-sheet-up .28s var(--ease)}
  .lk-sheet-head{padding:20px 18px 0}
  .lk-sheet-body{padding:10px 18px 0}
  .lk-sheet-actions{padding:14px 18px calc(14px + env(safe-area-inset-bottom))}
  .lk-sheet-actions .lk-btn,.lk-sheet-actions .lk-primary{flex:1;min-height:44px}
}

/* ── surfaces ──────────────────────────────────────────────────────── */
.lk-card{background:var(--card);border:1px solid var(--rule);border-radius:var(--r-lg);box-shadow:var(--shadow-1)}
.lk-stagebox{position:relative;background:var(--stage);border-radius:var(--r-md);overflow:hidden;display:grid;place-items:center;color:var(--stage-muted)}
.lk-stagebox img,.lk-stagebox video{display:block;width:100%;height:100%;object-fit:contain}
.lk-stagebox[data-empty="true"]{background:
  radial-gradient(120% 90% at 50% 0,#232825 0%,#111413 70%)}
.lk-stagebox[data-empty="true"]::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(135deg,#ffffff05 0 2px,transparent 2px 7px)}

/* ── detail drawer ─────────────────────────────────────────────────── */
.lk-overlay{position:absolute;inset:0;z-index:80;display:flex;justify-content:flex-end;background:#1417143d;
  backdrop-filter:blur(5px);animation:lk-fade .18s ease}
.lk-detail{width:min(470px,94%);height:100%;display:flex;flex-direction:column;background:var(--paper-2);
  border-left:1px solid var(--rule);box-shadow:-30px 0 70px -44px #1417148c;animation:lk-slide-in .3s var(--ease)}
.lk-detail-head{display:flex;align-items:flex-start;gap:12px;padding:22px 22px 16px;border-bottom:1px solid var(--rule)}
.lk-detail-head .lk-kicker{margin-bottom:7px}
.lk-detail-title{font:400 27px/1.15 var(--serif);letter-spacing:-.02em;color:var(--ink)}
.lk-detail-en{margin-top:4px;font:11px/1.5 var(--mono);letter-spacing:.08em;color:var(--accent)}
.lk-detail-body{flex:1;overflow:auto;padding:18px 22px 24px;overscroll-behavior:contain}
.lk-detail-foot{flex:none;display:flex;flex-direction:column;gap:7px;padding:13px 22px calc(15px + env(safe-area-inset-bottom));
  border-top:1px solid var(--rule);background:var(--paper-2)}
.lk-detail-foot .lk-primary{width:100%}
.lk-detail-foot .lk-primary[data-on="true"]{background:var(--accent-soft);color:var(--accent-2);border-color:var(--accent-line);
  box-shadow:none;opacity:1;cursor:default;transform:none}
.lk-detail-foot p{margin:0;font-size:11px;line-height:1.6;color:var(--muted);text-align:center}
.lk-tagrow{display:flex;flex-wrap:wrap;gap:6px}
.lk-x{display:grid;place-items:center;width:34px;height:34px;flex:none;border-radius:50%;border:1px solid transparent;
  color:var(--muted);transition:background var(--fast),color var(--fast),border-color var(--fast)}
.lk-x:hover{background:#1a1d1b0d;color:var(--ink);border-color:var(--rule)}
.lk-preview{position:relative;margin:0 0 20px;border-radius:var(--r-md);overflow:hidden;background:var(--stage)}
.lk-preview img{display:block;width:100%;max-height:260px;object-fit:contain}
.lk-section{margin:0 0 24px}
.lk-section h3{margin:0 0 8px;font:500 10px/1.4 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.lk-section p{margin:0;font-size:14px;line-height:1.8;color:var(--ink-2)}
.lk-section p+p{margin-top:8px}
.lk-section .lk-quote{font-family:var(--serif);font-size:16px;line-height:1.7;color:var(--ink)}
.lk-add{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:0 13px;
  border:1px solid var(--rule-2);border-radius:var(--r-sm);background:var(--card);color:var(--ink);font-size:13px;
  transition:background var(--fast),border-color var(--fast),color var(--fast)}
.lk-add:hover:not(:disabled){border-color:var(--ink)}
.lk-add[data-on="true"],.lk-add[aria-pressed="true"]{background:var(--accent-soft);border-color:var(--accent-line);color:#7d2b1c}

/* ── state screens ─────────────────────────────────────────────────── */
.lk-loading{display:flex;align-items:center;gap:11px;margin:auto;font:11px/1.5 var(--mono);letter-spacing:.16em;color:var(--muted)}
.lk-loading:before{content:"";width:15px;height:15px;border:1.5px solid var(--rule-2);border-top-color:var(--accent);
  border-radius:50%;animation:lk-spin .9s linear infinite}
.lk-error{margin:auto;max-width:540px;padding:34px;border:1px solid var(--rule);border-radius:var(--r-lg);
  background:var(--paper-2);box-shadow:var(--shadow-2)}
.lk-error h2{font-size:26px;margin:0 0 10px}
.lk-error code{font:11.5px/1.6 var(--mono);background:var(--paper);padding:2px 6px;border-radius:4px;word-break:break-all}
.lk-empty{display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:30px 22px;border:1px dashed var(--rule-2);
  border-radius:var(--r-lg);background:#fffdf880;color:var(--muted);font-size:13px;line-height:1.7}
.lk-empty .lk-icon{color:var(--accent)}

/* ── help ──────────────────────────────────────────────────────────── */
.lk-help{display:inline-grid;place-items:center;width:24px;height:24px;min-height:24px;margin-left:5px;padding:0;
  border:0;border-radius:50%;background:transparent;color:var(--muted);cursor:help;vertical-align:middle;flex:none;
  transition:background var(--fast),color var(--fast)}
.lk-help:hover,.lk-help[aria-describedby]{background:var(--accent-soft);color:var(--accent)}
.lk-help:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.lumina-help-tip{position:fixed;z-index:2147483647;box-sizing:border-box;width:max-content;max-width:min(320px,calc(100vw - 24px));
  padding:12px 14px;border-radius:10px;background:#1a1d1b;color:#f6f2e8;border:1px solid #ffffff1c;
  font:400 13px/1.7 var(--sans);text-align:left;white-space:normal;overflow-wrap:anywhere;
  box-shadow:0 22px 48px -22px #000000b8;animation:lk-fade .14s ease}

/* ── motion ────────────────────────────────────────────────────────── */
@keyframes lk-fade{from{opacity:0}to{opacity:1}}
@keyframes lk-rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
@keyframes lk-slide-in{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:none}}
@keyframes lk-sheet-in{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
@keyframes lk-sheet-up{from{opacity:.6;transform:translateY(100%)}to{opacity:1;transform:none}}
@keyframes lk-pop{0%{transform:scale(.82)}60%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes lk-spin{to{transform:rotate(360deg)}}
@keyframes lk-shimmer{0%{background-position:-180% 0}100%{background-position:180% 0}}
/* ── v3 primitives ─────────────────────────────────────────────────── */
/* Segmented control: one sliding sheet of paper, not a row of buttons. */
.lk-seg{display:inline-flex;align-items:center;gap:2px;padding:3px;border:1px solid var(--rule);
  border-radius:999px;background:var(--paper-2);box-shadow:inset 0 1px 2px #2b261b0d}
.lk-seg button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:30px;padding:0 14px;
  border-radius:999px;color:var(--muted);font-size:12.5px;font-weight:500;white-space:nowrap;
  transition:background var(--fast),color var(--fast),box-shadow var(--fast)}
.lk-seg button:hover:not(:disabled){color:var(--ink)}
.lk-seg button[aria-pressed="true"]{background:var(--card);color:var(--ink);box-shadow:0 1px 2px #2b261b1f,0 0 0 1px var(--rule-soft)}
.lk-seg button:disabled{opacity:.45;cursor:not-allowed}
.lk-seg[data-tone="ink"]{background:#171a1810;border-color:transparent;box-shadow:none}
.lk-seg[data-tone="ink"] button[aria-pressed="true"]{background:var(--ink);color:var(--paper-2);box-shadow:none}

.lk-chip{display:inline-flex;align-items:center;gap:6px;min-height:26px;padding:0 9px;border:1px solid var(--rule);
  border-radius:999px;background:var(--card);color:var(--ink-2);font-size:11.5px;white-space:nowrap}
.lk-chip[data-tone="accent"]{background:var(--accent-soft);border-color:var(--accent-line);color:var(--accent-2)}
.lk-chip[data-tone="ghost"]{background:transparent;border-style:dashed}
.lk-chip button{display:grid;place-items:center;width:18px;height:18px;margin-right:-4px;border-radius:50%;color:currentColor;opacity:.6}
.lk-chip button:hover{opacity:1;background:#0000000f}
.lk-badge{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;
  background:var(--accent-soft);color:var(--accent-2);font:500 10.5px/1 var(--mono);font-variant-numeric:tabular-nums}
.lk-link{color:var(--accent);text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:1px}
.lk-link:hover{color:var(--accent-2)}

/* Skeletons: layout stays put while data arrives. */
.lk-skel{position:relative;overflow:hidden;border-radius:var(--r-sm);background:var(--rule-soft)}
.lk-skel::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,#ffffff80 45%,transparent 90%);
  background-size:200% 100%;animation:lk-shimmer 1.5s linear infinite}

/* View transition: the work surface settles, the chrome never moves. */
.lk-view{display:flex;flex-direction:column;flex:1;min-height:0;min-width:0;
  animation:lk-view-in var(--med) var(--ease-out) both}
@keyframes lk-view-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

@keyframes lk-pulse{0%,100%{opacity:1}50%{opacity:.45}}
@media (prefers-reduced-motion:reduce){
  .lk-root *,.lumina-shell *{animation:none!important;transition:none!important;scroll-behavior:auto!important}
}
`;

// Darkroom palette. The default is warm paper; when the host or OS asks for
// dark, the same editorial hierarchy runs on charcoal with warm light text.
const DARK_CSS = `@media (prefers-color-scheme: dark){
  .lk-root,.lumina-shell{
    --paper:#121412;--paper-2:#181b17;--card:#21251e;
    --ink:#f4eee1;--ink-2:#d5cec0;--muted:#aea697;--faint:#9b9488;
    --rule:#343830;--rule-2:#4b5045;--rule-soft:#2a2e26;
    --accent:#e88a70;--accent-2:#f2a892;--accent-soft:#3a2720;--accent-line:#5d3b2f;
    --stage:#0b0d0b;--stage-2:#121511;--stage-3:#1b1f1a;--stage-ink:#f2ecdf;--stage-muted:#a9a294;
    --well:#1d211d;
    --ok:#8ec7a4;--ok-soft:#1d2f25;--warn:#e3b56e;--warn-soft:#332815;--danger:#e58a78;--danger-soft:#3b211d;
    --shadow-1:0 1px 0 #ffffff0d inset,0 1px 2px #00000052;
    --shadow-2:0 24px 48px -32px #000000d9,0 3px 10px #00000080;
    --shadow-3:0 44px 88px -44px #000000f2,0 14px 28px -18px #000000a6;
    --ring:0 0 0 3px #ffffff24;
    color-scheme:dark;
  }
  .lk-root .lk-btn:hover:not(:disabled){background:#2b3027;border-color:var(--ink)}
  .lk-root .lk-btn.ghost:hover:not(:disabled){background:#ffffff0d;border-color:transparent}
  .lk-root .lk-primary:hover:not(:disabled){background:var(--accent);border-color:var(--accent);color:#1a1d1b}
  .lk-root .ll-action .lk-primary.ll-navigate:hover:not(:disabled){background:#2b3027;border-color:var(--ink);color:var(--ink)}
  .lk-root .ll-dimensions button:hover{background:#ffffff0a}
  .lk-root .ll-answer-options button:hover:not(:disabled){background:#2b3027}
  .lk-root .lk-iconbtn:hover{background:#ffffff0d}
  .lk-root .lk-help:hover,.lk-root .lk-x:hover{background:#ffffff0d}
  .lk-root .lk-primary:disabled{background:#2a2e25;color:#8f887b;border-color:#3b4035;box-shadow:none}
  .lk-root .lk-input:focus,.lk-root .lk-textarea:focus,.lk-root .lk-select:focus,
  .lk-root .ll-search-wrap:focus-within,.lk-root .lr-workspace label.lr-searchbox:focus-within,
  .lk-root .lo-start textarea:focus,.lk-root .lr-workspace :is(select,input,textarea):focus{box-shadow:0 0 0 3px #ffffff1f}
  .lk-root .ll-search-wrap:focus-within{border-color:var(--ink)}
  .lk-root .ll-exp:hover{background:#23271f}
  .lk-root .ll-add[aria-pressed="true"],.lk-root .ll-add[data-on="true"],
  .lk-root .ll-row-add[aria-pressed="true"],.lk-root .ll-variant[data-selected="true"]>.ll-add,
  .lk-root .ll-concept[data-selected="true"] .ll-add{color:var(--accent-2)}
  .lk-root .ll-dimensions button[aria-pressed="true"]{background:var(--accent-soft);color:var(--accent-2);border-color:var(--accent-line)}
  .lk-root .ll-filters button[aria-pressed="true"]{color:var(--accent-2)}
  .lk-root .lr-seg button[aria-pressed="true"]{background:var(--accent-soft);color:var(--accent-2)}
  .lk-root .lr-slot-letter{background:var(--accent-soft);color:var(--accent-2)}
  .lk-root .ll-tab-badge{color:var(--accent-2)}
  .lk-root .ll-empty,.lk-root .lr-empty-note{background:#1b1e1a80;border-color:var(--rule-2)}
  .lk-root .ll-row:hover{background:#ffffff07}
  .lk-root .ll-search-clear:hover,.lk-root .lk-toast-x:hover{background:#ffffff0d}
  .lk-root .ll-question,.lk-root .ll-question h3,.lk-root .ll-answer-options button{color:#f2c9bd;border-color:var(--accent-line)}
  .lk-root .ll-stale{background:var(--warn-soft);border-color:#5a4a2c;color:#f0cf9a}
  .lk-root .ll-stale strong{color:#f5dcb0}
  .lk-root .ll-stale p{color:#f0cf9a}
  .lk-root .ll-stale .lk-btn{background:var(--card);border-color:#5a4a2c}
  .lk-root .ll-feedback{background:var(--warn-soft);border-color:#5a4a2c;color:#f0cf9a}
  .lk-root .ll-browser-notice{background:var(--danger-soft);border-color:#5a2a24;border-left-color:var(--danger);color:#f6c9c0}
  .lk-root .ll-browser-notice.ll-success{background:var(--ok-soft);border-color:#335640;border-left-color:var(--ok);color:#b7dcc6}
  .lk-root .lr-outcome-chip[data-outcome="achieved"],
  .lk-root .lr-status[data-status="result"],.lk-root .lr-status[data-status="reviewed"]{background:var(--ok-soft);border-color:#335640;color:#a9d8bc}
  .lk-root .lr-outcome-chip[data-outcome="partial"],
  .lk-root .lr-status[data-status="drafting"]{background:var(--warn-soft);border-color:#5a4a2c;color:#f0cf9a}
  .lk-root .lo-start{background:radial-gradient(90% 60% at 8% 0%,#1c211b 0%,transparent 55%),radial-gradient(70% 50% at 100% 0%,#1a1f19 0%,transparent 60%)}
  .lk-root .lk-input::placeholder,.lk-root .lk-textarea::placeholder,.lk-root .lo-start textarea::placeholder{color:#9a9386}
  .lk-root ::selection,.lumina-shell ::selection{background:#5a2f25;color:#fff3ec}
  .lk-root ::-webkit-scrollbar-thumb{background:#3e4238;border-color:var(--paper)}
  .lk-root ::-webkit-scrollbar-thumb:hover{background:#50564a}
  .lk-root .ll-concept:hover{box-shadow:0 22px 38px -32px #000}
  .lk-root .ll-search-hint{background:var(--paper);border-color:var(--rule);color:var(--faint)}
  .lk-root .ll-weight{background:var(--paper)}
  .lk-root .ll-weight button[aria-pressed="true"]{background:var(--card);color:var(--ink)}
  .lk-root .ll-media-recover-form{background:var(--paper)}
  .lk-root .lk-sheet-facts{background:var(--paper)}
  .lk-root .lk-sheet-note{color:var(--muted)}
  .lk-root .lk-toast{background:var(--card)}
}
`;

function h(tag, props, ...children) {
  return React.createElement(tag, props, ...children)
}

function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

const ICONS = {
  dot: [['circle', { cx: 12, cy: 12, r: 2.2, fill: 'currentColor', stroke: 'none' }]],
  search: [['circle', { cx: 11, cy: 11, r: 6.6 }], ['path', { d: 'm19.8 19.8-4.1-4.1' }]],
  plus: [['path', { d: 'M12 5.5v13M5.5 12h13' }]],
  minus: [['path', { d: 'M6 12h12' }]],
  check: [['path', { d: 'm5 12.7 4.3 4.3L19 6.6' }]],
  close: [['path', { d: 'M6.5 6.5l11 11M17.5 6.5l-11 11' }]],
  chevron: [['path', { d: 'm6.5 9.3 5.5 5.5 5.5-5.5' }]],
  arrow: [['path', { d: 'M4.5 12h14' }], ['path', { d: 'm13 6.5 5.5 5.5-5.5 5.5' }]],
  back: [['path', { d: 'M19.5 12h-14' }], ['path', { d: 'm11 6.5-5.5 5.5 5.5 5.5' }]],
  sparkle: [['path', { d: 'M12 3.6c.7 4 2 5.3 6 6-4 .7-5.3 2-6 6-.7-4-2-5.3-6-6 4-.7 5.3-2 6-6Z' }],
    ['path', { d: 'M18.6 16.4c.3 1.6.9 2.2 2.4 2.5-1.5.3-2.1.9-2.4 2.5-.3-1.6-.9-2.2-2.4-2.5 1.5-.3 2.1-.9 2.4-2.5Z' }]],
  image: [['rect', { x: 3.5, y: 4.5, width: 17, height: 15, rx: 2 }], ['circle', { cx: 8.6, cy: 9.4, r: 1.4 }],
    ['path', { d: 'm20.5 15.2-4.6-4.6L5 21.5' }]],
  video: [['rect', { x: 2.8, y: 6, width: 12.4, height: 12, rx: 2 }], ['path', { d: 'm15.2 10.4 5.6-3.2v9.6l-5.6-3.2' }]],
  film: [['rect', { x: 3, y: 4.5, width: 18, height: 15, rx: 2 }], ['path', { d: 'M7.5 4.5v15M16.5 4.5v15M3 9h4.5M3 15h4.5M16.5 9H21M16.5 15H21' }]],
  clock: [['circle', { cx: 12, cy: 12, r: 8.4 }], ['path', { d: 'M12 7.4V12l3 1.9' }]],
  trash: [['path', { d: 'M4.5 7h15M9.5 7V4.8h5V7M6.8 7l.8 12.2h8.8L17.2 7' }], ['path', { d: 'M10.3 10.8v5M13.7 10.8v5' }]],
  archive: [['rect', { x: 3.5, y: 4.5, width: 17, height: 4.5, rx: 1.4 }],
    ['path', { d: 'M5.2 9v9.2a1.8 1.8 0 0 0 1.8 1.8h10a1.8 1.8 0 0 0 1.8-1.8V9M10 12.8h4' }]],
  pencil: [['path', { d: 'm4.5 19.5 4.1-1 9.7-9.7a2.1 2.1 0 0 0-3-3L5.6 15.5l-1.1 4Z' }], ['path', { d: 'm13.7 6.7 3 3' }]],
  folder: [['path', { d: 'M3.5 7.4a2 2 0 0 1 2-2h3l1.8 2.2h8.2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z' }]],
  layers: [['path', { d: 'm12 3.6 8.4 4.6-8.4 4.6L3.6 8.2Z' }], ['path', { d: 'm3.6 12.4 8.4 4.6 8.4-4.6' }],
    ['path', { d: 'm3.6 16.6 8.4 4.6 8.4-4.6' }]],
  target: [['circle', { cx: 12, cy: 12, r: 8.4 }], ['circle', { cx: 12, cy: 12, r: 4 }],
    ['circle', { cx: 12, cy: 12, r: .7, fill: 'currentColor', stroke: 'none' }]],
  eye: [['path', { d: 'M2.9 12S6.1 6.6 12 6.6 21.1 12 21.1 12 17.9 17.4 12 17.4 2.9 12 2.9 12Z' }],
    ['circle', { cx: 12, cy: 12, r: 2.6 }]],
  info: [['circle', { cx: 12, cy: 12, r: 8.4 }], ['path', { d: 'M12 11v5.2' }],
    ['circle', { cx: 12, cy: 8, r: .7, fill: 'currentColor', stroke: 'none' }]],
  help: [['circle', { cx: 12, cy: 12, r: 8.4 }], ['path', { d: 'M9.6 9.2a2.5 2.5 0 0 1 4.9.4c0 1.7-2.4 1.9-2.4 3.8' }],
    ['circle', { cx: 12, cy: 16.6, r: .7, fill: 'currentColor', stroke: 'none' }]],
  alert: [['path', { d: 'M12 3.9 20.8 19.4H3.2Z' }], ['path', { d: 'M12 9.2v4.4' }],
    ['circle', { cx: 12, cy: 16.4, r: .7, fill: 'currentColor', stroke: 'none' }]],
  copy: [['rect', { x: 8.4, y: 8.4, width: 11.2, height: 11.4, rx: 2 }],
    ['path', { d: 'M15.6 8.4V5.9a2 2 0 0 0-2-2H5.9a2 2 0 0 0-2 2v7.7a2 2 0 0 0 2 2h2.5' }]],
  download: [['path', { d: 'M12 4.2v10' }], ['path', { d: 'm7.5 10 4.5 4.4 4.5-4.4' }], ['path', { d: 'M4.6 19.4h14.8' }]],
  upload: [['path', { d: 'M12 16V5.2' }], ['path', { d: 'm7.5 9.1 4.5-4.4L16.5 9.1' }], ['path', { d: 'M4.6 19.4h14.8' }]],
  play: [['path', { d: 'm8.6 5.4 10 6.6-10 6.6Z' }]],
  pause: [['path', { d: 'M9 5.6v12.8M15 5.6v12.8' }]],
  undo: [['path', { d: 'M4.6 9.4h9a5 5 0 1 1 0 10H8' }], ['path', { d: 'm8.1 5.4-3.5 4 3.5 4' }]],
  settings: [['circle', { cx: 12, cy: 12, r: 3 }],
    ['path', { d: 'M12 3.4v2.3M12 18.3v2.3M4.5 7.7l2 1.2M17.5 15.1l2 1.2M4.5 16.3l2-1.2M17.5 8.9l2-1.2' }]],
  more: [['circle', { cx: 6, cy: 12, r: 1.15, fill: 'currentColor', stroke: 'none' }],
    ['circle', { cx: 12, cy: 12, r: 1.15, fill: 'currentColor', stroke: 'none' }],
    ['circle', { cx: 18, cy: 12, r: 1.15, fill: 'currentColor', stroke: 'none' }]],
  grid: [['rect', { x: 4, y: 4, width: 6.6, height: 6.6, rx: 1.2 }], ['rect', { x: 13.4, y: 4, width: 6.6, height: 6.6, rx: 1.2 }],
    ['rect', { x: 4, y: 13.4, width: 6.6, height: 6.6, rx: 1.2 }], ['rect', { x: 13.4, y: 13.4, width: 6.6, height: 6.6, rx: 1.2 }]],
  list: [['path', { d: 'M4.5 6.8h15M4.5 12h15M4.5 17.2h15' }]],
  lock: [['rect', { x: 5, y: 10.4, width: 14, height: 9.6, rx: 2 }], ['path', { d: 'M8.5 10.4V8a3.5 3.5 0 0 1 7 0v2.4' }]],
  external: [['path', { d: 'M13.5 4.5h6v6' }], ['path', { d: 'M19.5 4.5 11 13' }],
    ['path', { d: 'M18 14.2v4.3a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4.3' }]],
  refresh: [['path', { d: 'M19.4 9.4A8 8 0 1 0 20 12' }], ['path', { d: 'M19.8 4.6v4.9h-4.9' }]],
  camera: [['path', { d: 'M4 8.4h3.1l1.4-2h7l1.4 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z' }],
    ['circle', { cx: 12, cy: 13.6, r: 3.4 }]],
  clapper: [['path', { d: 'M3.6 9.2h16.8v10.2H3.6Z' }], ['path', { d: 'm3.6 9.2 1.2-3.4 16.2 2-.7 2.6' }],
    ['path', { d: 'm8.3 5.4-1 3.2M13.1 6l-1 3.1M17.9 6.6l-1 3.1' }]],
  quote: [['path', { d: 'M9.4 6.8C6.8 8 5.4 10 5.4 12.6c0 2.2 1.2 3.7 3 3.7 1.6 0 2.7-1.1 2.7-2.7 0-1.5-1-2.6-2.4-2.6-.3 0-.6 0-.8.1.3-1.2 1.2-2.2 2.5-2.9Z' }],
    ['path', { d: 'M18.4 6.8C15.8 8 14.4 10 14.4 12.6c0 2.2 1.2 3.7 3 3.7 1.6 0 2.7-1.1 2.7-2.7 0-1.5-1-2.6-2.4-2.6-.3 0-.6 0-.8.1.3-1.2 1.2-2.2 2.5-2.9Z' }]],
  wand: [['path', { d: 'm5 19 9.4-9.4' }], ['path', { d: 'm14 4 1 2.4 2.4 1-2.4 1L14 11l-1-2.6-2.4-1 2.4-1Z' }],
    ['path', { d: 'm19 13 .7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7Z' }]],
  pin: [['path', { d: 'M12 21s6.2-5.2 6.2-10A6.2 6.2 0 0 0 5.8 11c0 4.8 6.2 10 6.2 10Z' }],
    ['circle', { cx: 12, cy: 10.8, r: 2.3 }]],
  star: [['path', { d: 'm12 4 2.2 5.1 5.5.5-4.2 3.7 1.3 5.4-4.8-2.9-4.8 2.9 1.3-5.4-4.2-3.7 5.5-.5Z' }]],
  bookmark: [['path', { d: 'M6.5 4.5h11v15.2L12 15.5l-5.5 4.2Z' }]],
  link: [['path', { d: 'M9.6 14.4 14.4 9.6' }],
    ['path', { d: 'M7.7 9.8 6.1 11.4a3.4 3.4 0 0 0 4.8 4.8l1.6-1.6' }],
    ['path', { d: 'M16.3 14.2l1.6-1.6a3.4 3.4 0 0 0-4.8-4.8l-1.6 1.6' }]],
}

function Icon(props) {
  const name = props.name || 'dot'
  const shapes = ICONS[name] || ICONS.dot
  return h('svg', {
    viewBox: '0 0 24 24', width: props.size || 16, height: props.size || 16, fill: 'none',
    stroke: 'currentColor', strokeWidth: props.stroke || 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': true, focusable: 'false', className: cx('lk-icon', props.className), style: props.style,
  }, shapes.map(([tag, attrs], index) => h(tag, { key: index, ...attrs })))
}

/** The LUMINA mark: a lens seen edge-on, one arc catching the light. */
function BrandMark(props) {
  const size = props.size || 22
  return h('svg', { viewBox: '0 0 28 28', width: size, height: size, 'aria-hidden': true, focusable: 'false', className: 'lk-brandmark' },
    h('circle', { cx: 14, cy: 14, r: 11.1, fill: 'none', stroke: 'currentColor', strokeWidth: 1.25, opacity: .85 }),
    h('path', { d: 'M14 2.9a11.1 11.1 0 0 1 9.6 16.7', fill: 'none', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round' }),
    h('path', { d: 'M14 25.1a11.1 11.1 0 0 1-9.6-16.7', fill: 'none', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', opacity: .45 }),
    h('circle', { cx: 14, cy: 14, r: 3.2, fill: 'currentColor' }),
    h('circle', { cx: 14, cy: 14, r: 1.15, fill: 'var(--paper, #f3f0e7)' }))
}

function StatusDot({ tone }) {
  return h('span', { className: 'lk-dot', 'data-tone': tone || 'idle', 'aria-hidden': true })
}

function DisclosureSummary({ label, children, className = '', ...props }) {
  return h('summary', { ...props, className: `lk-disclosure ${className}`.trim() },
    h('span', { className: 'lk-disclosure-label' }, label ?? children),
    h('span', { className: 'lk-disclosure-state' }, h('span', { className: 'lk-disclosure-open' }, '展开'), h('span', { className: 'lk-disclosure-close' }, '收起')),
    h(Icon, { name: 'chevron', size: 16 }))
}

function Btn({ children, onClick, variant, primary, disabled, title, small, type, icon, className, ariaLabel, ariaPressed, ...rest }) {
  const cls = cx('lk-btn', small && 'sm', variant && variant !== 'primary' ? variant : null, (variant === 'primary' || primary) ? 'lk-primary' : null, className)
  return h('button', {
    type: type || 'button', className: cls, onClick, disabled, title,
    'aria-label': ariaLabel, 'aria-pressed': ariaPressed, ...rest,
  }, icon ? h(Icon, { name: icon, size: small ? 14 : 16 }) : null, children)
}

/* ── in-panel decision sheet ─────────────────────────────────────────
   Native confirm() breaks the editorial surface and cannot show model,
   output and cost together. The sheet is a single host mounted at the app
   root; every screen asks it for a decision. If no host exists (unit tests,
   non-React callers) it falls back to confirm() and resolves immediately. */
const confirmHost = { listener: null, current: null, queue: [] }

function requestConfirm(options) {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (!confirmHost.listener) {
    const text = options.nativeText || [options.title, options.message, ...(options.facts || []).map(([label, value]) => `${label}：${value}`), options.note].filter(Boolean).join('\n')
    const answer = typeof window.confirm === 'function' ? window.confirm(text) : false
    return Promise.resolve(Boolean(answer))
  }
  return new Promise(resolve => {
    const entry = { options, resolve }
    if (confirmHost.current) confirmHost.queue.push(entry)
    else { confirmHost.current = entry; confirmHost.listener(entry) }
  })
}

function ConfirmSheet({ entry, onFinish }) {
  const options = entry.options || {}
  const dialog = React.useRef(null)
  const cancel = React.useRef(null)
  const previous = React.useRef(null)
  React.useEffect(() => {
    previous.current = document.activeElement
    cancel.current?.focus()
    const node = dialog.current
    const keys = event => {
      if (event.key === 'Escape') { event.preventDefault(); onFinish(false); return }
      if (event.key !== 'Tab') return
      const controls = [...(node?.querySelectorAll('button:not(:disabled)') || [])]
      if (!controls.length) return
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    node?.addEventListener('keydown', keys)
    return () => {
      node?.removeEventListener('keydown', keys)
      if (previous.current && document.contains(previous.current)) previous.current.focus?.()
    }
  }, [entry])
  const facts = options.facts || []
  return h('div', {
    className: 'lk-overlay', 'data-kind': 'sheet',
    onClick: event => { if (event.target === event.currentTarget) onFinish(false) },
  },
  h('div', {
    ref: dialog, className: 'lk-sheet', 'data-tone': options.tone || 'cost',
    role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'lk-sheet-title', 'aria-describedby': 'lk-sheet-desc', tabIndex: -1,
  },
  h('div', { className: 'lk-sheet-head' },
    h('span', { className: 'lk-sheet-mark' }, h(Icon, { name: options.icon || 'info', size: 19 })),
    h('div', { style: { flex: 1, minWidth: 0 } },
      h('span', { className: 'lk-sheet-eyebrow' }, options.eyebrow || 'CONFIRM'),
      h('h2', { className: 'lk-sheet-title', id: 'lk-sheet-title' }, options.title || '确认这一步？')),
    h('button', { type: 'button', className: 'lk-x', 'aria-label': '关闭', onClick: () => onFinish(false) }, h(Icon, { name: 'close', size: 16 }))),
  h('div', { className: 'lk-sheet-body' },
    options.message ? h('p', { className: 'lk-sheet-message', id: 'lk-sheet-desc' }, options.message) : h('span', { id: 'lk-sheet-desc' }),
    facts.length
      ? h('dl', { className: 'lk-sheet-facts' }, facts.map(([label, value, emphasis], index) => h(React.Fragment, { key: `${label}-${index}` },
        h('dt', null, label),
        h('dd', { 'data-emphasis': emphasis ? 'true' : 'false' }, value))))
      : null,
    options.note ? h('p', { className: 'lk-sheet-note' }, h(Icon, { name: 'info', size: 13 }), h('span', null, options.note)) : null,
    options.extra || null),
  h('div', { className: 'lk-sheet-actions' },
    h('button', { ref: cancel, type: 'button', className: 'lk-btn', onClick: () => onFinish(false) }, options.cancelLabel || '取消'),
    h('button', { type: 'button', className: cx('lk-primary', options.tone === 'danger' && 'lk-danger'), onClick: () => onFinish(true) }, options.confirmLabel || '确认'))))
}

function ConfirmHost() {
  const [entry, setEntry] = React.useState(null)
  React.useEffect(() => {
    confirmHost.listener = setEntry
    if (confirmHost.current) setEntry(confirmHost.current)
    return () => {
      confirmHost.listener = null
      if (confirmHost.current) {
        const current = confirmHost.current
        confirmHost.current = null
        current.resolve(false)
      }
      confirmHost.queue.length = 0
    }
  }, [])
  const finish = value => {
    const current = confirmHost.current
    if (!current) return
    confirmHost.current = null
    current.resolve(value)
    const next = confirmHost.queue.shift() || null
    confirmHost.current = next
    setEntry(next)
  }
  return entry ? h(ConfirmSheet, { entry, onFinish: finish }) : null
}

let helpSequence = 0
function HelpTip({ label, text }) {
  const [open, setOpen] = React.useState(false)
  const trigger = React.useRef(null), timer = React.useRef(null), pinned = React.useRef(false)
  const identity = React.useRef(null)
  if (!identity.current) identity.current = `lumina-help-${++helpSequence}`
  const cancel = () => clearTimeout(timer.current)
  const close = () => { cancel(); pinned.current = false; setOpen(false) }
  const leave = () => {
    cancel()
    if (!pinned.current && document.activeElement !== trigger.current) timer.current = setTimeout(() => setOpen(false), 140)
  }
  React.useEffect(() => {
    if (!open) return
    // Mount outside scrolling panels so the explanation is never clipped.
    const tip = document.createElement('span')
    tip.id = identity.current
    tip.className = 'lumina-help-tip'
    tip.setAttribute('role', 'tooltip')
    tip.textContent = text
    document.body.appendChild(tip)
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect()
      if (!rect) return
      const box = tip.getBoundingClientRect()
      tip.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - box.width - 12))}px`
      tip.style.top = `${Math.max(12, rect.bottom + box.height + 8 <= window.innerHeight ? rect.bottom + 8 : rect.top - box.height - 8)}px`
    }
    const outside = e => { if (!trigger.current?.contains(e.target) && !tip.contains(e.target)) close() }
    const escape = e => { if (e.key === 'Escape') { e.stopPropagation(); close() } }
    tip.addEventListener('mouseenter', cancel)
    tip.addEventListener('mouseleave', leave)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape, true)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    place()
    return () => {
      cancel(); tip.remove()
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape, true)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, text])
  React.useEffect(() => () => cancel(), [])
  return h('button', {
    ref: trigger, type: 'button', className: 'lk-help', 'aria-label': `${label}帮助`,
    'aria-describedby': open ? identity.current : undefined,
    onMouseEnter: () => { cancel(); setOpen(true) }, onMouseLeave: leave,
    onFocus: () => { cancel(); setOpen(true) },
    onBlur: () => { if (!pinned.current) { cancel(); timer.current = setTimeout(() => setOpen(false), 140) } },
    onClick: e => { e.preventDefault(); e.stopPropagation(); cancel(); pinned.current = !pinned.current; setOpen(pinned.current) },
  }, h(Icon, { name: 'help', size: 15 }))
}

function CopyBtn({ text, small, label }) {
  const [done, setDone] = React.useState(false)
  const timer = React.useRef(null)
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  async function copy() {
    let copied = false
    try {
      await navigator.clipboard.writeText(text || '')
      copied = true
    } catch {
      const area = document.createElement('textarea')
      area.value = text || ''
      document.body.appendChild(area)
      area.select()
      try { copied = document.execCommand('copy') } catch {}
      area.remove()
    }
    setDone(copied ? true : 'error')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setDone(false), 1600)
  }
  return h('button', {
    type: 'button',
    className: cx('lk-btn', small && 'sm', 'lk-copy'),
    onClick: copy,
    'aria-live': 'polite',
  }, h(Icon, { name: done === 'error' ? 'alert' : done ? 'check' : 'copy', size: small ? 14 : 15 }),
  done === 'error' ? '复制失败，请手动复制' : done ? t('serve.copied') : (label || t('serve.copy')))
}

function KitchenIcon(props) {
  return h('span', { style: { display: 'block', color: 'currentColor' } },
    h(BrandMark, { size: props.size || 20 }))
}

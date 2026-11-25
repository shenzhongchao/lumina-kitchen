const CREATION_CSS = `
.lc-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0}
.lc-tools label{display:flex;gap:8px;align-items:center}
.lc-plan .ll-media{margin-top:18px}
.lc-settings{margin-top:12px;overflow-wrap:anywhere}
.lc-settings summary{cursor:pointer;min-height:44px;display:flex;align-items:center}
.lc-settings dl{display:grid;grid-template-columns:110px minmax(0,1fr);gap:8px 16px}
.lc-settings dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
.lc-settings pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.7 var(--sans)}
.lc-message{color:var(--muted);margin:12px 0!important}

/* ── detail page: a print room with one stage ──────────────────────── */
.lp-detail{flex:1;min-height:0;overflow:auto;padding:24px 30px 72px;min-width:0}
.lp-jump{display:none}
.lp-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;
  padding-bottom:18px;margin-bottom:20px;border-bottom:1px solid var(--rule)}
.lp-head-main{min-width:0}
.lp-head-main .lk-kicker{margin-bottom:9px}
.lp-detail-head h2{margin:0 0 7px;font:400 var(--text-2xl)/1.15 var(--serif);letter-spacing:-.022em;overflow-wrap:anywhere}
.lp-idea{margin:0;max-width:64ch;color:var(--muted);font-size:12.5px;line-height:1.7;overflow-wrap:anywhere}
.lp-head-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;flex:none}
.lp-head-spec{display:flex;align-items:center;gap:6px;font:500 10px/1 var(--mono);letter-spacing:.1em;
  text-transform:uppercase;color:var(--faint);white-space:nowrap}
.lp-head-spec span+span::before{content:'·';margin-right:6px;color:var(--rule-2)}
.lp-detail-grid{display:grid;grid-template-columns:minmax(0,1fr) 344px;gap:26px;align-items:start}
.lp-output{min-width:0}
.lp-controls{min-width:0;display:flex;flex-direction:column;gap:10px}
.lp-panel{background:var(--card);border:1px solid var(--rule);border-radius:var(--r-lg);padding:15px 16px}
.lp-controls .ll-media{margin:0;padding:14px 15px;border:1px solid var(--rule);border-radius:var(--r-lg);background:var(--card)}
.lp-controls .ll-generation-heading{font:600 14px/1.5 var(--sans);margin:0 0 10px}
.lp-controls .ll-generation-switch{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:12px}
.lp-controls .ll-generation-switch button{min-height:44px;padding-inline:4px}
.lp-controls .ll-generation-switch button[aria-pressed="true"]{background:var(--accent-soft);color:var(--accent-2);box-shadow:inset 0 0 0 1px var(--accent-line)}
.lp-controls .ll-generation-readiness{display:flex;align-items:flex-start;gap:6px;font-size:11.5px;line-height:1.65;color:var(--muted);margin:0 0 10px}
.lp-controls .ll-generation-readiness .lk-icon{flex:none;margin-top:2px;color:var(--faint)}
.lp-controls .ll-generation-kind{display:block;min-width:0}
.lp-controls .ll-generation-controls{display:grid;gap:10px}
.lp-controls .ll-generation-controls>h3{font-size:14px;margin:0}
.lp-controls .ll-config-needed{padding:10px 11px;border:1px dashed var(--rule-2);border-radius:var(--r-sm);background:var(--paper);margin:0}
.lp-controls .ll-config-needed p{margin:0 0 8px;font-size:12px;line-height:1.6;color:var(--ink-2)}
.lp-controls .ll-media .lo-cost{font-size:11px;line-height:1.6;color:var(--muted);margin:0}
.lp-controls .ll-media-row{display:flex;gap:6px;flex-wrap:wrap;margin:0}
.lp-controls .ll-media-action>.lk-btn{width:100%;min-height:46px}
.lp-controls .ll-media-specrow{display:flex;align-items:center;gap:6px}
.lp-controls .ll-media-specrow .lo-cost{flex:1;min-width:0}
.lp-controls .ll-media-specrow .lk-help{flex:none;width:28px;height:28px;min-height:28px;margin:0 0 0 auto}
/* A running task keeps its own action readable instead of greying out. */
.lp-controls .ll-media-action>.lk-btn[data-busy="true"]{background:var(--accent-soft);border-color:var(--accent-line);color:var(--accent-2);
  box-shadow:none;opacity:1;cursor:progress}
.lp-controls .ll-media-spinner{width:13px;height:13px;flex:none;border:1.6px solid currentColor;border-top-color:transparent;
  border-radius:50%;opacity:.85;animation:lk-spin .9s linear infinite}
.lp-controls .ll-image-status{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--muted)}
.lp-controls .ll-image-status[data-tone="ok"]{color:var(--ok)}
.lp-controls .ll-image-status[data-tone="warn"]{color:var(--warn)}
.lp-controls .ll-image-status[data-tone="error"]{color:var(--danger)}
.lp-controls .ll-media-recover-form{background:var(--paper)}
.lp-controls .ll-media-recover-form .lk-input{min-height:36px}
.lp-panel-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:9px}
.lp-panel-count{font:10px/1.4 var(--mono);letter-spacing:.06em;color:var(--faint);white-space:nowrap}
.lp-panel h3{font:400 21px/1.3 var(--serif);margin:0 0 6px;letter-spacing:-.014em}
.lp-panel-copy{margin:0 0 12px;font-size:12.5px;line-height:1.7;color:var(--ink-2);overflow-wrap:anywhere}
.lp-panel .lk-primary{width:100%}
.lp-quiet-note{margin:6px 0 0;font-size:11px;line-height:1.6;color:var(--muted)}
.lp-panel .ll-role-note{margin:8px 0 0}
.lp-stale{color:var(--accent);font-size:12px;line-height:1.6;margin:0 0 10px}

/* current take: read the shot first, then one row of ways to change it. */
.lp-take-title{margin:0 0 6px}
.lp-take .lp-panel-copy{margin-bottom:0}
.lp-take-original .lp-panel-copy{margin:0 0 4px}
.lp-controls details.lp-take-original>summary.lk-disclosure{padding-left:0;padding-right:0}
.lp-take-actions{display:flex;align-items:center;gap:4px;margin-top:14px}
.lp-take-actions .lk-btn{flex:1;min-width:0;min-height:40px}
.lp-take-actions .lk-help{margin-left:0}
/* Output settings live behind one disclosure instead of their own card. */
.lp-adjust{margin-top:10px;border-top:1px solid var(--rule-soft)}
.lp-adjust>summary.lk-disclosure{min-height:40px;padding-left:0;padding-right:0;color:var(--muted)}
.lp-adjust>summary .lk-disclosure-label{font-size:12px}
.lp-adjust[open]>summary.lk-disclosure{color:var(--accent)}
.lp-adjust-body{display:grid;gap:12px;padding:2px 0 4px;animation:lk-fade var(--fast) ease}
.lp-adjust-row{display:grid;grid-template-columns:58px minmax(0,1fr);align-items:center;gap:10px;min-height:34px;min-width:0}
.lp-adjust-label{font:500 10.5px/1.4 var(--mono);letter-spacing:.1em;color:var(--muted);text-transform:uppercase}
.lp-adjust-inline{display:flex;align-items:center;gap:8px;min-width:0}
.lp-adjust-inline .lk-btn{margin-left:auto;flex:none}
.lp-adjust-value{font:600 13.5px/1.2 var(--sans);font-variant-numeric:tabular-nums}
.lp-adjust-row .lk-select{min-width:0;min-height:34px}
.lp-adjust .lk-btn{min-height:32px}
/* The generated prompts stay one click away inside the take card. */
.lp-prompts{border-top:1px solid var(--rule-soft)}
.lp-prompts>summary.lk-disclosure{min-height:40px;padding-left:0;padding-right:0;color:var(--muted)}
.lp-prompts>summary .lk-disclosure-label{font-size:12px}
.lp-prompts[open]>summary.lk-disclosure{color:var(--accent)}
.lp-prompts-body{display:grid;gap:6px;padding:2px 0 6px;animation:lk-fade var(--fast) ease}
.lp-prompts-body ul{margin:0 0 2px;padding-left:16px;display:grid;gap:3px;font-size:12px;line-height:1.6;color:var(--ink-2)}
.lp-prompts-body h4{margin:6px 0 0;font:500 10px/1.4 var(--mono);letter-spacing:.14em;color:var(--muted)}
.lp-prompts-body pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:0;padding:10px;border:1px solid var(--rule-soft);border-radius:var(--r-sm);
  background:var(--paper);font:11px/1.7 var(--mono);color:var(--ink-2);max-height:220px;overflow:auto}
/* The retime editor opens under the duration row it belongs to, so the card
   above and the generate card below keep their place. */
.lp-timing-editor{display:grid;gap:10px;margin:0;padding:12px 13px;border:1px solid var(--rule);border-radius:var(--r-md);
  background:var(--paper-2);animation:lp-panel-in var(--fast) var(--ease-out) both}
.lp-timing-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.lp-timing-head .lk-label{margin:0}
.lp-timing-range{font:10px/1.4 var(--mono);letter-spacing:.04em;color:var(--faint);white-space:nowrap}
.lp-step{display:flex;align-items:center;gap:2px;padding:3px;border:1px solid var(--rule-2);border-radius:999px;background:var(--card);box-shadow:var(--shadow-1)}
.lp-step-btn{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;border:1px solid transparent;color:var(--ink-2);
  transition:background var(--fast),border-color var(--fast),color var(--fast),transform 80ms ease}
.lp-step-btn:hover:not(:disabled){background:var(--paper-2);border-color:var(--rule);color:var(--ink)}
.lp-step-btn:active:not(:disabled){transform:scale(.92)}
.lp-step-btn:disabled{color:var(--faint);opacity:.45;cursor:not-allowed}
.lp-step-value{flex:1;display:inline-flex;align-items:baseline;justify-content:center;gap:3px;min-height:34px;border-radius:999px;
  color:var(--ink);font:600 15px/1.2 var(--sans);font-variant-numeric:tabular-nums;cursor:default}
.lp-step-value small{font:500 11px/1 var(--sans);color:var(--muted)}
.lp-step-value:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.lp-presets{display:flex;gap:6px;flex-wrap:wrap}
.lp-preset{min-height:32px;padding:0 11px;border:1px solid var(--rule);border-radius:999px;background:var(--card);color:var(--ink-2);
  font-size:12px;font-variant-numeric:tabular-nums;transition:background var(--fast),border-color var(--fast),color var(--fast)}
.lp-preset:hover:not(:disabled){border-color:var(--ink);color:var(--ink)}
.lp-preset:active:not(:disabled){transform:translateY(1px)}
.lp-preset[aria-pressed="true"]{background:var(--accent-soft);border-color:var(--accent-line);color:var(--accent-2)}
.lp-preset:disabled{opacity:.45;cursor:not-allowed}
.lp-timing-actions{display:flex;align-items:center;gap:8px}
.lp-timing-actions>.lk-btn{flex:1;width:auto;min-height:38px}
.lp-timing-actions>.lk-btn.ghost{flex:0 0 auto;padding:0 10px;color:var(--muted)}
.lp-controls .lc-settings[open]>:not(summary){animation:lk-fade var(--fast) ease}

/* stage */
.lp-versions{padding:0;overflow:visible;background:transparent;animation:none;--stage-ar:16/9}
.lp-stage{background:var(--paper-2);border:1px solid var(--rule);border-radius:var(--r-lg);padding:14px;min-width:0}
.lp-stage-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px;flex-wrap:wrap}
.lp-stage-title{flex:1 1 120px;min-width:0}
.lp-stage-title h3{font:400 22px/1.25 var(--serif);letter-spacing:-.016em;margin:3px 0 2px}
.lp-stage-sub{font:10.5px/1.4 var(--mono);letter-spacing:.04em;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp-stage-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.lp-stage-compare{min-inline-size:8em}
.lp-stage .lr-frame,.lp-frame-card .lr-frame{height:clamp(280px,46vh,560px);border-radius:var(--r-md);
  background:radial-gradient(120% 100% at 50% 0,#1b201d 0%,#0c0f0e 72%);
  box-shadow:inset 0 0 0 1px #ffffff0d,0 18px 40px -34px #000000b3}
.lp-frame-card{min-width:0;border:0;background:transparent;padding:0;display:flex;flex-direction:column}
.lp-frame-card .lr-frame{height:min(52vh,540px);aspect-ratio:var(--stage-ar);width:auto;max-width:100%;margin:0 auto}
.lp-frame-card .lr-frame::after{content:"";position:absolute;inset:10px;pointer-events:none;opacity:.42;
  background:
    linear-gradient(#ffffffd9,#ffffffd9) left top/12px 1px no-repeat,
    linear-gradient(#ffffffd9,#ffffffd9) left top/1px 12px no-repeat,
    linear-gradient(#ffffffd9,#ffffffd9) right top/12px 1px no-repeat,
    linear-gradient(#ffffffd9,#ffffffd9) right top/1px 12px no-repeat,
    linear-gradient(#ffffffd9,#ffffffd9) left bottom/12px 1px no-repeat,
    linear-gradient(#ffffffd9,#ffffffd9) left bottom/1px 12px no-repeat,
    linear-gradient(#ffffffd9,#ffffffd9) right bottom/12px 1px no-repeat,
    linear-gradient(#ffffffd9,#ffffffd9) right bottom/1px 12px no-repeat}
.lr-pair .lp-frame-card .lr-frame{width:100%;height:auto;margin:0}
.lp-one .lp-frame-card{width:100%}
.lp-frame-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:11px;flex-wrap:wrap}
.lp-frame-meta{display:flex;flex-direction:column;gap:1px;min-width:0}
.lp-frame-meta strong{font:400 15.5px/1.3 var(--serif);color:var(--ink)}
.lp-frame-meta span{font:10.5px/1.4 var(--mono);letter-spacing:.04em;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp-frame-actions{display:flex;gap:6px;flex-wrap:wrap}
.lp-frame-actions .lk-btn,.lp-frame-actions .lk-primary{min-height:34px}
.lp-compare-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.lp-compare-row label{flex:1;min-width:170px}
.lp-compare-play{margin-bottom:10px}
.lp-one{max-width:none}
.lr-pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}

/* film strip */
.lp-strip{margin-top:14px;padding-top:12px;border-top:1px solid var(--rule)}
.lp-strip-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:4px}
.lp-strip-count{font:10px/1.4 var(--mono);color:var(--faint);letter-spacing:.04em}
.lp-strip-row{display:flex;gap:8px;overflow-x:auto;padding:6px 2px 4px;scrollbar-width:thin}
.lp-thumb{position:relative;flex:none;width:116px;height:74px;padding:0;border:1px solid var(--rule);border-radius:6px;
  overflow:hidden;background:var(--stage);transition:border-color var(--fast),box-shadow var(--fast),transform var(--fast)}
.lp-thumb:hover{border-color:var(--rule-2);transform:translateY(-1px)}
.lp-thumb[aria-pressed="true"]{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
.lp-thumb img,.lp-thumb video{display:block;width:100%;height:100%;object-fit:cover;opacity:.92}
.lp-thumb[aria-pressed="true"] img,.lp-thumb[aria-pressed="true"] video{opacity:1}
.lp-thumb-no{position:absolute;left:5px;top:5px;padding:2px 4px;border-radius:3px;background:#0b0e0dcc;color:#efe9dc;
  font:9.5px/1 var(--mono);letter-spacing:.06em}

/* empty stage */
.lp-artwork-empty{min-height:min(460px,52vh);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;
  padding:34px 24px;background:
    radial-gradient(120% 90% at 50% 0,var(--well) 0%,var(--paper-2) 62%);
  border:1px solid var(--rule);border-radius:var(--r-md);text-align:center;color:var(--muted)}
.lp-empty-art{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;
  background:var(--accent-soft);color:var(--accent);box-shadow:0 0 0 8px #a83e2b0f}
.lp-artwork-empty h3{font:400 24px/1.3 var(--serif);color:var(--ink);margin:6px 0 0;letter-spacing:-.02em}
.lp-artwork-empty p{font-size:13px;line-height:1.7;max-width:44ch;margin:0}
.lp-empty-steps{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:10px 0 0;padding:0;list-style:none}
.lp-empty-steps li{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border:1px solid var(--rule);
  border-radius:999px;background:var(--card);font-size:11.5px;color:var(--ink-2)}
.lp-empty-steps li span{font:9.5px/1 var(--mono);color:var(--accent)}

/* utility drawer */
.lp-utility-shade{position:absolute;inset:0;z-index:100;background:#14171465;display:flex;justify-content:flex-end;backdrop-filter:blur(4px)}
.lp-utility{width:min(1100px,100%);height:100%;min-width:0;overflow:auto;overscroll-behavior:contain;background:var(--paper);color:var(--ink);
  box-shadow:-30px 0 70px -44px #1417148c;animation:lk-slide-in .3s var(--ease)}
.lp-utility-head{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;border-bottom:1px solid var(--rule);
  position:sticky;top:0;z-index:2;background:var(--paper-2)}
.lp-utility-head h2{font:400 22px/1.3 var(--serif);margin:0;letter-spacing:-.014em}
.lp-utility .lr-workspace{box-sizing:border-box}@container(max-width:1050px){.lp-detail-grid{grid-template-columns:minmax(0,1fr) 312px;gap:18px}}@container(max-width:860px){
  .lp-jump{display:inline-flex}
  .lp-detail-grid{display:flex;flex-direction:column;gap:18px}
  .lp-controls{order:-1;width:100%}
  .lp-output{width:100%}
  .lp-detail[data-has-results="true"] .lp-output{order:-1}
  .lp-detail[data-has-results="true"] .lp-controls{order:0}
  .lp-detail-head{flex-wrap:wrap;gap:12px}
  .lp-detail{padding:18px 16px 54px}
  .lp-stage{padding:12px}
  .lp-stage .lr-frame,.lp-frame-card .lr-frame{height:clamp(240px,40vh,420px)}
  .lr-pair .lp-frame-card .lr-frame{height:auto}
}@container(max-width:620px){
  .lp-detail{padding:16px 14px 48px}
  .lp-detail-head h2{font-size:23px}
  .lp-head-actions{width:100%;justify-content:flex-start}
  .lp-head-spec{order:-1;width:100%}
  .lr-pair{grid-template-columns:1fr}
  .lc-settings dl{grid-template-columns:1fr}
  .lp-artwork-empty{min-height:320px;padding:24px 16px}
  .lp-panel{padding:13px}
  .lp-frame-actions{width:100%}
  .lp-frame-actions .lk-btn,.lp-frame-actions .lk-primary{flex:1;min-height:40px}
  .lp-utility-head{padding:12px 16px}
  .lp-utility-head h2{font-size:19px}
  .lp-take-actions .lk-btn{min-height:44px}
  .lp-adjust>summary.lk-disclosure,.lp-prompts>summary.lk-disclosure{min-height:44px}
  .lp-adjust-row{min-height:44px}
  .lp-adjust .lk-btn{min-height:40px}
  .lp-controls .lp-subaction{min-height:40px}
  .lp-step-btn{width:40px;height:40px}
  .lp-step-value{min-height:40px}
  .lp-preset{min-height:36px}
  .lp-timing-actions>.lk-btn{min-height:44px}
  .lp-controls .ll-media-action>.lk-btn{min-height:48px}
}
`

/* Output parameters live next to generation, not in the ingredient editor.
   The dock on page one can focus this panel via focusSettings. */
function VideoDurationField({ id, duration, videoInfo, onChange, disabled, fieldRef, label = '视频时长' }) {
  const min = videoInfo?.minDuration ?? 4
  const max = videoInfo?.maxDuration ?? 30
  const durations = Array.from({ length: max - min + 1 }, (_, index) => min + index)
  const unsupported = !videoDurationSupported(duration, videoInfo || undefined)
  return h(React.Fragment, null,
    h('label', { htmlFor: id, className: 'll-label' }, label),
    h('select', { id, ref: fieldRef, className: 'lk-select', value: duration, disabled, 'aria-describedby': `${id}-range`, onChange: e => onChange(Number(e.target.value)) },
      unsupported ? h('option', { value: duration, disabled: true }, `${duration} 秒（原设置）`) : null,
      durations.map(d => h('option', { key: d, value: d }, `${d} 秒`))),
    h('p', { className: 'll-role-note', id: `${id}-range` }, videoInfo
      ? `当前视频服务支持 ${min}–${max} 秒。${unsupported ? '请选择支持的时长，或切换默认服务。' : ''}`
      : '可先设定时长，选好视频服务后会检查可用范围。'))
}

/* A retime changes one number. A stepper plus four presets keeps that in one
   row instead of a 27-item popup, and every value is reachable in one or two
   presses. Arrow keys, Home and End work when the value has focus. */
function DurationStepper({ id, labelId, value, min, max, onChange, disabled, valueRef }) {
  const clamp = next => Math.min(max, Math.max(min, next))
  const step = delta => { if (!disabled) onChange(clamp(value + delta)) }
  const onKeyDown = event => {
    if (disabled) return
    if (event.key === 'Home') { event.preventDefault(); onChange(min); return }
    if (event.key === 'End') { event.preventDefault(); onChange(max); return }
    const delta = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 2, PageDown: -2 }[event.key]
    if (!delta) return
    event.preventDefault()
    onChange(clamp(value + delta))
  }
  const presets = [6, 9, 12, 15].filter(seconds => seconds >= min && seconds <= max)
  return h(React.Fragment, null,
    h('div', { className: 'lp-step' },
      h('button', { type: 'button', className: 'lp-step-btn', 'aria-label': '减少 1 秒', disabled: disabled || value <= min, onClick: () => step(-1) }, h(Icon, { name: 'minus', size: 15 })),
      h('span', { id, ref: valueRef, className: 'lp-step-value', role: 'spinbutton', tabIndex: disabled ? -1 : 0,
        'aria-valuenow': value, 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuetext': `${value} 秒`, 'aria-labelledby': labelId,
        onKeyDown }, value, h('small', null, '秒')),
      h('button', { type: 'button', className: 'lp-step-btn', 'aria-label': '增加 1 秒', disabled: disabled || value >= max, onClick: () => step(1) }, h(Icon, { name: 'plus', size: 15 }))),
    presets.length ? h('div', { className: 'lp-presets', role: 'group', 'aria-labelledby': labelId },
      presets.map(seconds => h('button', { key: seconds, type: 'button', className: 'lp-preset', 'aria-pressed': value === seconds,
        disabled, onClick: () => onChange(seconds) }, `${seconds} 秒`))) : null)
}

function CreationWorkspace({ board, busy, model, mediaInfo, jobs, onDesign, onRetime, onGenerate, onRecover, onSettings, onAtlas, onAdopt, concepts, onAction, resultFocus, onConstraints, focusSettings }) {
  const controls = React.useRef(null)
  const adjust = React.useRef(null)
  const durationField = React.useRef(null)
  const durationSelect = React.useRef(null)
  const editButton = React.useRef(null)
  const [timingDraft, setTimingDraft] = React.useState(null)
  const [timingError, setTimingError] = React.useState('')
  const hasResults = board.lab?.runs?.some(run => run.status === 'succeeded')
  const plan = board.lab?.comparison
  const stale = plan && !isCurrentPlan(plan, board)
  const variant = plan?.variants?.find(v => v.id === plan.selectedId) || plan?.variants?.[0]
  const duration = targetVideoDuration(board)
  const editedDuration = plan?.promptSynced && plan.originalDuration !== duration
  const description = variant?.effect || variant?.change || plan?.summary
  const editingTiming = timingDraft !== null
  const timingDisabled = Boolean(busy) || !model || Boolean(board.demo)
  const timingMin = mediaInfo?.video?.minDuration ?? 4
  const timingMax = mediaInfo?.video?.maxDuration ?? 30
  const timingChanged = timingDraft !== duration || editedDuration
  const durationValues = Array.from({ length: timingMax - timingMin + 1 }, (_, index) => timingMin + index)
  if (!durationValues.includes(duration)) durationValues.unshift(duration)
  React.useEffect(() => { if (editingTiming) durationField.current?.focus() }, [editingTiming])
  React.useEffect(() => {
    if (!focusSettings || !adjust.current) return
    adjust.current.open = true
    const timer = setTimeout(() => adjust.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 80)
    return () => clearTimeout(timer)
  }, [focusSettings])
  function openAdjust() {
    if (adjust.current) adjust.current.open = true
    adjust.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
  function focusVideoDuration() {
    openAdjust()
    if (!plan) { requestAnimationFrame(() => durationSelect.current?.focus()); return }
    if (editingTiming) { durationField.current?.focus(); return }
    // An unsupported target (e.g. 20s on a 15s service) starts from the nearest
    // value the service accepts, so the submit is usable straight away.
    setTimingError(''); setTimingDraft(Math.min(timingMax, Math.max(timingMin, duration)))
  }
  function closeTiming() {
    setTimingDraft(null); setTimingError('')
    requestAnimationFrame(() => editButton.current?.focus())
  }
  async function updateTiming(event) {
    event.preventDefault()
    if (timingDisabled || !videoDurationSupported(timingDraft, mediaInfo?.video || undefined) || (timingDraft === duration && !editedDuration)) return
    setTimingError('')
    try { if (await onRetime?.(timingDraft, plan.id)) closeTiming() }
    catch (err) { setTimingError(err.message) }
  }
  const durationControl = plan
    ? h('div', { className: 'lp-adjust-inline' },
      h('span', { className: 'lp-adjust-value' }, `${duration} 秒`),
      h('button', { ref: editButton, type: 'button', className: 'lk-btn sm quiet', disabled: timingDisabled,
        'aria-expanded': editingTiming, 'aria-controls': editingTiming ? 'lp-timing-form' : undefined,
        onClick: editingTiming ? closeTiming : focusVideoDuration }, '改时长'))
    : h('select', { ref: durationSelect, className: 'lk-select', value: duration, disabled: Boolean(busy), 'aria-label': '目标时长',
      onChange: event => onConstraints({ duration: Number(event.target.value) }) },
      durationValues.map(value => h('option', { key: value, value }, `${value} 秒`)))
  const timingEditor = editingTiming
    ? h('form', { id: 'lp-timing-form', className: 'lp-timing-editor', onSubmit: updateTiming, 'aria-label': '改时长',
      onKeyDown: event => { if (event.key === 'Escape' && !busy) { event.preventDefault(); closeTiming() } } },
      h('div', { className: 'lp-timing-head' },
        h('span', { className: 'lk-label', id: 'lp-new-duration-label' }, '新视频时长'),
        h('span', { className: 'lp-timing-range' }, `支持 ${timingMin}–${timingMax} 秒`)),
      h(DurationStepper, { id: 'lp-new-duration', labelId: 'lp-new-duration-label', value: timingDraft, min: timingMin, max: timingMax,
        disabled: Boolean(busy), valueRef: durationField, onChange: value => { setTimingError(''); setTimingDraft(value) } }),
      timingError ? h('p', { className: 'll-media-error', role: 'alert' }, `更新失败，原拍法仍保留。${timingError}`) : null,
      h('div', { className: 'lp-timing-actions' },
        h(Btn, { type: 'submit', variant: 'primary', small: true, disabled: timingDisabled || !timingChanged || !videoDurationSupported(timingDraft, mediaInfo?.video || undefined) },
          busy === 'retime' ? '正在更新拍法…' : `按 ${timingDraft} 秒更新拍法`),
        h(Btn, { small: true, variant: 'ghost', disabled: Boolean(busy), onClick: closeTiming }, '取消')))
    : null
  return h('section', { className: 'lp-detail', 'aria-label': '创作详情', 'data-has-results': Boolean(hasResults) },
    h('header', { className: 'lp-detail-head' },
      h('div', { className: 'lp-head-main' },
        h('span', { className: 'lk-kicker' }, '光影厨房 · 创作详情'),
        h('h2', null, board.title || '创作详情'),
        board.title !== board.idea ? h('p', { className: 'lp-idea' }, board.idea) : null),
      h('div', { className: 'lp-head-actions' },
        h('div', { className: 'lp-head-spec' },
          h('span', null, `${board.ingredients.length} 味`),
          h('span', null, board.constraints.aspect)),
        h(Btn, { icon: 'back', onClick: onAtlas, disabled: Boolean(busy) }, '返回修改想法与配料'),
        hasResults ? h('button', { className: 'lk-btn lp-jump', type: 'button', onClick: () => { controls.current?.scrollIntoView({ block: 'start' }); controls.current?.focus({ preventScroll: true }) } }, '调整并生成') : null)),
    h('div', { className: 'lp-detail-grid' },
      h('div', { className: 'lp-output' }, h(VersionsWorkspace, { key: board.id, embedded: true, board, busy: Boolean(busy), onAction, concepts, resultFocus }),
        board.lineage?.result ? h('details', { className: 'lc-settings' }, h(DisclosureSummary, null, '作为起点的作品'), h(ResultMedia, { run: board.lineage.result })) : null),
      h('aside', { className: 'lp-controls', 'aria-label': '生成控制', ref: controls, tabIndex: -1 },
        h('div', { className: 'lp-panel lp-take' },
          h('div', { className: 'lp-panel-head' },
            h('span', { className: 'lk-eyebrow', 'data-plain': 'true' }, 'CURRENT TAKE'),
            h('span', { className: 'lp-panel-count' }, `${duration} 秒`)),
          h('h3', { className: 'lp-take-title' }, plan ? (variant?.title || '当前拍法') : '当前拍法'),
          plan
            ? editedDuration
              ? h('details', { className: 'lc-settings lp-take-original' }, h(DisclosureSummary, null, '原始拍法说明'), h('p', { className: 'lp-panel-copy' }, description))
              : h('p', { className: 'lp-panel-copy' }, description)
            : null,
          editedDuration && !stale && Number.isInteger(plan.originalDuration) ? h('p', { className: 'lp-quiet-note' }, `拍法原按 ${plan.originalDuration} 秒安排`) : null,
          stale ? h('p', { role: 'status', className: 'lp-stale' }, '想法或配料已改动，请更新拍法后再生成。已有作品保留。') : null,
          h('div', { className: 'lp-take-actions' },
            h(Btn, { variant: !plan || stale ? 'primary' : 'default', disabled: Boolean(busy) || !board.idea?.trim() || !model || Boolean(board.demo), onClick: onDesign, icon: 'sparkle' },
              busy === 'design' ? '正在准备拍法…' : !plan ? '准备拍法' : stale ? '更新拍法' : '换个拍法'),
            h(HelpTip, { label: '准备拍法', text: '调用 DSH 文字模型，费用未知；确认后才发起请求。已有拍法与作品不受影响。' })),
          h('details', { className: 'lp-adjust', ref: adjust, 'aria-label': '调整时长/画幅' },
            h(DisclosureSummary, null, '调整时长/画幅'),
            h('div', { className: 'lp-adjust-body' },
              h('div', { className: 'lp-adjust-row' }, h('span', { className: 'lp-adjust-label' }, '目标时长'), durationControl),
              timingEditor,
              h('label', { className: 'lp-adjust-row' },
                h('span', { className: 'lp-adjust-label' }, '画幅'),
                h('select', { className: 'lk-select', value: board.constraints?.platform, disabled: Boolean(busy), onChange: event => {
                  const platform = PLATFORMS.find(item => item.id === event.target.value)
                  onConstraints({ platform: platform.id, aspect: platform.aspect })
                } }, PLATFORMS.map(platform => h('option', { key: platform.id, value: platform.id }, `${platform.cn} ${platform.aspect}`)))))),
          !model ? h('p', { className: 'll-role-note' }, '需要先在 DSH 配置文字模型。') : null,
          h('details', { className: 'lp-prompts', 'aria-label': '配料与提示词' },
            h(DisclosureSummary, null, '配料与提示词'),
            h('div', { className: 'lp-prompts-body' },
              h('ul', null, board.ingredients.map(item => h('li', { key: item.slug }, concepts.find(c => c.id === item.slug)?.cn || item.slug))),
              variant ? h(React.Fragment, null,
                h('h4', null, '图片提示词'),
                h('pre', null, variant.imagePrompt || '—'),
                h('h4', null, '视频提示词'),
                h('pre', null, variant.videoPrompt ? videoPromptForOutput(variant.videoPrompt, duration, board.constraints?.aspect || '9:16') : '—'))
                : h('p', { className: 'll-role-note' }, '准备拍法后，这里会显示这一版的图片与视频提示词。'))),
          plan?.variants?.length > 1 ? h('details', { className: 'lc-settings' }, h(DisclosureSummary, null, '历史方案中的其他拍法'), h('div', { className: 'lc-tools' }, plan.variants.map(v => h(Btn, { key: v.id, disabled: Boolean(busy) || stale || v.id === variant?.id, onClick: () => onAdopt(plan.id, v.id) }, v.title)))) : null),
        h(MediaPanel, { key: board.id, board, plan, variant, info: mediaInfo, jobs, busy, stale, onGenerate, onRecover, onSettings, onVideoDuration: focusVideoDuration }),
        board.lab?.continuedFrom ? h('p', { className: 'll-role-note', role: 'status' }, '已带回所选的画面条件与提示词；旧作品保留。') : null)))
}

function UtilityPanel({ title, busy, onClose, children }) {
  const root = React.useRef(null), close = React.useRef(onClose)
  close.current = onClose
  React.useEffect(() => {
    const prior = document.activeElement
    root.current?.querySelector('button')?.focus()
    const keys = event => {
      // A confirmation sheet or lightbox above this panel owns its own focus.
      if (document.querySelector('.lk-sheet,.lk-lightbox')) return
      if (event.key === 'Escape') { event.preventDefault(); close.current(); return }
      if (event.key !== 'Tab') return
      const controls = [...root.current.querySelectorAll('button:not(:disabled),input,select,textarea,a[href],summary')].filter(e => e.getClientRects().length)
      const first = controls[0], last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    root.current?.addEventListener('keydown', keys)
    const node = root.current
    return () => { node?.removeEventListener('keydown', keys); if (document.contains(prior)) prior.focus?.() }
  }, [])
  return h('div', {
    className: 'lp-utility-shade',
    onClick: event => { if (!busy && event.target === event.currentTarget) onClose() },
  }, h('section', { className: 'lp-utility', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, ref: root },
    h('header', { className: 'lp-utility-head' }, h('h2', null, title), h(Btn, { disabled: busy, onClick: onClose, icon: 'close' }, '关闭面板')), children))
}

function VersionSettings({ run, concepts }) {
  return h('details', { className: 'lc-settings' }, h(DisclosureSummary, null, '查看这一版的设置与提示词'),
    h('dl', null, recipeConditions({ source: run.source, result: run }, concepts).map(([label, value]) => h(React.Fragment, { key: label }, h('dt', null, label), h('dd', null, value))),
      h('dt', null, '生成时间'), h('dd', null, new Date(run.createdAt).toLocaleString('zh-CN')),
      h('dt', null, '生成服务'), h('dd', null, run.service?.name || run.provider || '旧版未记录'),
      h('dt', null, '完整请求参数'), h('dd', null, h('pre', null, JSON.stringify(run.request || {}, null, 2)))),
    !run.source ? h('p', { className: 'lc-message' }, '这个旧版本缺少完整画面条件快照。') : null,
    h('pre', null, run.prompt || '旧版本未记录提示词'))
}

function VersionsWorkspace({ board, busy, onAction, concepts, resultFocus, embedded = false }) {
  const runs = (board.lab?.runs || []).filter(r => r.status === 'succeeded' && (r.asset?.file || r.remoteUrl)).slice().reverse()
  const [kind, setKind] = React.useState(resultFocus?.kind || runs[0]?.kind || 'image')
  const [leftId, setLeft] = React.useState(resultFocus?.runIds?.[0] || '')
  const [rightId, setRight] = React.useState(resultFocus?.runIds?.[1] || '')
  const [compare, setCompare] = React.useState(false)
  const [lightbox, setLightbox] = React.useState(null)
  const [error, setError] = React.useState('')
  const leftVideo = React.useRef(null), rightVideo = React.useRef(null)
  const filtered = runs.filter(r => r.kind === kind)
  const left = filtered.find(r => r.id === leftId) || filtered[0]
  const right = filtered.find(r => r.id === rightId && r.id !== left?.id) || filtered.find(r => r.id !== left?.id)
  React.useEffect(() => { if (resultFocus?.kind) { setKind(resultFocus.kind); setLeft(resultFocus.runIds?.[0] || ''); setRight(resultFocus.runIds?.[1] || '') } }, [resultFocus])
  async function action(name, run) {
    setError('')
    if (name === 'continue' && !(await requestConfirm({ title: '从这一版继续创作？', message: '当前编辑区将换成这一版的想法和设置。每次生成的作品及对应设置都保留。', facts: [], confirmLabel: '带回设置', nativeText: '将这一版设置带回编辑区？所有作品保留。' }))) return
    try { await onAction(name, { runId: run.id }) } catch (e) { setError(e.message) }
  }
  async function playBoth() {
    setError('')
    const players = [leftVideo.current, rightVideo.current].filter(Boolean)
    try { players.forEach(v => { v.pause(); v.currentTime = 0 }); await Promise.all(players.map(v => v.play())) } catch { players.forEach(v => v.pause()); setError('无法同时播放，请使用各自的播放控件重试。') }
  }
  const versionNumber = run => (board.lab?.runs || []).filter(r => r.status === 'succeeded').findIndex(r => r.id === run.id) + 1
  const view = (run, side) => run ? h('article', { className: 'lp-frame-card', key: run.id },
    h(ResultMedia, { run, videoRef: side ? rightVideo : leftVideo, onOpen: setLightbox }),
    h('div', { className: 'lp-frame-foot' },
      h('div', { className: 'lp-frame-meta' },
        h('strong', null, `${side ? '右 · ' : ''}第 ${versionNumber(run)} 版`),
        h('span', null, run.source?.variant?.title || run.model || '历史生成')),
      h('div', { className: 'lp-frame-actions' },
        h(Btn, { small: true, onClick: () => action('continue', run), disabled: busy || !canReuseResult(board, run), variant: 'primary' }, '从这一版继续'),
        h('a', { className: 'lk-btn sm ghost', href: assetSrc(run.asset) || run.remoteUrl, target: '_blank', rel: 'noreferrer', download: run.asset?.file }, '打开原文件'))),
    h(VersionSettings, { run, concepts })) : null
  const [arW, arH] = String(board.constraints?.aspect || '16:9').split(':').map(Number)
  const stageAr = arW > 0 && arH > 0 ? `${arW} / ${arH}` : '16 / 9'
  const strip = filtered.length    ? h('div', { className: 'lp-strip' },
      h('div', { className: 'lp-strip-head' },
        h('span', { className: 'lk-eyebrow', 'data-plain': 'true' }, '所有版本'),
        h('span', { className: 'lp-strip-count' }, `${filtered.length} 个 · 点选切换`)),
      h('div', { className: 'lp-strip-row' }, filtered.map(run => {
        return h('button', {
          key: run.id, type: 'button', className: 'lp-thumb', 'aria-pressed': left?.id === run.id,
          onClick: () => setLeft(run.id), title: `第 ${versionNumber(run)} 版`,
        },
        run.kind === 'image' ? h('img', { loading: 'lazy', src: assetSrc(run.asset) || run.remoteUrl, alt: '' }) : h('video', { src: assetSrc(run.asset) || run.remoteUrl, preload: 'metadata', muted: true, playsInline: true }),
        h('span', { className: 'lp-thumb-no' }, String(versionNumber(run)).padStart(2, '0')))
      })))
    : null
  const empty = h('div', { className: 'lp-artwork-empty' },
    h('span', { className: 'lp-empty-art' }, h(Icon, { name: kind, size: 26 })),
    h('h3', null, '第一版作品会出现在这里'),
    h('ol', { className: 'lp-empty-steps' },
      ['在右侧准备一种拍法', '选择参考图或短视频生成', '对照两版，或从这一版继续'].map((text, index) => h('li', { key: text }, h('span', null, String(index + 1).padStart(2, '0')), text))))
  return h('section', { className: `lr-workspace lp-versions${embedded ? '' : ' lp-versions-full'}`, style: { '--stage-ar': stageAr }, 'aria-label': '作品与历史' },
    h('div', { className: 'lp-stage' },
      h('header', { className: 'lp-stage-head' },
        h('div', { className: 'lp-stage-title' },
          h('span', { className: 'lk-eyebrow', 'data-plain': 'true' }, embedded ? 'STAGE' : 'WORK'),
          h('h3', null, filtered.length ? (compare && right ? '两版对照' : `第 ${versionNumber(left)} 版`) : '还没有作品'),
          filtered.length ? h('p', { className: 'lp-stage-sub' }, `${filtered.length} 个${kind === 'image' ? '图片' : '视频'}版本 · ${filtered[0]?.model || '本地生成'}`) : null),
        h('div', { className: 'lp-stage-tools' },
          h('div', { className: 'lk-seg', role: 'group', 'aria-label': '结果类型' },
            ['image', 'video'].map(k => h('button', { key: k, type: 'button', 'aria-pressed': kind === k, onClick: () => { setKind(k); setLeft(''); setRight('') } },
              h(Icon, { name: k, size: 13 }), `${k === 'image' ? '图片' : '视频'} ${runs.filter(r => r.kind === k).length}`))),
          h(Btn, { className: 'lp-stage-compare', small: true, variant: compare && filtered.length >= 2 ? 'quiet' : 'default', disabled: filtered.length < 2, onClick: () => setCompare(!compare) }, compare && filtered.length >= 2 ? '结束对照' : '选两版对照'))),
      error ? h('p', { role: 'alert', className: 'll-error' }, error) : null,
      !filtered.length
        ? empty
        : compare && right
          ? h(React.Fragment, null,
            h('div', { className: 'lp-compare-row' },
              ...[['左侧', left?.id, setLeft], ['右侧', right?.id, setRight]].map(([label, value, setter]) => h('label', { key: label },
                h('span', { className: 'lk-label' }, label),
                h('select', { className: 'lk-select', value, onChange: e => { if (label === '左侧' && e.target.value === right?.id) setRight(left.id); if (label === '右侧' && e.target.value === left?.id) setLeft(right.id); setter(e.target.value) } }, filtered.map(r => h('option', { key: r.id, value: r.id }, `第 ${versionNumber(r)} 版 · ${r.source?.variant?.title || r.model || ''}`)))))),
            kind === 'video' ? h('div', { className: 'lp-compare-play' }, h(Btn, { small: true, onClick: playBoth, icon: 'play' }, '一起从头播放')) : null,
            h('div', { className: 'lr-pair' }, view(left, false), view(right, true)))
          : h('div', { className: 'lp-one' }, view(left, false)),
      strip),
    board.lab?.reviews?.length ? h('details', { className: 'lc-settings' }, h(DisclosureSummary, null, '以前保存的备注与复盘'), board.lab.reviews.map(r => h('p', { key: r.id }, r.observed))) : null,
    lightbox ? h(Lightbox, { run: lightbox, onClose: () => setLightbox(null) }) : null)
}

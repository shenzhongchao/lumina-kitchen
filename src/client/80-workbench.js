// The workbench: browse the atlas, compose the shot. One system, two halves.
const WORKBENCH_CSS = `
.ll-motion-controls{margin:12px 0;padding:12px 0;border-block:1px solid var(--rule);font-size:13px;line-height:1.6}
.ll-motion-actions{display:flex;align-items:center;flex-wrap:wrap;gap:10px}
.ll-motion-status{color:var(--ink-2);font-variant-numeric:tabular-nums}
.ll-motion-controls progress{display:block;width:100%;height:6px;margin-top:10px;accent-color:var(--accent)}
.ll-motion-controls p{margin:8px 0 0}
@media(max-width:620px){.ll-motion-controls .lk-btn{min-height:44px}.ll-motion-status{flex-basis:100%}}

.ll-panel{container-type:inline-size;height:100%;min-height:0;background:var(--paper)}

/* ── folio bar ─────────────────────────────────────────────────────── */
.ll-header{display:grid;grid-template-columns:auto minmax(160px,1fr) auto auto;align-items:center;gap:18px;
  padding:11px 22px;min-height:64px;flex:none;border-bottom:1px solid var(--rule);background:var(--paper-2);
  position:relative;z-index:6}
.ll-context{display:flex;align-items:center;gap:10px;min-width:0}
.ll-exp{display:flex;align-items:center;gap:4px;max-width:min(380px,42vw);min-width:0;padding:5px 6px 5px 11px;
  border:1px solid var(--rule);border-radius:var(--r-sm);background:var(--card);box-shadow:var(--shadow-1);
  text-align:left;transition:border-color var(--fast),background var(--fast),box-shadow var(--fast)}
.ll-exp:hover{border-color:var(--rule-2);background:#fffef9;box-shadow:0 10px 24px -22px #2b261b99}
.ll-exp-main{display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:0;border:0;background:none;
  color:inherit;text-align:left;cursor:pointer}
.ll-exp-main:disabled{cursor:not-allowed}
.ll-exp-body{display:flex;flex-direction:column;gap:1px;min-width:0;overflow:hidden}
.ll-exp-body strong{font:500 13.5px/1.4 var(--sans);color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ll-exp .lk-icon{color:var(--faint);flex:none}
/* The status dot belongs to the eyebrow line, not the middle of two lines. */
.ll-exp-main>.lk-dot{align-self:center}
.ll-exp-rename{display:grid;place-items:center;width:28px;height:28px;flex:none;border:1px solid transparent;
  border-radius:50%;background:transparent;color:var(--faint);
  transition:color var(--fast),border-color var(--fast),background var(--fast)}
.ll-exp-rename:hover:not(:disabled){color:var(--accent);border-color:var(--accent-line);background:var(--accent-soft)}
.ll-exp-rename:disabled{opacity:.4;cursor:not-allowed}
.ll-exp-input{flex:1;min-width:0;height:30px;padding:0 3px;border:0;border-bottom:1px solid var(--accent);
  border-radius:0;background:transparent;box-shadow:none;font:500 13.5px/1.4 var(--sans);color:var(--ink)}
.ll-exp-input:focus{outline:none;border-bottom-color:var(--accent)}
.ll-header-actions{margin-left:auto;display:flex;align-items:center;gap:6px;flex-wrap:nowrap;justify-content:flex-end}
.ll-header-actions .lk-btn{min-height:34px}
.ll-save{display:inline-flex;align-items:center;gap:6px;padding:0 4px;font:10.5px/1.4 var(--mono);
  letter-spacing:.06em;color:var(--faint);white-space:nowrap}
.ll-save[data-state="error"]{color:var(--danger)}
.ll-save[data-state="saving"]{color:var(--warn)}

/* View switch lives in the folio bar, so the work surface has no second nav. */
.ll-switch{display:inline-flex;align-items:center;gap:2px;padding:3px;border:1px solid var(--rule);
  border-radius:999px;background:var(--paper);box-shadow:inset 0 1px 2px #2b261b0d}
.ll-switch button{display:inline-flex;align-items:center;gap:7px;min-height:30px;padding:0 14px;border-radius:999px;
  color:var(--muted);font-size:12.5px;font-weight:500;white-space:nowrap;
  transition:background var(--fast),color var(--fast),box-shadow var(--fast)}
.ll-switch button .lk-icon{opacity:.7}
.ll-switch button:hover:not(:disabled){color:var(--ink)}
.ll-switch button[aria-pressed="true"]{background:var(--card);color:var(--ink);box-shadow:0 1px 2px #2b261b1f,0 0 0 1px var(--rule-soft)}
.ll-switch button[aria-pressed="true"] .lk-icon{opacity:1;color:var(--accent)}
.ll-switch button:disabled{opacity:.42;cursor:not-allowed}

/* ── layout ────────────────────────────────────────────────────────── */
.ll-layout{display:grid;grid-template-columns:minmax(0,1fr) 372px;flex:1;min-height:0;overflow:hidden}
.ll-browser{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--paper)}
.ll-mobile{display:none}
.ll-browser-notice{display:flex;align-items:flex-start;gap:9px;margin:14px 32px 0;padding:11px 14px;
  border:1px solid var(--accent-line);border-left:3px solid var(--danger);border-radius:var(--r-md);
  background:var(--danger-soft);color:#6d2119;font-size:12.5px;line-height:1.65}
.ll-browser-notice.ll-success{border-color:#c9ddd0;border-left-color:var(--ok);background:var(--ok-soft);color:#1f4c37}

/* ── library: a contact sheet, not a product grid ───────────────────── */
.ll-library{flex:1;min-height:0;overflow:auto;padding:26px 32px 92px;animation:lk-rise .34s var(--ease)}
.ll-lib-head{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;max-width:1240px;padding-bottom:16px}
.ll-lib-mast{min-width:0}
.ll-lib-mast .lk-kicker{margin-bottom:10px}
.ll-library-heading{font-size:var(--text-3xl);line-height:1.1;letter-spacing:-.024em;margin:0 0 8px}
.ll-lib-ledger{display:flex;align-items:flex-start;gap:26px;margin:0;flex:none}
.ll-lib-ledger div{display:flex;flex-direction:column;gap:3px}
.ll-lib-ledger dd{margin:0;font:400 27px/1 var(--serif);letter-spacing:-.02em;color:var(--ink);font-variant-numeric:tabular-nums}
.ll-lib-ledger dt{font:500 10px/1.4 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.ll-search-wrap{position:relative;display:flex;align-items:center;gap:11px;height:48px;
  margin:14px 0 4px;padding:0 13px;border:1px solid var(--rule-2);border-radius:var(--r-md);background:var(--card);
  box-shadow:0 1px 0 #ffffffb3 inset,0 2px 5px -4px #2b261b40;
  transition:border-color var(--fast),box-shadow var(--fast)}
.ll-search-wrap:hover{border-color:var(--rule)}
.ll-search-wrap:focus-within{border-color:var(--ink);box-shadow:var(--ring)}
.ll-search-wrap .lk-icon{color:var(--muted)}
.ll-search{flex:1;width:100%;min-height:0;height:100%;padding:0;border:0;border-radius:0;background:none;
  box-shadow:none;font-size:14px;color:var(--ink)}
.ll-search:focus{outline:none;border:0;box-shadow:none}
.ll-search:focus-visible{outline:none}
.ll-search::-webkit-search-cancel-button,.ll-search::-webkit-search-decoration{display:none}
.ll-search-clear{display:grid;place-items:center;width:26px;height:26px;flex:none;border-radius:50%;
  color:var(--muted);transition:background var(--fast),color var(--fast)}
.ll-search-clear:hover{background:#1a1d1b0d;color:var(--ink)}
.ll-suggest{position:absolute;left:0;right:0;top:calc(100% + 8px);z-index:45;padding:8px;
  border:1px solid var(--rule);border-radius:var(--r-md);background:var(--card);box-shadow:var(--shadow-2);
  animation:lk-rise .18s var(--ease)}
.ll-suggest-label{display:block;padding:6px 8px;font:500 10px/1.4 var(--mono);letter-spacing:.14em;
  text-transform:uppercase;color:var(--faint)}
.ll-suggest button{display:flex;align-items:center;gap:8px;width:100%;min-height:36px;padding:0 8px;
  border-radius:6px;color:var(--ink-2);font-size:12.5px;text-align:left}
.ll-suggest button:hover,.ll-suggest button:focus-visible{background:var(--paper-2);color:var(--ink)}
.ll-suggest .lk-icon{color:var(--faint)}
.ll-search-hint{flex:none;font:10.5px/1 var(--mono);letter-spacing:.04em;color:var(--faint);
  border:1px solid var(--rule);border-radius:5px;padding:4px 6px;background:var(--paper)}
.ll-atlas-nav{display:flex;flex-direction:column;padding:10px 0 0;border-bottom:1px solid var(--rule)}
.ll-dimensions{display:flex;flex-wrap:nowrap;gap:3px;padding:0;overflow-x:auto;scrollbar-width:none}
.ll-dimensions::-webkit-scrollbar{display:none}
.ll-dimensions button{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 12px;flex:none;
  border:1px solid transparent;border-radius:999px;color:var(--ink-2);white-space:nowrap;
  transition:background var(--fast),color var(--fast),border-color var(--fast)}
.ll-dimensions button:hover{background:#1a1d1b0a}
.ll-dimensions button[aria-pressed="true"]{background:var(--ink);color:var(--paper-2);border-color:var(--ink)}
.ll-dimensions button[aria-pressed="true"] .ll-dim-no,.ll-dimensions button[aria-pressed="true"] .ll-dim-n{color:#cbc3b4}
.ll-dim-no{font:10px/1 var(--mono);letter-spacing:.06em;color:var(--faint);font-variant-numeric:tabular-nums}
.ll-dim-n{font:10.5px/1 var(--mono);letter-spacing:.02em;color:var(--faint);font-variant-numeric:tabular-nums;opacity:.9}
.ll-topicbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 0 16px;flex-wrap:wrap}
.ll-result-count{font-size:12px;line-height:1.6;color:var(--muted);min-width:0;overflow-wrap:anywhere}
.ll-result-count b{font:500 13px/1 var(--mono);color:var(--ink)}
.ll-reset{font:11.5px/1.5 var(--sans);color:var(--accent);text-decoration:underline;text-underline-offset:3px;min-height:30px}
.ll-topic-left{display:flex;align-items:center;gap:14px;min-width:0;flex-wrap:wrap}
.ll-topic-right{display:flex;align-items:center;gap:8px;margin-left:auto}
.ll-topics{display:flex;flex-wrap:wrap;align-items:center;gap:2px;margin:8px 0 0;padding:0 0 10px}
.ll-topics button{position:relative;display:inline-flex;align-items:center;gap:7px;appearance:none;border:0;border-radius:7px;
  background:transparent;color:var(--muted);font:400 12.5px/1.5 var(--sans);min-height:34px;padding:0 10px;cursor:pointer;
  transition:background var(--fast),color var(--fast)}
.ll-topics button::after{content:none}
.ll-topics button:hover{background:#1a1d1b0a;color:var(--ink)}
.ll-topics button[aria-pressed="true"]{color:var(--accent);font-weight:600;background:var(--accent-soft)}
.ll-topics button[aria-pressed="true"]::before{content:"";width:5px;height:5px;border-radius:50%;background:currentColor}
.ll-topics button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.ll-filters{display:inline-flex;align-items:center;gap:5px;flex-wrap:wrap}
.ll-filters button{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 10px;
  border:1px solid var(--rule);border-radius:999px;background:var(--card);color:var(--muted);
  font-size:11.5px;white-space:nowrap;transition:background var(--fast),border-color var(--fast),color var(--fast)}
.ll-filters button:hover{border-color:var(--rule-2);color:var(--ink)}
.ll-filters button[aria-pressed="true"]{background:var(--accent-soft);border-color:var(--accent-line);color:#7d2b1c}
.ll-count{font:10px/1.4 var(--mono);letter-spacing:.1em;color:var(--muted);white-space:nowrap}
.ll-empty{display:flex;flex-direction:column;align-items:flex-start;gap:9px;width:100%;max-width:560px;
  padding:26px 24px;border:1px solid var(--rule);border-radius:var(--r-lg);
  background:var(--paper-2);color:var(--muted);font-size:12.5px;line-height:1.75}
.ll-empty-mark{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;
  background:var(--accent-soft);color:var(--accent);margin-bottom:2px}
.ll-empty strong{font:400 21px/1.3 var(--serif);font-weight:400;color:var(--ink)}
.ll-empty p{font-size:12.5px;line-height:1.7;color:var(--muted)}
.ll-empty-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
.ll-density{display:inline-flex;gap:2px;padding:2px;border:1px solid var(--rule);border-radius:999px;background:var(--paper-2);flex:none}
.ll-density button{display:grid;place-items:center;width:30px;height:26px;border-radius:999px;color:var(--muted)}
.ll-density button:hover{color:var(--ink)}
.ll-density button[aria-pressed="true"]{background:var(--card);color:var(--ink);box-shadow:var(--shadow-1)}

/* concept cards */
.ll-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));gap:18px;align-content:start}
.ll-concept{position:relative;display:flex;flex-direction:column;min-width:0;border:1px solid var(--rule);border-radius:var(--r-lg);
  overflow:hidden;background:var(--card);
  transition:transform var(--med) var(--ease),border-color var(--fast),box-shadow var(--med) var(--ease)}
.ll-concept:hover{transform:translateY(-2px);border-color:var(--rule-2);box-shadow:0 24px 40px -34px #2b261b8c}
.ll-concept[data-selected="true"]{border-color:var(--accent-line);box-shadow:inset 3px 0 0 var(--accent),0 18px 32px -32px #a83e2b66}
.ll-picture{position:relative;display:block;width:100%;aspect-ratio:4/3;padding:0;border:0;
  background:radial-gradient(110% 90% at 50% 10%,#202522 0%,#101312 75%);overflow:hidden;color:var(--stage-muted)}
.ll-picture img{display:block;width:100%;height:100%;object-fit:contain;transition:transform .6s var(--ease)}
.ll-concept:hover .ll-picture img{transform:scale(1.02)}
.ll-picture-tag{position:absolute;left:10px;top:10px;display:inline-flex;align-items:center;gap:5px;
  padding:4px 7px;border-radius:6px;background:#0b0e0dcc;color:#efe9dc;
  font:9.5px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;backdrop-filter:blur(6px)}
.ll-plate-no{position:absolute;right:10px;top:10px;padding:4px 6px;border-radius:4px;
  background:#0b0e0d99;color:#e6dfd0;font:10px/1 var(--mono);letter-spacing:.08em;
  font-variant-numeric:tabular-nums;backdrop-filter:blur(6px)}
.ll-picture-open{position:absolute;left:10px;bottom:10px;display:inline-flex;align-items:center;gap:6px;
  padding:5px 9px;border-radius:999px;background:#0b0e0de6;color:#efe9dc;font-size:11px;line-height:1;
  opacity:0;transform:translateY(4px);transition:opacity var(--fast),transform var(--fast);pointer-events:none}
.ll-concept:hover .ll-picture-open,.ll-picture:focus-visible .ll-picture-open{opacity:1;transform:none}
.ll-picture-grain{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,transparent 58%,#00000059 100%)}
.ll-picture-empty{display:grid;place-items:center;gap:8px;width:100%;height:100%;
  font:10px/1.4 var(--mono);letter-spacing:.1em;color:#8d948c}
.ll-concept-body{display:flex;flex-direction:column;gap:6px;flex:1;padding:14px 15px 13px}
.ll-concept-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;font:9.5px/1.4 var(--mono);
  letter-spacing:.12em;text-transform:uppercase;color:var(--faint);white-space:nowrap;overflow:hidden}
.ll-concept-meta>span:first-child{overflow:hidden;text-overflow:ellipsis}
.ll-concept-on{color:var(--accent);letter-spacing:.04em;flex:none}
.ll-concept h3{font-size:20px;line-height:1.3;letter-spacing:-.014em}
.ll-name{padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;transition:color var(--fast)}
.ll-name:hover{color:var(--accent)}
.ll-concept-effect{font-size:12px;line-height:1.55;color:var(--ink-2);font-weight:500;
  display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.ll-concept-def{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  font-size:12px;line-height:1.65;color:var(--muted)}
.ll-concept-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto;
  padding-top:10px;border-top:1px solid var(--rule-soft)}
.ll-concept-dims{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font:10px/1.4 var(--mono);letter-spacing:.06em;color:var(--faint)}
.ll-add{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:32px;padding:0 11px;
  border:1px solid var(--rule-2);border-radius:var(--r-sm);background:var(--card);color:var(--ink);
  font-size:12px;font-weight:500;white-space:nowrap;flex:none;text-decoration:none;
  transition:background var(--fast),border-color var(--fast),color var(--fast),transform var(--fast)}
.ll-add:hover:not(:disabled){border-color:var(--ink);background:#fffef9}
.ll-add[aria-pressed="true"],.ll-add[data-on="true"]{background:var(--accent-soft);border-color:var(--accent-line);color:#7d2b1c}
.ll-add:disabled{cursor:default}
.ll-add .lk-icon{animation:lk-pop .28s var(--ease)}

/* list density */
.ll-list{display:flex;flex-direction:column;border-top:1px solid var(--rule)}
.ll-row{display:grid;grid-template-columns:88px minmax(0,1fr) 38px;gap:16px;align-items:center;
  padding:10px 6px;border-bottom:1px solid var(--rule);transition:background var(--fast)}
.ll-row:hover{background:#1a1d1b06}
.ll-row[data-selected="true"]{box-shadow:inset 3px 0 0 var(--accent);background:var(--accent-soft)}
.ll-row-thumb{width:88px;height:60px;padding:0;border:0;border-radius:6px;overflow:hidden;
  background:radial-gradient(110% 90% at 50% 10%,#202522 0%,#101312 75%)}
.ll-row-thumb img{display:block;width:100%;height:100%;object-fit:cover}
.ll-row-body{min-width:0;display:flex;flex-direction:column;gap:2px}
.ll-row h3{font-size:16px;line-height:1.35}
.ll-row-meta{font:9.5px/1.4 var(--mono);letter-spacing:.1em;text-transform:uppercase;
  color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ll-row-effect{font-size:12px;line-height:1.5;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ll-row-def{font-size:11.5px;line-height:1.5;color:var(--muted);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ll-row-add{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;
  border:1px solid var(--rule-2);background:var(--card);color:var(--ink)}
.ll-row-add:hover{border-color:var(--ink)}
.ll-row-add[aria-pressed="true"]{background:var(--accent-soft);border-color:var(--accent-line);color:#7d2b1c}

/* ── editor ────────────────────────────────────────────────────────── */
.ll-editor{display:flex;flex-direction:column;min-width:0;min-height:0;border-left:1px solid var(--rule);
  background:var(--paper-2)}
.ll-editor-body{flex:1;min-height:0;overflow:auto;padding:16px 18px 24px;overscroll-behavior:contain}
.ll-editor-head{margin:0 0 12px;padding-bottom:10px;border-bottom:1px solid var(--rule)}
.ll-editor-eyebrow{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px}
.ll-rev{font:10px/1 var(--mono);letter-spacing:.1em;color:var(--faint);font-variant-numeric:tabular-nums}
.ll-editor fieldset{border:0;padding:0;margin:0;min-width:0}
.ll-block{padding:16px 0;border-bottom:1px solid var(--rule)}
.ll-block:first-of-type{padding-top:4px}
.ll-block:last-of-type{border-bottom:0;padding-bottom:4px}
.ll-block-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.ll-block-title{display:flex;align-items:center;gap:2px;font-family:var(--serif);font-size:18px;line-height:1.3;color:var(--ink)}
.ll-idea{min-height:104px;background:var(--card);font-size:13px;line-height:1.75;box-shadow:none;border-radius:var(--r-sm)}
.ll-examples{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.ll-examples button{display:inline-flex;align-items:center;gap:6px;min-height:29px;padding:0 9px;
  border:1px dashed var(--rule-2);border-radius:999px;color:var(--muted);font-size:11.5px;
  transition:border-color var(--fast),color var(--fast),background var(--fast)}
.ll-examples button:hover,.ll-examples button[aria-pressed="true"]{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
.ll-smart{display:flex;align-items:center;gap:10px;width:100%;margin-top:11px;padding:8px 10px;
  border:1px dashed var(--rule-2);border-radius:var(--r-sm);background:transparent;text-align:left;color:var(--ink);
  transition:border-color var(--fast),background var(--fast),box-shadow var(--fast)}
.ll-smart:hover:not(:disabled){border-color:var(--accent);background:var(--accent-soft)}
.ll-smart-icon{display:grid;place-items:center;width:30px;height:30px;flex:none;border-radius:50%;
  background:var(--accent-soft);color:var(--accent)}
.ll-smart-body{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
.ll-smart-body strong{font-size:12.5px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ll-smart-body small{font-size:10.5px;line-height:1.4;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ll-smart>.lk-icon{color:var(--faint);flex:none}
.ll-smart:hover:not(:disabled)>.lk-icon{color:var(--accent)}
.ll-smart:disabled{opacity:.45;cursor:not-allowed}
.ll-smart-row{display:flex;align-items:center;gap:2px;margin-top:11px}
.ll-smart-row .ll-smart{flex:1;min-width:0;margin-top:0}
.ll-role-note{margin:6px 0;font-size:11.5px;line-height:1.65;color:var(--muted)}
.ll-tools-link{display:inline-flex;align-items:center;align-self:flex-start;min-height:32px;font-size:12px;
  color:var(--accent);transition:color var(--fast)}
.ll-tools-link:hover{color:var(--accent-2);text-decoration:underline}
.ll-clarification{margin-top:8px}
.ll-editor details{margin:6px 0}
.ll-editor details>summary{display:flex;align-items:center;justify-content:space-between;gap:10px;
  min-height:38px;padding:0 2px;color:var(--ink-2);font-size:12.5px;cursor:pointer;list-style:none}
.ll-editor details>summary::-webkit-details-marker{display:none}
.ll-editor details>summary::after{content:"";flex:none;width:7px;height:7px;margin-right:5px;
  border-right:1.4px solid var(--muted);border-bottom:1.4px solid var(--muted);
  transform:rotate(45deg) translate(-1px,-1px);transition:transform var(--fast)}
.ll-editor details[open]>summary::after{transform:rotate(225deg) translate(-2px,-2px)}
.ll-editor details>summary:hover{color:var(--ink)}
.ll-editor details[open]>summary{margin-bottom:6px}
.ll-ingredients-head{display:flex;align-items:baseline;gap:8px;margin:0 0 2px}
.ll-ingredients-head h2{font-family:var(--serif);font-size:19px;line-height:1.3;letter-spacing:-.01em}
.ll-ingredients-count{margin-left:auto;font:10.5px/1.4 var(--mono);letter-spacing:.06em;color:var(--accent);font-variant-numeric:tabular-nums}
.ll-ingredient{display:flex;flex-direction:column;gap:4px;padding:9px 0;border-bottom:1px solid var(--rule-soft)}
.ll-ingredient:last-of-type{border-bottom:0}
.ll-ingredient-top{display:flex;align-items:center;gap:7px}
.ll-ingredient-index{flex:none;width:16px;font:10px/1 var(--mono);color:var(--faint);font-variant-numeric:tabular-nums}
.ll-ingredient-top .ll-name{flex:1;min-width:0;font-family:var(--serif);font-size:15.5px;letter-spacing:-.01em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ll-dim{flex:none;padding:2px 6px;border:1px solid var(--rule);border-radius:5px;
  font:9.5px/1.3 var(--mono);letter-spacing:.06em;color:var(--muted)}
.ll-remove{display:grid;place-items:center;width:26px;height:26px;flex:none;border-radius:50%;
  color:var(--faint);opacity:.55;transition:background var(--fast),color var(--fast),opacity var(--fast)}
.ll-ingredient:hover .ll-remove,.ll-remove:focus-visible{opacity:1}
.ll-remove:hover{background:var(--danger-soft);color:var(--danger)}
.ll-ingredient>p{margin:0 0 0 23px;font-size:11.5px;line-height:1.55;color:var(--muted)}
.ll-ingredient details{margin:2px 0 0 23px}
.ll-ingredient details>summary{min-height:28px;font-size:11.5px;color:var(--faint)}
.ll-weight{display:inline-flex;align-items:center;gap:2px;width:max-content;max-width:100%;margin:1px 0 1px 23px;
  padding:2px;border:1px solid var(--rule);border-radius:7px;background:var(--paper)}
.ll-weight button{min-height:24px;padding:0 8px;border-radius:5px;font-size:11px;color:var(--muted);
  transition:background var(--fast),color var(--fast)}
.ll-weight button:hover{color:var(--ink)}
.ll-weight button[aria-pressed="true"]{background:var(--accent-soft);color:var(--accent-2);font-weight:600;
  box-shadow:inset 0 0 0 1px var(--accent-line)}
.ll-tools{display:flex;align-items:center;gap:16px;margin-top:10px;padding-left:2px}
.ll-tools button{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0;
  font-size:11.5px;color:var(--muted);white-space:nowrap}
.ll-tools button .lk-icon{flex:none}
.ll-tools button:hover:not(:disabled){color:var(--ink);text-decoration:underline}
.ll-tools button:disabled{opacity:.4;cursor:not-allowed}
.ll-feedback{margin-top:10px;padding:10px 12px;border:1px solid #e1cfa8;border-radius:var(--r-md);
  background:var(--warn-soft);color:#5c3c0c;font-size:12px;line-height:1.65}
.ll-feedback .lk-btn{margin-top:8px}
.ll-save{display:flex;align-items:center;gap:6px;margin-top:12px;font:10px/1.5 var(--mono);
  letter-spacing:.08em;color:var(--faint)}
.ll-save[data-state="error"]{color:var(--danger)}
.ll-save .lk-icon{flex:none}

/* ── decision dock ────────────────────────────────────────────────── */
.ll-action{flex:none;padding:12px 18px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--rule);background:var(--paper-2);
  box-shadow:0 -18px 36px -36px #2b261b80}
.ll-action-meta{display:flex;align-items:center;gap:6px;margin-bottom:8px;
  font:10px/1.4 var(--mono);letter-spacing:.08em;color:var(--faint);text-transform:uppercase;
  font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden}
.ll-action-meta span+span::before{content:'·';margin-right:6px;color:var(--rule-2)}
.ll-action-spec{display:inline-flex;align-items:center;gap:4px;min-height:20px;padding:0;border:0;
  background:none;font:inherit;letter-spacing:inherit;color:var(--ink-2);cursor:pointer}
.ll-action-spec::before{content:'·';margin-right:6px;color:var(--rule-2)}
.ll-action-spec:hover{color:var(--accent);text-decoration:underline}
.ll-action-spec .lk-icon{opacity:.7;flex:none}
.ll-planning-duration{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:6px 10px;margin:4px 0 10px}
.ll-planning-duration .lk-select{min-height:36px;min-width:76px}
.ll-planning-duration .ll-role-note{grid-column:1/-1;margin:0}
.ll-action .lk-primary{width:100%;margin:0;font-size:14.5px}
.ll-action .lk-primary.ll-navigate{background:var(--card);color:var(--ink);border-color:var(--rule-2);box-shadow:var(--shadow-1)}
.ll-action .lk-primary.ll-navigate:hover{background:#fffef9;border-color:var(--ink)}
.ll-action p{margin:7px 0 0;font-size:11.5px;line-height:1.6;color:var(--muted)}
.ll-action .ll-error{color:var(--danger)}
.ll-action .ll-cost{display:flex;align-items:flex-start;gap:6px;margin-top:7px;font-size:10.5px;line-height:1.55;color:var(--faint)}
.ll-action .ll-cost .lk-icon{margin-top:1px;flex:none}

/* ── steps ─────────────────────────────────────────────────────────── */
.ll-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:0}
.ll-step{display:flex;flex-direction:column;gap:5px;min-height:26px;padding:0;border:0;background:none;text-align:left;
  color:var(--faint);cursor:default;min-width:0}
.ll-step:not(:disabled){cursor:pointer}
.ll-step-bar{display:block;width:100%;height:2px;border-radius:2px;background:var(--rule);overflow:hidden;
  transition:background var(--fast)}
.ll-step[data-state="done"] .ll-step-bar{background:var(--ink)}
.ll-step[data-state="current"] .ll-step-bar{background:linear-gradient(90deg,var(--ink) 0 52%,var(--rule) 52%)}
.ll-step-label{font:9.5px/1.4 var(--mono);letter-spacing:.08em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ll-step[data-state="done"] .ll-step-label{color:var(--ink-2)}
.ll-step[data-state="current"] .ll-step-label{color:var(--accent)}
.ll-step:not(:disabled):hover .ll-step-label{color:var(--accent)}

/* ── boot ──────────────────────────────────────────────────────────── */
.ll-boot{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;height:100%;
  background:radial-gradient(120% 80% at 50% 0,#fbf8f0 0%,var(--paper) 62%)}
.ll-boot-word{padding-left:.5em;font:400 13px/1 var(--serif);letter-spacing:.5em;color:var(--ink)}
.ll-boot-note{margin-top:4px;font:10px/1.5 var(--mono);letter-spacing:.18em;color:var(--muted)}
.ll-boot .lk-brandmark{animation:lk-pulse 2.6s var(--ease) infinite}
.ll-boot .lk-brandmark .lk-icon{animation:none}

/* ── generation jobs and completion notices ───────────────────────── */
.ll-jobs{display:flex;align-items:center;gap:9px;margin:12px 32px 0;padding:9px 12px;flex:none;
  border:1px solid var(--rule);border-radius:var(--r-md);background:var(--paper-2);
  font-size:11.5px;line-height:1.5;color:var(--ink-2);animation:lk-rise .24s var(--ease)}
.ll-jobs-title{font-weight:500;white-space:nowrap}
.ll-jobs-list{display:flex;gap:5px;flex-wrap:wrap;min-width:0;overflow:hidden}
.ll-job-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border:1px solid var(--rule);
  border-radius:999px;font:10px/1.4 var(--mono);letter-spacing:.03em;color:var(--muted);white-space:nowrap}
.ll-job-chip .lk-icon{color:var(--faint)}
.ll-jobs-link{margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:30px;
  color:var(--accent);font-size:11.5px;white-space:nowrap}
.ll-jobs-link:hover{text-decoration:underline}
.lk-toasts{position:absolute;left:24px;bottom:64px;z-index:170;display:flex;flex-direction:column;gap:8px;
  width:min(360px,calc(100% - 32px));pointer-events:none}
.lk-toast{display:flex;align-items:flex-start;gap:9px;padding:12px 12px 12px 14px;border:1px solid var(--rule);
  border-left:3px solid var(--accent);border-radius:var(--r-md);background:var(--card);box-shadow:var(--shadow-2);
  pointer-events:auto;animation:lk-rise .3s var(--ease)}
.lk-toast[data-tone="ok"]{border-left-color:var(--ok)}
.lk-toast[data-tone="warn"]{border-left-color:var(--warn)}
.lk-toast[data-tone="error"]{border-left-color:var(--danger)}
.lk-toast .lk-dot{margin-top:5px}
.lk-toast-body{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.lk-toast-body strong{font-size:12.5px;font-weight:600;color:var(--ink)}
.lk-toast-body span{font-size:11.5px;line-height:1.55;color:var(--muted)}
.lk-toast-action{align-self:center;min-height:30px;padding:0 8px;font-size:11px;color:var(--accent);white-space:nowrap}
.lk-toast-action:hover{text-decoration:underline}
.lk-toast-x{display:grid;place-items:center;width:26px;height:26px;flex:none;border-radius:50%;color:var(--faint)}
.lk-toast-x:hover{background:#1a1d1b0d;color:var(--ink)}@media(max-width:620px){
  .ll-jobs{margin:10px 16px 0;flex-wrap:wrap}
  .ll-jobs-title{flex:1}
  .ll-jobs-list{order:3;width:100%}
  .ll-jobs-link{min-height:36px}
  .lk-toasts{right:12px;left:12px;bottom:calc(92px + env(safe-area-inset-bottom));width:auto}
}@container(max-width:1180px){
  .ll-layout{grid-template-columns:minmax(0,1fr) 348px}
  .ll-library{padding:20px 24px 64px}
  .ll-editor-body{padding:18px 18px 24px}
  .ll-action{padding:13px 16px 15px}
  .ll-dimensions button{padding:0 10px;gap:6px}
  .ll-dim-n{display:none}
}@container(max-width:860px){
  .ll-layout{display:flex;flex-direction:column}
  .ll-mobile{display:flex;gap:4px;padding:8px 12px;flex:none;border-bottom:1px solid var(--rule);background:var(--paper-2)}
  .ll-mobile button{flex:1;min-height:38px;border:1px solid transparent;border-radius:var(--r-sm);
    color:var(--muted);font-size:12.5px}
  .ll-mobile button[aria-pressed="true"]{background:var(--accent-soft);border-color:var(--accent-line);color:#7d2b1c;font-weight:600}
  .ll-panel[data-pane="atlas"] .ll-editor{display:none}
  .ll-panel[data-pane="board"] .ll-browser{display:none}
  .ll-browser,.ll-editor{width:100%;flex:1}
  .ll-editor{border-left:0}
  .ll-exp{max-width:none;flex:1}
  .ll-library{padding:18px 16px 56px}
  .ll-browser-notice{margin:12px 16px 0}
  .ll-topicbar{margin:14px 0}
  .ll-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .ll-concept-body{padding:14px}
  .ll-concept h3{font-size:18px}
  .ll-concept p{-webkit-line-clamp:2}
  .ll-picture{aspect-ratio:5/4}
}@container(max-width:620px){
  .ll-grid{grid-template-columns:minmax(0,1fr)}
  .ll-picture{aspect-ratio:16/10}
  .ll-library-heading{font-size:26px}
  .ll-topicbar{gap:8px;flex-wrap:wrap;row-gap:10px}
  .ll-topic-left{flex-wrap:wrap;width:100%}
  .ll-filters button{min-height:44px}
  .ll-search-clear{width:40px;height:40px}
  .ll-add{min-height:44px}
  .lk-toast-x{width:40px;height:40px}
  .ll-topics{column-gap:14px}
  .ll-topics button{min-height:44px}
  .ll-editor-body{padding:16px}
  .ll-action{padding:12px 16px calc(14px + env(safe-area-inset-bottom))}
  .ll-idea{min-height:104px}
  .ll-dimensions{flex-wrap:nowrap;gap:2px;padding-bottom:0}
  .ll-dimensions::-webkit-scrollbar{display:none}
  .ll-dimensions button{height:42px;padding:0 11px;flex:none}
  .ll-dimensions button[aria-pressed="true"]{padding-right:12px}
  .ll-atlas-nav{position:relative}
  .ll-atlas-nav::after{content:"";position:absolute;right:0;top:10px;width:34px;height:42px;pointer-events:none;
    background:linear-gradient(90deg,transparent,var(--paper) 82%)}
  .ll-iconbtn,.lk-x{width:44px;height:44px}
  .ll-remove,.ll-row-add{width:44px;height:44px}
  .ll-weight button{min-height:44px;padding:0 10px}
  .ll-tools button,.ll-secondary-actions button{min-height:44px}
  .ll-step{min-height:44px}
  .ll-mobile button{min-height:44px}
  .ll-lib-head{display:block}
  .ll-lib-ledger{margin-top:12px;gap:22px}
  .ll-density button{width:44px;height:40px}
  .lk-help{width:40px;height:40px;min-height:40px}
  .ll-jobs-link{min-height:44px}
}

/* Selected ingredients are the focal work area; secondary settings stay folded. */
.ll-ingredients-panel{background:var(--card);border:1px solid var(--rule);border-radius:var(--r-md);padding:12px 13px;margin:14px 0}
.ll-ingredients-panel .ll-ingredients-head{gap:8px;margin-bottom:2px}
.ll-ingredients-panel .ll-ingredients-head h2{font-weight:400;font-size:19px}
@media(max-width:620px){.ll-ingredients-panel{padding:12px}.ll-ingredients-panel .ll-weight button{min-height:44px}.ll-ingredients-panel .ll-ingredient{padding:8px 0}}


/* Keep the scrollable editor dominant, even in a short host panel. */
.ll-editor-head{margin-bottom:12px}
.ll-editor-head .ll-steps{margin:0;gap:9px}
.ll-editor-head .ll-step{min-height:26px}
.ll-editor .ll-idea-label{font:600 17px/1.4 var(--serif);letter-spacing:-.01em;text-transform:none;color:var(--ink);display:flex;align-items:center;gap:4px}
.ll-editor .ll-idea{min-height:100px;resize:vertical;box-shadow:none}
.ll-editor-body>.ll-secondary-actions{border-top:1px solid var(--rule);padding-top:8px;margin-top:12px;gap:6px 16px}
.ll-editor .ll-action{padding:10px 16px calc(10px + env(safe-area-inset-bottom));max-height:44%;overflow-y:auto;overscroll-behavior:contain}
.ll-editor .ll-action .ll-cost{display:flex;align-items:center;flex-wrap:nowrap;gap:6px;margin-top:2px;font-size:11px}
.ll-editor .ll-action .ll-cost>span{min-width:0;overflow-wrap:anywhere}
.ll-editor .ll-action .ll-cost>.lk-help{flex:none;margin-left:auto}
.ll-editor .ll-action>p[role="status"]{margin-top:6px}@media(prefers-color-scheme:dark){.lk-root .ll-mobile button[aria-pressed="true"]{color:var(--accent-2)}}@container(max-width:620px){
  .ll-mobile{padding-top:4px;padding-bottom:4px}
  .ll-editor-body{padding:12px 16px 20px}
  .ll-editor-head .ll-step{min-height:44px}
  .ll-editor .ll-idea{min-height:92px}
}@container(max-width:1180px){
  .ll-header{grid-template-columns:auto minmax(0,1fr) auto;gap:10px 14px}
  .ll-header .ll-switch{grid-column:1;grid-row:2;justify-self:start}
  .ll-header .ll-header-actions{grid-column:2/-1;grid-row:2;justify-content:flex-end}
  .ll-header .ll-context{grid-column:2/-1;grid-row:1}
  .ll-header>.lm-identity{grid-column:1;grid-row:1}
}@container(max-width:820px){
  .ll-header{gap:9px 12px;padding:10px 16px}
  .ll-header>.lm-identity{grid-column:1;grid-row:1}
  .ll-header .ll-context{grid-column:2/-1;grid-row:1}
  .ll-header .ll-switch{grid-column:1;grid-row:2;width:auto}
  .ll-header .ll-header-actions{grid-column:2/-1;grid-row:2;width:auto;justify-content:flex-end}
}@container(max-width:620px){
  .ll-header{grid-template-columns:auto minmax(0,1fr);padding:10px 14px;gap:8px}
  .ll-header>.lm-identity{grid-column:1;grid-row:1}
  .lm-sub{display:none}
  .ll-header .ll-context{grid-column:2;grid-row:1;justify-content:flex-end}
  .ll-header .ll-exp{flex:1;max-width:none;min-height:36px;padding:5px 9px}
  .ll-header .ll-exp-main>.lk-dot{align-self:center;margin-top:0}
  .ll-header .ll-save{display:none}
  .ll-header .ll-switch{grid-column:1/-1;grid-row:2;width:100%}
  .ll-header .ll-switch button{flex:1;justify-content:center;min-height:38px}
  .ll-header .ll-header-actions{grid-column:1/-1;grid-row:3;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%}
  .ll-header .ll-header-actions .lk-btn{width:100%;min-width:0;min-height:44px;justify-content:center;padding-inline:6px}
}@media(prefers-reduced-motion:reduce){
  .ll-concept,.ll-concept img,.ll-add,.ll-step-bar{transition:none!important}
  .ll-library{animation:none!important}
}
`

/** One sentence of effect, from existing knowledge — never invented for the catalog. */
function conceptEffect(c) {
  const known = {
    '1-1-extreme-long-shot': '让人物在环境中显得渺小', '1-1-close-up': '让观众看清人物的表情',
    '1-3-negative-space': '留出空处，突出孤独或渺小', '1-1-extreme-close-up': '放大局部，增强情绪压力',
    '2-1-hard-light': '让明暗边界更加鲜明', '2-1-soft-light': '让明暗过渡更加柔和',
  }
  if (known[c.id]) return known[c.id]
  const definition = c.def || ''
  const match = definition.match(/(?:用以|旨在|用于|从而|使得|能够)([^。；]{5,32})/)
  return match ? match[1] : c.cn
}

/* ── atelier library ───────────────────────────────────────────────── */

const QUICK_SEARCHES = ['孤独', '逆光', '浅景深', '负空间', '侧光', '冷色']

function Library({ motion, dims, concepts, board, dimId, topicId, query, density, onDim, onTopic, onQuery, onDensity, onAdd, onDetail }) {
  const dim = dims.find(d => d.id === dimId) || dims[0]
  const q = query.trim().toLowerCase()
  const selected = new Set(board.ingredients.map(i => i.slug))
  const [onlyImage, setOnlyImage] = React.useState(false)
  const [onlyAdded, setOnlyAdded] = React.useState(false)
  const searchAll = Boolean(q) || onlyAdded
  const items = concepts.filter(c => {
    if (q && ![c.cn, c.en, c.def, ...(c.tags || []), ...(c.tagsCn || [])].join(' ').toLowerCase().includes(q)) return false
    if (!searchAll && (c.dim !== dim?.id || (topicId && c.topic !== topicId))) return false
    if (onlyImage && !c.thumb) return false
    if (onlyAdded && !selected.has(c.id)) return false
    return true
  })
  const filtered = onlyImage || onlyAdded
  const clearFilters = () => { setOnlyImage(false); setOnlyAdded(false) }
  const hasFilters = Boolean(q || topicId || filtered)
  const resetFilters = () => { clearFilters(); onQuery(''); onTopic(null) }
  const resultContext = q ? `全图谱搜索“${query.trim()}”` : onlyAdded ? '已加入配料' : `${dim?.cn || ''} · ${dim?.topics?.find(t => t.id === topicId)?.cn || '全部主题'}`
  const dimMap = new Map(dims.map(d => [d.id, d]))
  const topicName = c => {
    const owner = dimMap.get(c.dim)
    return owner?.topics?.find(x => x.id === c.topic)?.cn || owner?.cn || ''
  }
  const searchRef = React.useRef(null)
  const [searchFocused, setSearchFocused] = React.useState(false)
  const [recent, setRecent] = React.useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('lumina-kitchen:recent-searches') || '[]')
      return Array.isArray(saved) ? saved.filter(item => typeof item === 'string').slice(0, 4) : []
    } catch { return [] }
  })
  const rememberSearch = term => {
    const value = String(term || '').trim()
    if (!value) return
    setRecent(previous => {
      const next = [value, ...previous.filter(item => item !== value)].slice(0, 4)
      try { window.localStorage.setItem('lumina-kitchen:recent-searches', JSON.stringify(next)) } catch {}
      return next
    })
  }
  const chooseSearch = term => {
    onQuery(term)
    rememberSearch(term)
    setSearchFocused(false)
    searchRef.current?.blur()
  }
  const showSuggestions = searchFocused && !query
  const suggestion = (term, icon) => h('button', {
    key: term,
    type: 'button',
    role: 'option',
    'aria-selected': false,
    onPointerDown: event => event.preventDefault(),
    onClick: () => chooseSearch(term),
  }, h(Icon, { name: icon, size: 14 }), term)
  React.useEffect(() => {
    function keys(event) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', keys)
    return () => window.removeEventListener('keydown', keys)
  }, [])
  return h('section', { className: 'll-library', 'aria-label': '摄影知识图谱' },
    h('header', { className: 'll-lib-head' },
      h('div', { className: 'll-lib-mast' },
        h('span', { className: 'lk-kicker' }, '光影厨房 · 摄影图谱'),
        h('h2', { className: 'll-library-heading' }, '选一种画面效果')),
      h('dl', { className: 'll-lib-ledger', 'aria-label': '图谱规模' },
        [['维度', dims.length], ['主题', dims.reduce((n, d) => n + (d.topics?.length || 0), 0)], ['概念', concepts.length]].map(([label, count]) => h('div', { key: label },
          h('dd', null, count), h('dt', null, label))))),
    h('div', { className: 'll-search-wrap' },
      h(Icon, { name: 'search', size: 18 }),
      h('input', {
        ref: searchRef,
        type: 'search',
        className: 'll-search',
        value: query,
        placeholder: '搜索概念或感觉，例如：孤独、逆光、浅景深',
        'aria-label': '搜索摄影知识',
        'aria-autocomplete': 'list',
        'aria-expanded': showSuggestions ? 'true' : 'false',
        'aria-controls': showSuggestions ? 'll-search-suggest' : undefined,
        onChange: e => onQuery(e.target.value),
        onFocus: () => setSearchFocused(true),
        onBlur: () => setTimeout(() => setSearchFocused(false), 140),
        onKeyDown: e => {
          if (e.key === 'Escape') { e.preventDefault(); onQuery(''); setSearchFocused(false); return }
          if (e.key === 'Enter') { e.preventDefault(); rememberSearch(query); setSearchFocused(false) }
        },
      }),
      query
        ? h('button', { type: 'button', className: 'll-search-clear', 'aria-label': '清除搜索', title: '清除搜索', onClick: () => { onQuery(''); searchRef.current?.focus() } }, h(Icon, { name: 'close', size: 14 }))
        : h('span', { className: 'll-search-hint', 'aria-hidden': true }, '/'),
      showSuggestions
        ? h('div', { className: 'll-suggest', id: 'll-search-suggest', role: 'listbox', 'aria-label': '搜索建议' },
          recent.length
            ? h('div', null,
              h('span', { className: 'll-suggest-label' }, '最近搜索'),
              recent.map(term => suggestion(term, 'clock')))
            : null,
          h('div', null,
            h('span', { className: 'll-suggest-label' }, '试试这些感觉'),
            QUICK_SEARCHES.filter(term => !recent.includes(term)).map(term => suggestion(term, 'sparkle'))))
        : null,
    ),
    h('div', { className: 'll-atlas-nav' },
      h('nav', { className: 'll-dimensions', 'aria-label': '摄影维度' },
        dims.map((d, index) => h('button', {
          key: d.id,
          type: 'button',
          'aria-pressed': !q && !onlyAdded && dim?.id === d.id,
          onClick: () => { setOnlyAdded(false); onDim(d.id) },
        },
        h('span', { className: 'll-dim-no', 'aria-hidden': true }, String(index + 1).padStart(2, '0')),
        h('span', null, d.cn),
        h('span', { className: 'll-dim-n' }, d.count)))),
    !q && !onlyAdded ? h('nav', { className: 'll-topics', 'aria-label': `${dim?.cn || '摄影'}主题` },
      [{ id: '', cn: '全部' }, ...(dim?.topics || [])].map(topic => h('button', {
        key: topic.id,
        type: 'button',
        'aria-pressed': (topicId || '') === topic.id,
        onClick: () => { setOnlyAdded(false); onTopic(topic.id || null) },
      }, topic.cn))) : null),
    dim?.id === 'motion' ? h(MotionControls, { motion }) : null,
    h('div', { className: 'll-topicbar' },
      h('div', { className: 'll-topic-left' },
        h('span', { className: 'll-result-count', role: 'status' },
          h('b', null, items.length), ' 个概念 · ', resultContext),
        hasFilters ? h('button', { type: 'button', className: 'll-reset', onClick: resetFilters }, '重置筛选') : null),
      h('div', { className: 'll-topic-right' },
        h('div', { className: 'll-filters', role: 'group', 'aria-label': '筛选概念' },
          h('button', { type: 'button', 'aria-pressed': onlyImage, onClick: () => setOnlyImage(value => !value) },
            h(Icon, { name: 'image', size: 13 }), '有例图'),
          h('button', { type: 'button', 'aria-pressed': onlyAdded, onClick: () => setOnlyAdded(value => !value) },
            h(Icon, { name: 'check', size: 13 }), `已加入 ${selected.size}`)),
        h('div', { className: 'll-density', role: 'group', 'aria-label': '浏览密度' },
          [['card', 'grid', '卡片，看例图'], ['line', 'list', '列表，扫得快']].map(([id, icon, label]) => h('button', {
            key: id,
            type: 'button',
            'aria-pressed': density === id,
            'aria-label': label,
            title: label,
            onClick: () => onDensity?.(id),
          }, h(Icon, { name: icon, size: 15 })))))),
    items.length
      ? density === 'line'
        ? h('div', { className: 'll-list' }, items.map((c, index) => h('article', { className: 'll-row', key: c.id, 'data-selected': selected.has(c.id) },
          h('button', { className: 'll-row-thumb', type: 'button', 'aria-label': `查看 ${c.cn}`, onClick: () => onDetail(c) },
            c.thumb ? h(MotionImage, { concept: c, motion, alt: '', width: 132, height: 100, decoding: 'async', loading: index < 8 ? 'eager' : 'lazy' }) : null),
          h('div', { className: 'll-row-body' },
            h('p', { className: 'll-row-meta' }, `${topicName(c)} · ${c.en}`),
            h('h3', null, h('button', { className: 'll-name', type: 'button', onClick: () => onDetail(c) }, c.cn)),
            conceptEffect(c) === c.cn ? null : h('p', { className: 'll-row-effect' }, conceptEffect(c)),
            h('p', { className: 'll-row-def' }, c.def || '')),
          h('button', {
            className: 'll-row-add', type: 'button',
            'aria-pressed': selected.has(c.id),
            'aria-label': `${selected.has(c.id) ? '移出配料表' : '加入配料表'} ${c.cn}`,
            title: selected.has(c.id) ? '已在配料表，点一下移除' : '加入配料表',
            onClick: () => onAdd(c.id),
          }, h(Icon, { name: selected.has(c.id) ? 'check' : 'plus', size: 15 })))))
        : h('div', { className: 'll-grid' }, items.map((c, index) => h('article', { className: 'll-concept', key: c.id, 'data-selected': selected.has(c.id) },
          h('button', { className: 'll-picture', type: 'button', 'aria-label': `查看 ${c.cn} 原理示例`, onClick: () => onDetail(c) },
            c.thumb
              ? h(MotionImage, { concept: c, motion, alt: `${c.cn}摄影示例`, width: 320, height: 240, decoding: 'async', loading: index < 4 ? 'eager' : 'lazy' })
              : h('span', { className: 'll-picture-empty' }, h(Icon, { name: 'image', size: 22 }), '暂无示例图'),
            h('span', { className: 'll-picture-tag' }, topicName(c) || c.dimCn || ''),
            h('span', { className: 'll-plate-no', 'aria-hidden': true }, String(index + 1).padStart(2, '0')),
            c.thumb ? h('span', { className: 'll-picture-grain', 'aria-hidden': true }) : null,
            h('span', { className: 'll-picture-open', 'aria-hidden': true }, h(Icon, { name: 'eye', size: 13 }), '查看原理')),
          h('div', { className: 'll-concept-body' },
            h('div', { className: 'll-concept-meta' }, h('span', null, c.en || c.cn), selected.has(c.id) ? h('span', { className: 'll-concept-on' }, '已在配料表') : null),
            h('h3', null, h('button', { className: 'll-name', type: 'button', onClick: () => onDetail(c) }, c.cn)),
            conceptEffect(c) === c.cn ? null : h('p', { className: 'll-concept-effect' }, conceptEffect(c)),
            h('p', { className: 'll-concept-def' }, c.def),
            h('div', { className: 'll-concept-foot' },
              h('span', { className: 'll-concept-dims' }, c.dimCn || topicName(c)),
              h('button', {
                className: 'll-add',
                type: 'button',
                'aria-pressed': selected.has(c.id),
                'aria-label': `${selected.has(c.id) ? '移出配料表' : '加入配料表'} ${c.cn}`,
                onClick: () => onAdd(c.id),
              }, h(Icon, { name: selected.has(c.id) ? 'check' : 'plus', size: 14 }),
              selected.has(c.id) ? '已加入 · 移除' : '加入配料表'))))))
      : h('div', { className: 'll-empty' },
        h('span', { className: 'll-empty-mark' }, h(Icon, { name: 'search', size: 22 })),
        h('strong', null, filtered ? '当前筛选没有匹配' : '没有找到相关概念'),
        h('p', null, filtered ? '试着关闭“有例图”或“已加入”，或换一个关键词。' : '试试更具体的摄影词，例如“负空间”或“侧光”。'),
        h('div', { className: 'll-empty-actions' },
          filtered ? h(Btn, { onClick: clearFilters, icon: 'refresh' }, '清除筛选') : null,
          q ? h(Btn, { onClick: () => onQuery(''), icon: 'close' }, '清除搜索') : null,
          h(Btn, { onClick: resetFilters, icon: 'layers' }, '回到全部主题')))
  )
}

/* ── next action (unchanged rules, new copy stays explicit) ─────────── */

function nextAction(board) {
  if (!board.idea?.trim()) return { action: 'idea', label: '进入创作详情', hint: '先填写想法，再生成推荐配料或从左侧添加。', disabled: true }
  if (!board.ingredients?.length) return { action: 'ingredients', label: '进入创作详情', hint: '生成推荐配料表，或从左侧选一个效果。', disabled: true }
  return { action: 'detail', label: '进入创作详情', hint: '' }
}

/* ── step rail: where am I in the take? ────────────────────────────── */

function StepRail({ board, onStep }) {
  const plan = board.lab?.comparison
  const runs = board.lab?.runs || []
  const steps = [
    { id: 'idea', label: '想法', done: Boolean(board.idea?.trim()) },
    { id: 'ingredients', label: '配料', done: (board.ingredients || []).length > 0 },
    { id: 'compare', label: '拍法', done: Boolean(plan && isCurrentPlan(plan, board)) },
    { id: 'results', label: '结果', done: runs.some(r => r.status === 'succeeded') },
  ]
  const current = steps.findIndex(step => !step.done)
  const go = id => {
    if (!onStep) return
    if (id === 'idea') { document.getElementById('ll-idea')?.focus(); onStep('idea'); return }
    onStep(id === 'ingredients' ? 'atlas' : id)
  }
  return h('div', { className: 'll-steps', role: 'group', 'aria-label': '当前进度' },
    steps.map((step, index) => {
      const state = step.done ? 'done' : index === current ? 'current' : 'todo'
      return h('button', {
        key: step.id,
        type: 'button',
        className: 'll-step',
        'data-state': state,
        'aria-current': state === 'current' ? 'step' : undefined,
        disabled: !onStep,
        title: step.done ? `已完成：${step.label}` : `下一步：${step.label}`,
        onClick: () => go(step.id),
      },
      h('span', { className: 'll-step-bar', 'aria-hidden': true }),
      h('span', { className: 'll-step-label' }, step.label))
    }))
}

/* ── the composer ──────────────────────────────────────────────────── */

function IngredientEditor({ view, board, analysis, model, generating, busy, notice, saving, canUndo, onIdea, onWeight, onRemove, onClear, onUndo, onFire, onDetail, onRetrySave, onRecommend, onNavigate, onRefresh, onOpenSettings, videoInfo, onDuration, durationFocus }) {
  const next = nextAction(board)
  const proceed = () => onNavigate('create')
  const conflict = analysis.conflicts?.[0]
  const recommendation = board.lab?.recommendation
  const currentRec = isCurrentIntent(recommendation, board) ? recommendation : null
  const comparison = board.lab?.comparison
  const durationField = React.useRef(null)
  React.useEffect(() => { if (durationFocus) durationField.current?.focus() }, [durationFocus])
  const summary = isCurrentPlan(comparison, board) ? comparison.summary : null
  const idea = board.idea || ''
  const ideaLimit = idea.length > 1000 || board.panelIdeaOnly ? Math.max(10000, idea.length) : 1000
  const chosen = (analysis.chosen || []).map((c, index) => ({ ...c, index }))
  const chosenIds = new Set(chosen.map(c => c.id))
  const orphanIngredients = (board.ingredients || []).filter(item => !chosenIds.has(item.slug))
  const goStep = target => {
    if (target === 'idea') { document.getElementById('ll-idea')?.focus(); return }
    onNavigate?.(target)
  }
  const saveState = saving === 'error' ? 'error' : saving === 'saving' ? 'saving' : 'saved'
  const dimsUsed = analysis.stats?.dimsUsed || 0
  return h('aside', { className: 'll-editor', 'aria-label': '想法与配料表' },
    h('div', { className: 'll-editor-body' },
      h('fieldset', { disabled: generating },
        h('div', { className: 'll-editor-head' },
          h('div', { className: 'll-editor-eyebrow' },
            h('span', { className: 'lk-eyebrow', 'data-plain': 'true' }, 'CURRENT TAKE'),
            h('span', { className: 'll-rev', 'aria-hidden': true }, `REV ${String(board.revision ?? 0).padStart(2, '0')}`)),
          h(StepRail, { board, onStep: goStep })),
        h('section', { className: 'll-block ll-compose', 'aria-labelledby': 'll-idea-label' },
          h('div', { className: 'll-block-head' },
            h('label', { className: 'll-label ll-idea-label', id: 'll-idea-label', htmlFor: 'll-idea' }, '镜头想法', h(HelpTip, { label: '镜头想法', text: '人物、场景、动作，以及必须满足的要求，都直接写在这里。手动编辑和保存不调用模型。' })),
            h('span', { className: 'lk-counter' }, `${idea.length} / ${ideaLimit}`)),
          h('textarea', {
            id: 'll-idea', className: 'lk-textarea ll-idea', value: idea, maxLength: ideaLimit,
            placeholder: '例如：雨夜站台，一个人等车。让环境显得空旷，人物显得孤独。',
            onChange: e => onIdea(e.target.value),
          }),
          !idea ? h('div', { className: 'll-examples', role: 'group', 'aria-label': '填入想法示例' }, [
            ['人物更孤独', '雨夜站台，一个人等车。让环境显得空旷，人物显得孤独。'],
            ['产品更高级', '一瓶香水放在桌面上，希望画面简洁、精致，突出玻璃质感。'],
            ['追逐更紧张', '一个人在狭窄巷道里奔跑，希望观众感到追逐的紧张。'],
          ].map(([label, text]) => h('button', { type: 'button', key: label, title: '填入示例，可继续修改', onClick: () => { onIdea(text); document.getElementById('ll-idea')?.focus() } }, h(Icon, { name: 'pencil', size: 13 }), label))) : null,
          h('div', { className: 'll-smart-row' },
            h('button', {
              type: 'button', className: 'll-smart',
              disabled: generating || !idea.trim() || !model || Boolean(board.demo),
              onClick: onRecommend,
            },
            h('span', { className: 'll-smart-icon' }, h(Icon, { name: 'sparkle', size: 15 })),
            h('span', { className: 'll-smart-body' }, h('strong', null, busy === 'compose' ? '正在生成推荐配料…' : board.ingredients.length ? '补充推荐配料' : '生成推荐配料表')),
            h(Icon, { name: 'arrow', size: 15 })),
            h(HelpTip, {
              label: '生成推荐配料表',
              text: model
                ? '调用 DSH 文字模型，费用未知；确认后才发起请求。已有配料与影响程度保留。'
                : '需要先在 DSH 配置文字模型；也可以直接从左侧摄影图谱添加配料。',
            })),
          currentClarification(board) ? h('details', { className: 'll-clarification' },
            h(DisclosureSummary, null, `补充条件 · ${currentClarification(board).option}`),
            h('p', { className: 'll-role-note' }, currentClarification(board).prompt),
            h('p', { className: 'll-role-note' }, '仅用于推荐与方案，不改写想法；改想法后失效。')) : null),
        h('section', { className: 'll-block ll-ingredients-panel', 'aria-labelledby': 'll-ingredients-title' },
          h('div', { className: 'll-ingredients-head' },
            h('h2', { id: 'll-ingredients-title' }, '配料表', h(HelpTip, { label: '配料表', text: '配料是你选择的摄影效果，不是例图里的内容。先选一两个想尝试的效果即可，不必凑齐七个维度。点击生成推荐配料表会加入建议。影响程度表示优先级，不是精确生成参数。' })),
            h('span', { className: 'll-ingredients-count', role: 'status' }, `${board.ingredients.length} 味 · ${dimsUsed} 维`)),
          !board.ingredients.length
            ? h('div', { className: 'll-empty', style: { padding: '18px 16px' } },
              h('span', { className: 'll-empty-mark' }, h(Icon, { name: 'layers', size: 19 })),
              h('strong', null, '选一个想尝试的效果'),
              h('p', null, '点上方按钮生成配料，或从左侧摄影图谱直接添加。'),
              h('button', { type: 'button', className: 'll-tools-link', onClick: () => onNavigate?.('atlas') }, '去摄影图谱 →'))
            : chosen.map(c => {
              const item = currentRec?.items?.find(i => i.id === c.id)
              return h('div', { key: c.id, className: 'll-ingredient' },
                h('div', { className: 'll-ingredient-top' },
                  h('span', { className: 'll-ingredient-index' }, String(c.index + 1).padStart(2, '0')),
                  h('button', { className: 'll-name', type: 'button', onClick: () => onDetail(c) }, c.cn),
                  h('span', { className: 'll-dim' }, c.dimCn),
                  h('button', { className: 'll-remove', type: 'button', 'aria-label': `移除 ${c.cn}`, title: `移除 ${c.cn}`, onClick: () => onRemove(c.id) }, h(Icon, { name: 'close', size: 13 }))),
                h('p', null, item?.effect || (conceptEffect(c) === c.cn ? c.def?.split(/[。；]/)[0] || '点击名称查看摄影原理' : conceptEffect(c))),
                h('div', { className: 'll-weight', role: 'group', 'aria-label': `${c.cn}影响程度` },
                  [[1, '点缀'], [2, '辅助'], [3, '主导']].map(([w, label]) => h('button', { key: w, type: 'button', 'aria-pressed': c.weight === w, onClick: () => onWeight(c.id, w) }, label))))
            }),
          orphanIngredients.map((item, index) => h('div', { key: item.slug, className: 'll-ingredient' },
            h('div', { className: 'll-ingredient-top' },
              h('span', { className: 'll-ingredient-index' }, String(chosen.length + index + 1).padStart(2, '0')),
              h('span', { className: 'll-name', style: { fontFamily: 'var(--mono)', fontSize: 13 } }, item.slug),
              h('span', { className: 'll-dim' }, '旧数据'),
              h('button', { className: 'll-remove', type: 'button', 'aria-label': `移除 ${item.slug}`, title: `移除 ${item.slug}`, onClick: () => onRemove(item.slug) }, h(Icon, { name: 'close', size: 13 }))),
            h('p', null, '这个旧配料已不在当前图谱中，请移除后再准备拍法。'),
            h('div', { className: 'll-weight', role: 'group', 'aria-label': `${item.slug}影响程度` },
              [[1, '点缀'], [2, '辅助'], [3, '主导']].map(([w, label]) => h('button', { key: w, type: 'button', 'aria-pressed': item.weight === w, onClick: () => onWeight(item.slug, w) }, label))))),
          summary ? h('details', null, h(DisclosureSummary, null, '查看本次方案摘要'), h('p', { className: 'll-role-note' }, summary)) : null,
          board.ingredients.length || canUndo
            ? h('div', { className: 'll-tools' },
              h('button', { type: 'button', disabled: !canUndo, onClick: onUndo }, h(Icon, { name: 'undo', size: 12 }), '撤销修改'),
              h('button', { type: 'button', disabled: !board.ingredients.length, onClick: onClear }, '清空配料'))
            : null,
          conflict ? h('div', { className: 'll-feedback' }, `${conflict.a.cn}与${conflict.b.cn}可能难以同时突出。${conflict.fix}`,
            h('div', null, h(Btn, { small: true, onClick: proceed, disabled: !board.idea?.trim() }, '进入详情调整拍法'))) : null)),
      h('p', { className: 'll-save', 'data-state': saveState, role: 'status' },
        h(Icon, { name: saving === 'error' ? 'alert' : saving === 'saving' ? 'clock' : 'check', size: 12 }),
        saving === 'error' ? '保存失败，当前修改仍在本页。' : saving === 'saving' ? '正在保存…' : '修改已保存'),
      saving === 'error'
        ? h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          h(Btn, { small: true, icon: 'refresh', onClick: onRetrySave }, '重试保存'),
          h(Btn, { small: true, variant: 'ghost', onClick: onRefresh }, '放弃本页未保存修改并同步'))
        : null),
    h('div', { className: 'll-action' },
      notice ? h('p', { className: 'll-error', role: 'alert' }, notice) : null,
      !comparison && board.idea?.trim() && !board.demo ? h('div', { className: 'll-planning-duration' },
        h(VideoDurationField, { id: 'll-planning-duration', duration: targetVideoDuration(board), videoInfo,
          onChange: onDuration, fieldRef: durationField, disabled: generating, label: '视频时长（准备拍法前）' })) : null,
      h('div', { className: 'll-action-meta' },
        h('span', null, `${board.ingredients.length} 味`),
        h('span', null, `${dimsUsed} 维`),
        h('button', {
          type: 'button', className: 'll-action-spec', onClick: onOpenSettings,
          title: '到创作详情页调整画幅',
          'aria-label': `画幅 ${board.constraints?.aspect || '9:16'}，点击到创作详情页调整`,
        }, board.constraints?.aspect || '9:16', h(Icon, { name: 'settings', size: 11 }))),
      h('button', { type: 'button', className: 'lk-primary', disabled: generating || next.disabled, onClick: proceed }, next.label, h(Icon, { name: 'arrow', size: 16 })),
      generating ? h('p', { role: 'status' }, '正在处理，配料表会在本页更新。') : next.hint ? h('p', { role: 'status' }, next.hint) : null))
}

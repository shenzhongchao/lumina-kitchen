const SERVICES_CSS = `
.ll-services{padding:clamp(18px,3vw,36px);padding-bottom:calc(36px + env(safe-area-inset-bottom,0px));max-width:1120px;margin:0 auto;width:100%;box-sizing:border-box;container-type:inline-size}
.ll-services h2{font:26px/1.3 var(--serif);margin:0 0 8px;color:var(--ink)}
.ll-service-head{display:flex;align-items:center;gap:2px;margin:0 0 4px}
.ll-service-head p{margin:0}
.ll-services p{max-width:72ch;color:var(--ink-2);margin:8px 0 14px;overflow-wrap:anywhere;font-size:13px;line-height:1.7}
.ll-service-tabs,.ll-service-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.ll-service-tabs{display:inline-flex;gap:2px;margin:18px 0 0;padding:3px;border:1px solid var(--rule);border-radius:999px;background:var(--paper-2)}
.ll-service-tabs button{border:0;border-radius:999px;background:transparent;color:var(--muted);font:500 12.5px/1.4 var(--sans);padding:8px 15px;min-height:32px;cursor:pointer;transition:background var(--fast),color var(--fast),box-shadow var(--fast)}
.ll-service-tabs button:hover{color:var(--ink)}
.ll-service-tabs button[aria-pressed="true"]{background:var(--card);color:var(--ink);box-shadow:0 1px 2px #2b261b1f,0 0 0 1px var(--rule-soft)}
.ll-service-grid{display:grid;grid-template-columns:minmax(220px,1fr) minmax(0,1.7fr);gap:22px;padding-top:20px;align-items:start}
.ll-service-grid[data-empty="true"]{grid-template-columns:minmax(0,1fr)}
.ll-service-grid[data-empty="true"] .ll-service-form{width:100%;max-width:640px}
.ll-service-list{min-width:0;padding:14px;border:1px solid var(--rule);border-radius:var(--r-lg);background:var(--card)}
.ll-service-list h3{font:400 18px/1.35 var(--serif);margin:0 0 12px}
.ll-service-form h3{font:400 20px/1.35 var(--serif);margin:0 0 12px;overflow-wrap:anywhere}
.ll-service-form-head{display:flex;align-items:baseline;flex-wrap:wrap;column-gap:12px}
.ll-service-form-head > span{font:600 12px/1.4 var(--sans);color:var(--accent-2);margin-bottom:12px}
.ll-service-form form{padding:16px;border:1px solid var(--rule);border-radius:var(--r-lg);background:var(--card)}
.ll-service-list ul{list-style:none;padding:0;margin:14px 0}
.ll-service-list li{border-bottom:1px solid var(--rule-soft)}
.ll-service-item{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;text-align:left;padding:11px 9px;border:0;border-radius:7px;background:transparent;color:var(--ink);font:inherit;cursor:pointer;overflow-wrap:anywhere;transition:background var(--fast)}
.ll-service-item:hover{background:var(--paper-2)}
.ll-service-item[aria-pressed="true"]{background:var(--accent-soft);color:var(--accent-2)}
.ll-service-item-copy{min-width:0}
.ll-service-item-gear{flex:none;color:var(--muted)}
.ll-service-item:is(:hover,:focus-visible,[aria-pressed="true"]) .ll-service-item-gear{color:var(--accent-2)}
.ll-service-item strong,.ll-service-item small{display:block}.ll-service-item small{font-size:11.5px;color:var(--muted);margin-top:3px}
.ll-service-form{min-width:0}
.ll-service-field{display:flex;flex-direction:column;gap:6px;margin:0 0 16px;font:500 12px/1.4 var(--sans);color:var(--ink-2)}
.ll-services input,.ll-services select{box-sizing:border-box;width:100%;min-height:40px;border:1px solid var(--rule-2);border-radius:var(--r-sm);background:var(--paper-2);color:var(--ink);font:inherit;font-size:13px;padding:9px 10px;transition:border-color var(--fast),box-shadow var(--fast)}
.ll-services :is(button,input,select,h3,[role="status"]){scroll-margin-top:80px;scroll-margin-bottom:16px}
.ll-services input:focus,.ll-services select:focus{outline:none;border-color:var(--ink);box-shadow:var(--ring)}
.ll-services input::placeholder{color:var(--faint);opacity:1}
.ll-service-field small{color:var(--ink-2);font-size:12px;line-height:1.6;overflow-wrap:anywhere}
.ll-service-key{margin-bottom:16px}
.ll-service-key .ll-service-field{margin-bottom:6px}
.ll-service-key-link{color:var(--accent-2);font-size:12px;text-decoration:underline;text-underline-offset:3px}
.ll-service-key-hint{display:block;margin-top:4px;color:var(--ink-2);font-size:12px;line-height:1.6;overflow-wrap:anywhere}
.ll-services .ll-service-warning{color:var(--warn);font-weight:600}
.ll-service-list-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap}
.ll-service-list-head h3{margin-bottom:4px}
.ll-services .ll-service-default{margin:4px 0 12px}
.ll-service-toolbar{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.ll-service-footer{border-top:1px solid var(--rule);margin-top:16px;padding-top:12px;scroll-margin:80px 0 16px}
.ll-service-actions{gap:8px}
.ll-service-feedback{margin:0 0 10px}
.ll-service-feedback:empty{display:none}
.ll-services .ll-service-feedback p{margin:0 0 6px}
.ll-service-feedback [role="alert"] p{color:var(--danger)}
.ll-service-feedback [role="status"] p{color:var(--ok)}
.ll-service-loading{margin-top:18px}
.ll-service-empty{max-width:480px;padding:20px}
.ll-service-empty h3{font-size:20px;margin:0}
.ll-service-empty p{margin:6px 0 14px}
.ll-service-back{display:none}
.ll-service-grid[data-empty="true"] .ll-service-back{display:inline-flex;margin-bottom:8px}
.ll-services details{margin:14px 0}.ll-services summary{cursor:pointer;margin-bottom:12px;font-size:12.5px}
@container(max-width:585px){
  .ll-service-grid{grid-template-columns:minmax(0,1fr);gap:12px}
  .ll-service-grid[data-editing="true"] .ll-service-list{display:none}
  .ll-service-back{display:inline-flex;margin-bottom:8px}
  .ll-services input,.ll-services select,.ll-services .lk-btn,.ll-service-tabs button,.ll-service-item{min-height:44px}
  .ll-services h2{font-size:23px}
}
`

const SERVICE_KEY_LINKS = new Map([
  ['api.openai.com', { name: 'OpenAI', url: 'https://platform.openai.com/api-keys' }],
  ['ark.cn-beijing.volces.com', { name: '火山方舟', url: 'https://ark.volcengine.com/region:cn-beijing/apikey' }],
  ['api.minimax.cn', { name: 'MiniMax', url: 'https://platform.minimax.cn/console/keys' }],
])

function serviceKeyLink(baseUrl) {
  try { return SERVICE_KEY_LINKS.get(new URL(baseUrl).hostname) }
  catch { return undefined }
}

function serviceKeyEnvironment(preset, draft) {
  if (!preset?.keyEnvironment || (draft.configured && !draft.keyEnvironment)) return null
  if (!preset.keyRequiresPresetOrigin) return preset.keyEnvironment
  try { return new URL(draft.baseUrl).origin === new URL(preset.baseUrl).origin ? preset.keyEnvironment : null }
  catch { return null }
}

function ServiceSettings({ onMedia, onDirty, onBack, embedded = false, initialKind = 'image' }) {
  const [settings, setSettings] = React.useState(null)
  const [kind, setKind] = React.useState(initialKind)
  const [draft, setDraft] = React.useState(null)
  const [dirty, setDirty] = React.useState(false)
  const [busy, setBusy] = React.useState('load')
  const [feedback, setFeedback] = React.useState(null)
  const listHeading = React.useRef(null)
  const formHeading = React.useRef(null)
  const presetField = React.useRef(null)
  const keyField = React.useRef(null)
  const formStatus = React.useRef(null)
  const focus = ref => requestAnimationFrame(() => ref.current?.focus())
  const blank = protocol => {
    const preset = settings.presets[protocol]
    return { protocol, name: preset.name, baseUrl: preset.baseUrl, model: preset.model, apiKey: '', size: '', quality: 'medium', complexity: '' }
  }
  React.useEffect(() => { load(); return () => onDirty(false) }, [])
  React.useEffect(() => {
    onDirty(dirty || Boolean(busy))
    const prevent = event => { if (dirty || busy) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', prevent)
    return () => window.removeEventListener('beforeunload', prevent)
  }, [dirty, busy])
  async function load(area = 'load') {
    setBusy('load'); setFeedback(null)
    try { const data = await api('/services'); setSettings(data.settings); onMedia(data.media) }
    catch (err) { setFeedback({ area, error: true, text: err.message }) }
    finally { setBusy(null) }
  }
  async function discard() {
    if (!dirty) return true
    return requestConfirm({ title: '放弃未保存的服务配置？', message: '已填写的字段和新密钥尚未保存。', confirmLabel: '放弃修改', tone: 'danger', nativeText: '放弃未保存的服务配置？' })
  }
  async function edit(profile, target = profile ? formHeading : presetField) {
    if (profile && draft?.id === profile.id) { focus(target); return }
    if (busy || !(await discard())) return
    const protocol = Object.keys(settings.presets).find(key => settings.presets[key].kind === kind)
    setDraft(profile ? { ...profile, apiKey: '' } : blank(protocol)); setDirty(false); setFeedback(null)
    focus(target)
  }
  async function backToList() {
    if (busy || !(await discard())) return
    setDraft(null); setDirty(false); setFeedback(null)
    focus(listHeading)
  }
  async function changeKind(value) {
    if (busy || value === kind || !(await discard())) return
    setKind(value); setDraft(null); setDirty(false); setFeedback(null)
  }
  function change(key, value) { setDraft(d => ({ ...d, [key]: value })); setDirty(true); setFeedback(null) }
  async function send(action, details, area = 'form') {
    if (busy) return
    setBusy(action); setFeedback(null)
    try {
      const data = await api('/services', { action, kind, expectedRevision: settings.revision, ...details })
      setSettings(data.settings); onMedia(data.media)
      let text
      if (action === 'save') {
        const saved = data.settings.profiles.find(p => p.kind === kind && p.name === draft.name.trim())
        setDraft({ ...saved, apiKey: '' }); setDirty(false)
        text = '配置已保存。'
      }
      if (action === 'default') text = details.id ? `已设为默认${label}服务。` : `已取消默认${label}服务。`
      if (action === 'delete') {
        setDraft(null); setDirty(false)
        area = 'list'; text = '配置已删除，已有任务仍保留原服务信息。'
      }
      setFeedback({ area, text })
      if (area === 'form') requestAnimationFrame(() => {
        formStatus.current?.focus({ preventScroll: true })
        formStatus.current?.closest('.ll-service-footer')?.scrollIntoView({ block: 'nearest' })
      })
      if (action === 'delete') focus(listHeading)
    } catch (err) { setFeedback({ area, error: true, text: err.message }) }
    finally { setBusy(null) }
  }
  const label = kind === 'image' ? '图片' : '视频'
  const effective = settings?.effective[kind]
  const profiles = settings?.profiles.filter(p => p.kind === kind) || []
  const defaultProfile = profiles.find(p => p.id === effective?.id)
  const protocols = Object.entries(settings?.presets || {}).filter(([, preset]) => preset.kind === kind)
  const openaiImage = draft?.protocol === 'openai-image'
  const fixedModel = draft?.protocol === 'minimax-video'
  const keyLink = serviceKeyLink(draft?.baseUrl)
  const preset = settings?.presets[draft?.protocol]
  const savedDraft = profiles.find(profile => profile.id === draft?.id)
  const keyEnvironment = draft && serviceKeyEnvironment(preset, { ...draft, configured: savedDraft?.configured, keyEnvironment: savedDraft?.keyEnvironment })
  const missingKey = Boolean(draft && !draft.apiKey.trim() && !keyEnvironment && !savedDraft?.configured)
  const isDefault = Boolean(draft?.id && draft.id === effective?.id)
  const keyDescription = draft?.apiKey.trim() ? '保存配置后将使用此密钥。'
    : keyEnvironment ? `已读取宿主密钥（${keyEnvironment}）。填写新密钥可替换。`
    : savedDraft?.configured ? '已保存本机密钥。留空保留，填写新密钥可替换。'
    : '缺少密钥。可以先保存配置，补填密钥后才能生成。'
  const protocolNote = {
    'openai-image': '服务需兼容 OpenAI 的 /images/generations 接口及所选参数。',
    'ark-seedream': '使用火山方舟密钥，输出 2K 单张图片，尺寸随画幅调整。',
    'minimax-image': '使用 MiniMax 开放平台密钥，输出 2K 单张图片，尺寸随画幅调整。',
    'minimax-video': '使用 MiniMax 开放平台密钥，生成 768P 文生视频，支持 4–15 秒。',
    'ark-seedance': '使用火山方舟密钥，生成 720p 文生视频，支持 4–30 秒。',
  }
  const override = key => isDefault && effective.overrides?.[key]
    ? h('small', { id: `ll-service-override-${key}` }, '实际使用 ', h('code', null, effective[key]), '（来自 ', h('code', null, effective.overrides[key]), '）。') : null
  const input = (key, title, extra = {}) => {
    const note = override(key)
    return h('div', { className: 'll-service-field' }, h('label', { htmlFor: `ll-service-${key}` }, title),
      h('input', { id: `ll-service-${key}`, value: draft[key] || '', onChange: e => change(key, e.target.value), disabled: Boolean(busy),
        'aria-describedby': note?.props.id, ...extra }), note)
  }
  const select = (key, title, choices) => {
    const note = override(key)
    return h('div', { className: 'll-service-field' }, h('label', { htmlFor: `ll-service-${key}` }, title),
      h('select', { id: `ll-service-${key}`, value: draft[key] || '', disabled: Boolean(busy), 'aria-describedby': note?.props.id,
        onChange: e => change(key, e.target.value) }, choices.map(([value, text]) => h('option', { key: value, value }, text))), note)
  }
  const status = area => feedback?.area === area ? h('div', { className: 'll-service-feedback' },
    feedback.error ? h(React.Fragment, null, h('div', { role: 'alert' }, h('p', null, feedback.text)),
      h(Btn, { small: true, variant: 'quiet', disabled: Boolean(busy), onClick: () => load(area) }, settings ? '重新加载配置（保留草稿）' : '重试加载'))
      : h('div', { role: 'status', tabIndex: -1, ref: area === 'form' ? formStatus : undefined }, h('p', null, feedback.text))) : null
  const addButton = primary => h(Btn, { icon: 'plus', small: !primary, primary, disabled: Boolean(busy), onClick: () => edit(null) }, `添加${label}服务`)
  return h('section', { className: 'll-services', 'aria-label': 'API配置' },
    h('style', null, SERVICES_CSS),
    !embedded ? h(Btn, { small: true, variant: 'quiet', disabled: Boolean(busy), onClick: onBack }, '返回创作') : null,
    !embedded ? h('h2', null, 'API配置') : null,
    h('div', { className: 'll-service-head' },
      h('p', null, '数据保存在本机；生成时提示词会发送到所选 API 服务。'),
      h(HelpTip, { label: 'API 配置', text: '图片与视频服务分开管理，可保存多组配置。保存设置不会提交生成，也不产生模型调用费用；更换默认服务只影响后续生成。' })),
    h('div', { className: 'll-service-tabs', role: 'group', 'aria-label': '服务类型' }, ['image', 'video'].map(type => h('button', { key: type, type: 'button', disabled: Boolean(busy), 'aria-pressed': kind === type, onClick: () => changeKind(type) }, type === 'image' ? '图片生成' : '视频生成'))),
    !settings && busy ? h('p', { className: 'll-service-loading', role: 'status' }, '正在加载服务配置…') : null,
    status('load'),
    settings ? h('div', { className: 'll-service-grid', 'data-editing': Boolean(draft), 'data-empty': !profiles.length },
        profiles.length ? h('aside', { className: 'll-service-list' },
          h('div', { className: 'll-service-list-head' }, h('h3', { ref: listHeading, tabIndex: -1 }, `${label}服务列表`), addButton(false)),
          effective?.id && !effective.configured ? h('div', { className: 'll-service-toolbar' },
            h('p', { className: 'll-service-default ll-service-warning' }, `默认${label}服务缺少密钥，暂时无法生成。`),
            h(Btn, { small: true, variant: 'quiet', disabled: Boolean(busy), onClick: () => edit(defaultProfile, keyField) }, '补填密钥')) : null,
          h('label', { className: 'll-service-field' }, `默认${label}服务`,
            h('select', { value: settings.defaults[kind] || '', disabled: Boolean(busy), onChange: e => send('default', { id: e.target.value || null }, 'list') },
              h('option', { value: '' }, '未选择默认服务'),
              profiles.map(p => h('option', { key: p.id, value: p.id }, p.name)))),
          status('list'),
          h('ul', null, profiles.map(profile => h('li', { key: profile.id },
            h('button', {
              type: 'button', className: 'll-service-item', disabled: Boolean(busy),
              'aria-pressed': draft?.id === profile.id,
              onClick: () => edit(profile),
            },
            h('span', { className: 'll-service-item-copy' },
              h('strong', null, profile.name),
              h('small', null, profile.id === effective?.id ? '默认 · ' : '',
                !profile.keyAvailable ? h('span', { className: 'll-service-warning' }, '缺少密钥 · ') : null,
                profile.id === effective?.id ? effective.model : profile.model)),
            h(Icon, { name: 'settings', className: 'll-service-item-gear', size: 18 }))))))
          : !draft ? h('div', { className: 'll-service-list ll-service-empty' },
            h('h3', { ref: listHeading, tabIndex: -1 }, `还没有${label}服务`),
            h('p', null, `添加一组服务以开始配置${label}生成。`), status('list'), addButton(true)) : null,
        draft ? h('div', { className: 'll-service-form' },
          h(Btn, { className: 'll-service-back', icon: 'back', small: true, variant: 'quiet', disabled: Boolean(busy), onClick: backToList }, '返回服务列表'),
          h('form', { onSubmit: e => { e.preventDefault(); if (!draft.id || dirty) send('save', { profile: draft }) } },
          h('div', { className: 'll-service-form-head' },
            h('h3', { ref: formHeading, tabIndex: -1 }, draft.id ? `编辑 ${savedDraft?.name || draft.name}` : `添加${label}服务`),
            isDefault ? h('span', null, `默认${label}服务`) : null),
          h('label', { className: 'll-service-field' }, '服务预设',
            h('select', { ref: presetField, value: draft.protocol, disabled: Boolean(busy || draft.id), onChange: async e => {
              const protocol = e.target.value
              if (!(await discard())) return
              setDraft(blank(protocol)); setDirty(true); setFeedback(null)
            } }, protocols.map(([protocol, preset]) => h('option', { key: protocol, value: protocol }, preset.name)))),
          h('p', null, protocolNote[draft.protocol]),
          input('name', '服务名称', { required: true, maxLength: 60, placeholder: `例如：我的${label}服务` }),
          input('baseUrl', 'API 地址', { required: true, type: 'url', autoComplete: 'off' }),
          h('div', { className: 'll-service-key' },
            input('apiKey', 'API 密钥', { ref: keyField, type: 'password', autoComplete: 'new-password', maxLength: 4096, 'aria-describedby': 'll-service-key-source' }),
            h('small', { className: cx('ll-service-key-hint', missingKey && 'll-service-warning'), id: 'll-service-key-source' }, keyDescription),
            keyLink
              ? h('a', { className: 'll-service-key-link', href: keyLink.url, target: '_blank', rel: 'noopener noreferrer' }, `前往 ${keyLink.name} 获取 API 密钥`)
              : h('span', { className: 'll-service-key-hint' }, '请到当前服务商的控制台获取 API 密钥。'),
            missingKey && preset?.keyEnv?.length ? h('small', { className: 'll-service-key-hint' },
              '也可设置宿主环境变量 ', h('code', null, preset.keyEnv.join(' / ')), preset.keyRequiresPresetOrigin ? '（仅预设服务域名支持）。' : '。') : null),
          input('model', '模型 ID', { required: !fixedModel, readOnly: fixedModel, maxLength: 160 }),
          openaiImage ? h('details', null, h(DisclosureSummary, null, '图片默认参数'),
            select('size', '图片尺寸', [['', '跟随实验画幅'], ['1024x1024', '1024 × 1024'], ['1536x1024', '1536 × 1024'], ['1024x1536', '1024 × 1536']]),
            select('quality', '图片质量', [['low', '低'], ['medium', '中'], ['high', '高'], ['auto', '自动']]),
            select('complexity', '复杂度', [['', '不发送此参数'], ['low', '低'], ['medium', '中'], ['high', '高']])) : null,
          h('p', null, '手动填写的密钥保存在本机插件数据目录。'),
          h('div', { className: 'll-service-footer' },
            status('form'),
            draft.id && dirty ? h('p', null, '有未保存的修改。') : null,
            draft.id && !dirty && feedback?.area !== 'form' ? h('p', null, isDefault ? `已保存 · 默认${label}服务` : '已保存 · 未设为默认') : null,
            draft.id && !dirty && missingKey ? h('p', { className: 'll-service-warning' }, isDefault ? '缺少密钥，暂时无法生成。' : '缺少密钥，设为默认后仍需补填才能生成。') : null,
            h('div', { className: 'll-service-actions' },
            h('button', { type: 'submit', className: cx('lk-btn', (!draft.id || dirty) && 'lk-primary'), disabled: Boolean(busy || (draft.id && !dirty)) }, busy === 'save' ? '正在保存…' : '保存配置'),
            draft.id && !dirty && !isDefault ? h(Btn, { primary: !missingKey, disabled: Boolean(busy), onClick: () => send('default', { id: draft.id }) }, busy === 'default' ? '正在设为默认…' : `设为默认${label}服务`) : null,
            draft.id && !dirty && missingKey ? h(Btn, { small: true, variant: 'quiet', disabled: Boolean(busy), onClick: () => focus(keyField) }, '补填密钥') : null,
            draft.id ? h(Btn, { small: true, variant: 'quiet', disabled: Boolean(busy || isDefault), onClick: async () => {
              if (await requestConfirm({ title: '删除这组服务配置？', message: '已有生成任务会继续保留原服务信息与所需凭据。', confirmLabel: '删除配置', tone: 'danger', nativeText: '删除这组服务配置？' })) send('delete', { id: draft.id })
            } }, '删除配置') : null),
            isDefault ? h('p', null, '删除前请先切换或取消默认服务。') : null))) : null) : null)
}

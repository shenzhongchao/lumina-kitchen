// 页面：状态、请求、三栏组合（维度树 / 图谱 / 配料表+灶台），以及侧栏入口的注册。
function snapshot(board) {
  return JSON.stringify({ id: board.id, title: board.title, idea: board.idea, constraints: board.constraints, retained: board.retained || {}, shot: board.shot || {}, panelIdeaOnly: Boolean(board.panelIdeaOnly), ingredients: board.ingredients, targets: board.targets })
}

function pagePatch(state, update) {
  return { ...state, ...update, ...(Object.hasOwn(update, 'notice') ? { noticeKind: update.noticeKind || 'error' } : {}) }
}

function PageNotice({ message, kind }) {
  return message
    ? h('p', { className: `ll-browser-notice ${kind === 'success' ? 'll-success' : 'll-error'}`, role: kind === 'success' ? 'status' : 'alert' },
      h(Icon, { name: kind === 'success' ? 'check' : 'alert', size: 15 }),
      h('span', null, message))
    : null
}

async function api(path, body) {
  const res = await fetch(`${BASE}${path}`, body === undefined ? {} : {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    const error = new Error(data?.error || `HTTP ${res.status}`)
    error.data = data
    throw error
  }
  return data
}

function Detail({ motion, concept, added, onAdd, onClose }) {
  const dialog = React.useRef(null)
  React.useEffect(() => {
    const previous = document.activeElement
    const node = dialog.current
    node?.querySelector('button')?.focus()
    function keys(event) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const controls = [...node.querySelectorAll('button:not(:disabled), [tabindex="0"]')]
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    node?.addEventListener('keydown', keys)
    return () => { node?.removeEventListener('keydown', keys); previous?.focus() }
  }, [])
  const section = (label, ...body) => h('div', { className: 'lk-section' }, h('h3', null, label), ...body)
  return h('div', { className: 'lk-overlay', onClick: onClose },
    h('aside', { ref: dialog, className: 'lk-detail', onClick: e => e.stopPropagation(), role: 'dialog', 'aria-modal': 'true', 'aria-label': concept.cn },
      h('div', { className: 'lk-detail-head' },
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('span', { className: 'lk-kicker', 'data-plain': 'true' }, 'ATLAS ENTRY'),
          h('h2', { className: 'lk-detail-title' }, concept.cn),
          h('div', { className: 'lk-detail-en', lang: 'en' }, concept.en),
          added ? h('span', { className: 'lk-chip', 'data-tone': 'accent', style: { marginTop: 8 } }, h(Icon, { name: 'check', size: 12 }), '已在配料表') : null),
        h('button', { type: 'button', className: 'lk-x', 'aria-label': t('detail.close'), onClick: onClose }, h(Icon, { name: 'close', size: 17 }))),
      h('div', { className: 'lk-detail-body' },
        concept.preview
          ? h('figure', { className: 'lk-preview' },
            h(MotionImage, { concept, motion, preview: true, alt: '' }))
          : null,
        concept.def ? section(t('detail.def'), h('p', { key: 'def' }, concept.def)) : null,
        concept.syntax ? section(t('detail.syntax'), h('p', { className: 'lk-quote' }, concept.syntax)) : null,
        concept.case ? section(t('detail.case'), h('p', null, concept.case)) : null,
        concept.wrong?.length
          ? section(t('detail.wrong'), ...concept.wrong.map((w, i) => h('p', { key: i, style: { color: 'var(--muted)' } }, `× ${w}`)))
          : null,
        concept.combo?.length
          ? section(t('detail.combo'), h('p', { style: { color: 'var(--muted)' } }, concept.combo.slice(0, 8).join(' / ')))
          : null,
        concept.variants?.length
          ? section(t('detail.variants'), ...concept.variants.map((v, i) =>
            h('p', { key: i, style: { color: 'var(--muted)' } }, `${v.cn}${v.syntax ? ` · ${v.syntax}` : ''}`)))
          : null,
        concept.tags?.length
          ? section(t('detail.tags'), h('div', { className: 'lk-tagrow' }, concept.tags.map(tag => h('span', { key: tag, className: 'lk-chip', 'data-tone': 'ghost' }, tag))))
          : null,
      ),
      h('div', { className: 'lk-detail-foot' },
        h('button', {
          type: 'button',
          className: 'lk-primary',
          'data-on': added ? 'true' : 'false',
          disabled: added,
          onClick: () => onAdd(concept.id),
        }, h(Icon, { name: added ? 'check' : 'plus', size: 15 }), added ? t('detail.remove') : t('detail.add')),
        h('p', null, added ? '已在这个创作的配料表中。' : '加入后只应用这个摄影概念，不会带入例图中的人物、服装或场景。')),
    ))
}

function JobTray({ items, onOpen }) {
  const extra = items.length > 4 ? ` +${items.length - 4}` : ''
  return h('div', { className: 'll-jobs', role: 'status' },
    h(StatusDot, { tone: 'busy' }),
    h('span', { className: 'll-jobs-title' }, `${items.length} 个生成任务进行中`),
    h('span', { className: 'll-jobs-list' },
      items.slice(0, 4).map(item => h('span', { key: item.id, className: 'll-job-chip' },
        h(Icon, { name: item.kind === 'video' ? 'video' : 'image', size: 12 }),
        `${item.kind === 'video' ? '视频' : '参考图'}${item.variantId ? ` · ${item.variantId}` : ''}`)),
      extra ? h('span', { className: 'll-job-chip' }, extra) : null),
    h('button', { type: 'button', className: 'll-jobs-link', onClick: onOpen }, '查看方案', h(Icon, { name: 'arrow', size: 13 })))
}

function ToastItem({ toast, onDismiss, onResults }) {
  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 6500)
    return () => clearTimeout(timer)
  }, [toast.id])
  return h('div', { className: 'lk-toast', 'data-tone': toast.tone },
    h(StatusDot, { tone: toast.tone === 'ok' ? 'ok' : toast.tone === 'warn' ? 'warn' : 'error' }),
    h('div', { className: 'lk-toast-body' },
      h('strong', null, toast.title),
      h('span', null, toast.detail)),
    toast.status === 'succeeded'
      ? h('button', { type: 'button', className: 'lk-toast-action', onClick: onResults }, '查看结果')
      : null,
    h('button', { type: 'button', className: 'lk-toast-x', 'aria-label': '关闭提示', onClick: () => onDismiss(toast.id) }, h(Icon, { name: 'close', size: 14 })))
}

function ToastStack({ toasts, onDismiss, onResults }) {
  if (!toasts.length) return null
  return h('div', { className: 'lk-toasts', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'false' },
    toasts.map(toast => h(ToastItem, { key: toast.id, toast, onDismiss, onResults })))
}

function KitchenPage() {
  const motion = useMotionDownloads()
  const [state, setState] = React.useState({
    loading: true,
    error: null,
    shelf: null,
    boards: [],
    activeId: null,
    model: null,
    canUndo: false,
    view: 'atlas',
    utility: null,
    generating: false,
    busy: null,
    stage: 0,
    notice: null,
    query: '',
    dimId: null,
    topicId: null,
    detail: null,
    pane: 'atlas',
    density: 'card',
    saving: 'saved',
    media: null,
    jobs: {},
    toasts: [],
    settingsFocus: 0,
    durationFocus: 0,
  })
  const [renaming, setRenaming] = React.useState(false)
  const [draftTitle, setDraftTitle] = React.useState('')
  const titleInput = React.useRef(null)
  const renameCancelled = React.useRef(false)
  React.useEffect(() => {
    if (!renaming) return
    titleInput.current?.focus()
    titleInput.current?.select()
  }, [renaming])
  const servicesDirty = React.useRef(false)
  const revisions = React.useRef(new Map())
  const syncing = React.useRef(false)
  const editEpoch = React.useRef(0)
  const saveTimer = React.useRef(null)
  const pending = React.useRef(null)
  const lastSaved = React.useRef('')
  const requestBusy = React.useRef(false)
  const saveQueue = React.useRef(Promise.resolve())
  const dirtyRef = React.useRef(false)
  const startDirty = React.useRef(false)
  const notifiedJobs = React.useRef(new Set())

  const patch = React.useCallback(update => setState(s => pagePatch(s, update)), [])

  const load = React.useCallback(async () => {
    patch({ loading: true, error: null })
    try {
      const [shelfData, boardData] = await Promise.all([
        (async () => {
          const response = await fetch(`${BASE}/shelf`)
          const data = await response.json().catch(() => null)
          if (!response.ok) {
            const error = new Error(data?.error || `HTTP ${response.status}`)
            error.data = data
            throw error
          }
          return data
        })(),
        api('/boards'),
      ])
      const first = shelfData.dimensions?.[0]
      patch({
        loading: false,
        shelf: shelfData,
        model: shelfData.model || boardData.model || null,
        media: boardData.media || shelfData.media || null,
        boards: boardData.boards.map(panelIdeaBoard),
        activeId: boardData.activeId,
        view: firstView(boardData.boards.find(b => b.id === boardData.activeId)),
        canUndo: boardData.canUndo,
        dimId: first?.id || null,
        topicId: null,
        error: null,
      })
      for (const b of boardData.boards) revisions.current.set(b.id, b.revision)
      const active = boardData.boards.find(b => b.id === boardData.activeId)
      lastSaved.current = active ? snapshot(active) : ''
    } catch (err) {
      patch({ loading: false, error: { message: err.message, data: err.data || null } })
    }
  }, [patch])

  React.useEffect(() => {
    load()
  }, [load])

  const shelf = state.shelf
  const dims = shelf?.dimensions || []
  const concepts = shelf?.concepts || []
  const byId = React.useMemo(() => {
    const map = new Map()
    for (const c of concepts) map.set(c.id, c)
    return map
  }, [concepts])
  const dimMap = React.useMemo(() => new Map(dims.map(d => [d.id, d])), [dims])
  const board = state.boards.find(b => b.id === state.activeId) || state.boards[0] || null
  const analysis = React.useMemo(() => (board ? analyze(board, byId, dimMap) : null), [board, byId, dimMap])
  dirtyRef.current = Boolean(board && snapshot(board) !== lastSaved.current)

  function persist(next) {
    patch({ saving: 'saving' })
    const task = saveQueue.current.catch(() => {}).then(() => api('/boards', { action: 'update', id: next.id, board: next, expectedRevision: revisions.current.get(next.id) }))
    saveQueue.current = task
    return task.then(data => {
      const saved = data.boards.find(b => b.id === next.id)
      revisions.current.set(next.id, saved.revision)
      lastSaved.current = snapshot(saved)
      if (pending.current && snapshot(pending.current) === snapshot(next)) pending.current = null
      setState(s => ({ ...s, canUndo: data.canUndo, saving: pending.current ? 'saving' : 'saved', boards: s.boards.map(b => b.id === next.id ? (snapshot(b) === snapshot(next) ? { ...b, ...saved } : { ...b, title: saved.title, transient: saved.transient, revision: saved.revision, shot: saved.shot, lab: saved.lab }) : b) }))
      return data
    }).catch(err => {
      if (!pending.current) pending.current = next
      patch({ saving: 'error', notice: `未能保存：${err.message}` })
      throw err
    })
  }

  async function flush() {
    clearTimeout(saveTimer.current)
    if (pending.current) await persist(pending.current)
    else await saveQueue.current
  }

  React.useEffect(() => {
    if (!board || snapshot(board) === lastSaved.current) return
    pending.current = board
    patch({ saving: 'saving' })
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(board).catch(() => {}), 600)
  }, [board])

  React.useEffect(() => () => {
    clearTimeout(saveTimer.current)
    const next = pending.current
    if (next) saveQueue.current.catch(() => {}).then(() => api('/boards', { action: 'update', id: next.id, board: next, expectedRevision: revisions.current.get(next.id) })).catch(() => {})
  }, [])

  function mutate(fn) {
    if (state.generating) return
    editEpoch.current++
    setState(s => {
      const current = s.boards.find(b => b.id === s.activeId) || s.boards[0]
      if (!current) return s
      const next = fn({ ...current, ingredients: [...(current.ingredients || [])], constraints: { ...(current.constraints || {}) } })
      // 真正落盘时会记一条撤销；这里先让按钮可用，不必等下一轮请求
      return { ...s, canUndo: true, boards: s.boards.map(b => (b.id === current.id ? next : b)) }
    })
  }

  const addIngredient = id => {
    if (board.ingredients.length >= 24 && !board.ingredients.some(i => i.slug === id)) {
      patch({ notice: '每份配料表最多 24 个概念，请先移除不需要的配料。' })
      return
    }
    mutate(board => {
      const exists = board.ingredients.some(i => i.slug === id)
      return {
        ...board,
        ingredients: exists ? board.ingredients.filter(i => i.slug !== id) : [...board.ingredients, { slug: id, weight: 2 }],
      }
    })
  }

  function setWeight(id, weight) {
    mutate(board => ({ ...board, ingredients: board.ingredients.map(i => (i.slug === id ? { ...i, weight } : i)) }))
  }

  function removeIngredient(id) {
    mutate(board => ({ ...board, ingredients: board.ingredients.filter(i => i.slug !== id) }))
  }

  function setTitle(title) {
    mutate(board => ({ ...board, title }))
  }

  function beginRename() {
    if (state.generating) return
    renameCancelled.current = false
    setDraftTitle(board?.title || '')
    setRenaming(true)
  }
  function commitRename() {
    if (!renaming || renameCancelled.current) { renameCancelled.current = false; return }
    setRenaming(false)
    const title = draftTitle.trim().slice(0, 40)
    if (title && title !== board?.title) setTitle(title)
  }
  function cancelRename() {
    renameCancelled.current = true
    setRenaming(false)
  }

  function setIdea(idea) {
    mutate(board => ({ ...board, idea }))
  }

  function setConstraints(partial) {
    mutate(board => ({ ...board, constraints: { ...board.constraints, ...partial } }))
  }

  async function undo() {
    if (requestBusy.current) return
    requestBusy.current = true
    editEpoch.current++
    patch({ generating: true })
    try {
      await flush()
      const data = await api('/boards', { action: 'undo', id: board.id, expectedRevision: revisions.current.get(board.id) })
      acceptBoards(data)
      patch({ view: 'atlas' })
    } catch (err) {
      patch({ notice: err.message })
    } finally { requestBusy.current = false; patch({ generating: false }) }
  }

  function clearBoard() {
    mutate(board => ({ ...board, ingredients: [] }))
  }

  function acceptBoards(data, { preserveActive = false } = {}) {
    setRenaming(false)
    for (const b of data.boards) revisions.current.set(b.id, b.revision)
    const activeId = preserveActive ? (board?.id || data.activeId) : data.activeId
    const active = data.boards.find(b => b.id === activeId)
    lastSaved.current = active ? snapshot(active) : ''
    pending.current = null
    patch({ boards: data.boards.map(panelIdeaBoard), activeId, canUndo: data.canUndo, saving: 'saved', ...(data.model ? { model: data.model } : {}), ...(data.media ? { media: data.media } : {}) })
  }

  async function runLab(action, extra = {}, override = null) {
    if (!board || requestBusy.current) return
    if (action !== 'adopt') {
      try { if (!(await requestConfirm(textCallOptions(board, state.model, action, extra.duration)))) return } catch (err) { patch({ notice: err.message }); return }
    }
    if (requestBusy.current) return
    requestBusy.current = true
    editEpoch.current++
    const view = ['recommend', 'compose'].includes(action) ? 'atlas' : 'create'
    patch({ generating: true, busy: action, notice: null, view, pane: view === 'atlas' ? 'board' : 'atlas' })
    try {
      if (override) { clearTimeout(saveTimer.current); await persist(override) }
      else await flush()
      const data = await api('/lab', { id: board.id, action, expectedRevision: revisions.current.get(board.id), ...extra })
      acceptBoards(data)
      if (action === 'compose') patch({ noticeKind: 'success', notice: '推荐配料已加入，可调整影响程度。' })
      return true
    } catch (err) {
      if (err.data?.media) patch({ media: err.data.media })
      if (action === 'retime') throw err
      patch({ notice: err.message })
    } finally {
      requestBusy.current = false
      patch({ generating: false, busy: null })
    }
  }

  async function startMedia(kind, planId, variantId, force, serviceRevision) {
    if (!board || requestBusy.current) return
    if (board.demo) { patch({ notice: '入门练习不调用模型。请新建自己的实验。' }); return }
    requestBusy.current = true
    editEpoch.current++
    patch({ generating: true, busy: kind, notice: null })
    try {
      await flush()
      const data = await api(`/media/${kind}`, {
        id: board.id,
        expectedRevision: revisions.current.get(board.id),
        planId,
        variantId,
        force: Boolean(force),
        serviceRevision,
      })
      acceptBoards(data)
      if (data.job) setState(s => ({ ...s, resultFocus: { kind, runIds: [] }, jobs: { ...s.jobs, [data.job.id]: data.job } }))
    } catch (err) {
      patch({ notice: err.message })
    } finally {
      requestBusy.current = false
      patch({ generating: false, busy: null })
    }
  }

  async function recoverMedia(jobId, taskId) {
    if (requestBusy.current) return
    requestBusy.current = true
    patch({ generating: true, busy: 'video', notice: null })
    try {
      const data = await api('/media/recover', { id: jobId, taskId })
      acceptBoards(data)
      if (data.job) setState(s => ({ ...s, jobs: { ...s.jobs, [data.job.id]: data.job } }))
    } catch (err) {
      patch({ notice: err.message })
    } finally {
      requestBusy.current = false
      patch({ generating: false, busy: null })
    }
  }

  const activeJobIds = React.useMemo(() => {
    const ids = new Set()
    for (const item of state.boards) {
      for (const run of item.lab?.runs || []) {
        if (run.jobId && ['submitting', 'queued', 'running'].includes(run.status)) ids.add(run.jobId)
      }
    }
    return [...ids]
  }, [state.boards])

  const jobItems = React.useMemo(() => {
    const current = state.boards.find(item => item.id === state.activeId)
    const items = []
    for (const run of current?.lab?.runs || []) {
      if (!run.jobId) continue
      const status = state.jobs[run.jobId]?.status || run.status
      if (['submitting', 'queued', 'running'].includes(status)) {
        items.push({ id: run.jobId, kind: run.kind, variantId: run.variantId, status })
      }
    }
    return items
  }, [state.boards, state.jobs, state.activeId])

  function notifyJob(job) {
    if (!job?.id || notifiedJobs.current.has(job.id)) return
    notifiedJobs.current.add(job.id)
    const success = job.status === 'succeeded'
    const uncertain = job.status === 'uncertain'
    const kindLabel = job.kind === 'video' ? '视频' : '参考图'
    setState(s => ({
      ...s,
      toasts: [...s.toasts.slice(-2), {
        id: `${job.id}-${Date.now()}`,
        tone: success ? 'ok' : uncertain ? 'warn' : 'error',
        status: job.status,
        title: success ? `${kindLabel}已生成` : uncertain ? `${kindLabel}结果待核对` : `${kindLabel}生成未完成`,
        detail: success ? '已保存到作品历史，可对照或继续修改。' : uncertain ? '请先核对服务商账单或任务状态，再决定是否重试。' : (job.error ? String(job.error).slice(0, 90) : '可查看任务详情后重试。'),
      }],
    }))
  }

  React.useEffect(() => {
    if (!activeJobIds.length) return
    let cancelled = false
    let running = false
    const tick = async () => {
      if (running) return
      running = true
      try {
        for (const id of activeJobIds) {
          try {
            const data = await api(`/media/job?id=${encodeURIComponent(id)}`)
            if (cancelled) return
            if (data.job) setState(s => ({ ...s, jobs: { ...s.jobs, [data.job.id]: data.job } }))
            if (data.job && ['succeeded', 'failed', 'rejected', 'uncertain'].includes(data.job.status)) {
              notifyJob(data.job)
              if (!requestBusy.current && !pending.current && !dirtyRef.current) acceptBoards(data, { preserveActive: true })
            }
          } catch {
            // A transient poll failure must not hide the existing result.
          }
        }
      } finally {
        running = false
      }
    }
    tick()
    const timer = setInterval(tick, 2000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [activeJobIds.join('|')])

  function answer(question, option) {
    runLab('recommend', { answer: { prompt: question, option } })
  }

  async function changeBoard(action, id, extra = {}) {
    if (requestBusy.current) return
    if (!(await canLeavePage())) return
    requestBusy.current = true
    editEpoch.current++
    patch({ generating: true, notice: null })
    try {
      await flush()
      const data = await api('/boards', { action, id, expectedRevision: revisions.current.get(id), ...extra })
      acceptBoards(data)
      patch({ view: action === 'create' ? 'atlas' : firstView(data.boards.find(b => b.id === data.activeId)), utility: ['rename', 'archive', 'restore', 'delete'].includes(action) ? 'experiments' : null, pane: action === 'create' ? 'board' : 'atlas', query: '', detail: null })
      return true
    } catch (err) { patch({ notice: err.message }) }
    finally { requestBusy.current = false; patch({ generating: false }) }
  }

  async function refreshShared() {
    if (syncing.current || requestBusy.current || pending.current || dirtyRef.current) return
    syncing.current = true
    const epoch = editEpoch.current
    try {
      const data = await api('/boards')
      if (epoch === editEpoch.current && !pending.current && !requestBusy.current && !dirtyRef.current) acceptBoards(data)
    } catch (err) { patch({ notice: `同步失败：${err.message}` }) }
    finally { syncing.current = false }
  }
  React.useEffect(() => {
    const timer = setInterval(refreshShared, 2500)
    return () => clearInterval(timer)
  }, [])

  async function discardAndRefresh() {
    editEpoch.current++
    clearTimeout(saveTimer.current)
    try { await saveQueue.current } catch {}
    pending.current = null
    acceptBoards(await api('/boards'))
    patch({ notice: null })
  }

  const fire = () => runLab('design')

  async function begin(action, idea) {
    if (requestBusy.current || (action !== 'start' && !(await canLeavePage()))) return
    requestBusy.current = true
    editEpoch.current++
    patch({ generating: true, notice: null })
    try {
      await flush()
      const data = await api('/onboarding', { action, id: board.id, expectedRevision: revisions.current.get(board.id), idea })
      acceptBoards(data)
      patch({ view: action === 'skip' ? 'atlas' : 'create', pane: 'atlas' })
    } catch (err) { patch({ notice: err.message }) }
    finally { requestBusy.current = false; patch({ generating: false }) }
  }

  function canLeavePage() {
    if (!startDirty.current && !servicesDirty.current) return Promise.resolve(true)
    return requestConfirm({
      tone: 'danger',
      icon: 'alert',
      eyebrow: 'UNSAVED DRAFT',
      title: '放弃本页草稿并离开？',
      message: '当前面板内尚未保存的修改会丢失。',
      facts: [['影响', '仅本页未保存内容'], ['保留', '已保存的创作与作品']],
      note: '已保存的内容不受影响；此操作无法撤销。',
      confirmLabel: '放弃并离开',
      nativeText: '有尚未保存的修改，放弃草稿并离开？',
    })
  }
  async function closeUtility() {
    if (requestBusy.current || !(await canLeavePage())) return
    patch({ utility: null })
  }
  async function switchView(view, serviceKind = 'image') {
    if (requestBusy.current || !(await canLeavePage())) return
    if (['services', 'experiments'].includes(view)) { patch({ utility: view, serviceKind }); return }
    const next = view === 'atlas' || view === 'recommend' ? 'atlas' : 'create'
    if (next === 'create' && !board.idea?.trim() && !board.lab?.runs?.length) { patch({ notice: '先填写画面想法。', pane: 'board' }); return }
    try { await flush(); patch({ view: next, utility: null, pane: 'atlas', notice: null }) }
    catch (err) { patch({ notice: err.message }) }
  }
  async function openOutputSettings() {
    if (requestBusy.current || !(await canLeavePage())) return
    if (!board?.idea?.trim() && !board?.lab?.runs?.length) {
      patch({ notice: '先写一句画面想法，再到创作详情调整输出设置。', pane: 'board' })
      return
    }
    try {
      await flush()
      setState(s => ({ ...s, view: 'create', utility: null, pane: 'atlas', notice: null, settingsFocus: (s.settingsFocus || 0) + 1 }))
    } catch (err) { patch({ notice: err.message }) }
  }
  async function openPlanningDuration() {
    if (requestBusy.current || !(await canLeavePage())) return
    try {
      await flush()
      setState(s => ({ ...s, view: 'atlas', pane: 'board', notice: null, durationFocus: s.durationFocus + 1 }))
    } catch (err) { patch({ notice: err.message }) }
  }
  async function resultsAction(action, details) {
    if (!board || requestBusy.current) throw new Error('请等待当前操作完成')
    requestBusy.current = true; editEpoch.current++
    patch({ generating: true, busy: 'results', notice: null })
    try {
      await flush()
      const data = await api('/results', { id: board.id, expectedRevision: revisions.current.get(board.id), action, ...details })
      acceptBoards(data)
      if (data.result?.continuedRunId) patch({ view: 'create', pane: 'atlas', noticeKind: 'success', notice: '已带回这一版的设置。' })
      return data
    } finally { requestBusy.current = false; patch({ generating: false, busy: null }) }
  }
  function openSource(id) {
    if (!state.boards.some(b => b.id === id)) { patch({ notice: '来源实验已删除，保存的条件和媒体仍可查看。' }); return }
    changeBoard('activate', id)
  }

  function navigateResult(view) { return switchView(view) }

  function pickDim(id) {
    const next = id || dims[0]?.id || null
    patch({ dimId: next, topicId: null, query: '' })
  }

  if (state.loading) {
    return h('div', { className: 'lk-root ll-panel' }, h('style', null, CSS + WORKBENCH_CSS + GUIDED_CSS + RESULTS_CSS + ONBOARDING_CSS + DARK_CSS + CREATION_CSS),
      h('div', { className: 'll-boot' },
        h(BrandMark, { size: 38 }),
        h('span', { className: 'll-boot-word' }, '光影厨房'),
        h('span', { className: 'll-boot-note', role: 'status' }, t('loading'))))
  }

  if (state.error) {
    const dataDir = state.error.data?.dataDir || ''
    return h('div', { className: 'lk-root ll-panel' }, h('style', null, CSS + WORKBENCH_CSS + GUIDED_CSS + RESULTS_CSS + ONBOARDING_CSS + DARK_CSS + CREATION_CSS),
      h('header', { className: 'll-header' }, h(WorkspaceIdentity)),
      h('div', { className: 'lk-error' },
        h('span', { className: 'lk-kicker' }, 'ATLAS OFFLINE'),
        h('h2', null, t('error.title')),
        h('p', { style: { fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.75, margin: '6px 0 14px' } }, state.error.message),
        dataDir ? h('p', { style: { fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 } }, `${t('error.dataDir')}：`, h('code', null, dataDir)) : null,
        h('p', { style: { fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginTop: 8 } }, t('error.hint')),
        h('div', { style: { marginTop: 18 } }, h(Btn, { onClick: load, icon: 'refresh' }, t('error.retry'))),
      ))
  }

  if (!board || !analysis) {
    return h('div', { className: 'lk-root ll-panel' }, h('style', null, CSS + WORKBENCH_CSS + GUIDED_CSS + RESULTS_CSS + ONBOARDING_CSS + DARK_CSS + CREATION_CSS),
      h('div', { className: 'll-boot' }, h(BrandMark, { size: 34 }), h('span', { className: 'll-boot-note', role: 'status' }, t('loading'))))
  }

  const succeeded = (board.lab?.runs || []).filter(run => run.status === 'succeeded').length
  const saveTone = board.transient ? 'idle' : state.saving === 'error' ? 'error' : state.saving === 'saving' ? 'saving' : 'saved'
  const saveText = board.transient ? '尚未保存' : state.saving === 'error' ? '保存失败' : state.saving === 'saving' ? '正在保存' : '已保存'
  const experimentTitle = board.transient ? '新的创作' : (board.title || '未命名创作')
  const createReady = Boolean(board.idea?.trim() && board.ingredients.length) || Boolean(board.lab?.comparison) || succeeded > 0
  return h('div', { className: 'lk-root ll-panel', 'data-pane': state.pane, 'data-view': state.view, 'data-results': state.view === 'create' },
    h('style', null, CSS + WORKBENCH_CSS + GUIDED_CSS + RESULTS_CSS + ONBOARDING_CSS + DARK_CSS + CREATION_CSS),
    h('header', { className: 'll-header', inert: state.utility ? '' : undefined },
      h(WorkspaceIdentity),
      h('div', { className: 'll-context' },
        h('div', { className: 'll-exp' },
          renaming
            ? h('input', {
              ref: titleInput, className: 'll-exp-input', value: draftTitle, maxLength: 40,
              'aria-label': '创作名称', placeholder: '给这次创作起个名字',
              onChange: e => setDraftTitle(e.target.value),
              onBlur: commitRename,
              onKeyDown: e => {
                if (e.key === 'Enter') { e.preventDefault(); commitRename() }
                else if (e.key === 'Escape') { e.preventDefault(); cancelRename() }
              },
            })
            : h(React.Fragment, null,
              h('button', {
                type: 'button', className: 'll-exp-main', disabled: state.generating,
                title: experimentTitle, 'aria-label': `创作管理 · ${experimentTitle}`,
                onClick: () => switchView('experiments'),
              },
              h(StatusDot, { tone: board.demo ? 'warn' : board.transient ? 'idle' : 'ok' }),
              h('span', { className: 'll-exp-body' },
                h('strong', null, experimentTitle)),
              h(Icon, { name: 'chevron', size: 14 })),
              h('button', {
                type: 'button', className: 'll-exp-rename', disabled: state.generating,
                'aria-label': '重命名当前创作', title: '重命名当前创作',
                onClick: beginRename,
              }, h(Icon, { name: 'pencil', size: 13 })))),
        h('span', { className: 'll-save', 'data-state': saveTone, role: 'status' },
          h(Icon, { name: board.transient ? 'pencil' : state.saving === 'error' ? 'alert' : state.saving === 'saving' ? 'clock' : 'check', size: 12 }),
          saveText)),
      h('nav', { className: 'll-switch', 'aria-label': '创作流程' },
        [['atlas', '想法与配料', 'layers'], ['create', '创作详情', 'film']].map(([id, label, icon]) => h('button', {
          key: id, type: 'button', 'aria-pressed': state.view === id,
          disabled: state.generating || (id === 'create' && !createReady),
          onClick: () => switchView(id),
        }, h(Icon, { name: icon, size: 14 }), label))),
      h('div', { className: 'll-header-actions' },
        h(Btn, { small: true, variant: 'ghost', icon: 'settings', disabled: state.generating, onClick: () => switchView('services'), ariaLabel: 'API配置' }, 'API配置'),
        h(Btn, { small: true, icon: 'plus', disabled: state.generating, onClick: () => changeBoard('create') }, '新创作'),
        h(Btn, { small: true, variant: 'ghost', icon: 'folder', disabled: state.generating, onClick: () => switchView('experiments'), ariaLabel: '创作管理' }, '创作管理'))),
    state.view === 'atlas' ? h('nav', { inert: state.utility ? '' : undefined, className: 'll-mobile', 'aria-label': '工作区' }, [['atlas', `浏览图谱`], ['board', `配料表 ${board.ingredients.length}`]].map(([id, label]) => h('button', { type: 'button', key: id, 'aria-pressed': state.pane === id, onClick: () => patch({ pane: id }) }, label))) : null,
    h('div', { className: 'll-layout', inert: state.utility ? '' : undefined },
      h('div', { className: 'll-browser' },
        h(PageNotice, { message: state.notice, kind: state.noticeKind }),
        jobItems.length ? h(JobTray, { items: jobItems, onOpen: () => switchView('create') }) : null,
        h('div', { className: 'lk-view', key: state.view },
          state.view === 'create'
            ? h(CreationWorkspace, { key: board.id, board, busy: state.busy || (state.generating ? 'saving' : null), model: state.model, mediaInfo: state.media, jobs: state.jobs, onDesign: fire,
              onRetime: (duration, planId) => runLab('retime', { duration, planId, serviceRevision: state.media?.revision }), onPlanningDuration: openPlanningDuration,
              onGenerate: startMedia, onRecover: recoverMedia, onSettings: kind => switchView('services', kind), onAtlas: () => switchView('atlas'), onAdopt: (planId, variantId) => runLab('adopt', { planId, variantId }), concepts, onAction: resultsAction, resultFocus: state.resultFocus, onConstraints: setConstraints, focusSettings: state.settingsFocus })
            : h(Library, { motion, dims, concepts, board, dimId: state.dimId, topicId: state.topicId, query: state.query, density: state.density, onDensity: density => patch({ density }), onDim: pickDim, onTopic: topicId => patch({ topicId }), onQuery: query => patch({ query }), onAdd: addIngredient, onDetail: detail => patch({ detail }) }))),
      state.view !== 'atlas' ? null : h(IngredientEditor, { key: board.id, view: state.view, onNavigate: navigateResult, board, analysis, model: state.model, generating: state.generating, busy: state.busy, onRecommend: () => runLab('compose'), notice: state.noticeKind === 'success' ? null : state.notice, saving: state.saving, canUndo: state.canUndo, onIdea: setIdea, onOpenSettings: openOutputSettings,
        videoInfo: state.media?.video, onDuration: duration => setConstraints({ duration }), durationFocus: state.durationFocus,
        onWeight: setWeight, onRemove: removeIngredient, onClear: clearBoard, onUndo: undo, onFire: fire, onDetail: detail => patch({ detail }), onRefresh: () => discardAndRefresh().catch(err => patch({ notice: err.message })), onRetrySave: () => flush().then(() => patch({ notice: null })).catch(() => {}) })),
    state.detail ? h(Detail, { motion, concept: state.detail, added: board.ingredients.some(i => i.slug === state.detail.id), onAdd: addIngredient, onClose: () => patch({ detail: null }) }) : null,
    state.utility ? h(UtilityPanel, { title: { services: '生成服务配置', experiments: '创作管理' }[state.utility], busy: state.generating, onClose: closeUtility },
      h(PageNotice, { message: state.notice, kind: state.noticeKind }),
      state.utility === 'services' ? h(ServiceSettings, { embedded: true, initialKind: state.serviceKind, onDirty: value => { servicesDirty.current = value }, onMedia: media => patch({ media }), onBack: closeUtility })
        : h(ExperimentManager, { boards: state.boards, activeId: state.activeId, busy: state.generating, onAction: changeBoard, onNew: () => changeBoard('create') })) : null,
    h(ConfirmHost),
    h(ToastStack, {
      toasts: state.toasts,
      onDismiss: id => setState(s => ({ ...s, toasts: s.toasts.filter(toast => toast.id !== id) })),
      onResults: () => patch({ view: 'create', pane: 'atlas', resultFocus: null }),
    }))

}

const kitchenPlugin = {
  inject: ['slots'],
  apply(ctx) {
    try {
      const snap = ctx.get('locale')?.getLocale?.()
      const id = String(snap?.id || snap?.locale || '')
      if (/^en/i.test(id)) LANG = 'en'
    } catch {
      LANG = 'zh'
    }
    ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
      name: 'sidebar.panellist',
      id: 'lumina-kitchen',
      order: 6,
      label: () => t('sidebar.title'),
    }, KitchenIcon))
    ctx.slots.inject('main', () => ctx.slots.register({
      name: 'main',
      key: 'lumina-kitchen',
    }, LuminaPage))
  },
}

module.exports = kitchenPlugin

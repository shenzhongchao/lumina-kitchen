function useMotionDownloads() {
  const [status, setStatus] = React.useState(null)
  const [error, setError] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const epoch = React.useRef(0)
  const refresh = React.useCallback(async () => {
    const current = ++epoch.current
    try { const value = await api('/motion'); if (current === epoch.current) { setStatus(value); setError('') } }
    catch (e) { if (current === epoch.current) setError(e.message) }
  }, [])
  React.useEffect(() => { refresh() }, [refresh])
  React.useEffect(() => {
    if (!['downloading', 'cancelling'].includes(status?.phase)) return
    const timer = setInterval(refresh, 700)
    return () => clearInterval(timer)
  }, [status?.phase, refresh])
  async function act(action) {
    const current = ++epoch.current
    setPending(true); setError('')
    try { const value = await api('/motion', { action }); if (current === epoch.current) setStatus(value) }
    catch (e) { if (current === epoch.current) setError(e.message) }
    finally { setPending(false) }
  }
  return { status, error, pending, act, refresh }
}

function MotionControls({ motion }) {
  const { status: s, error, pending, act, refresh } = motion
  const running = ['downloading', 'cancelling'].includes(s?.phase)
  const complete = s?.total > 0 && s.completed === s.total
  const mb = bytes => `${(bytes / 1_000_000).toFixed(1)} MB`
  const label = complete ? (s.enabled ? '切回静态图' : '使用已缓存的动态演示')
    : s?.phase === 'error' ? '重试未完成的下载' : s?.completed > 0 || s?.phase === 'cancelled' ? '继续加载动态演示' : '加载动态演示'
  return h('div', { className: 'll-motion-controls', 'aria-label': '运镜动态演示' },
    h('div', { className: 'll-motion-actions' },
      h(Btn, { small: true, disabled: pending || running || !s || (!complete && (!s.configured || !s.total)),
        onClick: () => act(complete && s.enabled ? 'static' : 'start') }, label),
      running ? h(Btn, { small: true, variant: 'ghost', disabled: pending || s.phase === 'cancelling', onClick: () => act('cancel') }, s.phase === 'cancelling' ? '正在取消…' : '取消下载') : null,
      h('span', { role: 'status', className: 'll-motion-status' }, !s ? '正在读取下载状态…'
        : running ? `已下载 ${s.completed}/${s.total} · ${mb(s.downloadedBytes)} / ${mb(s.totalBytes)}`
        : complete ? `${s.total} 个演示已缓存 · ${s.enabled ? '仅播放可见卡片' : '当前使用静态图'}`
        : !s.configured ? '动态演示源尚未配置，静态图仍可使用'
        : `${s.total} 个演示 · 共 ${mb(s.totalBytes)}${s.completed ? ` · 已缓存 ${s.completed} 个` : ''}${s.phase === 'cancelled' ? ' · 已取消，缓存已保留' : ''}`)),
    running ? h('progress', { max: s.totalBytes || 1, value: s.downloadedBytes, 'aria-label': '动态演示下载进度' }) : null,
    s?.failures?.length ? h('p', { role: 'alert', className: 'll-error' }, `${s.failures.length} 个演示未完成，已下载文件保留。${s.failures[0].message}`) : null,
    error || s?.error ? h('div', { role: 'alert', className: 'll-error' }, error || s.error,
      h(Btn, { small: true, variant: 'ghost', onClick: refresh }, '刷新状态')) : null)
}

// Removing the GIF src stops off-screen decoding; lazy loading alone does not.
function MotionImage({ concept, motion, preview = false, ...props }) {
  const ref = React.useRef(null)
  const [visible, setVisible] = React.useState(false)
  const [active, setActive] = React.useState(!document.hidden)
  const [failed, setFailed] = React.useState(false)
  const asset = motion?.status?.assets?.[concept.id]
  React.useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio > 0), { threshold: [0, 0.01] })
    observer.observe(node)
    const onVisibility = () => setActive(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])
  React.useEffect(() => setFailed(false), [asset])
  const animated = Boolean(asset && visible && active && !failed)
  return h('img', { ...props, ref, 'data-motion': animated ? 'playing' : 'static',
    src: animated ? `${BASE}/motion/assets/${asset}` : mediaUrl(preview ? concept.preview : concept.thumb),
    onError: () => { if (animated) setFailed(true) } })
}

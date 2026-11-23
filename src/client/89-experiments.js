function ExperimentManager({ boards, activeId, busy, onAction, onNew }) {
  const [query, setQuery] = React.useState(''), [archived, setArchived] = React.useState(false)
  const [editing, setEditing] = React.useState(null), [title, setTitle] = React.useState(''), [error, setError] = React.useState('')
  const items = boards.filter(b => !b.transient && Boolean(b.archivedAt) === archived && `${b.title} ${b.idea || ''} ${b.id}`.toLowerCase().includes(query.toLowerCase()))
    .slice().sort((a, b) => [b.lastOpenedAt, b.updatedAt, b.createdAt].filter(Boolean).sort().at(-1)?.localeCompare([a.lastOpenedAt, a.updatedAt, a.createdAt].filter(Boolean).sort().at(-1) || '') || 0)
  const execute = async (action, b, extra = {}) => { setError(''); try { if (await onAction(action, b.id, extra)) setEditing(null) } catch (e) { setError(e.message) } }
  const statusOf = b => b.archivedAt ? '已归档' : b.lab?.reviews?.length ? '已复盘' : b.lab?.runs?.some(r => r.status === 'succeeded') ? '已有结果' : b.lab?.comparison ? '已有方案' : b.idea?.trim() || b.ingredients?.length ? '准备中' : '空白创作'
  return h('section', { className: 'lr-workspace', 'aria-label': '创作管理器' },
    h('header', { className: 'lr-head' },
      h('span', { className: 'lk-kicker' }, 'WORKBENCH'),
      h('h2', null, '我的创作', h(HelpTip, { label: '创作管理', text: '按最近打开或修改的时间排列。归档可恢复；删除创作不会删除已保存的拍法与来源媒体。' }))),
    h('div', { className: 'lr-toolbar' },
      h('div', { className: 'lr-seg', role: 'group', 'aria-label': '创作状态' },
        h('button', { type: 'button', 'aria-pressed': !archived, onClick: () => setArchived(false) }, '进行中'),
        h('button', { type: 'button', 'aria-pressed': archived, onClick: () => setArchived(true) }, '已归档')),
      h('label', { className: 'lr-searchbox', style: { margin: 0 } },
        h(Icon, { name: 'search', size: 15 }),
        h('input', { type: 'search', value: query, placeholder: '搜索名称、想法或编号', 'aria-label': '搜索创作', onChange: e => setQuery(e.target.value) })),
      h('div', { className: 'lc-tools', style: { marginLeft: 'auto' } }, h(Btn, { icon: 'plus', onClick: onNew, disabled: busy }, '开始新创作'))),
    error ? h('p', { role: 'alert', className: 'lr-error' }, error) : null,
    !items.length
      ? h('div', { className: 'lr-empty-note' },
        h(Icon, { name: 'folder', size: 17 }),
        h('div', null,
          h('strong', { style: { display: 'block', color: 'var(--ink)', fontWeight: 500, marginBottom: 4 } }, query ? '没有匹配的创作' : archived ? '没有已归档的创作' : '还没有保存的创作'),
          query ? '换个关键词试试，或清空搜索。' : archived ? '归档的创作会保留在这里，随时可以恢复。' : '写下第一个想法后，它会出现在这里。'))
      : null,
    h('div', { className: 'lr-list' }, items.map((b, index) => {
      const status = statusOf(b)
      const date = [b.lastOpenedAt, b.updatedAt, b.createdAt].filter(Boolean).sort().at(-1)
      const active = b.id === activeId
      return h('article', { className: 'lr-exp', key: b.id, 'data-active': active ? 'true' : 'false', 'aria-label': `${b.title} · ${b.id.slice(-6)}` },
        h('div', { className: 'lr-exp-main' },
          h('div', { className: 'lr-exp-meta' },
            h('span', { className: 'lr-status', 'data-status': b.archivedAt ? 'archived' : b.lab?.reviews?.length ? 'reviewed' : b.lab?.runs?.some(r => r.status === 'succeeded') ? 'result' : b.lab?.comparison ? 'plan' : b.idea?.trim() || b.ingredients?.length ? 'drafting' : 'empty' },
              h(StatusDot, { tone: b.archivedAt ? 'idle' : b.lab?.runs?.some(r => r.status === 'succeeded') ? 'ok' : 'busy' }),
              status),
            b.demo ? h('span', { className: 'lr-outcome-chip' }, '入门练习') : null,
            /验收/.test(b.title + (b.idea || '')) ? h('span', { className: 'lr-outcome-chip' }, '验收记录') : null,
            active ? h('span', { className: 'lr-outcome-chip' }, '当前') : null,
            h('span', null, `编号 ${b.id.slice(-6)}`),
            date ? h('span', null, new Date(date).toLocaleString('zh-CN')) : h('span', null, '时间未记录')),
          h('h3', null, b.title || '未命名创作'),
          h('p', null, b.idea?.trim() ? b.idea.trim().slice(0, 160) + (b.idea.trim().length > 160 ? '…' : '') : '尚未填写想法'),
          editing === b.id
            ? h('form', { style: { marginTop: 10, maxWidth: 420 }, onSubmit: e => { e.preventDefault(); execute('rename', b, { title }) } },
              h('label', null, '新名称', h('input', { value: title, maxLength: 40, required: true, disabled: busy, onChange: e => setTitle(e.target.value) })),
              h('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
                h(Btn, { type: 'submit', small: true, icon: 'check', disabled: busy || !title.trim() }, '保存名称'),
                h(Btn, { small: true, variant: 'ghost', onClick: () => setEditing(null), disabled: busy }, '取消重命名')))
            : null,
          h('div', { className: 'lr-exp-actions' },
            h(Btn, { small: true, variant: active ? 'primary' : 'quiet', icon: archived ? 'undo' : 'arrow', disabled: busy, onClick: () => execute(archived ? 'restore' : 'activate', b) }, archived ? '恢复创作' : active ? '继续编辑' : '打开创作'),
            h(Btn, { small: true, variant: 'ghost', icon: 'pencil', disabled: busy, onClick: () => { setEditing(b.id); setTitle(b.title) } }, '重命名'),
            archived ? null : h(Btn, { small: true, variant: 'ghost', icon: 'archive', disabled: busy, onClick: () => execute('archive', b) }, '归档'),
            h(Btn, { small: true, variant: 'ghost', icon: 'trash', disabled: busy, onClick: async () => {
              const nativeText = `删除“${b.title}”（编号 ${b.id.slice(-6)}）？\n将删除该创作的想法、方案和复盘，无法撤销。已保存拍法、其他分支和媒体文件会保留。`
              const ok = await requestConfirm({
                tone: 'danger', icon: 'trash', eyebrow: 'DELETE EXPERIMENT', title: `删除“${b.title}”？`,
                message: `编号 ${b.id.slice(-6)}。会删除这个创作的想法、方案与复盘。`,
                facts: [['创作', b.title], ['编号', b.id.slice(-6)], ['保留', '拍法、其他分支、媒体文件']],
                note: '此操作无法撤销；已保存的拍法不会被删除。', confirmLabel: '删除创作', nativeText,
              })
              if (ok) execute('delete', b, { confirmTitle: b.title })
            } }, '删除'))),
        h('div', { className: 'lr-exp-side', 'aria-hidden': true },
          h('span', { className: 'lr-exp-index' }, String(index + 1).padStart(2, '0')),
          h(Icon, { name: b.archivedAt ? 'archive' : b.demo ? 'film' : 'clapper', size: 20 })))
    })))
}

const GUIDED_CSS = `
.ll-costbar .lk-icon{flex:none;color:var(--faint)}
.ll-costbar .lk-help{margin-left:0}
.ll-stale .lk-btn{margin-top:9px;background:var(--card);border-color:#d9c197}
.ll-suggestion .ll-picture{aspect-ratio:1/1;border-radius:var(--r-md);height:auto}
.ll-suggestion .ll-add{min-height:36px}
.ll-variant>.ll-add{width:100%;min-height:40px;margin-top:2px;border-radius:var(--r-sm)}
.ll-variant[data-selected="true"]>.ll-add{background:var(--ink);border-color:var(--ink);color:var(--paper-2)}
.ll-variant[data-selected="true"]>.ll-add:disabled{opacity:1}

/* media */
.ll-media{margin-top:4px;padding-top:14px;border-top:1px solid var(--rule)}
.ll-media-recover{margin-top:6px}
.ll-media-recover-form{margin-top:8px;padding:12px;border:1px solid var(--rule);border-radius:var(--r-md);background:var(--paper)}
.ll-media-recover-form .lk-input{min-height:36px;font-size:12px;margin-bottom:8px}
.ll-media-recover-form .ll-media-row{margin-top:0}
.ll-media .lo-cost{font-size:10.5px;line-height:1.6;color:var(--faint);margin:6px 0}
.ll-media-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}
.ll-media-error{font-size:11.5px;line-height:1.6;color:var(--danger);margin:6px 0}
.ll-generation-kind{min-width:0}
.ll-generation-controls{min-width:0}
.ll-config-needed{padding:10px 12px;border:1px solid var(--rule);border-radius:var(--r-md);background:var(--paper-2);margin:10px 0}
.ll-config-needed p{margin:0 0 8px;font-size:13px}
.ll-variant-footer .ll-add{border-radius:6px;width:auto;min-height:40px;padding:0 16px}
.ll-variant[data-selected="true"] .ll-variant-footer .ll-add{color:var(--accent);background:var(--accent-soft);border-color:var(--accent-line);opacity:1}
@container(max-width:720px){
  .ll-variant-footer .ll-add{min-height:44px}
}
@container(max-width:620px){.ll-suggestion .ll-picture{aspect-ratio:16/10}.ll-variant>.ll-add{min-height:44px}.ll-add{min-height:44px}}
`

/* ── media generation ──────────────────────────────────────────────── */

function latestRun(board, plan, variant, kind) {
  if (!plan?.id || !variant?.id) return null
  return (board.lab?.runs || []).filter(run => run.planId === plan.id && run.variantId === variant.id && run.kind === kind).at(-1) || null
}
function runStatus(run, jobs) {
  if (run && ['succeeded', 'failed', 'rejected', 'uncertain'].includes(run.status)) return run.status
  return (run?.jobId && jobs?.[run.jobId]?.status) || run?.status || ''
}
function mediaActive(status) { return ['submitting', 'queued', 'running'].includes(status) }
function mediaLabel(status) {
  return { submitting: '提交中', queued: '排队中', running: '生成中', succeeded: '已完成', failed: '失败', rejected: '被拒绝', uncertain: '结果待核对' }[status] || '尚未生成'
}
function mediaTone(status) {
  if (status === 'succeeded') return 'ok'
  if (mediaActive(status)) return 'busy'
  if (status === 'failed' || status === 'rejected') return 'error'
  if (status === 'uncertain') return 'warn'
  return 'idle'
}
function assetSrc(asset) {
  return asset?.file ? `${BASE}/assets/${encodeURIComponent(asset.file)}` : ''
}
function bytesLabel(bytes) {
  return typeof bytes === 'number' && bytes > 0 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : ''
}

function MediaPanel({ board, plan, variant, info, jobs, busy, stale, onGenerate, onRecover, onSettings, onVideoDuration }) {
  const [kind, setKind] = React.useState('video')
  const imageInfo = { ...(info?.image || {}) }
  if (imageInfo.protocol === 'openai-image') Object.assign(imageInfo, continuedImageSettings(board))
  const videoInfo = info?.video || {}
  const imageRun = latestRun(board, plan, variant, 'image')
  const videoRun = latestRun(board, plan, variant, 'video')
  const imageJob = imageRun?.jobId ? jobs?.[imageRun.jobId] : null
  const videoJob = videoRun?.jobId ? jobs?.[videoRun.jobId] : null
  const imageStatus = runStatus(imageRun, jobs)
  const videoStatus = runStatus(videoRun, jobs)
  const duration = targetVideoDuration(board)
  const incompatibleDuration = Boolean(info?.video && !videoDurationSupported(duration, videoInfo))
  const resolution = videoInfo.resolution || '768P'
  const officialVideo = videoRun?.service?.protocol === 'minimax-video'
  const taskPrefix = videoRun?.service?.protocol === 'ark-seedance' ? 'cgt-' : 'task_'
  const taskFormat = officialVideo ? '纯数字任务编号' : `${taskPrefix} 开头的任务编号`
  const imageSizeLabel = imageInfo.protocol === 'ark-seedream' || imageInfo.protocol === 'minimax-image'
    ? `${imageInfo.size} · ${board.constraints?.aspect || '1:1'}`
    : imageInfo.size || '按画幅自动'
  const estimate = !incompatibleDuration && videoInfo.costPerSecondUsd ? duration * videoInfo.costPerSecondUsd : null
  const ready = Boolean(plan?.id && variant?.id)
  const disabled = Boolean(busy) || stale || !ready || Boolean(board.demo)
  const [recoverOpen, setRecoverOpen] = React.useState(false)
  const [taskId, setTaskId] = React.useState('')
  const [recoverError, setRecoverError] = React.useState('')
  React.useEffect(() => {
    if (videoStatus !== 'uncertain') { setRecoverOpen(false); setRecoverError('') }
  }, [videoStatus])

  async function generateImage(force) {
    if (disabled || !imageInfo.configured || !onGenerate) return
    const size = imageSizeLabel
    const quality = imageInfo.quality ? `，质量 ${imageInfo.quality}` : ''
    const ok = await requestConfirm({
      tone: 'cost', icon: 'image', eyebrow: 'IMAGE GENERATION',
      title: `为方案 ${variant.id} 生成 1 张图片？`,
      message: `${variant.title}。调用 ${imageInfo.model}，结果保存在本机。`,
      facts: [
        ['服务', imageInfo.name || '原有图片配置'],
        ['地址', imageInfo.baseUrl || '原有配置地址'],
        ['模型', imageInfo.model],
        ['尺寸', `${size}${quality}`],
        ['数量', '1 张'],
        ['费用', '未知，按图像服务商账单计费', true],
        ['保存', '本机'],
      ],
      note: imageStatus === 'uncertain' ? '旧任务结果尚未确认，再次生成可能重复收费，请先核对服务商记录。' : '取消不会发起请求；重新生成可能再次计费。',
      confirmLabel: '生成图片',
      nativeText: `${imageStatus === 'uncertain' ? '旧任务结果待核对，再次生成可能重复收费。\n' : ''}为方案 ${variant.id} 调用 ${imageInfo.model} 生成 1 张图片？\n尺寸：${size}${quality}\n费用未知，按图像服务商账单计费；确认后才会提交。`,
    })
    if (!ok) return
    onGenerate('image', plan.id, variant.id, force, info?.revision)
  }
  async function generateVideo(force) {
    if (disabled || incompatibleDuration || !videoInfo.configured || !onGenerate) return
    const cost = estimate ? `约 $${estimate.toFixed(2)}（按 $${videoInfo.costPerSecondUsd}/秒估算）` : '未知，以服务商账单为准'
    const ok = await requestConfirm({
      tone: 'cost', icon: 'video', eyebrow: 'VIDEO GENERATION',
      title: `为方案 ${variant.id} 生成 ${duration} 秒视频？`,
      message: `${variant.title}。调用 ${videoInfo.model} 进行文生视频；本地参考图不会作为首帧上传。`,
      facts: [
        ['服务', videoInfo.name || '原有视频配置'],
        ['地址', videoInfo.baseUrl || '原有配置地址'],
        ['模型', videoInfo.model],
        ['时长', `${duration} 秒`],
        ['分辨率', resolution],
        ['费用', cost, true],
        ['方式', '文生视频 · 不使用本地参考图'],
      ],
      note: videoStatus === 'uncertain' ? '旧任务结果尚未确认，再次生成可能重复收费。请先核对服务商任务记录；取消不会提交。' : '费用最终以服务商账单为准；取消不会提交任务。',
      confirmLabel: '生成视频',
      nativeText: `${videoStatus === 'uncertain' ? '旧任务结果待核对，再次生成可能重复收费。\n' : ''}为方案 ${variant.id} 调用 ${videoInfo.model} 生成 ${duration} 秒、${resolution} 视频？\n${cost}\n费用按服务商账单。文生视频，不使用本地参考图。`,
    })
    if (!ok) return
    onGenerate('video', plan.id, variant.id, force, info?.revision)
  }
  function submitRecovery(event) {
    event.preventDefault()
    if (!videoRun?.jobId) return
    const id = taskId.trim()
    if (!(officialVideo ? /^\d{1,32}$/.test(id) : id.startsWith(taskPrefix))) { setRecoverError(`请输入服务商返回的${taskFormat}`); return }
    setRecoverError('')
    setRecoverOpen(false)
    setTaskId('')
    onRecover?.(videoRun.jobId, id)
  }

  const imageBytes = bytesLabel(imageRun?.asset?.bytes)
  const imageLabel = imageStatus === 'uncertain' ? '核对后重新生成图片' : imageRun ? '重新生成图片' : '生成图片'
  return h('section', { className: 'll-media', 'aria-label': '生成作品' },
    h('h3', { className: 'll-generation-heading' }, '生成作品'),
    h('div', { className: 'lk-seg ll-generation-switch', role: 'group', 'aria-label': '生成类型' },
      [['image', '图片生成'], ['video', '视频生成']].map(([id, label]) =>
        h('button', { key: id, type: 'button', 'aria-pressed': kind === id, onClick: () => setKind(id) },
          h(Icon, { name: id, size: 15 }), label))),
    !ready || stale ? h('p', { className: 'll-generation-readiness', role: 'status' },
      h(Icon, { name: 'info', size: 13 }),
      h('span', null, !ready ? '先在上方准备拍法，再生成图片或视频。' : '拍法已过期，请在上方更新拍法后再生成。')) : null,
    kind === 'video' ? h('section', { key: 'video', className: 'll-generation-kind', 'aria-label': '视频生成' },
      h('div', { className: 'll-generation-controls' },
        !videoInfo.configured ? h('div', { className: 'll-config-needed' }, h('p', null, '尚未配置视频生成服务。'), onSettings ? h(Btn, { small: true, onClick: () => onSettings('video') }, '配置视频服务') : null) : null,
        incompatibleDuration ? h('div', { className: 'll-config-needed' },
          h('p', { role: 'status' }, `当前服务支持 ${videoInfo.minDuration}–${videoInfo.maxDuration} 秒。`),
          onVideoDuration ? h(Btn, { small: true, onClick: onVideoDuration }, ready ? '去调整时长' : '去设置时长') : null,
          videoInfo.configured && onSettings ? h(Btn, { small: true, variant: 'quiet', onClick: () => onSettings('video') }, '切换服务') : null) : null,
        videoStatus === 'uncertain' ? h('p', { className: 'll-media-error', role: 'status' }, '上次任务结果待核对。先关联任务编号或检查服务商记录，再决定是否重新生成。') : null,
        h('div', { className: 'll-media-action' },
          h(Btn, { variant: 'primary',
            'data-busy': mediaActive(videoStatus) ? 'true' : undefined,
            disabled: disabled || incompatibleDuration || !videoInfo.configured || mediaActive(videoStatus),
            onClick: () => generateVideo(Boolean(videoRun) && !mediaActive(videoStatus)) },
            mediaActive(videoStatus) ? h('span', { className: 'll-media-spinner', 'aria-hidden': 'true' }) : h(Icon, { name: 'video', size: 16 }),
            mediaActive(videoStatus) ? '视频生成中…' : videoStatus === 'uncertain' ? '核对后重新生成视频' : videoRun ? '重新生成视频' : !disabled && !incompatibleDuration && videoInfo.configured ? `生成 ${duration} 秒视频` : '生成视频')),
        videoInfo.configured && ready && !stale ? h('div', { className: 'll-media-specrow' },
          h('p', { className: 'lo-cost' }, incompatibleDuration
            ? `目标 ${duration} 秒，超出当前服务范围`
            : `下次生成 · ${duration} 秒 · ${resolution}${estimate != null ? ` · 约 $${estimate.toFixed(2)}` : ' · 费用未知'} · 点击后确认费用`),
          h(HelpTip, { label: '文生视频', text: '视频为文生视频：本地参考图不会作为首帧上传。结果保存在本机，源链接可能过期；费用在确认面板列出，以服务商账单为准。' })) : null,
        videoRun?.error ? h('p', { className: 'll-media-error', role: 'alert' }, videoRun.error) : null,
        !videoRun?.error && videoJob?.error ? h('p', { className: 'll-media-error', role: 'alert' }, videoJob.error) : null,
        videoRun?.downloadError ? h('p', { className: 'll-media-error', role: 'alert' }, videoRun.downloadError) : null,
        videoStatus === 'uncertain' && videoRun?.jobId
          ? h('div', { className: 'll-media-recover' },
            h('div', { className: 'll-media-row' },
              h(Btn, { small: true, icon: 'target', onClick: () => { setRecoverOpen(open => !open); setRecoverError('') } }, recoverOpen ? '收起任务编号' : '关联任务编号')),
            recoverOpen
              ? h('form', { className: 'll-media-recover-form', onSubmit: submitRecovery },
                h('label', null, h('span', { className: 'lk-label' }, '服务商任务编号'), h('input', { className: 'lk-input', value: taskId, placeholder: officialVideo ? '纯数字任务编号' : `${taskPrefix}…`, inputMode: officialVideo ? 'numeric' : undefined, autoComplete: 'off', onChange: e => { setTaskId(e.target.value); setRecoverError('') } })),
                h('div', { className: 'll-media-row' },
                  h(Btn, { type: 'submit', small: true, icon: 'link', disabled: !taskId.trim() }, '关联任务'),
                  h(Btn, { small: true, variant: 'ghost', onClick: () => { setRecoverOpen(false); setTaskId(''); setRecoverError('') } }, '取消')),
                recoverError ? h('p', { className: 'll-media-error', role: 'alert' }, recoverError) : null)
              : null)
          : null))
      : h('section', { key: 'image', className: 'll-generation-kind', 'aria-label': '图片生成' },
        h('div', { className: 'll-generation-controls' },
          !imageInfo.configured ? h('div', { className: 'll-config-needed' },
            h('p', null, '尚未配置图片生成服务。'),
            onSettings ? h(Btn, { small: true, onClick: () => onSettings('image') }, '配置图片服务') : null) : null,
          imageStatus === 'uncertain' ? h('p', { className: 'll-media-error', role: 'status' }, '上次任务结果待核对，确认后再生成，避免重复收费。') : null,
          h('div', { className: 'll-media-action' },
            h(Btn, { variant: 'primary',
              'data-busy': mediaActive(imageStatus) ? 'true' : undefined,
              disabled: disabled || !imageInfo.configured || mediaActive(imageStatus),
              onClick: () => generateImage(Boolean(imageRun)) },
              mediaActive(imageStatus) ? h('span', { className: 'll-media-spinner', 'aria-hidden': 'true' }) : h(Icon, { name: 'image', size: 16 }),
              mediaActive(imageStatus) ? '图片生成中…' : imageLabel)),
          imageInfo.configured && ready && !stale ? h('p', { className: 'lo-cost' },
            `1 张 · ${imageSizeLabel}${imageInfo.quality ? ` · 质量 ${imageInfo.quality}` : ''} · 费用未知`) : null,
          imageStatus && !mediaActive(imageStatus) ? h('span', { className: 'll-image-status', role: 'status', 'data-tone': mediaTone(imageStatus) },
            h(StatusDot, { tone: mediaTone(imageStatus) }), mediaLabel(imageStatus), imageBytes ? ` · ${imageBytes}` : null) : null,
          imageRun?.error ? h('p', { className: 'll-media-error', role: 'alert' }, imageRun.error) : null,
          !imageRun?.error && imageJob?.error ? h('p', { className: 'll-media-error', role: 'alert' }, imageJob.error) : null)))
}

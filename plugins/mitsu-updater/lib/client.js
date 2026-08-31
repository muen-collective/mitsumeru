// @muen/mitsu-updater — browser half: an update toast in shell.overlay.
//
// Ported from the dsh-desktop updater card (preload/index.cjs): a compact
// frame-edge toast that polls the host's /mitsu/update/status and offers
// Update now / Later / Skip, then "Restart to apply" after a pull. The host
// owns all git work; the client only reads status and fires the three verbs.

window.__ModuleLoader__.load({
  id: '@muen/mitsu-updater',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useCallback } = React

    const styles = `
      .mitsu-update-root{position:fixed;top:16px;right:16px;z-index:2147483646;display:none;width:min(384px,calc(100vw - 40px));font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .mitsu-update-card{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border:1px solid rgba(120,120,125,.35);border-radius:14px;color:var(--dsw-alias-label-primary,#27272a);background:var(--dsw-alias-bg-layer-1,rgba(255,255,255,.94));box-shadow:0 5px 18px rgba(0,0,0,.12);backdrop-filter:blur(12px)}
      .mitsu-update-badge{flex:none;width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;background:var(--mitsu-primary,#765898);color:#fff}
      .mitsu-update-badge.warn{background:var(--dsw-alias-state-warn-fill,#d97706)}
      .mitsu-update-body{display:grid;gap:2px;min-width:0}
      .mitsu-update-title{font-size:13px;font-weight:700;line-height:18px}
      .mitsu-update-desc{font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary,#71717a);overflow-wrap:anywhere}
      .mitsu-update-progress{height:4px;border-radius:2px;margin-top:6px;background:var(--dsw-alias-bg-layer-2,#eee);overflow:hidden}
      .mitsu-update-progress>div{height:100%;background:var(--mitsu-primary,#765898)}
      .mitsu-update-actions{display:flex;gap:6px;margin-top:8px}
      .mitsu-update-actions button{min-height:26px;padding:3px 12px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-size:12px;font-weight:600}
      .mitsu-update-primary{background:var(--mitsu-primary,#765898);color:#fff}
      .mitsu-update-primary:hover{opacity:.9}
      .mitsu-update-secondary{background:var(--dsw-alias-bg-layer-2,#f1f1f3);color:var(--dsw-alias-label-primary,#3f3f46)}
      .mitsu-update-close{margin-left:auto;flex:none;width:22px;height:22px;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary,#71717a);cursor:pointer;font-size:14px;line-height:1}
      .mitsu-update-close:hover{background:var(--dsw-alias-bg-layer-2,#eee)}
    `

    const icon = '⬆'

    function titleFor(status, t) {
      switch (status.phase) {
        case 'checking': return t === 'zh' ? '正在检查更新' : 'Checking for updates'
        case 'available': return t === 'zh' ? '有可用更新' : 'Update available'
        case 'pulling': return t === 'zh' ? '正在更新…' : 'Updating…'
        case 'pulled': return t === 'zh' ? '更新已就绪' : 'Update ready'
        case 'up-to-date': return t === 'zh' ? '已是最新版本' : 'Up to date'
        case 'error': return t === 'zh' ? '更新失败' : 'Update failed'
        default: return 'Mitsu'
      }
    }

    function descFor(status, t) {
      switch (status.phase) {
        case 'checking': return t === 'zh' ? '正在检查 muen 更新…' : 'Checking the muen fork for updates…'
        case 'available':
          return status.message || (t === 'zh' ? '有新版本可用。' : 'A new version is available.')
        case 'pulling': return t === 'zh' ? '正在拉取更新…' : 'Pulling the update…'
        case 'pulled': return t === 'zh' ? '已拉取，重启后生效。' : 'Update pulled — reload to apply it.'
        case 'up-to-date': return t === 'zh' ? '你已运行最新版本。' : 'You are on the latest version.'
        case 'error': return status.message || (t === 'zh' ? '更新时出错，请重试。' : 'Something went wrong — please try again.')
        default: return ''
      }
    }

    const UpdaterToast = () => {
      const [status, setStatus] = useState({ phase: 'idle', version: null, commitsBehind: 0, message: '', skipped: false })
      const [dismissed, setDismissed] = useState(null)
      const [busy, setBusy] = useState(false)
      const t = (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('zh')) ? 'zh' : 'en'

      const refresh = useCallback(() => {
        fetch('/mitsu/update/status', { cache: 'no-store' })
          .then((r) => r.json())
          .then((s) => { if (s && s.ok) setStatus(s) })
          .catch(() => {})
      }, [])

      useEffect(() => {
        refresh()
        const id = setInterval(refresh, 60 * 1000)
        return () => clearInterval(id)
      }, [refresh])

      const act = useCallback((verb, body) => {
        setBusy(true)
        fetch('/mitsu/update/' + verb, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: body ? JSON.stringify(body) : '{}',
        })
          .then((r) => r.json())
          .then((s) => {
            setStatus(s || status)
            setBusy(false)
          })
          .catch(() => setBusy(false))
      }, [status])

      const visible = (() => {
        if (status.phase === 'idle' || status.phase === 'checking') return false
        if (status.phase === 'up-to-date') return false
        if (status.phase === 'error') return true
        if (status.skipped && status.phase === 'available') return false
        if (dismissed === status.phase && status.phase !== 'available') return false
        if (dismissed === status.version && status.phase === 'available') return false
        return true
      })()

      if (!visible) return null

      const actions = []
      if (status.phase === 'available' && !status.skipped) {
        actions.push(h('button', {
          key: 'now', className: 'mitsu-update-primary',
          disabled: busy,
          onClick: () => act('pull'),
        }, t === 'zh' ? '立即更新' : 'Update now'))
        actions.push(h('button', {
          key: 'skip', className: 'mitsu-update-secondary',
          onClick: () => { act('skip', { version: status.version }); setDismissed(status.version) },
        }, t === 'zh' ? '跳过此版本' : 'Skip this version'))
      }
      if (status.phase === 'pulled') {
        actions.push(h('button', {
          key: 'reload', className: 'mitsu-update-primary',
          onClick: () => window.location.reload(),
        }, t === 'zh' ? '重新加载' : 'Reload to apply'))
        actions.push(h('button', {
          key: 'later', className: 'mitsu-update-secondary',
          onClick: () => setDismissed('pulled'),
        }, t === 'zh' ? '稍后' : 'Later'))
      }
      if (status.phase === 'error') {
        actions.push(h('button', {
          key: 'retry', className: 'mitsu-update-primary',
          disabled: busy,
          onClick: () => act('check'),
        }, t === 'zh' ? '重试' : 'Retry'))
      }

      return h('div', { className: 'mitsu-update-root' },
        h('div', { className: 'mitsu-update-card' },
          h('span', { className: 'mitsu-update-badge' + (status.phase === 'error' ? ' warn' : '') }, status.phase === 'pulling' ? '…' : icon),
          h('div', { className: 'mitsu-update-body' },
            h('div', { className: 'mitsu-update-title' }, titleFor(status, t)),
            h('div', { className: 'mitsu-update-desc' }, descFor(status, t)),
            actions.length > 0 ? h('div', { className: 'mitsu-update-actions' }, actions) : null),
          h('button', {
            className: 'mitsu-update-close',
            'aria-label': t === 'zh' ? '关闭' : 'Close',
            onClick: () => setDismissed(status.phase === 'available' ? status.version : status.phase),
          }, '×'),
        ),
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        const style = document.createElement('style')
        style.textContent = styles
        document.head.appendChild(style)
        ctx.effect(() => () => { style.remove() })

        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register({
            name: 'shell.overlay',
            id: 'mitsu-updater',
            order: 200,
          }, () => h(UpdaterToast)))
      },
    }
  },
})

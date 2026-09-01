// @muen/mitsu-runninghub — browser half.
// "RunningHub" rail surface: run a creative workflow / model endpoint on RunningHub
// and land the output in the local Assets folder. The host holds RH_API_KEY and never
// sends it here; this half only calls the trusted /mitsu/rh/* routes. A lightweight
// "Check key" calls /probe so the user can validate RH_API_KEY without running a task.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-runninghub',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect } = React

    const STYLE = `
      .mitsu-rh { display: flex; flex-direction: column; height: 100%; gap: 12px; font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); }
      .mitsu-rh label { font-size: 11px; color: var(--dsw-alias-label-secondary); display: block; margin-bottom: 4px; }
      .mitsu-rh input, .mitsu-rh textarea { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); font-size: 12px; font-family: inherit; outline: none; resize: vertical; }
      .mitsu-rh input { height: 32px; }
      .mitsu-rh textarea { min-height: 56px; font-family: var(--ds-font-family-code, monospace); }
      .mitsu-rh-row { display: flex; gap: 8px; }
      .mitsu-rh-btn { flex: 1; padding: 9px 12px; border-radius: 8px; border: none; background: var(--dsw-alias-state-business-primary); color: var(--dsw-alias-label-primary-inverted, #fff); font-size: 13px; font-weight: 600; cursor: pointer; }
      .mitsu-rh-btn.ghost { background: none; border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
      .mitsu-rh-btn:disabled { opacity: .55; cursor: default; }
      .mitsu-rh-msg { font-size: 12px; line-height: 1.5; padding: 8px 10px; border-radius: 8px; }
      .mitsu-rh-msg.error { background: color-mix(in srgb, var(--dsw-alias-state-danger-primary) 12%, transparent); color: var(--dsw-alias-state-danger-primary); }
      .mitsu-rh-msg.info { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent); color: var(--dsw-alias-label-secondary); }
      .mitsu-rh-msg.ok { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent); color: var(--dsw-alias-state-success-primary); }
      .mitsu-rh-grid { display: grid; grid-template-columns: 1fr; gap: 8px; overflow-y: auto; }
      .mitsu-rh-card { border-radius: 10px; overflow: hidden; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); }
      .mitsu-rh-card img { width: 100%; display: block; background: var(--dsw-alias-bg-layer-2); }
      .mitsu-rh-card-name { padding: 6px 8px; font-size: 10px; color: var(--dsw-alias-label-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mitsu-rh-hint { font-size: 11px; color: var(--dsw-alias-label-tertiary); line-height: 1.5; }
    `

    let styleInjected = false
    const ensureStyles = () => {
      if (styleInjected) return
      styleInjected = true
      const st = document.createElement('style')
      st.setAttribute('data-mitsu-runninghub', '1')
      st.textContent = STYLE
      document.head.appendChild(st)
    }

    const Icon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('path', { d: 'M12 2v4M12 18v4M2 12h4M18 12h4' }),
      h('circle', { cx: 12, cy: 12, r: 3 }))

    const Panel = () => {
      const [keySet, setKeySet] = useState(null)
      const [endpoint, setEndpoint] = useState('')
      const [paramsText, setParamsText] = useState('{\n  "prompt": ""\n}')
      const [busy, setBusy] = useState(false)
      const [result, setResult] = useState(null)
      const [error, setError] = useState('')
      const [probeMsg, setProbeMsg] = useState('')

      useEffect(() => {
        fetch('/mitsu/rh/status', { cache: 'no-store' }).then((r) => r.json()).then((res) => {
          if (res && res.ok) setKeySet(!!res.keyConfigured)
        }).catch(() => setKeySet(false))
      }, [])

      const parseParams = () => {
        try { return JSON.parse(paramsText || '{}') } catch (e) { setError('Params JSON is invalid'); return undefined }
      }

      const checkKey = () => {
        if (!endpoint.trim()) { setError('Enter an endpoint to check the key.'); return }
        setProbeMsg(''); setError('')
        fetch('/mitsu/rh/probe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint }) })
          .then((r) => r.json()).then((res) => {
            setProbeMsg(res && res.ok ? 'Key OK — RunningHub responded.' : (res && res.error) || 'Key check failed.')
          }).catch(() => setProbeMsg('Could not run key check.'))
      }

      const run = () => {
        if (!endpoint.trim()) { setError('Enter an endpoint.'); return }
        const params = parseParams()
        if (params === undefined) return
        setBusy(true); setError(''); setResult(null); setProbeMsg('')
        fetch('/mitsu/rh/run', {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint, params }),
        }).then((r) => r.json()).then((res) => {
          if (res && res.ok) setResult(res)
          else setError((res && (res.error || 'Run failed.')) || 'Run failed.')
        }).catch(() => setError('Could not reach the RunningHub surface.')).finally(() => setBusy(false))
      }

      return h('div', { className: 'mitsu-rh' },
        h('div', null,
          h('label', null, 'Endpoint (model or workflow registry path)'),
          h('input', { value: endpoint, onChange: (e) => setEndpoint(e.target.value), placeholder: 'e.g. midjourney-text-to-image-v7', disabled: busy })),
        h('div', null,
          h('label', null, 'Params (JSON)'),
          h('textarea', { value: paramsText, onChange: (e) => setParamsText(e.target.value), disabled: busy })),
        h('div', { className: 'mitsu-rh-row' },
          h('button', { className: 'mitsu-rh-btn ghost', onClick: checkKey, disabled: busy }, 'Check key'),
          h('button', { className: 'mitsu-rh-btn', onClick: run, disabled: busy }, busy ? 'Running…' : 'Run')),
        h('div', { className: 'mitsu-rh-hint' }, 'The key is read host-side. Output lands in ~/Mitsu/assets.'),
        keySet === false && h('div', { className: 'mitsu-rh-msg error' }, 'RH_API_KEY is not set.'),
        probeMsg && h('div', { className: 'mitsu-rh-msg ' + (probeMsg.startsWith('Key OK') ? 'ok' : probeMsg.startsWith('Could not reach') ? 'error' : 'error') }, probeMsg),
        error && h('div', { className: 'mitsu-rh-msg error' }, error),
        busy && h('div', { className: 'mitsu-rh-msg info' }, 'Running on RunningHub — can take 10s–30m…'),
        result && result.files && result.files.length > 0 &&
          h('div', { className: 'mitsu-rh-grid' },
            result.files.map((f) => h('div', { key: f.name, className: 'mitsu-rh-card' },
              (f.url.startsWith('http') || f.url.startsWith('/'))
                ? h('img', { src: f.url, alt: f.name, loading: 'lazy' })
                : h('div', null, f.name),
              h('div', { className: 'mitsu-rh-card-name' }, f.name))))
      )
    }

    return {
      inject: [],
      apply() {
        ensureStyles()
        if (!window.__MITSU_RAIL__) return
        window.__MITSU_RAIL__.surfaces = window.__MITSU_RAIL__.surfaces.filter((s) => s.id !== 'runninghub')
        window.__MITSU_RAIL__.surfaces.push({ id: 'runninghub', label: 'RunningHub', icon: Icon, panel: Panel, hidden: true })
        for (const fn of window.__MITSU_RAIL__.listeners) fn([...window.__MITSU_RAIL__.surfaces])
      },
    }
  },
})

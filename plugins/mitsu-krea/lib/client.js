// @muen/mitsu-krea — browser half.
// "Krea" rail surface: generate images with Krea 2 and have them land in the
// local Assets folder (MITSU_PROJECT/assets, the visible durable copy). The host
// holds the KREA_API_KEY and never sends it here; this half only calls the
// trusted /mitsu/krea/* routes. After a successful generation the result is a
// local asset, so the Assets surface (and this panel's own grid) both show it.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-krea',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect } = React

    const STYLE = `
      .mitsu-krea { display: flex; flex-direction: column; height: 100%; gap: 12px; font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); }
      .mitsu-krea label { font-size: 11px; color: var(--dsw-alias-label-secondary); display: block; margin-bottom: 4px; }
      .mitsu-krea textarea, .mitsu-krea select { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); font-size: 12px; font-family: inherit; outline: none; resize: vertical; }
      .mitsu-krea textarea { min-height: 72px; }
      .mitsu-krea-row { display: flex; gap: 8px; }
      .mitsu-krea-row > div { flex: 1; }
      .mitsu-krea-btn { width: 100%; padding: 9px 12px; border-radius: 8px; border: none; background: var(--mitsu-primary, #765898); color: var(--dsw-alias-label-primary-inverted, #fff); font-size: 13px; font-weight: 600; cursor: pointer; }
      .mitsu-krea-btn:disabled { opacity: .55; cursor: default; }
      .mitsu-krea-msg { font-size: 12px; line-height: 1.5; padding: 8px 10px; border-radius: 8px; }
      .mitsu-krea-msg.error { background: color-mix(in srgb, var(--dsw-alias-state-danger-primary) 12%, transparent); color: var(--dsw-alias-state-danger-primary); }
      .mitsu-krea-msg.info { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent); color: var(--dsw-alias-label-secondary); }
      .mitsu-krea-grid { display: grid; grid-template-columns: 1fr; gap: 8px; overflow-y: auto; }
      .mitsu-krea-card { border-radius: 10px; overflow: hidden; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); }
      .mitsu-krea-card img { width: 100%; display: block; background: var(--dsw-alias-bg-layer-2); }
      .mitsu-krea-card-name { padding: 6px 8px; font-size: 10px; color: var(--dsw-alias-label-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    `

    let styleInjected = false
    const ensureStyles = () => {
      if (styleInjected) return
      styleInjected = true
      const st = document.createElement('style')
      st.setAttribute('data-mitsu-krea', '1')
      st.textContent = STYLE
      document.head.appendChild(st)
    }

    const ASPECTS = ['16:9', '9:16', '1:1', '4:3', '3:2', '2:3', '21:9']
    const RESOLUTIONS = ['1K', '2K']

    const Icon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('path', { d: 'M4 4h16v16H4z' }),
      h('circle', { cx: 9, cy: 9, r: 2 }),
      h('path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }),
      h('path', { d: 'M15 2v4M4 7h4' }))

    const Panel = () => {
      const [models, setModels] = useState(['krea-2-medium'])
      const [model, setModel] = useState('krea-2-medium')
      const [prompt, setPrompt] = useState('')
      const [aspect, setAspect] = useState('16:9')
      const [resolution, setResolution] = useState('1K')
      const [keySet, setKeySet] = useState(null)
      const [busy, setBusy] = useState(false)
      const [result, setResult] = useState(null)
      const [error, setError] = useState('')

      useEffect(() => {
        fetch('/mitsu/krea/models', { cache: 'no-store' }).then((r) => r.json()).then((res) => {
          if (res && res.ok && res.models && res.models.length) {
            setModels(res.models)
            setModel(res.models[0])
          }
        }).catch(() => {})
        fetch('/mitsu/krea/status', { cache: 'no-store' }).then((r) => r.json()).then((res) => {
          if (res && res.ok) setKeySet(!!res.keyConfigured)
        }).catch(() => setKeySet(false))
      }, [])

      const generate = () => {
        if (!prompt.trim()) { setError('Enter a prompt first.'); return }
        setBusy(true); setError(''); setResult(null)
        fetch('/mitsu/krea/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ model, prompt, aspect_ratio: aspect, resolution }),
        }).then((r) => r.json()).then((res) => {
          if (res && res.ok) setResult(res)
          else setError((res && (res.error || 'Generation failed.')) || 'Generation failed.')
        }).catch(() => setError('Could not reach the Krea surface.')).finally(() => setBusy(false))
      }

      return h('div', { className: 'mitsu-krea' },
        h('div', null,
          h('label', null, 'Model'),
          h('select', { value: model, onChange: (e) => setModel(e.target.value), disabled: busy },
            models.map((m) => h('option', { key: m, value: m }, m)))),
        h('div', null,
          h('label', null, 'Prompt'),
          h('textarea', { value: prompt, onChange: (e) => setPrompt(e.target.value), placeholder: 'Describe the image…', disabled: busy })),
        h('div', { className: 'mitsu-krea-row' },
          h('div', null,
            h('label', null, 'Aspect ratio'),
            h('select', { value: aspect, onChange: (e) => setAspect(e.target.value), disabled: busy },
              ASPECTS.map((a) => h('option', { key: a, value: a }, a)))),
          h('div', null,
            h('label', null, 'Resolution'),
            h('select', { value: resolution, onChange: (e) => setResolution(e.target.value), disabled: busy },
              RESOLUTIONS.map((r) => h('option', { key: r, value: r }, r))))),
        h('button', { className: 'mitsu-krea-btn', onClick: generate, disabled: busy },
          busy ? 'Generating…' : 'Generate'),
        keySet === false && h('div', { className: 'mitsu-krea-msg error' },
          'KREA_API_KEY is not set. Export it so the host can call Krea.'),
        error && h('div', { className: 'mitsu-krea-msg error' }, error),
        busy && h('div', { className: 'mitsu-krea-msg info' }, 'Generating — this may take ~10–60s…'),
        result && result.files && result.files.length > 0 &&
          h('div', { className: 'mitsu-krea-grid' },
            result.files.map((f) => h('div', { key: f.name, className: 'mitsu-krea-card' },
              f.url.startsWith('http') || f.url.startsWith('/')
                ? h('img', { src: f.url, alt: f.name, loading: 'lazy' })
                : h('div', null, f.name),
              h('div', { className: 'mitsu-krea-card-name' }, f.name))))
      )
    }

    return {
      inject: [],
      apply() {
        ensureStyles()
        if (!window.__MITSU_RAIL__) return
        window.__MITSU_RAIL__.surfaces = window.__MITSU_RAIL__.surfaces.filter((s) => s.id !== 'krea')
        window.__MITSU_RAIL__.surfaces.push({ id: 'krea', label: 'Krea', icon: Icon, panel: Panel, hidden: true })
        for (const fn of window.__MITSU_RAIL__.listeners) fn([...window.__MITSU_RAIL__.surfaces])
      },
    }
  },
})

// @muen/mitsu-assets — browser half.
// Asset library surface backed by the host `mitsu.assets` service: it lists the
// images downloaded into the VISIBLE local folder (MITSU_PROJECT/assets, default
// ~/Mitsu/assets). No Cloudinary — the durable copy is the local file. The list
// refreshes on open and on an interval; clicking an asset opens the local file.
// A "refresh" control re-reads the folder (e.g. after the browser panel saves a
// generated asset there).
window.__ModuleLoader__.load({
  id: '@muen/mitsu-assets',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo } = React

    const STYLE = `
      .mitsu-assets { display: flex; flex-direction: column; height: 100%; gap: 12px; font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); }
      .mitsu-assets-search { padding: 8px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); font-size: 12px; outline: none; font-family: inherit; }
      .mitsu-assets-bar { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--dsw-alias-label-secondary); }
      .mitsu-assets-refresh { background: none; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; padding: 3px 10px; color: var(--dsw-alias-label-primary); cursor: pointer; font-size: 11px; }
      .mitsu-assets-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; overflow-y: auto; }
      .mitsu-assets-empty { color: var(--dsw-alias-label-tertiary); font-size: 12px; text-align: center; padding: 24px 8px; line-height: 1.5; }
      .mitsu-assets-card { border-radius: 10px; overflow: hidden; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); position: relative; display: flex; flex-direction: column; }
      .mitsu-assets-card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; background: var(--dsw-alias-bg-layer-2); }
      .mitsu-assets-name { padding: 6px 8px; font-size: 10px; color: var(--dsw-alias-label-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    `

    const Icon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 }),
      h('circle', { cx: 9, cy: 9, r: 2 }),
      h('path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }))

    const Panel = () => {
      const [query, setQuery] = useState('')
      const [files, setFiles] = useState([])
      const [root, setRoot] = useState('')
      const [loading, setLoading] = useState(true)

      const refresh = () => {
        fetch('/mitsu/assets/list', { cache: 'no-store' }).then((r) => r.json()).then((res) => {
          if (res && res.ok) { setFiles(res.files || []); setRoot(res.root || '') }
          setLoading(false)
        }).catch(() => setLoading(false))
      }

      useEffect(() => {
        refresh()
        const id = window.setInterval(refresh, 15000)
        return () => window.clearInterval(id)
      }, [])

      const filtered = useMemo(() => files.filter((f) =>
        f.name.toLowerCase().includes(query.toLowerCase())), [query])

      return h('div', { className: 'mitsu-assets' },
        h('input', {
          className: 'mitsu-assets-search',
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: 'Search assets…',
        }),
        h('div', { className: 'mitsu-assets-bar' },
          h('span', null, files.length + ' asset' + (files.length === 1 ? '' : 's')),
          h('button', { className: 'mitsu-assets-refresh', onClick: refresh }, 'Refresh')),
        loading
          ? h('div', { className: 'mitsu-assets-empty' }, 'Loading assets…')
          : files.length === 0
            ? h('div', { className: 'mitsu-assets-empty' },
                'No assets yet. Generated or downloaded images land in ' + (root || 'the assets folder') + '.')
            : h('div', { className: 'mitsu-assets-grid' },
                filtered.map((f) => h('div', { key: f.path, className: 'mitsu-assets-card' },
                  h('img', { src: f.url, alt: f.name, loading: 'lazy' }),
                  h('div', { className: 'mitsu-assets-name' }, f.name)))))
    }

    return {
      inject: [],
      apply() {
        if (!window.__MITSU_RAIL__) return
        window.__MITSU_RAIL__.surfaces = window.__MITSU_RAIL__.surfaces.filter((s) => s.id !== 'assets')
        window.__MITSU_RAIL__.surfaces.push({ id: 'assets', label: 'Assets', icon: Icon, panel: Panel, hidden: true })
        for (const fn of window.__MITSU_RAIL__.listeners) fn([...window.__MITSU_RAIL__.surfaces])
      },
    }
  },
})

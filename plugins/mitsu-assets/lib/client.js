window.__ModuleLoader__.load({
  id: '@muen/mitsu-assets',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useMemo } = React

    const ASSETS = [
      { id: 'a1', name: 'Editorial look 01', prompt: 'Spring campaign editorial', color: '#765898', type: 'Text-to-image' },
      { id: 'a2', name: 'Silk slip dress', prompt: 'Silk slip on mannequin', color: '#52d053', type: 'Text-to-image' },
      { id: 'a3', name: 'Sketch → flat lay', prompt: 'Sketch extraction to flat lay', color: '#c62a3e', type: 'Sketch-to-image' },
      { id: 'a4', name: 'Cropped knit set', prompt: 'Cropped knit campaign crop', color: '#e6770b', type: 'Campaign' },
      { id: 'a5', name: 'Runway clip', prompt: 'Backstage motion clip', color: '#f6c026', type: 'Video' },
      { id: 'a6', name: 'Palette still life', prompt: 'Ink & violet still life', color: '#68a8a8', type: 'Text-to-image' },
      { id: 'a7', name: 'Denim jacket', prompt: 'Distressed denim jacket', color: '#d94a9c', type: 'Text-to-image' },
      { id: 'a8', name: 'Satin evening gown', prompt: 'Satin gown studio', color: '#60a5fa', type: 'Text-to-image' },
    ]

    const Icon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 }),
      h('circle', { cx: 9, cy: 9, r: 2 }),
      h('path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }))

    const Panel = () => {
      const [query, setQuery] = useState('')
      const [selected, setSelected] = useState(() => new Set())
      const filtered = useMemo(() => ASSETS.filter(a =>
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.prompt.toLowerCase().includes(query.toLowerCase())), [query])

      const toggle = (id) => {
        setSelected(prev => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id); else next.add(id)
          return next
        })
      }

      return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%', gap: 12 } },
        h('input', {
          value: query,
          onChange: e => setQuery(e.target.value),
          placeholder: 'Search assets…',
          style: {
            padding: '8px 10px', borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2)',
            background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)',
            fontSize: 12, outline: 'none', fontFamily: 'inherit',
          },
        }),
        selected.size > 0 && h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } },
          h('span', null, selected.size + ' selected'),
          h('button', { onClick: () => setSelected(new Set()), style: { background: 'none', border: 'none', color: 'var(--dsw-alias-label-primary)', cursor: 'pointer', fontSize: 11 } }, 'Clear')),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, overflowY: 'auto' } },
          filtered.map(a => h('div', {
            key: a.id,
            onClick: () => toggle(a.id),
            style: {
              aspectRatio: '3/4', borderRadius: 10, background: `linear-gradient(135deg, ${a.color}cc, ${a.color}55)`,
              color: '#fff', padding: 8, cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              border: selected.has(a.id) ? '2px solid var(--mitsu-primary, #765898)' : '2px solid transparent',
            },
          },
            h('div', { style: { fontWeight: 600, fontSize: 11, textShadow: '0 1px 2px rgba(0,0,0,.4)' } }, a.name),
            h('div', { style: { fontSize: 9, opacity: .85 } }, a.type))))
      )
    }

    return {
      inject: [],
      apply() {
        if (!window.__MITSU_RAIL__) return
        window.__MITSU_RAIL__.surfaces = window.__MITSU_RAIL__.surfaces.filter(s => s.id !== 'assets')
        window.__MITSU_RAIL__.surfaces.push({ id: 'assets', label: 'Assets', icon: Icon, panel: Panel })
        for (const fn of window.__MITSU_RAIL__.listeners) fn([...window.__MITSU_RAIL__.surfaces])
      },
    }
  },
})

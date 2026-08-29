window.__ModuleLoader__.load({
  id: '@muen/mitsu-docs',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const Icon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' }),
      h('path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }),
      h('path', { d: 'M10 9H8' }),
      h('path', { d: 'M16 13H8' }),
      h('path', { d: 'M16 17H8' }))
    const Panel = () => h('div', null,
      ['Spring Campaign — Mood Board', 'Using Mitsu', 'FAQ.md', 'Sketch Notes'].map((title, i) =>
        h('div', { key: title, style: { borderBottom: '1px solid var(--dsw-alias-border-l1)', padding: '8px 0' } },
          h('div', { style: { fontSize: 12, fontWeight: 600 } }, title),
          h('div', { style: { fontSize: 10, color: 'var(--dsw-alias-label-secondary)' } }, i === 0 ? 'Campaigns · .md' : 'Docs · .md'))))
    return {
      inject: [],
      apply() {
        if (!window.__MITSU_RAIL__) return
        window.__MITSU_RAIL__.surfaces = window.__MITSU_RAIL__.surfaces.filter(s => s.id !== 'docs')
        window.__MITSU_RAIL__.surfaces.push({ id: 'docs', label: 'Docs', icon: Icon, panel: Panel })
        for (const fn of window.__MITSU_RAIL__.listeners) fn([...window.__MITSU_RAIL__.surfaces])
      },
    }
  },
})

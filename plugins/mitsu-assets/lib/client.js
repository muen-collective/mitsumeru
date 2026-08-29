window.__ModuleLoader__.load({
  id: '@muen/mitsu-assets',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const Icon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 }),
      h('circle', { cx: 9, cy: 9, r: 2 }),
      h('path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }))
    const Panel = () => h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 } },
      ['Editorial look 01', 'Silk slip dress', 'Sketch → flat lay', 'Cropped knit set'].map(name =>
        h('div', { key: name, style: { aspectRatio: '3/4', borderRadius: 8, background: 'linear-gradient(135deg, #76589855, #52d05355)', color: '#fff', display: 'flex', alignItems: 'flex-end', padding: 8, fontSize: 10, fontWeight: 600 } }, name)))
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

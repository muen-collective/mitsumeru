window.__ModuleLoader__.load({
  id: '@muen/mitsu-browser',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const Icon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('circle', { cx: 12, cy: 12, r: 10 }),
      h('path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }),
      h('path', { d: 'M2 12h20' }))
    const Panel = () => h('div', null,
      h('div', { style: { border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 10, overflow: 'hidden' } },
        h('div', { style: { padding: '8px 10px', borderBottom: '1px solid var(--dsw-alias-border-l2)', fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } }, 'https://muen.studio'),
        h('iframe', { style: { width: '100%', height: 320, border: 'none', background: '#fff' }, src: 'https://example.com', title: 'Browser preview' })))
    return {
      inject: [],
      apply() {
        if (!window.__MITSU_RAIL__) return
        window.__MITSU_RAIL__.surfaces = window.__MITSU_RAIL__.surfaces.filter(s => s.id !== 'browser')
        window.__MITSU_RAIL__.surfaces.push({ id: 'browser', label: 'Browser', icon: Icon, panel: Panel })
        for (const fn of window.__MITSU_RAIL__.listeners) fn([...window.__MITSU_RAIL__.surfaces])
      },
    }
  },
})

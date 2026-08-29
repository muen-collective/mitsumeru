window.__ModuleLoader__.load({
  id: '@muen/mitsu-browser',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState } = React
    const Icon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('circle', { cx: 12, cy: 12, r: 10 }),
      h('path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }),
      h('path', { d: 'M2 12h20' }))
    const style = {
      tabBar: { display: 'flex', gap: 4, padding: '6px 4px', borderBottom: '1px solid var(--dsw-alias-border-l2)', overflowX: 'auto' },
      tab: (active) => ({
        display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8,
        background: active ? 'var(--dsw-alias-bg-layer-3)' : 'transparent',
        color: active ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
        border: 'none', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap', fontFamily: 'var(--dsw-font-family)',
      }),
      addressBar: { display: 'flex', gap: 6, padding: '6px 4px', borderBottom: '1px solid var(--dsw-alias-border-l2)', alignItems: 'center' },
      input: { flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)', fontSize: 11, outline: 'none', fontFamily: 'inherit' },
      frame: { flex: 1, border: 'none', width: '100%', minHeight: 0, background: '#fff' },
    }

    const Panel = () => {
      const [tabs, setTabs] = useState([
        { id: 1, title: 'Localhost', url: 'http://localhost:3000' },
        { id: 2, title: 'New Tab', url: 'about:blank' },
      ])
      const [activeId, setActiveId] = useState(1)
      const [address, setAddress] = useState(tabs[0].url)
      const active = tabs.find(t => t.id === activeId) || tabs[0]

      const go = () => {
        const url = address.startsWith('http') || address.startsWith('about:') ? address : 'https://' + address
        setTabs(prev => prev.map(t => t.id === activeId ? { ...t, url, title: url.replace(/^https?:\/\//, '') } : t))
      }

      const newTab = () => {
        const id = Date.now()
        setTabs(prev => [...prev, { id, title: 'New Tab', url: 'about:blank' }])
        setActiveId(id)
        setAddress('about:blank')
      }

      const closeTab = (id) => {
        setTabs(prev => {
          const next = prev.filter(t => t.id !== id)
          if (next.length === 0) return [{ id: Date.now(), title: 'New Tab', url: 'about:blank' }]
          if (id === activeId) setActiveId(next[next.length - 1].id)
          return next
        })
      }

      return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } },
        h('div', { style: style.tabBar },
          tabs.map(t => h('button', { key: t.id, style: style.tab(t.id === activeId), onClick: () => { setActiveId(t.id); setAddress(t.url) }, title: t.url },
            h('span', null, t.title),
            h('span', { onClick: (e) => { e.stopPropagation(); closeTab(t.id) }, style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12, padding: '0 2px' } }, '×'))),
          h('button', { onClick: newTab, style: { background: 'none', border: 'none', color: 'var(--dsw-alias-label-primary)', cursor: 'pointer', padding: '5px 8px' } }, '+')),
        h('div', { style: style.addressBar },
          h('button', { onClick: go, style: { background: 'none', border: 'none', color: 'var(--dsw-alias-label-primary)', cursor: 'pointer' } }, '↻'),
          h('input', { value: address, onChange: e => setAddress(e.target.value), onKeyDown: e => { if (e.key === 'Enter') go() }, style: style.input, placeholder: 'https://localhost:3000' }),
        ),
        h('iframe', { key: active.id, src: active.url, style: style.frame, title: active.title, sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads' }))
    }
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

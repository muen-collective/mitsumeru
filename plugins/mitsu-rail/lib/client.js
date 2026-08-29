// @muen/mitsu-rail — browser half.
// Right-edge rail prototype. Uses shell.overlay + local state for now.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-rail',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState } = React

    const STYLE = `
      .mitsu-rail-nav { position: fixed; top: 0; right: 0; bottom: 0; width: 52px; z-index: 950; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 0; background: var(--dsw-alias-bg-layer-1); border-left: 1px solid var(--dsw-alias-border-l2); }
      .mitsu-rail-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 16px; }
      .mitsu-rail-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .mitsu-rail-btn.active { border-color: var(--mitsu-primary, #765898); color: var(--mitsu-primary, #765898); background: color-mix(in srgb, var(--mitsu-primary, #765898) 8%, transparent); }
      .mitsu-rail-avatar { margin-top: auto; width: 30px; height: 30px; border-radius: 999px; background: color-mix(in srgb, var(--mitsu-primary, #765898) 25%, transparent); color: var(--dsw-alias-label-primary); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; cursor: pointer; }
      .mitsu-rail-panel { position: fixed; top: 0; right: 52px; bottom: 0; width: 300px; z-index: 945; background: var(--dsw-alias-bg-layer-2); border-left: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family); padding: 20px; overflow-y: auto; }
      .mitsu-rail-panel-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
      .mitsu-rail-panel-note { font-size: 12px; color: var(--dsw-alias-label-secondary); }
    `

    let styleInjected = false
    const ensureStyle = () => {
      if (styleInjected) return
      styleInjected = true
      const style = document.createElement('style')
      style.textContent = STYLE
      document.head.appendChild(style)
    }

    const ITEMS = [
      { id: 'tree', glyph: '☰', label: 'Tree' },
      { id: 'assets', glyph: '▦', label: 'Assets' },
      { id: 'docs', glyph: '▤', label: 'Docs' },
      { id: 'browser', glyph: '◉', label: 'Browser' },
    ]

    const RIGHT_RAIL = () => {
      const [open, setOpen] = useState(null)
      ensureStyle()
      const toggle = (id) => setOpen(prev => prev === id ? null : id)
      const activePanel = ITEMS.find(i => i.id === open)
      return h('div', { className: 'mitsu-rail-nav' },
        ITEMS.map(item => h('button', {
          key: item.id,
          className: 'mitsu-rail-btn' + (open === item.id ? ' active' : ''),
          title: item.label,
          'aria-label': item.label,
          onClick: () => toggle(item.id),
        }, item.glyph)),
        h('div', { className: 'mitsu-rail-avatar', title: 'Account' }, 'TP'),
        activePanel && h('div', { className: 'mitsu-rail-panel' },
          h('div', { className: 'mitsu-rail-panel-title' }, activePanel.label),
          h('div', { className: 'mitsu-rail-panel-note' }, 'Mitsu ' + activePanel.label + ' surface placeholder.')))
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register({
            name: 'shell.overlay',
            id: 'mitsu-rail',
            order: 120,
            label: 'Mitsu right rail',
          }, RIGHT_RAIL))
      },
    }
  },
})

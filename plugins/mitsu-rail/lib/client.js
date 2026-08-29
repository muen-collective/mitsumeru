// @muen/mitsu-rail — browser half.
// Raw loader plugin: React arrives via factory(require). Lucide icons are
// embedded as inline SVG components so no external module-table dependency is needed.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-rail',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState } = React

    const STYLE = `
      .mitsu-rail-nav { position: fixed; top: 0; right: 0; bottom: 0; width: 52px; z-index: 950; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 0; background: var(--dsw-alias-bg-layer-1); border-left: 1px solid var(--dsw-alias-border-l2); }
      .mitsu-rail-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; }
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

    const svg = (children, size = 18) =>
      h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      }, ...children)

    const PanelLeftIcon = () => svg([
      h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }),
      h('path', { d: 'M9 3v18' }),
    ])

    const ImageIcon = () => svg([
      h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 }),
      h('circle', { cx: 9, cy: 9, r: 2 }),
      h('path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }),
    ])

    const FileTextIcon = () => svg([
      h('path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' }),
      h('path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }),
      h('path', { d: 'M10 9H8' }),
      h('path', { d: 'M16 13H8' }),
      h('path', { d: 'M16 17H8' }),
    ])

    const GlobeIcon = () => svg([
      h('circle', { cx: 12, cy: 12, r: 10 }),
      h('path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }),
      h('path', { d: 'M2 12h20' }),
    ])

    const ITEMS = [
      { id: 'tree', icon: PanelLeftIcon, label: 'Tree' },
      { id: 'assets', icon: ImageIcon, label: 'Assets' },
      { id: 'docs', icon: FileTextIcon, label: 'Docs' },
      { id: 'browser', icon: GlobeIcon, label: 'Browser' },
    ]

    const RIGHT_RAIL = (props) => {
      const [open, setOpen] = useState(null)
      const { toggleSidebar } = props
      ensureStyle()
      const toggle = (id) => setOpen(prev => prev === id ? null : id)
      const handleClick = (id) => {
        if (id === 'tree') {
          toggleSidebar()
          return
        }
        toggle(id)
      }
      const activePanel = ITEMS.find(i => i.id === open && i.id !== 'tree')
      return h('div', { className: 'mitsu-rail-nav' },
        ITEMS.map(item => h('button', {
          key: item.id,
          className: 'mitsu-rail-btn' + (open === item.id ? ' active' : ''),
          title: item.label,
          'aria-label': item.label,
          onClick: () => handleClick(item.id),
        }, h(item.icon))),
        h('div', { className: 'mitsu-rail-avatar', title: 'Account' }, 'TP'),
        activePanel && h('div', { className: 'mitsu-rail-panel' },
          h('div', { className: 'mitsu-rail-panel-title' }, activePanel.label),
          h('div', { className: 'mitsu-rail-panel-note' }, 'Mitsu ' + activePanel.label + ' surface placeholder.')))
    }

    return {
      inject: ['slots', 'layout'],
      apply(ctx) {
        const injected = () => ({
          toggleSidebar: () => ctx.layout.toggleSidebar(),
        })
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register({
            name: 'shell.overlay',
            id: 'mitsu-rail',
            order: 120,
            label: 'Mitsu right rail',
            inject: injected,
          }, RIGHT_RAIL))
      },
    }
  },
})

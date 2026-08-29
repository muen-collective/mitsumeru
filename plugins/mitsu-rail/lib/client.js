// @muen/mitsu-rail — browser half.
// Raw loader plugin: React arrives via factory(require). Lucide icons are
// embedded as inline SVG components. The right dock uses DSH's details column
// so panels push the agent loop instead of overlaying it.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-rail',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect } = React

    const PANEL_WIDTH = 300
    const MIN_PANEL_WIDTH = 220
    const MAX_PANEL_WIDTH = 520

    // Shared dock state between the rail and the details-slot dock.
    const DOCK = { panels: [], widths: {}, listeners: [] }
    const getState = () => ({ panels: DOCK.panels, widths: { ...DOCK.widths } })
    const emit = () => { for (const fn of DOCK.listeners) fn(getState()) }
    const subscribe = (fn) => {
      DOCK.listeners.push(fn)
      return () => {
        const i = DOCK.listeners.indexOf(fn)
        if (i >= 0) DOCK.listeners.splice(i, 1)
      }
    }
    const setPanels = (panels) => {
      DOCK.panels = panels
      for (const id of panels) if (DOCK.widths[id] === undefined) DOCK.widths[id] = PANEL_WIDTH
      for (const id of Object.keys(DOCK.widths)) if (!panels.includes(id)) delete DOCK.widths[id]
      emit()
    }
    const setWidth = (id, width) => {
      DOCK.widths[id] = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, width))
      emit()
    }
    const totalWidth = () => DOCK.panels.reduce((sum, id) => sum + (DOCK.widths[id] || PANEL_WIDTH), 0)

    const STYLE = `
      .mitsu-rail-nav { position: fixed; top: 0; right: 0; bottom: 0; width: 52px; z-index: 950; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 0; background: var(--dsw-alias-bg-layer-1); border-left: 1px solid var(--dsw-alias-border-l2); }
      .mitsu-rail-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; }
      .mitsu-rail-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .mitsu-rail-btn.active { border-color: var(--mitsu-primary, #765898); color: var(--mitsu-primary, #765898); background: color-mix(in srgb, var(--mitsu-primary, #765898) 8%, transparent); }
      .mitsu-rail-avatar { margin-top: auto; width: 30px; height: 30px; border-radius: 999px; background: color-mix(in srgb, var(--mitsu-primary, #765898) 25%, transparent); color: var(--dsw-alias-label-primary); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; cursor: pointer; }
      .mitsu-sidebar-header { min-width: max-content; }
      .mitsu-sidebar-header { transition: opacity 150ms var(--ds-ease-in-out), visibility 0s linear 150ms; }
      .fading .mitsu-sidebar-header,
      .collapsed .mitsu-sidebar-header { opacity: 0; visibility: hidden; pointer-events: none; }
      .mitsu-dock { display: flex; height: 100%; min-width: 0; }
      .mitsu-dock-panel { height: 100%; flex: none; border-left: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family); padding: 16px; overflow-y: auto; position: relative; }
      .mitsu-dock-title { font-size: 13px; font-weight: 700; margin-bottom: 10px; }
      .mitsu-dock-note { font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .mitsu-dock-handle { position: absolute; left: -3px; top: 0; bottom: 0; width: 6px; cursor: ew-resize; z-index: 2; }
      .mitsu-dock-handle:hover { background: color-mix(in srgb, var(--mitsu-primary, #765898) 30%, transparent); }
      .mitsu-dock-card { border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; padding: 10px; margin-bottom: 8px; background: var(--dsw-alias-bg-layer-1); }
      .mitsu-dock-card-title { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
      .mitsu-dock-card-meta { font-size: 10px; color: var(--dsw-alias-label-secondary); }
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

    const PANEL_LABELS = {
      assets: 'Assets',
      docs: 'Docs',
      browser: 'Browser',
    }

    const PanelContent = ({ id }) => {
      if (id === 'assets') return h('div', null,
        h('div', { className: 'mitsu-dock-card' },
          h('div', { className: 'mitsu-dock-card-title' }, 'Editorial look 01'),
          h('div', { className: 'mitsu-dock-card-meta' }, 'Text-to-image · 4K')),
        h('div', { className: 'mitsu-dock-card' },
          h('div', { className: 'mitsu-dock-card-title' }, 'Silk slip dress'),
          h('div', { className: 'mitsu-dock-card-meta' }, 'Text-to-image · 6K')),
        h('div', { className: 'mitsu-dock-card' },
          h('div', { className: 'mitsu-dock-card-title' }, 'Sketch → flat lay'),
          h('div', { className: 'mitsu-dock-card-meta' }, 'Sketch-to-image')))
      if (id === 'docs') return h('div', null,
        h('div', { className: 'mitsu-dock-card' },
          h('div', { className: 'mitsu-dock-card-title' }, 'Spring Campaign — Mood Board'),
          h('div', { className: 'mitsu-dock-card-meta' }, 'Campaigns · .md')),
        h('div', { className: 'mitsu-dock-card' },
          h('div', { className: 'mitsu-dock-card-title' }, 'Using Mitsu'),
          h('div', { className: 'mitsu-dock-card-meta' }, '!Welcome · .md')))
      if (id === 'browser') return h('div', null,
        h('div', { className: 'mitsu-dock-card' },
          h('div', { className: 'mitsu-dock-card-title' }, 'Brand OS preview'),
          h('div', { className: 'mitsu-dock-card-meta' }, 'https://muen.studio')))
      return null
    }

    const DockHandle = ({ id }) => {
      const startDrag = (e) => {
        e.preventDefault()
        const startX = e.clientX
        const startWidth = DOCK.widths[id] || PANEL_WIDTH
        const onMove = (ev) => {
          const delta = ev.clientX - startX
          setWidth(id, startWidth - delta)
        }
        const onUp = () => {
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
      }
      return h('div', { className: 'mitsu-dock-handle', onMouseDown: startDrag })
    }

    const MitsuDock = () => {
      const [state, setState] = useState(getState())
      useEffect(() => subscribe(setState), [])
      ensureStyle()
      return h('div', { className: 'mitsu-dock' },
        state.panels.map((id, index) =>
          h('div', {
            key: id,
            className: 'mitsu-dock-panel',
            style: { width: state.widths[id] || PANEL_WIDTH },
          },
            index > 0 && h(DockHandle, { id }),
            h('div', { className: 'mitsu-dock-title' }, PANEL_LABELS[id] || id),
            h(PanelContent, { id }))))
    }

    const MitsuSidebarHeader = () =>
      h('div', {
        className: 'mitsu-sidebar-header',
        style: {
          display: 'inline-flex',
          alignItems: 'baseline',
          color: 'var(--dsw-alias-label-primary)',
          fontFamily: 'Satoshi, ui-sans-serif, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          padding: '0 18px',
        },
      },
        'Mitsumeru',
        h('span', {
          'aria-hidden': true,
          style: {
            fontSize: '1.8em',
            lineHeight: 'normal',
            marginLeft: '0.02em',
            color: '#765898',
          },
        }, '.'))

    const RIGHT_RAIL = (props) => {
      const [state, setState] = useState(getState())
      useEffect(() => subscribe(setState), [])
      const { toggleSidebar, openDetails, closeDetails, setDetailsWidth } = props
      ensureStyle()

      const handleClick = (id) => {
        if (id === 'tree') {
          toggleSidebar()
          return
        }
        const next = state.panels.includes(id)
          ? state.panels.filter(x => x !== id)
          : [...state.panels, id]
        setPanels(next)
        if (next.length > 0) {
          setDetailsWidth(totalWidth())
          openDetails()
        } else {
          closeDetails()
        }
      }

      return h('div', { className: 'mitsu-rail-nav' },
        ITEMS.map(item => h('button', {
          key: item.id,
          className: 'mitsu-rail-btn' + (item.id !== 'tree' && state.panels.includes(item.id) ? ' active' : ''),
          title: item.label,
          'aria-label': item.label,
          onClick: () => handleClick(item.id),
        }, h(item.icon))),
        h('div', { className: 'mitsu-rail-avatar', title: 'Account' }, 'TP'))
    }

    return {
      inject: ['slots', 'layout'],
      apply(ctx) {
        const injected = () => ({
          toggleSidebar: () => ctx.layout.toggleSidebar(),
          openDetails: () => ctx.layout.openDetails(),
          closeDetails: () => ctx.layout.closeDetails(),
          setDetailsWidth: (px) => ctx.layout.setDetailsWidth(px),
        })
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register({
            name: 'shell.overlay',
            id: 'mitsu-rail',
            order: 120,
            label: 'Mitsu right rail',
            inject: injected,
          }, RIGHT_RAIL))
        ctx.slots.inject('sidebar.header', () =>
          ctx.slots.register({
            name: 'sidebar.header',
            id: 'mitsu-sidebar-header',
          }, MitsuSidebarHeader))
        ctx.slots.inject('details', () =>
          ctx.slots.register({
            name: 'details',
            id: 'mitsu-dock',
            priority: -1,
          }, MitsuDock))
      },
    }
  },
})

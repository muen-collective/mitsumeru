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

    // Shared surface registry. Each Mitsu surface plugin registers itself here.
    window.__MITSU_RAIL__ = window.__MITSU_RAIL__ || { surfaces: [], listeners: [] }
    // Surfaces register with markers. `hidden: true` surfaces are not shown as a
    // rail icon unless the founder opts them in (e.g. `window.__MITSU_SURFACES__`
    // = ['krea','runninghub','assets','browser'], or a workspace surface flag).
    // The flags are evaluated at render so the epic can re-enable them without
    // recreating the plugin. Default visible set: the critical surface only.
    const surfaceVisible = (s) => {
      if (!s || s.hidden !== true) return true
      const optIns = window.__MITSU_SURFACES__
      return Array.isArray(optIns) && optIns.includes(s.id)
    }
    const getSurfaces = () => [...window.__MITSU_RAIL__.surfaces]
    const subscribeSurfaces = (fn) => {
      window.__MITSU_RAIL__.listeners.push(fn)
      return () => {
        const i = window.__MITSU_RAIL__.listeners.indexOf(fn)
        if (i >= 0) window.__MITSU_RAIL__.listeners.splice(i, 1)
      }
    }

    const STYLE = `
      :root { --mitsu-primary: var(--dsw-alias-state-business-primary); }
      .mitsu-rail-nav { position: fixed; top: 0; right: 0; bottom: 0; width: 52px; z-index: 950; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 0; background: var(--dsw-alias-bg-layer-1); border-left: 1px solid var(--dsw-alias-border-l2); }
      [data-side="details"]::after { display: none !important; }
      /* The rail is a fixed overlay on the frame's right 52px. Reserve that space
         on the frame so NO column content (conversation header utilities, the
         details dock, the session-log button) ever extends under it. The overlay
         layer holding the rail is absolutely positioned to the frame's border box,
         so padding does not move the rail itself. */
      div:has(> [data-shell-overlay]) { padding-right: 52px; }
      .mitsu-rail-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; }
      .mitsu-rail-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      /* Active state matches the session-menu selected row (grey hover-tint + primary label). */
      .mitsu-rail-btn.active { border-color: transparent; background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .mitsu-rail-avatar { margin-top: auto; width: 30px; height: 30px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 25%, transparent); color: var(--dsw-alias-label-primary); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; cursor: pointer; }
      .mitsu-sidebar-header { min-width: max-content; }
      .mitsu-sidebar-header { transition: opacity 150ms var(--ds-ease-in-out), visibility 0s linear 150ms; }
      .fading .mitsu-sidebar-header,
      .collapsed .mitsu-sidebar-header { opacity: 0; visibility: hidden; pointer-events: none; }
      .mitsu-dock { display: flex; height: 100%; min-width: 0; width: 100%; }
      .mitsu-dock-panel { height: 100%; flex: 1 1 0; min-width: 220px; border-left: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family); padding: 16px; overflow-y: auto; position: relative; }
      .mitsu-dock-title { font-size: 13px; font-weight: 700; margin-bottom: 10px; }
      .mitsu-dock-note { font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .mitsu-dock-handle { position: absolute; left: -3px; top: 0; bottom: 0; width: 6px; cursor: ew-resize; z-index: 2; }
      .mitsu-dock-handle:hover { background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 30%, transparent); }
      .mitsu-dock-card { border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; padding: 10px; margin-bottom: 8px; background: var(--dsw-alias-bg-layer-1); }
      .mitsu-dock-card-title { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
      .mitsu-dock-card-meta { font-size: 10px; color: var(--dsw-alias-label-secondary); }
      .mitsu-asset-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .mitsu-asset-tile { aspect-ratio: 3 / 4; border-radius: 8px; background: linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-state-business-primary) 35%, transparent), color-mix(in srgb, var(--dsw-alias-state-business-tertiary) 45%, transparent)); color: var(--dsw-alias-label-primary-inverted); display: flex; align-items: flex-end; padding: 8px; font-size: 10px; font-weight: 600; }
      .mitsu-doc-item { border-bottom: 1px solid var(--dsw-alias-border-l1); padding: 8px 0; }
      .mitsu-doc-item-title { font-size: 12px; font-weight: 600; }
      .mitsu-doc-item-meta { font-size: 10px; color: var(--dsw-alias-label-secondary); }
      .mitsu-browser-frame { border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; overflow: hidden; margin-top: 8px; }
      .mitsu-browser-url { padding: 8px 10px; border-bottom: 1px solid var(--dsw-alias-border-l2); font-size: 11px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-1); }
      .mitsu-browser-iframe { width: 100%; height: 320px; border: none; background: #fff; }
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

    // The real DSH panel-left glyph (ic_ds_panel_left_outline_16) — the same
    // icon the sidebar rail uses for the sessions toggle, filled + currentColor.
    const PanelLeftIcon = () => h('svg', {
      width: 18,
      height: 18,
      viewBox: '0 0 16 16',
      fill: 'none',
      'aria-hidden': true,
    }, h('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      fill: 'currentColor',
      d: 'M9.67272 0.522841C10.8339 0.522841 11.76 0.522714 12.4963 0.602493C13.2453 0.683657 13.8789 0.854248 14.4264 1.25197C14.7504 1.48739 15.0355 1.77247 15.2709 2.0965C15.6686 2.64394 15.8392 3.27758 15.9204 4.02655C16.0002 4.7629 16 5.68895 16 6.85014V9.14986C16 10.3111 16.0002 11.2371 15.9204 11.9735C15.8392 12.7224 15.6686 13.3561 15.2709 13.9035C15.0355 14.2275 14.7504 14.5126 14.4264 14.748C13.8789 15.1458 13.2453 15.3163 12.4963 15.3975C11.76 15.4773 10.8339 15.4772 9.67272 15.4772H6.3273C5.16611 15.4772 4.24006 15.4773 3.50371 15.3975C2.75474 15.3163 2.1211 15.1458 1.57366 14.748C1.24963 14.5126 0.964549 14.2275 0.729131 13.9035C0.331407 13.3561 0.160817 12.7224 0.0796529 11.9735C-0.000126137 11.2371 1.25338e-09 10.3111 1.25338e-09 9.14986V6.85014C1.25329e-09 5.68895 -0.000126137 4.7629 0.0796529 4.02655C0.160817 3.27758 0.331407 2.64394 0.729131 2.0965C0.964549 1.77247 1.24963 1.48739 1.57366 1.25197C2.1211 0.854248 2.75474 0.683657 3.50371 0.602493C4.24006 0.522714 5.16611 0.522841 6.3273 0.522841H9.67272ZM5.54303 1.88715V14.1118C5.78636 14.1128 6.04709 14.1169 6.3273 14.1169H9.67272C10.8639 14.1169 11.7032 14.1164 12.3493 14.0465C12.9824 13.9779 13.3497 13.8494 13.6268 13.6482C13.8354 13.4966 14.0195 13.3125 14.1711 13.1039C14.3723 12.8268 14.5007 12.4595 14.5693 11.8264C14.6393 11.1803 14.6398 10.341 14.6398 9.14986V6.85014C14.6398 5.65896 14.6393 4.81967 14.5693 4.1736C14.5007 3.54048 14.3723 3.17318 14.1711 2.89609C14.0195 2.68747 13.8354 2.50337 13.6268 2.35179C13.3497 2.1506 12.9824 2.02212 12.3493 1.95353C11.7032 1.88358 10.8639 1.88307 9.67272 1.88307H6.3273C6.04709 1.88307 5.78636 1.8862 5.54303 1.88715ZM4.1828 1.91166C3.99125 1.9216 3.8148 1.93577 3.65076 1.95353C3.01764 2.02212 2.65034 2.1506 2.37325 2.35179C2.16463 2.50337 1.98052 2.68747 1.82895 2.89609C1.62776 3.17318 1.49928 3.54048 1.43069 4.1736C1.36074 4.81967 1.36023 5.65896 1.36023 6.85014V9.14986C1.36023 10.341 1.36074 11.1803 1.43069 11.8264C1.49928 12.4595 1.62776 12.8268 1.82895 13.1039C1.98052 13.3125 2.16463 13.4966 2.37325 13.6482C2.65034 13.8494 3.01764 13.9779 3.65076 14.0465C3.81478 14.0642 3.99127 14.0774 4.1828 14.0873V1.91166Z',
    }))

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

    const TREE_ITEM = { id: 'tree', icon: PanelLeftIcon, label: 'Tree' }
    const surfaceById = (id) => getSurfaces().find(s => s.id === id)
    const RAIL_ORDER = { browser: 1, docs: 2, write: 2, assets: 3 }
    const railItems = () => {
      const surfaces = getSurfaces().filter(surfaceVisible).slice().sort((a, b) => {
        const ao = RAIL_ORDER[a.id] ?? 99
        const bo = RAIL_ORDER[b.id] ?? 99
        return ao - bo
      })
      return [TREE_ITEM, ...surfaces]
    }
    const PanelContent = ({ id }) => {
      const surface = surfaceById(id)
      return surface ? surface.panel() : null
    }

    const DockHandle = ({ id, onWidthChange }) => {
      const startDrag = (e) => {
        e.preventDefault()
        const startX = e.clientX
        const startWidth = DOCK.widths[id] || PANEL_WIDTH
        const onMove = (ev) => {
          const delta = ev.clientX - startX
          setWidth(id, startWidth - delta)
          if (onWidthChange) onWidthChange()
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

    const MitsuDock = (props) => {
      const [state, setState] = useState(getState())
      useEffect(() => subscribe(setState), [])
      ensureStyle()
      const refreshLayout = () => {
        if (props.setDetailsWidth) props.setDetailsWidth(totalWidth())
      }
      return h('div', { className: 'mitsu-dock' },
        state.panels.map((id, index) =>
          h('div', {
            key: id,
            className: 'mitsu-dock-panel',
            style: {
              flexGrow: state.widths[id] || PANEL_WIDTH,
              flexBasis: 0,
              minWidth: MIN_PANEL_WIDTH,
            },
          },
            index > 0 && h(DockHandle, { id, onWidthChange: refreshLayout }),
            h('div', { className: 'mitsu-dock-title' }, (surfaceById(id)?.label) || id),
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
            color: 'var(--dsw-alias-state-business-primary)',
          },
        }, '.'))

    const RIGHT_RAIL = (props) => {
      const [state, setState] = useState(getState())
      useEffect(() => subscribe(setState), [])
      const [surfaces, setSurfaces] = useState(getSurfaces())
      useEffect(() => subscribeSurfaces(setSurfaces), [])
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

      const items = [TREE_ITEM, ...surfaces.filter(surfaceVisible)]

      return h('div', { className: 'mitsu-rail-nav' },
        items.map(item => h('button', {
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
        window.__MITSU_RAIL__.openSurface = (id) => {
          if (!DOCK.panels.includes(id)) {
            DOCK.panels.push(id)
            if (DOCK.widths[id] === undefined) DOCK.widths[id] = PANEL_WIDTH
            emit()
          }
          ctx.layout.setDetailsWidth(totalWidth())
          ctx.layout.openDetails()
        }
        window.__MITSU_RAIL__.closeAll = () => {
          setPanels([])
          ctx.layout.closeDetails()
        }
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
        ctx.slots.inject('rightDock', () =>
          ctx.slots.register({
            name: 'rightDock',
            id: 'mitsu-dock',
            priority: -1,
            inject: injected,
          }, MitsuDock))
      },
    }
  },
})

// @muen/mitsu-task-switcher — browser half.
// Persistent workspace/session switcher in the ACTIVE chat header.
//
// DSH's built-in workspace picker (the "task switcher") lives ONLY in the
// blank-session Hero (conversation.hero.workspace slot), which unmounts once a
// chat session starts. This plugin adds a small switcher to
// conversation.session.header.utilities — a slot that renders in the ACTIVE
// session header — so you can switch tasks/sessions without returning to the
// empty hero. It reuses the global hook face (sessionId, useSessions,
// useWorkspaces) and the header inject face (open) that the slot system
// already provides.
//
// Raw loader plugin, same shape as @muen/mitsu-modes / mitsu-rail.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-task-switcher',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useRef } = React

    const STYLE = `
      .mitsu-ts { position: relative; display: inline-flex; align-items: center; }
      .mitsu-ts-btn { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 12px; font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); cursor: pointer; }
      .mitsu-ts-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
      .mitsu-ts-btn.active { border-color: var(--mitsu-primary, #765898); color: var(--mitsu-primary, #765898); }
      .mitsu-ts-menu { position: absolute; right: 0; top: 30px; z-index: 20; min-width: 240px; max-height: 320px; overflow-y: auto; border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); box-shadow: var(--dsw-shadow-lv2, 0 8px 24px rgba(0,0,0,.12)); padding: 6px; }
      .mitsu-ts-head { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: var(--dsw-alias-label-tertiary); padding: 6px 8px 2px; }
      .mitsu-ts-ws { font-size: 11px; font-weight: 600; color: var(--dsw-alias-label-secondary); padding: 5px 8px 2px; }
      .mitsu-ts-item { display: flex; align-items: center; gap: 6px; width: 100%; text-align: left; padding: 7px 8px; border: none; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-primary); font-size: 12px; cursor: pointer; font-family: inherit; }
      .mitsu-ts-item:hover { background: var(--dsw-alias-interactive-bg-hover); }
      .mitsu-ts-item.current { background: color-mix(in srgb, var(--mitsu-primary, #765898) 12%, transparent); color: var(--mitsu-primary, #765898); }
      .mitsu-ts-item .dot { width: 7px; height: 7px; border-radius: 999px; flex: none; }
      .mitsu-ts-item .dot.ws { background: var(--mitsu-primary, #765898); }
      .mitsu-ts-item .dot.sess { background: var(--dsw-alias-label-tertiary); }
      .mitsu-ts-empty { font-size: 11px; color: var(--dsw-alias-label-tertiary); padding: 8px; }
    `

    let styleInjected = false
    const ensureStyles = () => {
      if (styleInjected) return
      styleInjected = true
      const st = document.createElement('style')
      st.setAttribute('data-mitsu-task-switcher', '1')
      st.textContent = STYLE
      document.head.appendChild(st)
    }

    const Icon = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('path', { d: 'M17 3l4 4-4 4M21 7H3' }),
      h('path', { d: 'M7 21l-4-4 4-4M3 17h18' }))

    // Dismiss the popover on outside pointerdown / Escape.
    function useDismiss(ref, open, setOpen) {
      useEffect(() => {
        if (!open) return
        const onPointer = (e) => {
          if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('pointerdown', onPointer)
        document.addEventListener('keydown', onKey)
        return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey) }
      }, [open])
    }

    // The switcher entry. Receives the session-scoped + global standard hooks
    // and the header inject face (open) from the slot system.
    const TaskSwitcher = (props) => {
      const [open, setOpen] = useState(false)
      const rootRef = useRef(null)
      const sessionId = props.sessionId
      const useSessions = props.useSessions
      const useWorkspaces = props.useWorkspaces
      const openSession = props.open // header inject face (sessions.open)
      useDismiss(rootRef, open, setOpen)

      const workspaces = (useWorkspaces ? useWorkspaces(s => s) : undefined)
      const wsItems = (workspaces && workspaces.items) || []
      // Current session's owning workspace (map sessionId -> workspace title).
      const currentWsTitle = useMemo(() => {
        if (!wsItems.length || sessionId === undefined) return ''
        for (const ws of wsItems) if ((ws.sessionIds || []).includes(sessionId)) return ws.title
        return ''
      }, [wsItems, sessionId])

      // Flatten workspaces -> sessions for a flat "switch task" list.
      const items = useMemo(() => {
        const list = []
        for (const ws of wsItems) {
          const sessIds = (ws.sessionIds || [])
          if (sessIds.length > 0) {
            list.push({ type: 'ws', id: ws.workspaceId, label: ws.title, current: (ws.sessionIds || []).includes(sessionId) })
            for (const sid of sessIds) list.push({ type: 'sess', id: sid, label: sid, ws: ws.title, current: sid === sessionId })
          } else {
            list.push({ type: 'ws', id: ws.workspaceId, label: ws.title, current: false })
          }
        }
        return list
      }, [wsItems, sessionId])

      if (!openSession) return null // no navigation inject face → nothing to do

      const go = (id) => { setOpen(false); openSession(id) }
      const goWs = (wsId) => {
        // Navigate to a workspace's first session when known; else fall back to
        // the navigation action is not available here, so no-op on ws-only rows.
        const ws = wsItems.find(w => w.workspaceId === wsId)
        const first = ws && (ws.sessionIds || [])[0]
        if (first) go(first)
      }

      return h('div', { className: 'mitsu-ts', ref: rootRef },
        h('button', {
          className: 'mitsu-ts-btn' + (open ? ' active' : ''),
          onClick: () => setOpen(v => !v),
          'aria-expanded': open,
          'aria-label': 'Switch task',
          title: currentWsTitle ? `Switch task · ${currentWsTitle}` : 'Switch task',
        }, h(Icon), h('span', null, currentWsTitle || 'Tasks')),
        open && h('div', { className: 'mitsu-ts-menu' },
          items.length === 0
            ? h('div', { className: 'mitsu-ts-empty' }, 'No workspaces yet')
            : items.map((it) => it.type === 'ws'
              ? h('div', { key: 'ws-' + it.id },
                h('div', { className: 'mitsu-ts-head' }, 'Workspace'),
                h('button', { className: 'mitsu-ts-item' + (it.current ? ' current' : ''), onClick: () => goWs(it.id) },
                  h('span', { className: 'dot ws' }),
                  h('span', null, it.label)))
              : h('button', { key: 'sess-' + it.id, className: 'mitsu-ts-item' + (it.current ? ' current' : ''), onClick: () => go(it.id) },
                h('span', { className: 'dot sess' }),
                h('span', null, it.label))))
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ensureStyles()
        const slots = ctx.get('slots')
        if (slots === undefined) return
        slots.inject('conversation.session.header.utilities', () =>
          slots.register({
            name: 'conversation.session.header.utilities',
            id: 'mitsu-task-switcher',
            order: 10,
          }, TaskSwitcher))
      },
    }
  },
})

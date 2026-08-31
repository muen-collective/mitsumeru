// @muen/mitsu-sidebar-tree — browser half.
// Replaces the left workspace/session browser with a two-view toggle:
//   Sessions  → the chat session tree (workspace groups + sessions, open on click)
//   Docs      → the workspace .md file tree (nested folders + .md leaves, from
//               /mitsu/docs/list), matching the Kun "Work" tree.
//
// It wins the `sidebar.workspaces` single slot (higher priority than the default
// WorkspaceBrowser) and renders BOTH views under a segmented toggle, so the user
// can switch between the session tree and the docs tree — no separate plugins,
// no DSH core edit. Session hooks (useSessions/useWorkspaces/open/startSession)
// come from the slot's injected face; the docs tree reads the loopback list route.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-sidebar-tree',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo } = React

    const STYLE = `
      .mst-shell { display: flex; flex-direction: column; height: 100%; min-height: 0; font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); }
      .mst-toggle { display: flex; gap: 4px; padding: 8px 10px; flex-shrink: 0; }
      .mst-tab { flex: 1; padding: 5px 0; text-align: center; border-radius: 7px; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 12px; cursor: pointer; font-family: inherit; }
      .mst-tab.active { background: color-mix(in srgb, var(--mitsu-primary, #765898) 12%, transparent); color: var(--mitsu-primary, #765898); border-color: color-mix(in srgb, var(--mitsu-primary, #765898) 30%, transparent); }
      .mst-body { flex: 1; overflow-y: auto; min-height: 0; }
      /* Session tree */
      .mst-ws { font-size: 10.5px; font-weight: 600; color: var(--dsw-alias-label-tertiary); text-transform: uppercase; letter-spacing: .04em; padding: 8px 12px 3px; }
      .mst-sess { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 6px 12px; border: none; background: transparent; color: var(--dsw-alias-label-primary); font-size: 12.5px; cursor: pointer; font-family: inherit; }
      .mst-sess:hover { background: var(--dsw-alias-interactive-bg-hover); }
      .mst-sess.current { background: color-mix(in srgb, var(--mitsu-primary, #765898) 10%, transparent); color: var(--mitsu-primary, #765898); }
      .mst-sess .dot { width: 7px; height: 7px; border-radius: 999px; flex: none; background: var(--dsw-alias-label-tertiary); }
      .mst-sess .dot.ws { background: var(--mitsu-primary, #765898); }
      .mst-sess span.t { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mst-new { display: flex; align-items: center; gap: 6px; width: 100%; padding: 7px 12px; border: none; background: transparent; color: var(--dsw-alias-label-primary); font-size: 12.5px; cursor: pointer; font-family: inherit; }
      .mst-new:hover { background: var(--dsw-alias-interactive-bg-hover); }
      /* Docs tree */
      .mst-dir { display: flex; align-items: center; gap: 5px; padding: 5px 12px 5px 8px; cursor: pointer; color: var(--dsw-alias-label-primary); font-size: 12.5px; }
      .mst-dir:hover { background: var(--dsw-alias-bg-layer-2); }
      .mst-dir .caret { width: 10px; flex: none; color: var(--dsw-alias-label-tertiary); transition: transform .12s; }
      .mst-dir .caret.open { transform: rotate(90deg); }
      .mst-dir .ico { width: 12px; flex: none; }
      .mst-file { display: flex; align-items: center; gap: 6px; width: 100%; text-align: left; padding: 5px 12px; border: none; background: transparent; color: var(--dsw-alias-label-primary); font-size: 12.5px; cursor: pointer; font-family: inherit; }
      .mst-file:hover { background: var(--dsw-alias-bg-layer-2); }
      .mst-file.active { background: color-mix(in srgb, var(--mitsu-primary, #765898) 10%, transparent); color: var(--mitsu-primary, #765898); }
      .mst-file .ico { width: 12px; flex: none; }
      .mst-empty { padding: 12px; color: var(--dsw-alias-label-tertiary); font-size: 12px; }
      .mst-search { padding: 6px 10px 2px; }
      .mst-search input { width: 100%; box-sizing: border-box; padding: 5px 10px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); font-size: 12px; outline: none; font-family: inherit; }
    `

    let styleInjected = false
    const ensureStyles = () => {
      if (styleInjected) return
      styleInjected = true
      const st = document.createElement('style')
      st.setAttribute('data-mitsu-sidebar-tree', '1')
      st.textContent = STYLE
      document.head.appendChild(st)
    }

    const FolderIcon = () => h('svg', { className: 'ico', width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('path', { d: 'M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z' }))
    const DocIcon = () => h('svg', { className: 'ico', width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z' }),
      h('path', { d: 'M14 2v6h6' }))

    // Build a nested tree from the flat .md list (path -> folders -> files).
    function buildTree(files) {
      const root = {}
      for (const f of files) {
        const parts = f.path.split('/')
        let node = root
        for (let i = 0; i < parts.length - 1; i++) {
          node = node._dirs = node._dirs || {}
          node = node[parts[i]] = node[parts[i]] || { _dirs: {}, _files: [] }
        }
        node._files = node._files || []
        node._files.push(f)
      }
      return root
    }

    const DocsTree = ({ onOpen }) => {
      const [files, setFiles] = useState(null)
      const [error, setError] = useState('')
      const [query, setQuery] = useState('')
      const [open, setOpen] = useState({}) // { dirKey: bool }

      useEffect(() => {
        fetch('/mitsu/docs/list', { cache: 'no-store' }).then((r) => r.json()).then((res) => {
          if (res && res.ok) setFiles(res.files || [])
          else setError((res && res.error) || 'list failed')
        }).catch((e) => setError(String((e && e.message) || e)))
      }, [])

      const q = query.trim().toLowerCase()
      const filtered = useMemo(() => (files || []).filter((f) => q.length === 0 || f.path.toLowerCase().includes(q)), [files, q])
      const root = useMemo(() => buildTree(filtered), [filtered])

      const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }))

      const renderBranch = (dirs, files, prefix, depth) => {
        const dirKeys = Object.keys(dirs).sort()
        return [
          dirKeys.map((k) => {
            const key = prefix + '/' + k
            const expanded = open[key] === true
            return h('div', { key: key },
              h('div', { className: 'mst-dir', style: { paddingLeft: 8 + depth * 12 }, onClick: () => toggle(key) },
                h('span', { className: 'caret' + (expanded ? ' open' : '') }, '▸'),
                h(FolderIcon),
                h('span', null, k)),
              expanded ? renderBranch(dirs[k]._dirs || {}, dirs[k]._files || [], key, depth + 1) : null)
          }),
          (files || []).sort((a, b) => a.name.localeCompare(b.name)).map((f) =>
            h('button', { key: 'f:' + f.path, className: 'mst-file', style: { paddingLeft: 8 + (depth + 1) * 12 }, onClick: () => onOpen(f.path) },
              h(DocIcon),
              h('span', null, f.name))),
        ]
      }

      return h('div', null,
        h('div', { className: 'mst-search' },
          h('input', { type: 'search', value: query, placeholder: 'Filter docs…', 'aria-label': 'Filter docs', onChange: (e) => setQuery(e.currentTarget.value) })),
        error && h('div', { className: 'mst-empty' }, 'Error: ' + error),
        !error && files == null && h('div', { className: 'mst-empty' }, 'Loading docs…'),
        !error && files != null && files.length === 0 && h('div', { className: 'mst-empty' }, 'No .md files in workspace'),
        !error && files != null && files.length > 0 && renderBranch(root._dirs || {}, root._files || [], '', 0))
    }

    const SessionsTree = ({ workspaces, sessionId, useSessions, open, startSession }) => {
      const wsItems = (workspaces && workspaces.items) || []
      return h('div', null,
        h('button', { className: 'mst-new', onClick: () => startSession() },
          h('span', null, '+ New Session')),
        wsItems.length === 0 && h('div', { className: 'mst-empty' }, 'No workspaces yet'),
        wsItems.map((ws) => {
          const sessions = (ws.sessionIds || []).map((id) => useSessions ? useSessions((s) => s.byId[id]) : undefined).filter(Boolean)
          return h('div', { key: ws.workspaceId },
            h('div', { className: 'mst-ws' }, ws.title),
            sessions.length === 0 && h('div', { className: 'mst-sess', style: { cursor: 'default' } }, h('span', { className: 'dot ws' }), h('span', { className: 't' }, ws.title)),
            sessions.map((sess) => h('button', {
              key: sess.id,
              className: 'mst-sess' + (sess.id === sessionId ? ' current' : ''),
              onClick: () => open(sess.id),
            }, h('span', { className: 'dot' }), h('span', { className: 't' }, sess.title || sess.id))))
        }))
    }

    const Shell = (props) => {
      const [view, setView] = useState('sessions')
      const sessionId = props.sessionId
      const useSessions = props.useSessions
      const useWorkspaces = props.useWorkspaces
      const open = props.open
      const startSession = props.startSession
      const workspaces = useWorkspaces ? useWorkspaces((s) => s) : undefined

      const onOpenDoc = (path) => {
        // Opening a doc from the tree: toggle to Write mode + open the write surface.
        window.__MITSU_MODE__ = 'write'
        if (window.__MITSU_RAIL__) window.__MITSU_RAIL__.openSurface('write')
        if (window.__MITSU_DOC_OPEN__) window.__MITSU_DOC_OPEN__(path)
      }

      return h('div', { className: 'mst-shell' },
        h('div', { className: 'mst-toggle' },
          h('button', { className: 'mst-tab' + (view === 'sessions' ? ' active' : ''), onClick: () => setView('sessions') }, 'Sessions'),
          h('button', { className: 'mst-tab' + (view === 'docs' ? ' active' : ''), onClick: () => setView('docs') }, 'Docs')),
        h('div', { className: 'mst-body' },
          view === 'sessions'
            ? h(SessionsTree, { workspaces, sessionId, useSessions, open, startSession })
            : h(DocsTree, { onOpen: onOpenDoc })))
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ensureStyles()
        const slots = ctx.get('slots')
        if (slots === undefined) return
        // Higher priority than the default WorkspaceBrowser so we win the slot
        // and can render the Sessions/Docs toggle.
        slots.inject('sidebar.workspaces', () =>
          slots.register({
            name: 'sidebar.workspaces',
            id: 'mitsu-sidebar-tree',
            priority: -100,
          }, Shell))
      },
    }
  },
})

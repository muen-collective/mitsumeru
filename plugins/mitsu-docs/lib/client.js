// @muen/mitsu-docs — browser half (real DocViewer).
// Raw loader plugin: React arrives via factory(require) — same shape as the
// other Mitsu surfaces. Shows the workspace .md files (list + rendered reader)
// over the host `mitsu.docs` service's loopback routes (/mitsu/docs/list,
// /mitsu/docs/read). Two mounts:
//   1. With the rail (window.__MITSU_RAIL__ present): registers a real 'docs'
//      surface whose panel is the live viewer (replaces the mock).
//   2. Without the rail: a standalone right-edge Docs tab + overlay panel, so
//      the viewer works in dsh-desktop with no other Mitsu surface installed.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-docs',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect } = React

    let stylesInjected = false
    const ensureStyles = () => {
      if (stylesInjected) return
      stylesInjected = true
      const css = `
      .mitsu-docs-tab { position: fixed; right: 0; top: 40%; z-index: 901; pointer-events: auto; background: var(--mitsu-primary, #765898); color: #fff; border: none; border-radius: 8px 0 0 8px; padding: 12px 9px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; cursor: pointer; writing-mode: vertical-rl; font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); }
      .mitsu-docs-panel { position: fixed; top: 0; right: 0; bottom: 0; z-index: 900; display: flex; flex-direction: column; background: var(--dsw-alias-bg-layer-1); border-left: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); font-size: 13px; pointer-events: auto; }
      .mitsu-docs-resize { position: absolute; left: -3px; top: 0; bottom: 0; width: 6px; cursor: ew-resize; z-index: 2; }
      .mitsu-docs-resize:hover { background: color-mix(in srgb, var(--mitsu-primary, #765898) 25%, transparent); }
      .mitsu-docs-col { display: flex; flex-direction: column; height: 100%; min-height: 0; }
      .mitsu-docs-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--dsw-alias-border-l2); flex-shrink: 0; background: var(--dsw-alias-bg-layer-2); }
      .mitsu-docs-title { font-size: 13px; font-weight: 600; }
      .mitsu-docs-count { font-size: 11px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-1); border-radius: 999px; padding: 1px 8px; font-variant-numeric: tabular-nums; }
      .mitsu-docs-search { flex-shrink: 0; padding: 8px 12px 2px; }
      .mitsu-docs-search input { width: 100%; padding: 5px 10px; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; color: var(--dsw-alias-label-primary); font-size: 12px; outline: none; font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); }
      .mitsu-docs-search input:focus { border-color: var(--mitsu-primary, #765898); }
      .mitsu-docs-search input::placeholder { color: var(--dsw-alias-label-secondary); }
      .mitsu-docs-icon { background: none; border: none; color: var(--dsw-alias-label-secondary); cursor: pointer; padding: 4px 6px; border-radius: 6px; font-size: 14px; }
      .mitsu-docs-icon:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-1); }
      .mitsu-docs-list { flex: 1; overflow-y: auto; padding: 6px 0; }
      .mitsu-docs-row { display: flex; flex-direction: column; gap: 1px; padding: 7px 12px; cursor: pointer; border-left: 2px solid transparent; }
      .mitsu-docs-row:hover { background: var(--dsw-alias-bg-layer-2); }
      .mitsu-docs-row.sel { background: color-mix(in srgb, var(--mitsu-primary, #765898) 8%, transparent); border-left-color: var(--mitsu-primary, #765898); }
      .mitsu-docs-row-name { font-size: 12.5px; color: var(--dsw-alias-label-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mitsu-docs-row-path { font-size: 10.5px; color: var(--dsw-alias-label-secondary); font-family: "JetBrains Mono", ui-monospace, monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mitsu-docs-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--dsw-alias-label-secondary); font-size: 12px; padding: 24px 12px; text-align: center; }
      .mitsu-docs-reader { flex: 1; display: flex; flex-direction: column; min-height: 0; }
      .mitsu-docs-readbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--dsw-alias-border-l2); flex-shrink: 0; background: var(--dsw-alias-bg-layer-2); }
      .mitsu-docs-readname { font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mitsu-docs-frame { flex: 1; width: 100%; border: none; background: var(--dsw-alias-bg-layer-1); min-height: 0; }
      `
      const st = document.createElement('style')
      st.setAttribute('data-mitsu-docs', '1')
      st.textContent = css
      document.head.appendChild(st)
    }

    const DocIcon = () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
      h('path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' }),
      h('path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }),
      h('path', { d: 'M10 9H8' }),
      h('path', { d: 'M16 13H8' }),
      h('path', { d: 'M16 17H8' }))

    // ── Minimal markdown → HTML (headings/code/lists/tables/quotes/inline) ──
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const inline = (s) => s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    const isHr = (l) => /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)
    const isFence = (l) => /^```/.test(l)
    const isHeading = (l) => /^#{1,6}\s/.test(l)
    const isQuote = (l) => l.trim().startsWith('>')
    const isTable = (l) => l.trim().startsWith('|')
    const isUl = (l) => /^\s*[-*+]\s+/.test(l)
    const isOl = (l) => /^\s*\d+[.)]\s+/.test(l)

    const mdToHtml = (md) => {
      const lines = esc(md).split('\n')
      const out = []
      let i = 0
      while (i < lines.length) {
        const line = lines[i]
        if (isFence(line)) {
          const lang = (line.match(/^```(\w*)\s*$/) || [])[1] || ''
          const buf = []
          i++
          while (i < lines.length && !/^```\s*$/.test(lines[i])) { buf.push(lines[i]); i++ }
          i++
          out.push('<pre><code' + (lang ? ' class="lang-' + esc(lang) + '"' : '') + '>' + buf.join('\n') + '</code></pre>')
          continue
        }
        if (isHeading(line)) {
          const m = line.match(/^(#{1,6})\s+(.*)$/)
          const lvl = m[1].length
          out.push('<h' + lvl + '>' + inline(m[2]) + '</h' + lvl + '>')
          i++
          continue
        }
        if (isHr(line)) { out.push('<hr>'); i++; continue }
        if (isTable(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
          const row = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
          const header = row(line)
          const aligns = row(lines[i + 1]).map((c) => {
            const l = c.startsWith(':'); const r = c.endsWith(':')
            return l && r ? ' style="text-align:center"' : l ? ' style="text-align:left"' : r ? ' style="text-align:right"' : ''
          })
          i += 2
          const body = []
          while (i < lines.length && isTable(lines[i])) {
            body.push('<tr>' + row(lines[i]).map((c, ci) => '<td' + (aligns[ci] || '') + '>' + inline(c) + '</td>').join('') + '</tr>')
            i++
          }
          out.push('<table><thead><tr>' + header.map((c, ci) => '<th' + (aligns[ci] || '') + '>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>' + body.join('') + '</tbody></table>')
          continue
        }
        if (isQuote(line)) {
          const buf = []
          while (i < lines.length && isQuote(lines[i])) { buf.push(lines[i].trim().replace(/^>\s?/, '')); i++ }
          out.push('<blockquote>' + inline(buf.join(' ')) + '</blockquote>')
          continue
        }
        if (isUl(line) || isOl(line)) {
          const ordered = isOl(line)
          const items = []
          while (i < lines.length) {
            const lm = lines[i].match(/^\s*[-*+]\s+(.*)$/)
            const om = lines[i].match(/^\s*\d+[.)]\s+(.*)$/)
            if ((ordered && om) || (!ordered && lm)) { items.push(inline((om || lm)[1])); i++; continue }
            if (lines[i].trim() === '') {
              const j = i
              while (j < lines.length && lines[j].trim() === '') { /* skip */ }
              if (j < lines.length && ((ordered && isOl(lines[j])) || (!ordered && isUl(lines[j])))) { i = j; continue }
              break
            }
            break
          }
          out.push('<' + (ordered ? 'ol' : 'ul') + '>' + items.map((it) => '<li>' + it + '</li>').join('') + '</' + (ordered ? 'ol' : 'ul') + '>')
          continue
        }
        if (line.trim() !== '') {
          const buf = []
          while (i < lines.length && lines[i].trim() !== '' && !isFence(lines[i]) && !isHeading(lines[i]) && !isQuote(lines[i]) && !isTable(lines[i]) && !isUl(lines[i]) && !isOl(lines[i]) && !isHr(lines[i])) {
            buf.push(lines[i]); i++
          }
          out.push('<p>' + inline(buf.join(' ')) + '</p>')
          continue
        }
        i++
      }
      return out.join('\n')
    }

    const MD_CSS = `
    :root { color-scheme: dark; }
    body { margin: 0; padding: 22px 24px; background: var(--dsw-alias-bg-layer-1, #17181c); color: var(--dsw-alias-label-primary, #e8e8ea); font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif); font-size: 14px; line-height: 1.65; overflow-wrap: break-word; }
    h1,h2,h3,h4,h5,h6 { line-height: 1.3; margin: 1.4em 0 0.5em; }
    h1 { font-size: 1.5rem; } h2 { font-size: 1.3rem; } h3 { font-size: 1.15rem; } h4 { font-size: 1.05rem; }
    p { margin: 0.6em 0; }
    a { color: var(--mitsu-primary, #9A6BFF); }
    code { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.85em; background: var(--dsw-alias-bg-layer-2, #22242a); border-radius: 4px; padding: 0.15em 0.35em; }
    pre { background: var(--dsw-alias-bg-layer-2, #22242a); border: 1px solid var(--dsw-alias-border-l1, #30323a); border-radius: 8px; padding: 12px 14px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { margin: 0.8em 0; padding: 4px 14px; border-left: 2px solid var(--dsw-alias-state-error-primary, #c62a3e); color: var(--dsw-alias-label-secondary); }
    table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 13px; }
    th, td { border: 1px solid var(--dsw-alias-border-l1, #30323a); padding: 6px 10px; text-align: left; }
    th { background: var(--dsw-alias-bg-layer-2, #22242a); font-weight: 600; }
    tr:nth-child(even) td { background: var(--dsw-alias-bg-layer-2, #22242a); }
    ul, ol { margin: 0.6em 0; padding-left: 1.4em; }
    li { margin: 0.2em 0; }
    hr { border: none; border-top: 1px solid var(--dsw-alias-border-l1, #30323a); margin: 1.2em 0; }
    `

    const buildSrcDoc = (md, path) =>
      '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(path) + '</title><style>' + MD_CSS + '</style></head><body>' + mdToHtml(md) + '</body></html>'

    const Reader = ({ path, content, reading, error, onBack }) => {
      const name = (path || '').split('/').pop()
      const srcDoc = content != null ? buildSrcDoc(content, path) : ''
      return h('div', { className: 'mitsu-docs-reader' },
        h('div', { className: 'mitsu-docs-readbar' },
          h('button', { className: 'mitsu-docs-icon', title: 'Back', onClick: onBack }, '←'),
          h('span', { className: 'mitsu-docs-readname', title: path }, name),
          h('span', { style: { flex: 1 } })),
        reading && content == null
          ? h('div', { className: 'mitsu-docs-empty' }, 'Reading…')
          : error
            ? h('div', { className: 'mitsu-docs-empty' }, 'Error: ' + error)
            : h('iframe', { className: 'mitsu-docs-frame', sandbox: 'allow-same-origin', srcDoc, title: name }))
    }

    // ── The shared viewer column: head (title/count/optional close) + body ──
    const DocViewer = ({ onClose }) => {
      const [files, setFiles] = useState(null)
      const [error, setError] = useState(null)
      const [selected, setSelected] = useState(null)
      const [content, setContent] = useState(null)
      const [reading, setReading] = useState(false)
      const [query, setQuery] = useState('')

      const loadPath = (path) => {
        setSelected(path); setContent(null); setReading(true); setError(null)
        fetch('/mitsu/docs/read?path=' + encodeURIComponent(path)).then((r) => r.json()).then((res) => {
          if (res && res.ok) setContent(res.content)
          else setError((res && res.error) || 'read failed')
        }).catch((e) => setError(String((e && e.message) || e)))
          .finally(() => setReading(false))
      }

      useEffect(() => {
        let alive = true
        fetch('/mitsu/docs/list').then((r) => r.json()).then((res) => {
          if (!alive) return
          if (res && res.ok) setFiles(res.files || [])
          else setError((res && res.error) || 'list failed')
        }).catch((e) => { if (alive) setError(String((e && e.message) || e)) })
        return () => { alive = false }
      }, [])

      const q = query.trim().toLowerCase()
      const filtered = files ? files.filter((f) => q.length === 0 || f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)) : null

      let body
      if (error && !files) {
        body = h('div', { className: 'mitsu-docs-empty' }, 'Error: ' + error)
      } else if (selected != null) {
        body = h(Reader, {
          path: selected, content, reading, error,
          onBack: () => { setSelected(null); setContent(null); setError(null) },
        })
      } else if (files == null) {
        body = h('div', { className: 'mitsu-docs-empty' }, 'Loading…')
      } else if (files.length === 0) {
        body = h('div', { className: 'mitsu-docs-empty' }, 'No .md files in workspace')
      } else {
        body = h('div', null,
          h('div', { className: 'mitsu-docs-search' },
            h('input', { type: 'search', value: query, placeholder: 'Filter docs…', 'aria-label': 'Filter docs', onChange: (e) => setQuery(e.currentTarget.value) })),
          filtered.length === 0
            ? h('div', { className: 'mitsu-docs-empty' }, 'No docs match "' + query + '"')
            : h('div', { className: 'mitsu-docs-list' },
                filtered.map((f) => {
                  const dir = f.path.indexOf('/') >= 0 ? f.path.slice(0, f.path.lastIndexOf('/')) : ''
                  return h('div', {
                    key: f.path, className: 'mitsu-docs-row' + (selected === f.path ? ' sel' : ''),
                    onClick: () => loadPath(f.path),
                  },
                    h('span', { className: 'mitsu-docs-row-name' }, f.name),
                    h('span', { className: 'mitsu-docs-row-path' }, dir ? dir + ' · ' + (f.size != null ? f.size + ' B' : '') : (f.size != null ? f.size + ' B' : '')))
                })))
      }

      return h('div', { className: 'mitsu-docs-col' },
        h('div', { className: 'mitsu-docs-head' },
          h('span', { className: 'mitsu-docs-title' }, 'Docs'),
          h('span', { className: 'mitsu-docs-count' }, files ? (filtered ? filtered.length + '/' + files.length : files.length) + ' md' : '…'),
          h('span', { style: { flex: 1 } }),
          onClose ? h('button', { className: 'mitsu-docs-icon', title: 'Close', onClick: onClose }, '✕') : null),
        body)
    }

    // ── Standalone mount (no rail): right-edge tab + overlay panel ──
    const DocsStandalone = () => {
      const [open, setOpen] = useState(false)
      const [width, setWidth] = useState(420)
      const startResize = (e) => {
        e.preventDefault()
        const startX = e.clientX
        const startW = width
        const onMove = (ev) => setWidth(Math.min(700, Math.max(280, startW + (startX - ev.clientX))))
        const onUp = () => {
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
      }
      useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [open])
      if (!open) {
        return h('button', { className: 'mitsu-docs-tab', title: 'Mitsu Docs viewer', onClick: () => setOpen(true) }, 'Docs')
      }
      return h('div', { className: 'mitsu-docs-panel', style: { width } },
        h('div', { className: 'mitsu-docs-resize', onMouseDown: startResize }),
        h(DocViewer, { onClose: () => setOpen(false) }))
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ensureStyles()
        // 1) Rail present → register a real Docs surface (replaces the mock).
        const rail = window.__MITSU_RAIL__
        if (rail) {
          const surfaces = rail.surfaces || []
          const next = surfaces.filter((s) => s.id !== 'docs')
          next.push({ id: 'docs', label: 'Docs', icon: DocIcon, panel: () => h('div', { style: { height: '100%', minHeight: 0 } }, h(DocViewer, {})) })
          rail.surfaces = next
          for (const fn of rail.listeners || []) fn([...next])
          return
        }
        // 2) No rail → standalone right-edge Docs tab on shell.overlay.
        const slots = ctx.get('slots')
        if (slots === undefined) return
        slots.inject('shell.overlay', () => slots.register({
          name: 'shell.overlay',
          id: 'mitsu-docs',
          order: 120,
          label: 'Mitsu Docs',
        }, () => h(DocsStandalone, {})))
      },
    }
  },
})

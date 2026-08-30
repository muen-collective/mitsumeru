// @muen/mitsu-settings — browser half (fork plugin).
// Raw loader plugin: React arrives via factory(require) — same shape as
// mitsu-rail/mitsu-modes. Registers two ADDITIVE settings sections
// (settings.section is a replaceRisk:none list slot — nothing shipped is
// shadowed): mitsu-plugins (curated cards + enable/disable) and
// mitsu-advanced (raw DSH plugin table behind a reveal). Data comes from the
// host `mitsu.settings` service over loopback webServer routes.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-settings',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect } = React

    let stylesInjected = false
    const ensureStyles = () => {
      if (stylesInjected) return
      stylesInjected = true
      const css = `
      .ms-settings, .ms-settings * { box-sizing: border-box; }
      .ms-settings { display: flex; flex-direction: column; gap: 12px; color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); font-size: 13px; max-width: 760px; }
      .ms-heading { margin: 0; font-size: 18px; font-weight: 600; }
      .ms-intro { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 1.5; }
      .ms-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; }
      .ms-card-body { flex: 1; min-width: 0; }
      .ms-card-name { font-size: 14px; font-weight: 600; }
      .ms-card-desc { color: var(--dsw-alias-label-tertiary); font-size: 12.5px; line-height: 1.4; margin-top: 2px; }
      .ms-card-state { white-space: nowrap; font-size: 10.5px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-1); border-radius: 999px; padding: 1px 8px; align-self: flex-start; }
      .ms-card-state.on { color: var(--dsw-alias-state-success-primary, #7fd49a); }
      .ms-card-state.off { color: var(--dsw-alias-state-error-primary, #c62a3e); }
      .ms-switch { position: relative; flex: none; width: 40px; height: 22px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-3); cursor: pointer; padding: 0; }
      .ms-switch[aria-checked="true"] { background: var(--mitsu-primary, #765898); border-color: var(--mitsu-primary, #765898); }
      .ms-switch-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 999px; background: #fff; transition: left 0.14s ease; }
      .ms-switch[aria-checked="true"] .ms-switch-knob { left: 20px; }
      .ms-advanced-toggle { display: flex; align-items: center; gap: 10px; }
      .ms-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 12px; }
      .ms-row-id { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-primary); }
      .ms-plugin-count { color: var(--dsw-alias-label-tertiary); font-size: 11px; }
      .ms-note { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 1.5; }
      .ms-empty { color: var(--dsw-alias-label-tertiary); font-size: 12.5px; padding: 12px 0; }
      `
      const st = document.createElement('style')
      st.setAttribute('data-mitsu-settings', '1')
      st.textContent = css
      document.head.appendChild(st)
    }

    // ── Mitsu Plugins section: curated cards + enable/disable toggles ──
    const MitsuPluginsSection = () => {
      const [items, setItems] = useState(null)
      const [error, setError] = useState(null)

      useEffect(() => {
        let alive = true
        fetch('/mitsu/settings/list').then((r) => r.json()).then((res) => {
          if (!alive) return
          if (res && res.ok) setItems(res.items || [])
          else setError((res && res.error) || 'list failed')
        }).catch((e) => { if (alive) setError(String((e && e.message) || e)) })
        return () => { alive = false }
      }, [])

      const toggle = (id) => {
        const current = items && items.find((i) => i.id === id)
        if (current === undefined) return
        setItems((prev) => (prev || []).map((i) => i.id === id ? { ...i, enabled: !i.enabled } : i))
        fetch('/mitsu/settings/toggle', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id, enabled: !current.enabled }),
        }).then((r) => r.json()).then((res) => {
          if (res && res.ok) setItems(res.items || [])
          else setError((res && res.error) || 'toggle failed')
        }).catch((e) => setError(String((e && e.message) || e)))
      }

      const body = error
        ? h('p', { className: 'ms-empty' }, 'Error: ' + error)
        : items === null
          ? h('p', { className: 'ms-empty' }, 'Loading…')
          : items.length === 0
            ? h('p', { className: 'ms-empty' }, 'No curated Mitsu plugins.')
            : items.map((i) => h('div', { key: i.id, className: 'ms-card' },
                h('div', { className: 'ms-card-body' },
                  h('div', { className: 'ms-card-name' }, i.name),
                  h('div', { className: 'ms-card-desc' }, i.description)),
                h('span', { className: 'ms-card-state ' + (i.enabled ? 'on' : 'off') },
                  i.enabled ? 'Enabled' : 'Disabled'),
                h('button', {
                  className: 'ms-switch',
                  role: 'switch',
                  'aria-checked': i.enabled ? 'true' : 'false',
                  'aria-label': 'Toggle ' + i.name,
                  onClick: () => toggle(i.id),
                }, h('span', { className: 'ms-switch-knob' }))))

      return h('div', { className: 'ms-settings' },
        h('h2', { className: 'ms-heading' }, 'Mitsu Plugins'),
        h('p', { className: 'ms-intro' }, 'The curated Mitsu surfaces. Toggle a surface on or off for this workspace; turn everything on for the full toolset.'),
        body)
    }

    // ── Advanced section: raw DSH plugin table behind a reveal toggle ──
    const MitsuAdvancedSection = ({ close }) => {
      const [revealed, setRevealed] = useState(false)
      const [entries, setEntries] = useState(null)
      const [error, setError] = useState(null)

      useEffect(() => {
        if (!revealed || entries !== null) return
        let alive = true
        fetch('/mitsu/settings/plugins').then((r) => r.json()).then((res) => {
          if (!alive) return
          if (res && res.ok) setEntries(res.entries || [])
          else setError((res && res.error) || 'list failed')
        }).catch((e) => { if (alive) setError(String((e && e.message) || e)) })
        return () => { alive = false }
      }, [revealed])

      let body
      if (!revealed) {
        body = h('div', { className: 'ms-advanced-toggle' },
          h('span', { className: 'ms-note' }, 'Power-user configuration. Reveal the raw DSH plugin table and the engineer sections on a per-workspace basis.'),
          h('button', { className: 'ms-switch', role: 'switch', 'aria-checked': 'false', 'aria-label': 'Reveal Advanced', onClick: () => setRevealed(true) }, h('span', { className: 'ms-switch-knob' })))
      } else {
        body = h('div', { className: 'ms-settings' },
          h('div', { className: 'ms-advanced-toggle' },
            h('span', { className: 'ms-note' }, 'Advanced revealed.'),
            h('button', { className: 'ms-switch', role: 'switch', 'aria-checked': 'true', 'aria-label': 'Hide Advanced', onClick: () => setRevealed(false) }, h('span', { className: 'ms-switch-knob' }))),
          error
            ? h('p', { className: 'ms-note' }, error)
            : entries === null
              ? h('p', { className: 'ms-empty' }, 'Reading raw plugin table…')
              : entries.length === 0
                ? h('p', { className: 'ms-note' }, 'No plugins composed in this profile.')
                : h('div', { className: 'ms-settings' },
                  h('div', { className: 'ms-plugin-count' }, entries.length + ' composed plugins'),
                  entries.map((e) => h('div', { key: e.id, className: 'ms-row' }, h('span', { className: 'ms-row-id' }, e.name || e.id)))),
          h('p', { className: 'ms-note' }, 'For engineer personas: the raw DSH surface (Models, Agent presets, Market, and the full plugin inventory) lives in the shipped sections — this page keeps them out of the default workflow.'))
      }

      return h('div', { className: 'ms-settings' },
        h('h2', { className: 'ms-heading' }, 'Advanced'),
        body)
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ensureStyles()
        const slots = ctx.get('slots')
        if (slots === undefined) return
        slots.inject('settings.section', () => slots.register({
          name: 'settings.section',
          id: 'mitsu-plugins',
          order: 12,
          label: 'Mitsu Plugins',
        }, () => h(MitsuPluginsSection, {})))
        slots.inject('settings.section', () => slots.register({
          name: 'settings.section',
          id: 'mitsu-advanced',
          order: 45,
          label: 'Advanced',
        }, (props) => h(MitsuAdvancedSection, { close: props && props.close })))
      },
    }
  },
})

// @muen/mitsu-settings — browser half (fork plugin).
// Raw loader plugin: React arrives via factory(require) — same shape as
// mitsu-rail/mitsu-modes. The curated Mitsu Plugins page lives as a
// `settings.plugins.tab` (the "Mitsu" tab in the Settings → Plugins section,
// next to the plugin-market tabs) so it uses the same enable/disable/uninstall
// semantics as the market's manager UX. The engineer-facing Advanced surface
// stays a settings.section (replaceRisk:none list slot — nothing shipped is
// shadowed). Data comes from the host `mitsu.settings` service over loopback
// webServer routes.
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
      .ms-card-actions { display: flex; align-items: center; gap: 8px; }
      .ms-card-state { white-space: nowrap; font-size: 10.5px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-1); border-radius: 999px; padding: 1px 8px; align-self: flex-start; }
      .ms-card-state.on { color: var(--dsw-alias-state-success-primary, #7fd49a); }
      .ms-card-state.off { color: var(--dsw-alias-state-error-primary, #c62a3e); }
      .ms-switch { position: relative; flex: none; width: 40px; height: 22px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; background: var(--dsw-alias-bg-layer-3); cursor: pointer; padding: 0; }
      .ms-switch[aria-checked="true"] { background: var(--dsw-alias-state-business-primary); border-color: var(--dsw-alias-state-business-primary); }
      .ms-switch-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 999px; background: #fff; transition: left 0.14s ease; }
      .ms-switch[aria-checked="true"] .ms-switch-knob { left: 20px; }
      .ms-uninstall { flex: none; border: 1px solid var(--dsw-alias-border-l2); background: transparent; color: var(--dsw-alias-label-secondary); border-radius: 6px; padding: 4px 9px; font-size: 12px; cursor: pointer; }
      .ms-uninstall:hover { color: var(--dsw-alias-state-error-primary, #c62a3e); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #c62a3e) 40%, transparent); }
      .ms-uninstall[disabled] { opacity: 0.5; cursor: default; }
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

    // ── Mitsu tab (Settings → Plugins): curated cards + enable/disable +
    //    uninstall — the same semantics as the plugin-market manager UX ──
    const MitsuPluginsTab = () => {
      const [items, setItems] = useState(null)
      const [error, setError] = useState(null)
      const [busy, setBusy] = useState(null)

      const refresh = (res) => {
        if (res && res.ok) setItems(res.items || [])
        else setError((res && res.error) || 'list failed')
      }

      useEffect(() => {
        let alive = true
        fetch('/mitsu/settings/list').then((r) => r.json()).then((res) => {
          if (!alive) return
          refresh(res)
        }).catch((e) => { if (alive) setError(String((e && e.message) || e)) })
        return () => { alive = false }
      }, [])

      const toggle = (id) => {
        const current = items && items.find((i) => i.id === id)
        if (current === undefined) return
        setBusy(id)
        setItems((prev) => (prev || []).map((i) => i.id === id ? { ...i, enabled: !i.enabled } : i))
        fetch('/mitsu/settings/toggle', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id, enabled: !current.enabled }),
        }).then((r) => r.json()).then((res) => { refresh(res); setBusy(null) })
          .catch((e) => { setError(String((e && e.message) || e)); setBusy(null) })
      }

      const uninstall = (item) => {
        if (busy !== null) return
        if (!window.confirm('Uninstall ' + item.name + '? The plugin is removed from this profile and needs a restart to take effect.')) return
        setBusy(item.id)
        fetch('/mitsu/settings/uninstall', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: item.id }),
        }).then((r) => r.json()).then((res) => { refresh(res); setBusy(null) })
          .catch((e) => { setError(String((e && e.message) || e)); setBusy(null) })
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
                h('div', { className: 'ms-card-actions' },
                  h('button', {
                    className: 'ms-switch',
                    role: 'switch',
                    'aria-checked': i.enabled ? 'true' : 'false',
                    'aria-label': 'Toggle ' + i.name,
                    disabled: busy !== null,
                    onClick: () => toggle(i.id),
                  }, h('span', { className: 'ms-switch-knob' })),
                  i.installed === false ? null : h('button', {
                    className: 'ms-uninstall',
                    disabled: busy !== null,
                    onClick: () => uninstall(i),
                  }, busy === i.id ? 'Removing…' : 'Uninstall'))))

      return h('div', { className: 'ms-settings' },
        h('h2', { className: 'ms-heading' }, 'Mitsu Plugins'),
        h('p', { className: 'ms-intro' }, 'The curated Mitsu surfaces — enable, disable, or uninstall them here, same as the plugin market. Changes to the loader apply live; uninstall needs a restart.' ),
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
        // The Mitsu tab in Settings → Plugins, next to the plugin-market tabs.
        slots.inject('settings.plugins.tab', () => slots.register({
          name: 'settings.plugins.tab',
          id: 'mitsu',
          order: 30,
          label: 'Mitsu',
        }, () => h(MitsuPluginsTab, {})))
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

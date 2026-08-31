// @muen/mitsu-starter-pack — browser half.
// Raw loader plugin: React arrives via factory(require). Registers an ADDITIVE
// settings.section ("Creative workflows", order 14).
//
// PLACEHOLDER — the creative-workflow surface is designed next, and will tie
// into the git JSON workflow versioning (one versioned workflow definition per
// file; the harness reads, versions, and runs them — a process designed in a
// later milestone). For now this section is a visibly-rostered placeholder so
// the seam exists and can be filled without a profile change.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-starter-pack',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState } = React

    let stylesInjected = false
    const ensureStyles = () => {
      if (stylesInjected) return
      stylesInjected = true
      const css = `
      .msp-settings, .msp-settings * { box-sizing: border-box; }
      .msp-settings { display: flex; flex-direction: column; gap: 12px; color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); font-size: 13px; max-width: 760px; }
      .msp-heading { margin: 0; font-size: 18px; font-weight: 600; }
      .msp-intro { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 1.5; }
      .msp-placeholder { border: 1px dashed var(--dsw-alias-border-l2); border-radius: 12px; padding: 28px 20px; text-align: center; color: var(--dsw-alias-label-secondary); display: flex; flex-direction: column; gap: 8px; align-items: center; }
      .msp-placeholder-ico { font-size: 30px; opacity: .6; }
      .msp-placeholder-title { font-size: 15px; font-weight: 600; color: var(--dsw-alias-label-primary); }
      .msp-placeholder-body { font-size: 12px; line-height: 1.6; max-width: 480px; color: var(--dsw-alias-label-tertiary); }
      .msp-note { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 1.5; }
      `
      const st = document.createElement('style')
      st.setAttribute('data-mitsu-starter-pack', '1')
      st.textContent = css
      document.head.appendChild(st)
    }

    const CreativeWorkflowsSection = () => {
      const [version] = useState(null) // reserved: git JSON workflow version state

      return h('div', { className: 'msp-settings' },
        h('h2', { className: 'msp-heading' }, 'Creative workflows'),
        h('p', { className: 'msp-intro' }, 'Run versioned creative workflows — refine, generate, and remix.'),
        h('div', { className: 'msp-placeholder' },
          h('span', { className: 'msp-placeholder-ico' }, '✦'),
          h('span', { className: 'msp-placeholder-title' }, 'Coming soon'),
          h('span', { className: 'msp-placeholder-body' },
            'This surface will drive git-JSON-versioned workflows: each workflow is a versioned ',
            'definition in the repo, and the harness reads, versions, and runs it. The process is ',
            'designed in the next milestone. The seam for it is in place here.')),
        h('p', { className: 'msp-note' },
          'Workflow definitions will be versioned as JSON in git. Design the versioning + run ' +
          'contract next; the RunningHub adapter hooks in here once the workflow runner exists.'))
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ensureStyles()
        const slots = ctx.get('slots')
        if (slots === undefined) return
        slots.inject('settings.section', () => slots.register({
          name: 'settings.section',
          id: 'mitsu-pack',
          order: 14,
          label: 'Creative workflows',
        }, () => h(CreativeWorkflowsSection, {})))
      },
    }
  },
})

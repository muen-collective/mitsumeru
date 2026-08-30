// @muen/mitsu-starter-pack — browser half.
// Raw loader plugin: React arrives via factory(require). Registers an ADDITIVE
// settings.section ("Starter Pack", order 14) that runs the fashion workflows
// on RunningHub: pick a step (restore → person-swap → preserve-garment →
// variations), paste the input URLs, Run → the host submits and the client
// polls until the output image is ready. Data rides the host `mitsu.pack`
// service's loopback routes; the RH key never leaves the host.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-starter-pack',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect } = React

    let stylesInjected = false
    const ensureStyles = () => {
      if (stylesInjected) return
      stylesInjected = true
      const css = `
      .msp-settings, .msp-settings * { box-sizing: border-box; }
      .msp-settings { display: flex; flex-direction: column; gap: 12px; color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); font-size: 13px; max-width: 760px; }
      .msp-heading { margin: 0; font-size: 18px; font-weight: 600; }
      .msp-intro { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 1.5; }
      .msp-key { font-size: 11px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; padding: 2px 10px; align-self: flex-start; }
      .msp-key.on { color: var(--dsw-alias-state-success-primary, #7fd49a); }
      .msp-key.off { color: var(--dsw-alias-state-error-primary, #c62a3e); }
      .msp-step { background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
      .msp-step-head { display: flex; align-items: baseline; gap: 8px; }
      .msp-step-name { font-size: 14px; font-weight: 600; }
      .msp-step-desc { color: var(--dsw-alias-label-tertiary); font-size: 12px; }
      .msp-tag { font-size: 10px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-1); border-radius: 999px; padding: 1px 8px; }
      .msp-tag.bad { color: var(--dsw-alias-state-error-primary, #c62a3e); }
      .msp-field { display: flex; flex-direction: column; gap: 3px; }
      .msp-field label { font-size: 11px; color: var(--dsw-alias-label-secondary); }
      .msp-field input { width: 100%; padding: 6px 10px; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; color: var(--dsw-alias-label-primary); font-size: 12px; outline: none; font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); }
      .msp-field input:focus { border-color: var(--mitsu-primary, #765898); }
      .msp-run { align-self: flex-start; background: var(--mitsu-primary, #765898); color: #fff; border: none; border-radius: 7px; padding: 7px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
      .msp-run:disabled { opacity: 0.55; cursor: default; }
      .msp-status { font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .msp-status.err { color: var(--dsw-alias-state-error-primary, #c62a3e); }
      .msp-outputs { display: flex; flex-wrap: wrap; gap: 8px; }
      .msp-outputs img { max-width: 180px; max-height: 180px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); }
      .msp-note { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 1.5; }
      `
      const st = document.createElement('style')
      st.setAttribute('data-mitsu-starter-pack', '1')
      st.textContent = css
      document.head.appendChild(st)
    }

    const StarterPackSection = () => {
      const [catalog, setCatalog] = useState(null)
      const [inputs, setInputs] = useState({})
      const [runs, setRuns] = useState({}) // stepId → { taskId, status, outputs, error }

      const fetchCatalog = () => fetch('/mitsu/pack/list').then((r) => r.json()).then((res) => {
        if (res && res.ok) setCatalog(res)
      }).catch(() => {})

      useEffect(() => { fetchCatalog() }, [])

      // Poll a running task until terminal.
      useEffect(() => {
        const active = Object.entries(runs).filter(([, r]) => r.taskId && (r.status === 'queued' || r.status === 'running'))
        if (active.length === 0) return
        const timers = active.map(([stepId, r]) => window.setTimeout(() => {
          fetch('/mitsu/pack/status?taskId=' + encodeURIComponent(r.taskId)).then((res) => res.json()).then((res) => {
            setRuns((prev) => {
              const cur = prev[stepId]
              if (!cur || cur.taskId !== r.taskId) return prev
              if (res && res.ok && (res.status === 'completed' || res.status === 'failed')) {
                return { ...prev, [stepId]: { ...cur, status: res.status, outputs: res.resultUrls || [], error: res.error || null } }
              }
              return { ...prev, [stepId]: { ...cur, status: 'running' } }
            })
          }).catch(() => {})
        }, 5000))
        return () => timers.forEach((t) => window.clearTimeout(t))
      }, [runs])

      const run = (stepId) => {
        const payload = { stepId, inputs: inputs[stepId] || {}, params: {} }
        setRuns((prev) => ({ ...prev, [stepId]: { taskId: null, status: 'submitting', outputs: [], error: null } }))
        fetch('/mitsu/pack/run', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }).then((res) => res.json()).then((res) => {
          if (res && res.ok) setRuns((prev) => ({ ...prev, [stepId]: { taskId: res.taskId, status: 'queued', outputs: [], error: null } }))
          else setRuns((prev) => ({ ...prev, [stepId]: { taskId: null, status: 'error', outputs: [], error: (res && res.error) || 'run failed' } }))
        }).catch((e) => setRuns((prev) => ({ ...prev, [stepId]: { taskId: null, status: 'error', outputs: [], error: String((e && e.message) || e) } })))
      }

      const setInput = (stepId, field, value) => {
        setInputs((prev) => ({ ...prev, [stepId]: { ...(prev[stepId] || {}), [field]: value } }))
      }

      const body = catalog === null
        ? h('p', { className: 'msp-note' }, 'Loading pack…')
        : h('div', { className: 'msp-settings' },
            h('span', { className: 'msp-key ' + (catalog.keySet ? 'on' : 'off') },
              catalog.keySet ? 'RunningHub key set' : 'RH_API_KEY not set — runs will be rejected'),
            catalog.steps.map((step) => {
              const runState = runs[step.id]
              const busy = runState && (runState.status === 'submitting' || runState.status === 'queued' || runState.status === 'running')
              return h('div', { key: step.id, className: 'msp-step' },
                h('div', { className: 'msp-step-head' },
                  h('span', { className: 'msp-step-name' }, step.label),
                  h('span', { className: 'msp-step-desc' }, step.description),
                  h('span', { className: 'msp-tag ' + (step.appConfigured ? '' : 'bad') }, step.appConfigured ? 'app ' + step.id : 'appId not set')),
                step.inputs.map((inp) => h('div', { key: inp.field, className: 'msp-field' },
                  h('label', { htmlFor: 'msp-' + step.id + '-' + inp.field }, inp.label + (inp.role ? ' · ' + inp.role : '')),
                  h('input', {
                    id: 'msp-' + step.id + '-' + inp.field,
                    type: 'text',
                    value: (inputs[step.id] && inputs[step.id][inp.field]) || '',
                    placeholder: 'https://…',
                    onChange: (e) => setInput(step.id, inp.field, e.currentTarget.value),
                  }))),
                h('button', { className: 'msp-run', disabled: !!busy, onClick: () => run(step.id) },
                  busy ? (runState.status === 'submitting' ? 'Submitting…' : runState.status === 'queued' ? 'Queued…' : 'Running…') : 'Run ' + step.label),
                runState && (runState.status === 'error' || runState.error) ? h('div', { className: 'msp-status err' }, runState.error) : null,
                runState && runState.outputs && runState.outputs.length > 0
                  ? h('div', { className: 'msp-outputs' }, runState.outputs.map((u, i) => h('img', { key: i, src: u, alt: step.label + ' output ' + i })))
                  : null)
            }),
            h('p', { className: 'msp-note' }, 'Workflow appIds live in plugins/mitsu-starter-pack/lib/index.js (PACK manifest). Inputs are verified reachable before submit; each run polls to completion and shows the output image.'))

      return h('div', { className: 'msp-settings' },
        h('h2', { className: 'msp-heading' }, 'Starter Pack'),
        h('p', { className: 'msp-intro' }, 'The fashion workflows on RunningHub: restore → person-swap → preserve-garment → variations.'),
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
          id: 'mitsu-pack',
          order: 14,
          label: 'Starter Pack',
        }, () => h(StarterPackSection, {})))
      },
    }
  },
})

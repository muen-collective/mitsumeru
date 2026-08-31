// @muen/mitsu-providers — browser half.
// Full-screen Mitsu provider settings modal, registered as the Models tab.
// UI uses DSH theme tokens and local mock state for now; DSH APIs will be wired next.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-providers',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useMemo } = React

    const PROVIDERS = [
      { id: 'xiaomi', name: 'Xiaomi MiMo', desc: 'V2.5 series — cheap + agentic. Multimodal input, reasoning, image diffusion.', format: 'openai', base: 'https://api.xiaomimimo.com/v1', caps: ['Chat', 'Reasoning', 'Image'], models: ['mimo-v2.5', 'mimo-v2.5-pro', 'mimo-v2.5-pro-ultraspeed'] },
      { id: 'deepseek', name: 'DeepSeek', desc: 'Chat + built-in thinking mode. No vision API.', format: 'deepseek', base: 'https://api.deepseek.com', caps: ['Chat', 'Reasoning'], models: ['DeepSeek V4 Flash', 'DeepSeek V4 Pro'] },
      { id: 'qwen', name: 'Qwen (QwenCloud)', desc: 'Chat, reasoning, image, video, 3D and TTS.', format: 'openai', base: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', caps: ['Chat', 'Reasoning', 'Image', 'Video', '3D'], models: ['Qwen3.8 Max', 'Qwen3.7 Plus', 'Qwen Image 3.0 Pro', 'Wan 2.7 Image Pro'] },
      { id: 'openai', name: 'OpenAI', desc: 'GPT-5.6 Sol/Terra/Luna, GPT Image 2, Sora 2.', format: 'openai', base: 'https://api.openai.com/v1', caps: ['Chat', 'Reasoning', 'Image', 'Video'], models: ['GPT-5.6 Luna', 'GPT-5.6 Sol', 'GPT Image 2', 'Sora 2'] },
      { id: 'krea', name: 'Krea', desc: 'Aggregator API — 40+ image/video models on one endpoint.', format: 'custom', base: 'https://api.krea.ai/v1', caps: ['Image', 'Video', '3D'], models: ['Nano Banana 2', 'Flux 1.1 Pro', 'Veo 3.1', 'Kling 2.6', 'Hunyuan3D 2 Mini Turbo'] },
    ]

    const STYLE = `
      .mitsu-providers * { box-sizing: border-box; }
      .mitsu-providers { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family); --mitsu-primary: #765898; }
      .mitsu-providers-head { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); flex-shrink: 0; }
      .mitsu-providers-title { font-size: 16px; font-weight: 700; }
      .mitsu-providers-body { display: flex; flex: 1; min-height: 0; }
      .mitsu-providers-list { width: 280px; border-right: 1px solid var(--dsw-alias-border-l2); padding: 14px; overflow-y: auto; flex-shrink: 0; }
      .mitsu-providers-search { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); margin-bottom: 12px; font-size: 13px; }
      .mitsu-provider-card { padding: 12px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l2); margin-bottom: 8px; cursor: pointer; background: var(--dsw-alias-bg-layer-2); transition: border-color .15s; }
      .mitsu-provider-card:hover { border-color: var(--mitsu-primary); }
      .mitsu-provider-card.sel { border-color: var(--mitsu-primary); background: color-mix(in srgb, var(--mitsu-primary) 8%, transparent); }
      .mitsu-provider-name { font-size: 14px; font-weight: 600; }
      .mitsu-provider-desc { font-size: 11px; color: var(--dsw-alias-label-secondary); margin-top: 4px; line-height: 1.4; }
      .mitsu-provider-caps { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
      .mitsu-cap { font-size: 10px; padding: 2px 6px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); }
      .mitsu-providers-editor { flex: 1; padding: 24px; overflow-y: auto; }
      .mitsu-editor-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
      .mitsu-editor-sub { font-size: 12px; color: var(--dsw-alias-label-secondary); margin-bottom: 20px; }
      .mitsu-field { display: grid; gap: 6px; margin-bottom: 16px; max-width: 520px; }
      .mitsu-label { font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-primary); }
      .mitsu-input { padding: 9px 12px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); font-size: 13px; }
      .mitsu-row { display: flex; gap: 8px; align-items: center; }
      .mitsu-btn { padding: 8px 14px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-size: 13px; cursor: pointer; }
      .mitsu-btn.primary { background: var(--mitsu-primary); border-color: transparent; color: var(--dsw-alias-label-primary-inverted); }
      .mitsu-status { font-size: 12px; color: var(--dsw-alias-state-success-primary); }
      .mitsu-status.error { color: var(--dsw-alias-state-error-primary); }
      .mitsu-section-title { font-size: 14px; font-weight: 700; margin: 24px 0 10px; }
      .mitsu-model { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); font-size: 13px; }
      .mitsu-back { cursor: pointer; background: none; border: none; color: var(--dsw-alias-label-secondary); font-size: 13px; padding: 4px 8px; border-radius: 6px; }
      .mitsu-back:hover { background: var(--dsw-alias-interactive-bg-hover); }
      .mitsu-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; }
      .mitsu-empty-ico { font-size: 40px; margin-bottom: 14px; opacity: .5; }
      .mitsu-empty-title { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
      .mitsu-empty-desc { font-size: 13px; color: var(--dsw-alias-label-secondary); max-width: 340px; line-height: 1.5; margin-bottom: 22px; }
      .mitsu-add-dialog { position: fixed; inset: 0; z-index: 2147483646; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.45); }
      .mitsu-add-card { width: min(560px, calc(100vw - 48px)); max-height: 78vh; display: flex; flex-direction: column; border: 1px solid var(--dsw-alias-border-l2); border-radius: 16px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family); box-shadow: 0 18px 60px rgba(0,0,0,.35); overflow: hidden; }
      .mitsu-add-head { display: flex; align-items: center; gap: 10px; padding: 16px 20px; border-bottom: 1px solid var(--dsw-alias-border-l2); flex-shrink: 0; }
      .mitsu-add-title { font-size: 16px; font-weight: 700; }
      .mitsu-add-close { margin-left: auto; border: none; background: none; color: var(--dsw-alias-label-secondary); font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
      .mitsu-add-close:hover { background: var(--dsw-alias-bg-layer-2); }
      .mitsu-add-list { overflow-y: auto; padding: 8px 12px 16px; }
      .mitsu-add-note { padding: 10px 20px 4px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
    `

    let injected = false
    const ensureStyle = () => {
      if (injected) return
      injected = true
      const style = document.createElement('style')
      style.textContent = STYLE
      document.head.appendChild(style)
    }

    const ProviderCard = ({ provider, selected, onSelect }) =>
      h('div', {
        className: 'mitsu-provider-card' + (selected ? ' sel' : ''),
        onClick: onSelect,
      },
        h('div', { className: 'mitsu-provider-name' }, provider.name),
        h('div', { className: 'mitsu-provider-desc' }, provider.desc),
        h('div', { className: 'mitsu-provider-caps' },
          provider.caps.map((cap) => h('span', { className: 'mitsu-cap', key: cap }, cap))))

    const MitsuProvidersPanel = (props) => {
      const [selectedId, setSelectedId] = useState(null)   // null = empty state
      const [showAdd, setShowAdd] = useState(false)
      const [key, setKey] = useState('')
      const [baseURL, setBaseURL] = useState('')
      const [testStatus, setTestStatus] = useState(null)
      const [models, setModels] = useState([])
      const [busy, setBusy] = useState(false)

      ensureStyle()

      const selected = useMemo(() => PROVIDERS.find((p) => p.id === selectedId) || null, [selectedId])

      const chooseProvider = (provider) => {
        setSelectedId(provider.id)
        setBaseURL(provider.base)
        setModels(provider.models)
        setTestStatus(null)
        setShowAdd(false)
      }

      const closeProvider = () => {
        setSelectedId(null)
        setKey('')
        setBaseURL('')
        setModels([])
        setTestStatus(null)
      }

      // Live probe goes through the HOST route (CORS-free, key never leaves the
      // server's request). The host fetches <baseURL>/models with the key and
      // returns the advertised model ids.
      const probe = async () => {
        if (!key.trim()) {
          setTestStatus({ ok: false, text: 'Enter an API key first' })
          return null
        }
        setBusy(true)
        setTestStatus(null)
        try {
          const res = await fetch('/mitsu/providers/probe', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ provider: selected.id, baseURL, format: selected.format, apiKey: key }),
          })
          const json = await res.json()
          setBusy(false)
          if (!json.ok) {
            setTestStatus({ ok: false, text: json.error || 'Probe failed' })
            return null
          }
          const list = Array.isArray(json.list) ? json.list : []
          setTestStatus({ ok: true, text: `Key works — ${list.length} model${list.length === 1 ? '' : 's'} found` })
          return list
        } catch (error) {
          setBusy(false)
          setTestStatus({ ok: false, text: String((error && error.message) || error) })
          return null
        }
      }

      const testKey = async () => { await probe() }

      const pullModels = async () => {
        const list = await probe()
        if (list !== null && list.length > 0) {
          setModels(list.map((m) => typeof m === 'string' ? m : (m.id || m.name)))
          setTestStatus({ ok: true, text: 'Models pulled' })
        } else if (list !== null) {
          setTestStatus({ ok: false, text: 'No models returned' })
        }
      }

      // Add-provider dialog (curated list you've tested).
      const AddDialog = () => h('div', { className: 'mitsu-add-dialog', onClick: (e) => { if (e.target === e.currentTarget) setShowAdd(false) } },
        h('div', { className: 'mitsu-add-card' },
          h('div', { className: 'mitsu-add-head' },
            h('span', { className: 'mitsu-add-title' }, 'Add a provider'),
            h('button', { className: 'mitsu-add-close', 'aria-label': 'Close', onClick: () => setShowAdd(false) }, '×')),
          h('div', { className: 'mitsu-add-note' }, 'Curated providers — tested and verified.'),
          h('div', { className: 'mitsu-add-list' },
            PROVIDERS.map((p) => h(ProviderCard, { key: p.id, provider: p, selected: false, onSelect: () => chooseProvider(p) })))))

      // Empty state (no provider added yet).
      if (!selected) {
        return h('div', { className: 'mitsu-providers' },
          h('div', { className: 'mitsu-providers-head' },
            h('span', { className: 'mitsu-providers-title' }, 'Mitsu Providers')),
          h('div', { className: 'mitsu-empty' },
            h('div', { className: 'mitsu-empty-ico' }, '⚡'),
            h('div', { className: 'mitsu-empty-title' }, 'No provider added yet'),
            h('div', { className: 'mitsu-empty-desc' }, 'Add a model provider to start using Mitsu with your own API key.'),
            h('button', { className: 'mitsu-btn primary', onClick: () => setShowAdd(true) }, '+ Add provider'),
            showAdd ? h(AddDialog) : null))
      }

      // Provider editor.
      return h('div', { className: 'mitsu-providers' },
        h('div', { className: 'mitsu-providers-head' },
          h('span', { className: 'mitsu-providers-title' }, 'Mitsu Providers'),
          h('button', { className: 'mitsu-back', style: { marginLeft: 'auto' }, onClick: closeProvider }, '← Back'),
          h('button', { className: 'mitsu-btn', onClick: () => setShowAdd(true) }, '+ Add')),
        h('div', { className: 'mitsu-providers-editor' },
          h('div', { className: 'mitsu-editor-title' }, selected.name),
          h('div', { className: 'mitsu-editor-sub' }, selected.desc),
          h('div', { className: 'mitsu-field' },
            h('label', { className: 'mitsu-label' }, 'API key'),
            h('div', { className: 'mitsu-row' },
              h('input', {
                className: 'mitsu-input',
                style: { flex: 1 },
                type: 'password',
                placeholder: 'Enter API key',
                value: key,
                onChange: (e) => setKey(e.target.value),
              }),
              h('button', { className: 'mitsu-btn primary', onClick: () => void testKey(), disabled: busy }, busy ? 'Testing…' : 'Test'),
              h('button', { className: 'mitsu-btn', onClick: () => void pullModels(), disabled: busy }, busy ? 'Pulling…' : 'Pull models'))),
          h('div', { className: 'mitsu-field' },
            h('label', { className: 'mitsu-label' }, 'Base URL'),
            h('input', {
              className: 'mitsu-input',
              placeholder: 'https://api.example.com/v1',
              value: baseURL,
              onChange: (e) => setBaseURL(e.target.value),
            })),
          testStatus && h('div', { className: 'mitsu-status' + (testStatus.ok ? '' : ' error') }, testStatus.text),
          h('div', { className: 'mitsu-section-title' }, 'Models'),
          models.map((model) =>
            h('div', { className: 'mitsu-model', key: typeof model === 'string' ? model : model.id || model.name },
              h('input', { type: 'checkbox', defaultChecked: true }),
              h('span', null, typeof model === 'string' ? model : model.name || model.id))),
          h('div', { className: 'mitsu-section-title' }, 'Diffusion presets'),
          h('div', { className: 'mitsu-provider-caps' },
            ['Cinematic', 'Product', 'Fashion', 'Illustration'].map((preset) =>
              h('span', { className: 'mitsu-cap', key: preset }, preset)))),
        showAdd ? h(AddDialog) : null)
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'models',
              order: 10,
              label: () => 'Mitsu Providers',
            },
            MitsuProvidersPanel,
          ))
      },
    }
  },
})

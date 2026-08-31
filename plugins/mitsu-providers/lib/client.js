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
      const [query, setQuery] = useState('')
      const [selectedId, setSelectedId] = useState('mimo')
      const [key, setKey] = useState('')
      const [baseURL, setBaseURL] = useState(PROVIDERS[0].base)
      const [testStatus, setTestStatus] = useState(null)
      const [pulled, setPulled] = useState(false)
      const [models, setModels] = useState(PROVIDERS[0].models)
      const [busy, setBusy] = useState(false)

      ensureStyle()

      const selected = useMemo(() => PROVIDERS.find((p) => p.id === selectedId) || PROVIDERS[0], [selectedId])

      const selectProvider = (provider) => {
        setSelectedId(provider.id)
        setBaseURL(provider.base)
        setModels(provider.models)
        setTestStatus(null)
        setPulled(false)
      }

      const filtered = PROVIDERS.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.desc.toLowerCase().includes(query.toLowerCase()))

      const api = props.api

      const probe = async () => {
        if (!key.trim()) {
          setTestStatus({ ok: false, text: 'Enter an API key first' })
          return null
        }
        setBusy(true)
        setTestStatus(null)
        try {
          const settingsNs = selected.id === 'deepseek' ? 'llm-deepseek' : 'llm-pi-ai'
          const result = await api.llm.discoverModels(settingsNs, {
            provider: selected.id,
            ...(baseURL ? { baseURL } : {}),
            ...(key ? { apiKey: key } : {}),
          })
          const list = Array.isArray(result) ? result : (result && result.models) || []
          setBusy(false)
          return list
        } catch (error) {
          setBusy(false)
          setTestStatus({ ok: false, text: String((error && error.message) || error) })
          return null
        }
      }

      const testKey = async () => {
        const list = await probe()
        if (list !== null) {
          setTestStatus({ ok: true, text: 'Key works — models available' })
        }
      }

      const pullModels = async () => {
        const list = await probe()
        if (list !== null && list.length > 0) {
          setModels(list.map((m) => typeof m === 'string' ? m : (m.id || m.name)))
          setPulled(true)
          setTestStatus({ ok: true, text: 'Models pulled' })
        } else if (list !== null) {
          setTestStatus({ ok: false, text: 'No models returned' })
        }
      }

      return h('div', { className: 'mitsu-providers' },
        h('div', { className: 'mitsu-providers-head' },
          h('span', { className: 'mitsu-providers-title' }, 'Mitsu Providers')),
        h('div', { className: 'mitsu-providers-body' },
          h('div', { className: 'mitsu-providers-list' },
            h('input', {
              className: 'mitsu-providers-search',
              placeholder: 'Search providers…',
              value: query,
              onChange: (e) => setQuery(e.target.value),
            }),
            filtered.map((p) => h(ProviderCard, { key: p.id, provider: p, selected: p.id === selectedId, onSelect: () => selectProvider(p) }))),
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
                h('span', { className: 'mitsu-cap', key: preset }, preset))))))
    }

    return {
      inject: ['slots', 'remote', 'remote.credentials', 'remote.llm', 'remote.settings'],
      apply(ctx) {
        const injected = () => ({
          api: {
            credentials: ctx.remote.credentials,
            llm: ctx.remote.llm,
            settings: ctx.remote.settings,
          },
        })
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'models',
              order: 10,
              label: () => 'Mitsu Providers',
              inject: injected,
            },
            MitsuProvidersPanel,
          ))
      },
    }
  },
})

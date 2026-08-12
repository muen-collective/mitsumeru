import { describe, expect, it } from 'vitest'
import { createProvidersStore } from './providers'

describe('providers store', () => {
  it('loads seeded providers from the mock adapter', async () => {
    const store = createProvidersStore()
    await store.getState().load()
    const { providers, status } = store.getState()
    expect(status).toBe('ready')
    expect(providers.map((p) => p.id)).toEqual([
      'deepseek',
      'qwen',
      'minimax',
      'moonshot',
      'mimo',
      'lm-studio',
      'openai',
      'zai',
      'gemini',
      'anthropic',
      'krea',
      'openrouter',
      'magnific',
      'runninghub',
    ])
    expect(providers[0].keyStatus).toBe('valid')
    const local = providers.find((p) => p.id === 'lm-studio')
    expect(local?.status).toBe('local')
    expect(local?.modelsFetched).toBe(true)
    // v0.2: presets carry key mode + console URLs (api key / token plan)
    expect(providers[0].keyMode).toBe('api')
    expect(providers[0].setupApiUrl).toBe('https://platform.deepseek.com/api_keys')
    const qwen = providers.find((p) => p.id === 'qwen')
    expect(qwen?.keyMode).toBe('both')
    expect(qwen?.setupPlanUrl).toBe('https://www.qwencloud.com/pricing/token-plan')
  })

  it('saveKey updates keyStatus without exposing key material', async () => {
    const store = createProvidersStore()
    await store.getState().load()
    const status = await store.getState().saveKey('krea', 'sk-valid-key-123')
    expect(status).toBe('valid')
    const krea = store.getState().providers.find((p) => p.id === 'krea')
    expect(krea?.keyStatus).toBe('valid')
    expect(krea?.status).toBe('ready')
    expect(JSON.stringify(store.getState().providers)).not.toContain('sk-valid-key-123')
  })

  it('rejects short keys with an issue status', async () => {
    const store = createProvidersStore()
    await store.getState().load()
    await expect(store.getState().saveKey('krea', 'short')).resolves.toBe('invalid')
    const krea = store.getState().providers.find((p) => p.id === 'krea')
    expect(krea?.status).toBe('issue')
  })

  it('pullModels fetches the model list; setDefault/toggleKeep mutate it', async () => {
    const store = createProvidersStore()
    await store.getState().load()
    await store.getState().pullModels('deepseek')
    let deepseek = store.getState().providers.find((p) => p.id === 'deepseek')!
    expect(deepseek.modelsFetched).toBe(true)
    expect(deepseek.models.length).toBeGreaterThan(0)
    store.getState().setDefaultModel('deepseek', 'deepseek-v4-pro')
    store.getState().toggleKeepModel('deepseek', 'deepseek-v4-pro')
    deepseek = store.getState().providers.find((p) => p.id === 'deepseek')!
    expect(deepseek.defaultModelId).toBe('deepseek-v4-pro')
    expect(deepseek.models.find((m) => m.id === 'deepseek-v4-pro')?.kept).toBe(false)
  })

  it('addFromPreset appends with a unique id when the id exists; removeProvider deletes', async () => {
    const store = createProvidersStore()
    await store.getState().load()
    const added = store.getState().addFromPreset({
      id: 'minimax',
      name: 'MiniMax',
      description: 'Text generation.',
      endpoint: { format: 'openai', baseUrl: 'https://api.minimax.chat/v1' },
      capabilities: ['chat'],
      models: [{ id: 'minimax-m2.7', capability: 'chat', name: 'MiniMax M2.7', kept: true }],
      keyMode: 'both',
      setupApiUrl: 'https://platform.minimax.io/user-center/basic-information/interface-key',
      setupPlanUrl: 'https://platform.minimax.io/user-center/payment/token-plan',
    })
    expect(added.keyMode).toBe('both')
    expect(added.setupApiUrl).toBe('https://platform.minimax.io/user-center/basic-information/interface-key')
    // All presets are seeded in review mode → even the first add collides
    expect(added.id).toMatch(/^minimax-/)
    expect(store.getState().providers).toHaveLength(15)
    // Adding the same preset again suffixes the id (no collisions)
    const second = store.getState().addFromPreset({
      id: 'minimax',
      name: 'MiniMax',
      description: 'Text generation.',
      endpoint: { format: 'openai', baseUrl: 'https://api.minimax.chat/v1' },
      capabilities: ['chat'],
      models: [{ id: 'minimax-m2.7', capability: 'chat', name: 'MiniMax M2.7', kept: true }],
      keyMode: 'both',
    })
    expect(second.id).toMatch(/^minimax-/)
    expect(store.getState().providers).toHaveLength(16)
    store.getState().removeProvider(added.id)
    store.getState().removeProvider(second.id)
    expect(store.getState().providers).toHaveLength(14)
  })
})

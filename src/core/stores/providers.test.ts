import { describe, expect, it } from 'vitest'
import { createProvidersStore } from './providers'

describe('providers store', () => {
  it('loads seeded providers from the mock adapter', async () => {
    const store = createProvidersStore()
    await store.getState().load()
    const { providers, status } = store.getState()
    expect(status).toBe('ready')
    expect(providers.map((p) => p.id)).toEqual(['deepseek', 'krea'])
    expect(providers[0].keyStatus).toBe('valid')
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
    })
    expect(added.id).toBe('minimax')
    expect(store.getState().providers).toHaveLength(4)
    // Adding the same preset again suffixes the id (no collisions)
    const second = store.getState().addFromPreset({
      id: 'minimax',
      name: 'MiniMax',
      description: 'Text generation.',
      endpoint: { format: 'openai', baseUrl: 'https://api.minimax.chat/v1' },
      capabilities: ['chat'],
      models: [{ id: 'minimax-m2.7', capability: 'chat', name: 'MiniMax M2.7', kept: true }],
    })
    expect(second.id).toMatch(/^minimax-/)
    expect(store.getState().providers).toHaveLength(5)
    store.getState().removeProvider(added.id)
    store.getState().removeProvider(second.id)
    expect(store.getState().providers).toHaveLength(3)
  })
})

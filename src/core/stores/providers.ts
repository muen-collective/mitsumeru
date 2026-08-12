/**
 * Providers store (thin, epic 10 §9 — Zustand confirmed at Block 0).
 * Holds UI state, imports adapters via the seam — never network or contracts
 * drift (UI imports contracts only; stores import adapters).
 * Factory export so tests can create isolated stores.
 */
import { create } from 'zustand'
import { getAdapters } from '../config'
import type { KeyStatus } from '../contracts/keychain'
import type { ProviderConfig, ProviderPreset } from '../contracts/provider'

export interface ProvidersState {
  providers: ProviderConfig[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  load(): Promise<void>
  patchProvider(id: string, patch: Partial<ProviderConfig>): void
  setDefaultModel(providerId: string, modelId: string): void
  toggleKeepModel(providerId: string, modelId: string): void
  pullModels(providerId: string): Promise<void>
  saveKey(providerId: string, key: string): Promise<KeyStatus>
  testKey(providerId: string): Promise<KeyStatus>
  addFromPreset(preset: ProviderPreset): ProviderConfig
  removeProvider(providerId: string): void
}

export function createProvidersStore() {
  return create<ProvidersState>()((set, get) => ({
    providers: [],
    status: 'idle',

    async load() {
      set({ status: 'loading' })
      const providers = await getAdapters().providers.loadProviders()
      set({ providers, status: 'ready' })
    },

    patchProvider(id, patch) {
      set({
        providers: get().providers.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      })
    },

    setDefaultModel(providerId, modelId) {
      get().patchProvider(providerId, { defaultModelId: modelId })
    },

    toggleKeepModel(providerId, modelId) {
      get().patchProvider(providerId, {
        models: get()
          .providers.find((p) => p.id === providerId)
          ?.models.map((m) => (m.id === modelId ? { ...m, kept: !m.kept } : m)),
      })
    },

    async pullModels(providerId) {
      const models = await getAdapters().providers.fetchModels(providerId)
      get().patchProvider(providerId, { models, modelsFetched: true })
    },

    async saveKey(providerId, key) {
      const status = await getAdapters().keychain.saveKey(providerId, key)
      get().patchProvider(providerId, {
        keyStatus: status,
        status: status === 'valid' ? 'ready' : 'issue',
      })
      return status
    },

    async testKey(providerId) {
      const status = await getAdapters().keychain.testKey(providerId)
      get().patchProvider(providerId, {
        keyStatus: status,
        status: status === 'valid' ? 'ready' : 'issue',
      })
      return status
    },

    addFromPreset(preset) {
      const existing = get().providers.some((p) => p.id === preset.id)
      const provider: ProviderConfig = {
        id: existing ? `${preset.id}-${Date.now()}` : preset.id,
        name: preset.name,
        description: preset.description,
        kind: 'catalog',
        endpoint: { ...preset.endpoint },
        capabilities: [...preset.capabilities],
        models: preset.models.map((m) => ({ ...m })),
        modelsFetched: preset.models.length > 0,
        setupUrl: preset.setupUrl,
        defaultModelId: preset.models.find((m) => m.capability === 'chat' && m.kept)?.id,
        keyStatus: 'unset',
        status: 'unconfigured',
      }
      set({ providers: [...get().providers, provider] })
      return provider
    },

    removeProvider(providerId) {
      set({ providers: get().providers.filter((p) => p.id !== providerId) })
    },
  }))
}

/** Default singleton used by the UI. */
export const useProvidersStore = createProvidersStore()

/**
 * Providers store (thin, epic 10 §9 — Zustand confirmed at Block 0).
 * Holds UI state, imports adapters via the seam — never network or contracts
 * drift (UI imports contracts only; stores import adapters).
 */
import { create } from 'zustand'
import { getAdapters } from '../config'
import type { KeyStatus } from '../contracts/keychain'
import type { ProviderConfig } from '../contracts/provider'

interface ProvidersState {
  providers: ProviderConfig[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  load(): Promise<void>
  setDefaultModel(providerId: string, modelId: string): void
  testKey(providerId: string): Promise<KeyStatus>
}

export const useProvidersStore = create<ProvidersState>((set, get) => ({
  providers: [],
  status: 'idle',

  async load() {
    set({ status: 'loading' })
    const providers = await getAdapters().providers.loadProviders()
    set({ providers, status: 'ready' })
  },

  setDefaultModel(providerId, modelId) {
    set({
      providers: get().providers.map((p) =>
        p.id === providerId ? { ...p, defaultModelId: modelId } : p,
      ),
    })
  },

  async testKey(providerId) {
    const status = await getAdapters().keychain.testKey(providerId)
    set({
      providers: get().providers.map((p) =>
        p.id === providerId
          ? { ...p, keyStatus: status, status: status === 'valid' ? 'ready' : 'issue' }
          : p,
      ),
    })
    return status
  },
}))

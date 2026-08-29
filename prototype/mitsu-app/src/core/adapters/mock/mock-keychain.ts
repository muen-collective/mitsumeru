/**
 * Mock keychain (UI lane) — in-memory only.
 * Never persists, no localStorage, dev-only (epic 10 §6). The mock holds key
 * material internally (it must, to test save/test flows) but the adapter
 * boundary returns status booleans only — same rule as the real adapter.
 */
import type { KeychainAdapter } from '../ports'
import type { KeychainEntry, KeychainState, KeyStatus } from '../../contracts/keychain'

/** Deterministic mock validity: a key "works" when it is at least 8 chars. */
export const MOCK_MIN_KEY_LENGTH = 8

export function createMockKeychainAdapter(): KeychainAdapter {
  const store = new Map<string, string>()

  const entries = (): KeychainEntry[] =>
    [...store.entries()].map(([providerId, key]) => ({
      providerId,
      status: key.length >= MOCK_MIN_KEY_LENGTH ? 'valid' : 'invalid',
    }))

  return {
    async getState(): Promise<KeychainState> {
      return { entries: entries() }
    },
    async saveKey(providerId: string, key: string): Promise<KeyStatus> {
      if (key.length === 0) {
        store.delete(providerId)
        return 'unset'
      }
      store.set(providerId, key)
      return key.length >= MOCK_MIN_KEY_LENGTH ? 'valid' : 'invalid'
    },
    async testKey(providerId: string): Promise<KeyStatus> {
      const key = store.get(providerId)
      if (!key) return 'unset'
      return key.length >= MOCK_MIN_KEY_LENGTH ? 'valid' : 'invalid'
    },
    async removeKey(providerId: string): Promise<KeyStatus> {
      store.delete(providerId)
      return 'unset'
    },
  }
}

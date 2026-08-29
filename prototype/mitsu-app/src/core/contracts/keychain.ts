/**
 * KeychainState v0 — key storage UI, test/save flows (Block #1).
 * Real adapter: OS keychain (Electron tier) / server-side managed keys
 * (web managed-client tier, pilot epic 07 L40).
 * Security rule: the UI and every contract see status booleans only — key
 * material never crosses the adapter boundary (BYOK doctrine; the mock is
 * in-memory only, never localStorage).
 */
export type KeyStatus = 'unset' | 'valid' | 'invalid' | 'testing'

export interface KeychainEntry {
  providerId: string
  status: KeyStatus
  /** Opaque adapter-side id — never key material. */
  keyId?: string
  label?: string
  lastTestedAt?: string
}

export interface KeychainState {
  entries: KeychainEntry[]
}

/**
 * ProviderConfig v0 — Block #1 provider settings right panel.
 * Source story: claire-ai `Patterns/Mitsu provider panel` (MitsuProvidersPanel.tsx,
 * MitsuProviderEditor.tsx) + `ai/providerCatalog.ts`.
 * Open shape questions (epic 10 §3): catalog preset vs custom form; capability
 * flags; default-model selection.
 * BYOK rule: this contract never carries key material — key state lives in
 * KeychainState, referenced by providerId (status booleans only).
 */
import type { KeyStatus } from './keychain'

export type ProviderCapability = 'chat' | 'reasoning' | 'image' | 'video' | '3d'

export const PROVIDER_CAPABILITIES: readonly ProviderCapability[] = [
  'chat',
  'reasoning',
  'image',
  'video',
  '3d',
]

/**
 * ready = configured and usable · local = no key needed (Ollama) ·
 * issue = last key test failed · unconfigured = added, no key yet.
 */
export type ProviderStatus = 'ready' | 'local' | 'issue' | 'unconfigured'

export interface ProviderModel {
  id: string
  /** Primary capability of this model (a provider's model list also derives caps). */
  capability: ProviderCapability
  /** Display name — catalog only; custom providers show the raw id until fetched. */
  name?: string
}

export interface ProviderConfig {
  id: string
  name: string
  description?: string
  kind: 'catalog' | 'custom'
  /** Endpoint format id (openai / deepseek / anthropic / custom…) + base URL; request path derives from format. */
  endpoint: { format: string; baseUrl: string }
  /** Capabilities this provider offers, independent of its (possibly empty) model list. */
  capabilities: ProviderCapability[]
  models: ProviderModel[]
  defaultModelId?: string
  /** Derived from KeychainState by providerId — status booleans only, never material. */
  keyStatus: KeyStatus
  status: ProviderStatus
}

/** Catalog preset — the "Add provider" list (deepseek, qwen, minimax, moonshot, openai, krea…). */
export interface ProviderPreset {
  id: string
  name: string
  description: string
  endpoint: { format: string; baseUrl: string }
  capabilities: ProviderCapability[]
  models: ProviderModel[]
}

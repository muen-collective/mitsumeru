/**
 * ProviderConfig v0.1 — Block #1 provider settings right panel.
 * Source story: claire-ai `Patterns/Mitsu provider panel` (MitsuProvidersPanel.tsx,
 * MitsuProviderEditor.tsx) + `ai/providerCatalog.ts`.
 * v0.1 additions (Block 1, flagged for ratification): `modelsFetched` and
 * `ProviderModel.kept` — the panel's pull-models / keep-model flows.
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
 * ready = configured and usable · local = no key needed (local endpoints) ·
 * issue = last key test failed · unconfigured = added, no key yet.
 */
export type ProviderStatus = 'ready' | 'local' | 'issue' | 'unconfigured'

export interface ProviderModel {
  id: string
  /** Primary capability of this model (a provider's model list also derives caps). */
  capability: ProviderCapability
  /** Display name — catalog only; custom providers show the raw id until fetched. */
  name?: string
  /** Whether the user keeps this model enabled (v0.1 — model-list curation). */
  kept: boolean
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
  /** v0.1 — mirrors the panel's "pull models" flow; false until the user pulls. */
  modelsFetched: boolean
  defaultModelId?: string
  /** v0.2 — billing/key mode: which key type this provider uses. `both` = user picks. */
  keyMode: 'api' | 'subscription' | 'both'
  /** v0.2 — console for the pay-as-you-go API key (shown in the connection tab). */
  setupApiUrl?: string
  /** v0.2 — console/plan page for the subscription (token plan) key. */
  setupPlanUrl?: string
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
  /** v0.2 — billing/key mode; copied into ProviderConfig on add. */
  keyMode: 'api' | 'subscription' | 'both'
  setupApiUrl?: string
  setupPlanUrl?: string
}

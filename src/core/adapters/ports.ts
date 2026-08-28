/**
 * Adapter ports — the seam between stores and I/O (epic 10 §4).
 * Stores import these ports only; `mock/` implements them (UI lane),
 * `real/` shells are the partner's integration contract. The UI never
 * imports adapters directly — only contracts.
 */
import type { ProviderConfig, ProviderModel, ProviderPreset } from '../contracts/provider'
import type { KeychainState, KeyStatus } from '../contracts/keychain'
import type { UsageRecord, WalletMeterState } from '../contracts/wallet'
import type { PublishManifest } from '../contracts/publish'
import type { ContentNode } from '../contracts/content'
import type { AgentEvent } from '../contracts/agent'
import type { SessionState } from '../contracts/session'
import type { SyncConflict, SyncState } from '../contracts/sync'

export interface ProviderAdapter {
  listPresets(): Promise<ProviderPreset[]>
  loadProviders(): Promise<ProviderConfig[]>
  /** Pull the provider's real model list (v0.1 — panel "Pull models" flow). */
  fetchModels(providerId: string): Promise<ProviderModel[]>
}

export interface KeychainAdapter {
  getState(): Promise<KeychainState>
  /** Stores a key with the OS keychain / managed server. Status only — material never returns. */
  saveKey(providerId: string, key: string): Promise<KeyStatus>
  testKey(providerId: string): Promise<KeyStatus>
  removeKey(providerId: string): Promise<KeyStatus>
}

export interface WalletAdapter {
  getState(): Promise<WalletMeterState>
  record(usage: Omit<UsageRecord, 'id'>): Promise<UsageRecord>
}

export interface PublishAdapter {
  preview(manifest: PublishManifest): Promise<{ draftUrl: string; draftSha: string }>
  publish(manifest: PublishManifest): Promise<PublishManifest>
  rollback(manifest: PublishManifest): Promise<PublishManifest>
}

export interface ContentAdapter {
  loadTree(): Promise<ContentNode>
}

/** SSE-shaped subscription; the returned function unsubscribes. */
export interface AgentStreamAdapter {
  subscribe(onEvent: (event: AgentEvent) => void): () => void
}

export interface SessionAdapter {
  getSession(): Promise<SessionState>
  signIn(): Promise<SessionState>
  signOut(): Promise<SessionState>
}

export interface SyncAdapter {
  getState(): Promise<SyncState>
  resolveConflict(conflict: SyncConflict, resolution: 'local' | 'remote'): Promise<SyncState>
}

export interface Adapters {
  providers: ProviderAdapter
  keychain: KeychainAdapter
  wallet: WalletAdapter
  publish: PublishAdapter
  content: ContentAdapter
  agentStream: AgentStreamAdapter
  session: SessionAdapter
  sync: SyncAdapter
}

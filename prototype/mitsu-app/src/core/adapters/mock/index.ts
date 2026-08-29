/**
 * Mock adapter assembly (UI lane) — the default when USE_MOCKS is on.
 * Mocks never ship: prod/pilot deploys set the env flip off (epic 10 §6).
 */
import type { Adapters } from '../ports'
import { mockProviderAdapter } from './mock-provider-registry'
import { createMockKeychainAdapter } from './mock-keychain'
import { createMockWalletAdapter } from './mock-wallet-meter'
import { createMockPublishAdapter } from './mock-publish'
import { createMockAgentStreamAdapter } from './mock-agent-stream'
import { createMockSessionAdapter } from './mock-session'
import { createMockSyncAdapter } from './mock-sync'
import { MOCK_CONTENT_TREE } from './mock-content-tree'

export function mockAdapters(): Adapters {
  return {
    providers: mockProviderAdapter(),
    keychain: createMockKeychainAdapter(),
    wallet: createMockWalletAdapter(),
    publish: createMockPublishAdapter(),
    content: {
      async loadTree() {
        return MOCK_CONTENT_TREE
      },
    },
    agentStream: createMockAgentStreamAdapter(),
    session: createMockSessionAdapter(),
    sync: createMockSyncAdapter(),
  }
}

/**
 * Mock auth session (UI lane) — Clerk-shaped session states (epic 10 §6);
 * replaced by real Clerk at Block 2 (web tier).
 */
import type { SessionAdapter } from '../ports'
import type { SessionState } from '../../contracts/session'

const SIGNED_IN: SessionState = {
  status: 'signedIn',
  userId: 'user-mock-1',
  permissions: ['providers.manage', 'publish', 'settings.edit'],
}

export function createMockSessionAdapter(): SessionAdapter {
  let current: SessionState = { status: 'signedOut', permissions: [] }

  return {
    async getSession() {
      return current
    },
    async signIn() {
      current = SIGNED_IN
      return current
    },
    async signOut() {
      current = { status: 'signedOut', permissions: [] }
      return current
    },
  }
}

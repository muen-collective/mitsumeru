/**
 * Session store (thin) — auth/session + permissions for the settings shell
 * (Block #2). Real web tier = Clerk session (parked until Block 2 wiring per
 * epic 10 §9); the mock adapter stands in. Contract: SessionState v0
 * (provisional — no profile fields yet; the shell displays a static account
 * card until the real session shape lands).
 */
import { create } from 'zustand'
import { getAdapters } from '../config'
import type { SessionState } from '../contracts/session'

export interface SessionStore extends SessionState {
  load(): Promise<void>
  signIn(): Promise<void>
  signOut(): Promise<void>
}

export function createSessionStore() {
  return create<SessionStore>()((set) => ({
    status: 'signedOut',
    permissions: [],
    async load() {
      set(await getAdapters().session.getSession())
    },
    async signIn() {
      set(await getAdapters().session.signIn())
    },
    async signOut() {
      set(await getAdapters().session.signOut())
    },
  }))
}

export const useSessionStore = createSessionStore()

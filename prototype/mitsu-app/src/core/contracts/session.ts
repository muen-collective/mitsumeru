/**
 * SessionState v0 (PROVISIONAL) — auth/session + permissions.
 * Real web tier = Clerk session (the repo's scaffold already wires Clerk
 * middleware + routes); mock states stand in until Pratap's v0 shapes land
 * (epic 10 §3). Clerk wiring timing: Block #2 for the web tier (epic 10 §9).
 */
export type SessionStatus = 'signedOut' | 'signingIn' | 'signedIn'

export interface SessionState {
  status: SessionStatus
  userId?: string
  /** Provisional permission strings — replaced when the real shapes land. */
  permissions: string[]
}

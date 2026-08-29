/**
 * SyncState v0 (PROVISIONAL, mock-only) — sync/conflict states.
 * The seam covers complex backend states, not just simple data (epic 10 §3).
 */
export type SyncStatus = 'idle' | 'syncing' | 'conflict' | 'error'

export interface SyncConflict {
  path: string
  localSha: string
  remoteSha: string
  resolution?: 'local' | 'remote'
}

export interface SyncState {
  status: SyncStatus
  conflicts: SyncConflict[]
}

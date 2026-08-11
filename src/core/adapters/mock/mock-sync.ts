/**
 * Mock sync (UI lane, provisional) — idle by default; supports conflict
 * resolution so the settings shell (Block #2) can demo conflict states.
 */
import type { SyncAdapter } from '../ports'
import type { SyncConflict, SyncState } from '../../contracts/sync'

export function createMockSyncAdapter(initial: SyncState = { status: 'idle', conflicts: [] }): SyncAdapter {
  let current: SyncState = initial

  return {
    async getState() {
      return current
    },
    async resolveConflict(conflict, resolution) {
      const conflicts: SyncConflict[] = current.conflicts
        .filter((c) => c.path !== conflict.path)
        .map((c) => c)
      current = {
        status: conflicts.length > 0 ? 'conflict' : 'idle',
        conflicts,
      }
      return current
    },
  }
}

/**
 * Real adapter lane — Pratap's integration contract (epic 10 §4).
 * Empty shells: the seam type-checks with the env flip off, but every port
 * throws until the real backend lands. Whether these shells stay in this
 * repo or move to the fork repo is the partner's call at the spike (§9).
 */
import type { Adapters } from '../ports'

export function realAdapters(): Adapters {
  throw new Error(
    'real adapters: partner lane — not implemented yet (epic 10 §4). ' +
      'UI never imports this; stores flip via USE_MOCKS.',
  )
}

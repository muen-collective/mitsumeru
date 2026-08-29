/**
 * Env flip (epic 10 §4): `VITE_USE_MOCKS` on the Vite track; the Next repo
 * reads `NEXT_PUBLIC_USE_MOCKS`. Defaults to mocks on — mocks never ship:
 * prod/pilot deploys set the flip off (epic 10 §6).
 */
import { mockAdapters } from './adapters/mock'
import { realAdapters } from './adapters/real'
import type { Adapters } from './adapters/ports'

function readEnv(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) return process.env[name]
  return undefined
}

export const USE_MOCKS =
  (readEnv('VITE_USE_MOCKS') ?? readEnv('NEXT_PUBLIC_USE_MOCKS') ?? 'true') !== 'false'

export function getAdapters(): Adapters {
  return USE_MOCKS ? mockAdapters() : realAdapters()
}

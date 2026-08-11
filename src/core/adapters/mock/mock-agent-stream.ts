/**
 * Mock agent stream (UI lane) — yields AgentEvent objects on an interval,
 * SSE-shaped; no real LLM calls (epic 10 §6). The real adapter consumes an
 * SSE stream (Block #4).
 */
import type { AgentStreamAdapter } from '../ports'
import type { AgentEvent } from '../../contracts/agent'

const DEFAULT_INTERVAL_MS = 300

/** Distributive omit — `Omit` over a discriminated union collapses to common keys. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

const SEQUENCE: DistributiveOmit<AgentEvent, 'at'>[] = [
  { type: 'thinking', id: 'ev-1', text: 'Planning the publish flow…' },
  {
    type: 'tool_call',
    id: 'ev-2',
    tool: 'content.read',
    input: { path: 'site-content/index.json' },
  },
  { type: 'tool_result', id: 'ev-3', tool: 'content.read', ok: true, summary: '3 sections' },
  { type: 'text_chunk', id: 'ev-4', text: 'Draft looks consistent with the live site.' },
  { type: 'done', id: 'ev-5' },
]

export function createMockAgentStreamAdapter(intervalMs: number = DEFAULT_INTERVAL_MS): AgentStreamAdapter {
  return {
    subscribe(onEvent) {
      let i = 0
      let cancelled = false
      const timer = setInterval(() => {
        if (cancelled) return
        if (i >= SEQUENCE.length) {
          clearInterval(timer)
          return
        }
        onEvent({ ...SEQUENCE[i], at: new Date().toISOString() })
        i += 1
      }, intervalMs)
      return () => {
        cancelled = true
        clearInterval(timer)
      }
    },
  }
}

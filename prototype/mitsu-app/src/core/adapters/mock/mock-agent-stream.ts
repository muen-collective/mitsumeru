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
  { type: 'thinking', id: 'ev-1', text: 'Reading the current site content…' },
  {
    type: 'tool_call',
    id: 'ev-2',
    tool: 'content.read',
    input: { path: 'site-content/index.json' },
  },
  { type: 'tool_result', id: 'ev-3', tool: 'content.read', ok: true, summary: '3 sections · landing.json' },
  { type: 'thinking', id: 'ev-4', text: 'Drafting the spring hero for the event card…' },
  {
    type: 'tool_call',
    id: 'ev-5',
    tool: 'image.generate',
    input: { prompt: 'spring hero — editorial flatlay', provider: 'krea' },
  },
  {
    type: 'tool_result',
    id: 'ev-6',
    tool: 'image.generate',
    ok: true,
    summary: 'flatlay-generated.svg · krea',
    media: { kind: 'image', url: '/demo-images/flatlay-generated.svg' },
  },
  { type: 'text_chunk', id: 'ev-7', text: 'Hero image generated for the spring campaign.' },
  { type: 'text_chunk', id: 'ev-8', text: ' Preview it in the publish panel before it goes live.' },
  { type: 'done', id: 'ev-9' },
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

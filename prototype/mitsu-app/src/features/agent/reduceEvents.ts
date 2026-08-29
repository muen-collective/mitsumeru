/**
 * reduceEvents — pure event-stream → turn-items reducer (Block #4).
 * Ported from the settled `Patterns/Mitsu agent loop` story. The UI renders
 * these items; nothing here touches React or adapters.
 */
import type { AgentEvent } from '@/core/contracts/agent'

export type ToolStatus = 'pending' | 'active' | 'done' | 'failed'

export type ThinkingStep = {
  /** Human-readable label, e.g. "Reading the current site content…". */
  label: string
  /** done = check, active = spinner, pending = dim dot. */
  status: 'done' | 'active' | 'pending'
}

export type TurnItem =
  | { kind: 'thinking'; steps: ThinkingStep[] }
  | {
      kind: 'tool'
      tool: string
      input: Record<string, unknown>
      status: ToolStatus
      summary?: string
      media?: { kind: 'image'; url: string }
    }
  | { kind: 'text'; text: string }
  | { kind: 'terminal'; state: 'done' | 'stopped' | 'error'; message?: string }

export function reduceEvents(events: AgentEvent[], streaming: boolean): TurnItem[] {
  const items: TurnItem[] = []
  for (const event of events) {
    if (event.type === 'thinking') {
      const last = items[items.length - 1]
      if (last?.kind === 'thinking') {
        // Previous steps all resolved; the new one is active while streaming.
        last.steps = last.steps.map((s) => ({ ...s, status: 'done' as const }))
        last.steps.push({ label: event.text, status: streaming ? 'active' : 'done' })
      } else {
        items.push({
          kind: 'thinking',
          steps: [{ label: event.text, status: streaming ? 'active' : 'done' }],
        })
      }
    } else if (event.type === 'tool_call') {
      items.push({
        kind: 'tool',
        tool: event.tool,
        input: event.input,
        status: streaming ? 'active' : 'pending',
      })
    } else if (event.type === 'tool_result') {
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const item = items[i]
        if (
          item.kind === 'tool' &&
          item.tool === event.tool &&
          item.status !== 'done' &&
          item.status !== 'failed'
        ) {
          item.status = event.ok ? 'done' : 'failed'
          item.summary = event.summary
          item.media = event.media
          // The thinking block that preceded this tool is resolved.
          const prev = items[i - 1]
          if (prev?.kind === 'thinking') {
            prev.steps = prev.steps.map((s) => ({ ...s, status: 'done' as const }))
          }
          break
        }
      }
    } else if (event.type === 'text_chunk') {
      const last = items[items.length - 1]
      if (last?.kind === 'text') last.text += event.text
      else items.push({ kind: 'text', text: event.text })
    } else if (event.type === 'done') {
      items.push({ kind: 'terminal', state: 'done' })
    } else if (event.type === 'error') {
      items.push({ kind: 'terminal', state: 'error', message: event.message })
    }
  }
  // No terminal event and not streaming → the turn was stopped/interrupted.
  // Only when the turn has content — a bare idle state stays empty.
  if (!streaming && items.length > 0 && !items.some((i) => i.kind === 'terminal')) {
    items.push({ kind: 'terminal', state: 'stopped' })
  }
  return items
}

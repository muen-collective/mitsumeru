import { describe, expect, it } from 'vitest'
import { createMockAgentStreamAdapter } from './mock-agent-stream'
import type { AgentEvent } from '../../contracts/agent'

const collect = (intervalMs: number) =>
  new Promise<AgentEvent[]>((resolve) => {
    const adapter = createMockAgentStreamAdapter(intervalMs)
    const events: AgentEvent[] = []
    const unsubscribe = adapter.subscribe((event) => {
      events.push(event)
      if (event.type === 'done') {
        unsubscribe()
        resolve(events)
      }
    })
  })

describe('mock agent stream', () => {
  it('emits an SSE-shaped sequence ending in done', async () => {
    const events = await collect(1)
    expect(events.map((e) => e.type)).toEqual([
      'thinking',
      'tool_call',
      'tool_result',
      'text_chunk',
      'done',
    ])
    for (const event of events) {
      expect(event.id).toBeTruthy()
      expect(event.at).toBeTruthy()
    }
    const toolCall = events.find((e) => e.type === 'tool_call')
    expect(toolCall && toolCall.type === 'tool_call' ? toolCall.tool : '').toBe('content.read')
  })
})

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
  it('emits the settled Block #4 sequence ending in done', async () => {
    const events = await collect(1)
    expect(events.map((e) => e.type)).toEqual([
      'thinking',
      'tool_call',
      'tool_result',
      'thinking',
      'tool_call',
      'tool_result',
      'text_chunk',
      'text_chunk',
      'done',
    ])
    for (const event of events) {
      expect(event.id).toBeTruthy()
      expect(event.at).toBeTruthy()
    }
    const tools = events.filter((e) => e.type === 'tool_call')
    expect(tools.map((e) => (e.type === 'tool_call' ? e.tool : ''))).toEqual(['content.read', 'image.generate'])
    const imageResult = events.find((e) => e.type === 'tool_result' && e.tool === 'image.generate')
    expect(imageResult && imageResult.type === 'tool_result' ? imageResult.media : undefined).toEqual({
      kind: 'image',
      url: '/demo-images/flatlay-generated.svg',
    })
  })
})

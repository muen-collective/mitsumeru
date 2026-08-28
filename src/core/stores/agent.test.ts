import { describe, expect, it, vi } from 'vitest'

// Inject a fast mock stream into the seam the store reads at send() time.
vi.mock('../config', async () => {
  const { createMockAgentStreamAdapter } = await import('../adapters/mock/mock-agent-stream')
  return { getAdapters: () => ({ agentStream: createMockAgentStreamAdapter(5) }) }
})

import { createAgentStore } from './agent'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const SETTLED_TURN_MS = 120 // 9 events × 5ms + buffer

describe('agent store', () => {
  it('runs a turn: prompt set, events accumulate, usage + stats on done', async () => {
    const store = createAgentStore()
    store.getState().send('Generate a spring hero image for the event card.')
    expect(store.getState().streaming).toBe(true)
    expect(store.getState().events).toEqual([])

    await wait(SETTLED_TURN_MS)

    const s = store.getState()
    expect(s.streaming).toBe(false)
    expect(s.prompt).toBe('Generate a spring hero image for the event card.')
    expect(s.events.map((e) => e.type)).toEqual([
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
    expect(s.usage?.model).toBe('deepseek-v4-flash')
    expect(s.usage?.tokensIn).toBeGreaterThan(1024)
    expect(s.usage?.costUsd).toBeGreaterThan(0)
    expect(s.stats.turns).toBe(1)
    expect(s.stats.tokensTotal).toBe((s.usage?.tokensIn ?? 0) + (s.usage?.tokensOut ?? 0))
    expect(s.stats.costUsd).toBe(s.usage?.costUsd)
    expect(s.unsubscribe).toBeNull()
  })

  it('stop() halts the stream: partial events, no usage, no further appends', async () => {
    const store = createAgentStore()
    store.getState().send('Stop me')
    await wait(20) // a few events in
    store.getState().stop()
    const frozen = store.getState().events.length
    expect(store.getState().streaming).toBe(false)
    expect(frozen).toBeGreaterThan(0)
    expect(frozen).toBeLessThan(9)
    expect(store.getState().usage).toBeNull()

    await wait(30)
    expect(store.getState().events.length).toBe(frozen)
  })

  it('retry() re-sends the last prompt into a fresh turn', async () => {
    const store = createAgentStore()
    store.getState().send('First prompt')
    await wait(SETTLED_TURN_MS)
    store.getState().retry()
    expect(store.getState().prompt).toBe('First prompt')
    expect(store.getState().events).toEqual([])
    expect(store.getState().streaming).toBe(true)
    await wait(SETTLED_TURN_MS)
    expect(store.getState().streaming).toBe(false)
    expect(store.getState().stats.turns).toBe(2)
  })

  it('sending again mid-stream replaces the turn (no interleaving)', async () => {
    const store = createAgentStore()
    store.getState().send('Turn one')
    await wait(5)
    store.getState().send('Turn two')
    await wait(SETTLED_TURN_MS)
    const s = store.getState()
    expect(s.prompt).toBe('Turn two')
    expect(s.streaming).toBe(false)
    expect(s.stats.turns).toBe(1)
  })

  it('setModel and setReasoning update composer state', () => {
    const store = createAgentStore()
    store.getState().setModel('kimi-k2')
    store.getState().setReasoning('high')
    expect(store.getState().model).toBe('kimi-k2')
    expect(store.getState().reasoning).toBe('high')
  })
})

import { describe, expect, it } from 'vitest'
import { estimateTurnUsage } from './mock-agent-usage'
import type { AgentEvent } from '../../contracts/agent'

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

const ev = (partial: DistributiveOmit<AgentEvent, 'at' | 'id'>): AgentEvent =>
  ({ id: 'ev', at: new Date().toISOString(), ...partial }) as AgentEvent

describe('estimateTurnUsage', () => {
  it('derives tokens deterministically from the event payloads', () => {
    const events = [
      ev({ type: 'tool_call', tool: 'content.read', input: { a: 1 } }), // '{"a":1}' = 7 chars → 2 tokens
      ev({ type: 'text_chunk', text: 'abcd' }), // 4 chars → 1 token
      ev({ type: 'done' }),
    ]
    const usage = estimateTurnUsage(events, 'deepseek-chat')
    expect(usage).toEqual({
      tokensIn: 1026, // 1024 stable bootstrap prefix + 2
      tokensOut: 1,
      costUsd: Math.round((1026 * 0.27 + 1 * 1.1) / 1_000_000 * 1e6) / 1e6,
      model: 'deepseek-chat',
    })
    expect(usage.costUsd).toBeGreaterThan(0)
  })

  it('never emits negative or zero-cost turns for empty streams', () => {
    const usage = estimateTurnUsage([], 'kimi')
    expect(usage.tokensIn).toBe(1024)
    expect(usage.tokensOut).toBe(0)
    expect(usage.costUsd).toBeGreaterThan(0)
  })
})

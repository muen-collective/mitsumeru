import { describe, expect, it } from 'vitest'
import { reduceEvents } from './reduceEvents'
import type { AgentEvent } from '@/core/contracts/agent'

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

const ev = (partial: DistributiveOmit<AgentEvent, 'at' | 'id'> & { id?: string }): AgentEvent =>
  ({ id: `ev-${Math.random().toString(36).slice(2)}`, at: new Date().toISOString(), ...partial }) as AgentEvent

const HAPPY: AgentEvent[] = [
  ev({ type: 'thinking', text: 'Reading…' }),
  ev({ type: 'tool_call', tool: 'content.read', input: { path: 'index.json' } }),
  ev({ type: 'tool_result', tool: 'content.read', ok: true, summary: '3 sections' }),
  ev({ type: 'thinking', text: 'Drafting…' }),
  ev({ type: 'tool_call', tool: 'image.generate', input: { prompt: 'hero' } }),
  ev({
    type: 'tool_result',
    tool: 'image.generate',
    ok: true,
    summary: 'flatlay.svg',
    media: { kind: 'image', url: '/demo-images/flatlay-generated.svg' },
  }),
  ev({ type: 'text_chunk', text: 'Hero generated.' }),
  ev({ type: 'text_chunk', text: ' Preview it.' }),
  ev({ type: 'done' }),
]

describe('reduceEvents', () => {
  it('renders the settled turn: thinking blocks, tool rows, text, done terminal', () => {
    const items = reduceEvents(HAPPY, false)
    expect(items.map((i) => i.kind)).toEqual([
      'thinking',
      'tool',
      'thinking',
      'tool',
      'text',
      'terminal',
    ])
    expect(items[0]).toMatchObject({ kind: 'thinking', steps: [{ label: 'Reading…', status: 'done' }] })
    const tools = items.filter((i) => i.kind === 'tool')
    expect(tools[0]).toMatchObject({ tool: 'content.read', status: 'done', summary: '3 sections' })
    expect(tools[1]).toMatchObject({
      tool: 'image.generate',
      status: 'done',
      media: { kind: 'image', url: '/demo-images/flatlay-generated.svg' },
    })
    expect(items.find((i) => i.kind === 'text')).toMatchObject({
      text: 'Hero generated. Preview it.',
    })
    expect(items[items.length - 1]).toMatchObject({ kind: 'terminal', state: 'done' })
  })

  it('marks the preceding thinking block done when its tool resolves', () => {
    const items = reduceEvents(HAPPY.slice(0, 3), false)
    expect(items[0]).toMatchObject({ steps: [{ label: 'Reading…', status: 'done' }] })
  })

  it('keeps the open thinking step active while streaming', () => {
    const items = reduceEvents(HAPPY.slice(0, 1), true)
    expect(items[0]).toMatchObject({ steps: [{ label: 'Reading…', status: 'active' }] })
  })

  it('marks tool calls active while streaming, pending when idle', () => {
    expect(reduceEvents(HAPPY.slice(1, 2), true)[0]).toMatchObject({ status: 'active' })
    expect(reduceEvents(HAPPY.slice(1, 2), false)[0]).toMatchObject({ status: 'pending' })
  })

  it('marks a failed tool_result and resolves its thinking block', () => {
    const failed = [
      ev({ type: 'thinking', text: 'Generating…' }),
      ev({ type: 'tool_call', tool: 'image.generate', input: {} }),
      ev({ type: 'tool_result', tool: 'image.generate', ok: false, summary: 'billing not configured' }),
      ev({ type: 'error', message: 'image.generate failed — check the provider key.' }),
    ]
    const items = reduceEvents(failed, false)
    expect(items[1]).toMatchObject({ kind: 'tool', status: 'failed', summary: 'billing not configured' })
    expect(items[0]).toMatchObject({ steps: [{ status: 'done' }] })
    expect(items[items.length - 1]).toMatchObject({ kind: 'terminal', state: 'error', message: expect.stringContaining('check the provider key') })
  })

  it('adds a stopped terminal for an interrupted turn with content', () => {
    const items = reduceEvents(HAPPY.slice(0, 3), false)
    expect(items[items.length - 1]).toMatchObject({ kind: 'terminal', state: 'stopped' })
  })

  it('stays empty for a bare idle state', () => {
    expect(reduceEvents([], false)).toEqual([])
  })

  it('does not double-terminate when streaming ends after done', () => {
    const items = reduceEvents(HAPPY, true)
    expect(items.filter((i) => i.kind === 'terminal')).toHaveLength(1)
  })
})

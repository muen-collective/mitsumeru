// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

// Fast mock stream into the seam (5ms interval → a turn settles in ~50ms);
// the rest of the adapter surface stays the real mocks (providers list etc.).
vi.mock('@/core/config', async () => {
  const { mockAdapters } = await import('@/core/adapters/mock')
  const { createMockAgentStreamAdapter } = await import('@/core/adapters/mock/mock-agent-stream')
  return {
    getAdapters: () => ({
      ...mockAdapters(),
      agentStream: createMockAgentStreamAdapter(5),
    }),
  }
})

// Radix ScrollArea needs ResizeObserver; jsdom lacks it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

import AgentLoop from './AgentLoop'
import { useAgentStore } from '@/core/stores/agent'
import type { AgentEvent } from '@/core/contracts/agent'

afterEach(() => {
  cleanup()
  useAgentStore.setState({
    prompt: null,
    events: [],
    streaming: false,
    usage: null,
    stats: { tokensTotal: 0, costUsd: 0, cachePct: 94, turns: 0, tokPerSec: 102.5 },
  })
})

describe('AgentLoop', () => {
  it('renders the idle state', () => {
    render(<AgentLoop />)
    expect(screen.getByText('Ask Mitsu anything')).toBeTruthy()
    expect(screen.getByText('Mitsu')).toBeTruthy()
  })

  it('shows the fileTree toggle (left of the chat icon) when wired', () => {
    render(<AgentLoop panelOpen onTogglePanel={() => {}} />)
    const toggle = screen.getByRole('button', { name: /toggle file tree/i })
    expect(toggle).toBeTruthy()
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    // Without the workspace wiring the header stays icon-only.
    cleanup()
    render(<AgentLoop />)
    expect(screen.queryByRole('button', { name: /toggle file tree/i })).toBeNull()
  })

  it('runs a full turn: thinking, tool rows, media, done + cost, stats row', async () => {
    render(<AgentLoop />)
    fireEvent.change(screen.getByPlaceholderText(/Generate a spring hero image/), {
      target: { value: 'Generate a spring hero image for the event card.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    // User bubble + assistant header.
    expect(await screen.findByText('Generate a spring hero image for the event card.')).toBeTruthy()

    // Thinking disclosure resolves to the thought-process label.
    expect(await screen.findByText('Thought process', {}, { timeout: 3000 })).toBeTruthy()

    // Tool rows in settled order (row + status chip both carry the name).
    expect((await screen.findAllByText('content.read')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('image.generate')).length).toBeGreaterThan(0)

    // Generated media renders inline.
    const img = (await screen.findByAltText('image.generate result')) as HTMLImageElement
    expect(img.src).toContain('/demo-images/flatlay-generated.svg')

    // Done terminal with per-turn cost (also mirrored in the stats row).
    expect(await screen.findByText(/Done/)).toBeTruthy()
    expect((await screen.findAllByText(/\$0\.00/)).length).toBeGreaterThan(0)

    // Session stats row (cache is provider-reported in the mock).
    expect(await screen.findByText(/tokens/)).toBeTruthy()
    expect(await screen.findByText(/cache 94%/)).toBeTruthy()
    expect(await screen.findByText(/258|turns/)).toBeTruthy()
  })

  it('shows the failed-turn alert with Retry when the stream errors', async () => {
    useAgentStore.setState({
      prompt: 'Generate an image.',
      events: [
        { type: 'thinking', id: 'e1', text: 'Generating…', at: new Date().toISOString() },
        { type: 'tool_call', id: 'e2', tool: 'image.generate', input: {}, at: new Date().toISOString() },
        {
          type: 'tool_result',
          id: 'e3',
          tool: 'image.generate',
          ok: false,
          summary: 'Generation failed: billing not configured',
          at: new Date().toISOString(),
        },
        {
          type: 'error',
          id: 'e4',
          message: 'image.generate failed — check the provider key in Settings.',
          at: new Date().toISOString(),
        },
      ] as AgentEvent[],
      streaming: false,
    })
    render(<AgentLoop />)
    expect(await screen.findByText('Turn failed')).toBeTruthy()
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
    expect(screen.getByText(/check the provider key/)).toBeTruthy()
    // The failed summary lives in the collapsed tool detail — assert the
    // open-state signal (failed tool row) instead of the hidden panel.
    expect(screen.getByText('failed')).toBeTruthy()
  })

  it('stops a running turn when Stop is pressed', async () => {
    render(<AgentLoop />)
    fireEvent.change(screen.getByPlaceholderText(/Generate a spring hero image/), {
      target: { value: 'Stop me' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    const stop = await screen.findByRole('button', { name: /stop/i })
    fireEvent.click(stop)
    await waitFor(() => expect(screen.getByRole('button', { name: /send/i })).toBeTruthy())
    expect(useAgentStore.getState().streaming).toBe(false)
  })
})

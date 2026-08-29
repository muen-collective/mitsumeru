import { create } from 'zustand'
import { getAdapters } from '../config'
import type { AgentEvent } from '../contracts/agent'
import { estimateTurnUsage, type TurnUsage } from '../adapters/mock/mock-agent-usage'

export type ReasoningLevel = 'off' | 'low' | 'medium' | 'high'

export interface AgentStats {
  /** Session tokens (in + out), formatted in the UI. */
  tokensTotal: number
  /** Session USD cost. */
  costUsd: number
  /** Provider-reported prompt cache hit rate (null for local adapters). */
  cachePct: number | null
  /** Turns in this session. */
  turns: number
  /** Generation speed, tokens/sec. */
  tokPerSec: number
}

export interface AgentStore {
  /** The user's prompt for the current turn (null on idle). */
  prompt: string | null
  /** SSE-shaped events of the current turn, in arrival order. */
  events: AgentEvent[]
  /** True while the stream is live. */
  streaming: boolean
  /** Per-turn usage — set when the turn ends (cost transparency). */
  usage: TurnUsage | null
  /** Session aggregate (WalletMeter). */
  stats: AgentStats
  /** Composer state (store-owned per the Block #4 contract). */
  model: string
  reasoning: ReasoningLevel
  lastPrompt: string | null
  /** Active stream subscription (adapter unsubscribe). */
  unsubscribe: (() => void) | null
  send: (text: string) => void
  stop: () => void
  retry: () => void
  setModel: (model: string) => void
  setReasoning: (level: ReasoningLevel) => void
}

const INITIAL_STATS: AgentStats = {
  tokensTotal: 0,
  costUsd: 0,
  cachePct: 94,
  turns: 0,
  tokPerSec: 102.5,
}

export function createAgentStore() {
  return create<AgentStore>((set, get) => ({
    prompt: null,
    events: [],
    streaming: false,
    usage: null,
    stats: INITIAL_STATS,
    model: 'deepseek-v4-flash',
    reasoning: 'off',
    lastPrompt: null,
    unsubscribe: null,

    send(text) {
      get().unsubscribe?.()
      const trimmed = text.trim()
      set({ prompt: trimmed, lastPrompt: trimmed, events: [], streaming: true, usage: null })
      const unsub = getAdapters().agentStream.subscribe((event) => {
        const events = [...get().events, event]
        set({ events })
        if (event.type === 'done') {
          const usage = estimateTurnUsage(events, get().model)
          const stats = get().stats
          set({
            usage,
            streaming: false,
            stats: {
              ...stats,
              tokensTotal: stats.tokensTotal + usage.tokensIn + usage.tokensOut,
              costUsd: Math.round((stats.costUsd + usage.costUsd) * 1e6) / 1e6,
              turns: stats.turns + 1,
            },
          })
          unsub()
          set({ unsubscribe: null })
        } else if (event.type === 'error') {
          set({ streaming: false })
          unsub()
          set({ unsubscribe: null })
        }
      })
      set({ unsubscribe: unsub })
    },

    stop() {
      get().unsubscribe?.()
      set({ streaming: false, unsubscribe: null })
    },

    retry() {
      const last = get().lastPrompt
      if (last) get().send(last)
    },

    setModel(model) {
      set({ model })
    },

    setReasoning(reasoning) {
      set({ reasoning })
    },
  }))
}

export const useAgentStore = createAgentStore()

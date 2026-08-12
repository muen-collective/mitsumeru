/**
 * Mock turn usage (UI lane) — the mock agent stream yields events only;
 * the wallet meter needs per-turn usage. Deterministic estimate from the
 * event payloads so tests can assert exact numbers. The real adapter gets
 * usage from the provider response (WalletMeter.record).
 */
import type { AgentEvent } from '../../contracts/agent'

export interface TurnUsage {
  /** Tokens read this turn (WalletMeter `tokensIn`). */
  tokensIn: number
  /** Tokens generated this turn (WalletMeter `tokensOut`). */
  tokensOut: number
  /** USD cost of this turn. */
  costUsd: number
  /** Model that ran the turn. */
  model: string
}

/** DeepSeek-ish BYOK rates (per 1M tokens) — mock constants, not real billing. */
const RATE_IN = 0.27
const RATE_OUT = 1.1

export function estimateTurnUsage(events: AgentEvent[], model: string): TurnUsage {
  const tokensOut = events
    .filter((e): e is Extract<AgentEvent, { type: 'text_chunk' }> => e.type === 'text_chunk')
    .reduce((sum, e) => sum + Math.ceil(e.text.length / 4), 0)
  const tokensIn =
    1024 + // stable bootstrap prefix (cache-friendly, architecture doc §prefix hygiene)
    events
      .filter((e): e is Extract<AgentEvent, { type: 'tool_call' }> => e.type === 'tool_call')
      .reduce((sum, e) => sum + Math.ceil(JSON.stringify(e.input).length / 4), 0)
  const costUsd = (tokensIn * RATE_IN + tokensOut * RATE_OUT) / 1_000_000
  return { tokensIn, tokensOut, costUsd: Math.round(costUsd * 1e6) / 1e6, model }
}

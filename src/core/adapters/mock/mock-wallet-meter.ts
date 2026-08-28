/**
 * Mock wallet meter (UI lane) — meters usage, never credits (epic 10 §6,
 * monetization doc L61). Seeded with a few records so the cost status bar
 * has data; `record()` appends and recomputes totals.
 */
import type { WalletAdapter } from '../ports'
import type { UsageRecord, WalletMeterState } from '../../contracts/wallet'

let seq = 0
const nextId = () => `usage-${++seq}`

/** Seed records dated today (hours ago) so the cost bar shows a non-zero today. */
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

const SEED: UsageRecord[] = [
  {
    id: 'usage-1',
    providerId: 'deepseek',
    keyId: 'key-deepseek',
    modelId: 'deepseek-v4-flash',
    tokensIn: 4200,
    tokensOut: 860,
    costUsd: 0.031,
    at: hoursAgo(2),
  },
  {
    id: 'usage-2',
    providerId: 'deepseek',
    keyId: 'key-deepseek',
    modelId: 'deepseek-v4-flash',
    tokensIn: 2100,
    tokensOut: 340,
    costUsd: 0.014,
    at: hoursAgo(1),
  },
]

export function createMockWalletAdapter(balanceUsd?: number): WalletAdapter {
  let records: UsageRecord[] = [...SEED]

  const compute = (): WalletMeterState => {
    const totalCostUsd = records.reduce((sum, r) => sum + r.costUsd, 0)
    const today = new Date().toISOString().slice(0, 10)
    const todayCostUsd = records
      .filter((r) => r.at.slice(0, 10) === today)
      .reduce((sum, r) => sum + r.costUsd, 0)
    const lowBalance = balanceUsd !== undefined && balanceUsd < 1
    return { records, todayCostUsd, totalCostUsd, lowBalance, ...(balanceUsd !== undefined ? { balanceUsd } : {}) }
  }

  return {
    async getState() {
      return compute()
    },
    async record(usage) {
      const record: UsageRecord = { ...usage, id: nextId() }
      records = [...records, record]
      return record
    },
  }
}

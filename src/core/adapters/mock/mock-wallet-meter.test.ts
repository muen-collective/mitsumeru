import { describe, expect, it } from 'vitest'
import { createMockWalletAdapter } from './mock-wallet-meter'

describe('mock wallet meter', () => {
  it('records usage and recomputes totals — meters, never credits', async () => {
    const adapter = createMockWalletAdapter()
    const before = await adapter.getState()
    expect(before.records.length).toBeGreaterThan(0)
    expect(before).not.toHaveProperty('balanceUsd') // BYOK: no wallet balance

    const record = await adapter.record({
      providerId: 'deepseek',
      keyId: 'key-deepseek',
      modelId: 'deepseek-v4-flash',
      tokensIn: 1000,
      tokensOut: 500,
      costUsd: 0.01,
      at: new Date().toISOString(),
    })
    expect(record.id).toBeTruthy()

    const after = await adapter.getState()
    expect(after.records).toHaveLength(before.records.length + 1)
    expect(after.totalCostUsd).toBeCloseTo(before.totalCostUsd + 0.01, 6)
    expect(after.records.every((r) => typeof r.costUsd === 'number')).toBe(true)
  })

  it('flags low balance only for the managed-client wallet', async () => {
    const managed = createMockWalletAdapter(0.5)
    const state = await managed.getState()
    expect(state.balanceUsd).toBe(0.5)
    expect(state.lowBalance).toBe(true)
  })
})

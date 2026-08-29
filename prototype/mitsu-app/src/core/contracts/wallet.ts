/**
 * WalletMeter v0 — cost status bar, low-balance notice (Blocks #1/#5).
 * Meters usage (tokens in/out, cost per key/turn) — never "credits"
 * (monetization doc L61). Cost model: (tokens read + tokens generated) ×
 * price/token per turn.
 */
export interface UsageRecord {
  id: string
  providerId: string
  keyId: string
  modelId: string
  tokensIn: number
  tokensOut: number
  costUsd: number
  /** ISO timestamp. */
  at: string
}

export interface WalletMeterState {
  records: UsageRecord[]
  todayCostUsd: number
  totalCostUsd: number
  lowBalance: boolean
  /** Managed-client prepaid wallet only (pilot, epic 07) — absent in BYOK self-serve. */
  balanceUsd?: number
}

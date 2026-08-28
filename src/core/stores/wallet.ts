/**
 * Wallet store (thin) — cost status line for the provider panel (Block #1);
 * full cost status bar lands with Block #5. Meters usage, never credits.
 */
import { create } from 'zustand'
import { getAdapters } from '../config'
import type { WalletMeterState } from '../contracts/wallet'

export interface WalletState {
  meter: WalletMeterState | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  load(): Promise<void>
}

export function createWalletStore() {
  return create<WalletState>()((set) => ({
    meter: null,
    status: 'idle',
    async load() {
      set({ status: 'loading' })
      const meter = await getAdapters().wallet.getState()
      set({ meter, status: 'ready' })
    },
  }))
}

export const useWalletStore = createWalletStore()

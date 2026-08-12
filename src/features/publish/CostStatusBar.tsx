'use client'

import { useEffect } from 'react'
import { useWalletStore } from '@/core/stores/wallet'

/**
 * Cost status bar — Block #5. Meters usage (never credits): today + total
 * spend, BYOK note, and a low-balance indicator for the managed-client
 * wallet (pilot, epic 07). Status colors only as dots — never as text.
 */
export function CostStatusBar() {
  const meter = useWalletStore((s) => s.meter)
  const load = useWalletStore((s) => s.load)

  useEffect(() => {
    load()
  }, [load])

  if (!meter) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-success" />
        Today · ${meter.todayCostUsd.toFixed(3)} USD
      </span>
      <span className="flex items-center gap-1.5">
        {meter.lowBalance && meter.balanceUsd !== undefined && (
          <>
            <span className="size-1.5 rounded-full bg-warning" />
            Low balance · ${meter.balanceUsd.toFixed(2)} left
          </>
        )}
        Total · ${meter.totalCostUsd.toFixed(3)} USD · BYOK — keys stay on this device
      </span>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { getAdapters } from '@/core/config'
import type { ProviderPreset } from '@/core/contracts/provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'

const CUSTOM_PRESET: ProviderPreset = {
  id: 'custom',
  name: 'Custom',
  description: 'Your own endpoint.',
  endpoint: { format: 'custom', baseUrl: '' },
  capabilities: ['chat'],
  models: [],
}

interface AddProviderDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  existingIds: string[]
  onAdd(preset: ProviderPreset): void
}

/** Add-provider dialog — catalog presets + Ollama (local) + Custom (DESIGN.md §Provider panel). */
export function AddProviderDialog({ open, onOpenChange, existingIds, onAdd }: AddProviderDialogProps) {
  const [presets, setPresets] = useState<ProviderPreset[]>([])

  useEffect(() => {
    if (!open) return
    let alive = true
    getAdapters()
      .providers.listPresets()
      .then((list) => {
        if (alive) setPresets(list)
      })
    return () => {
      alive = false
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Add a provider</DialogTitle>
        <DialogDescription>
          Providers take an API key. Ollama and Custom need no account.
        </DialogDescription>
        <div className="mt-2 flex max-h-[300px] flex-col gap-1.5 overflow-y-auto pr-1">
          {presets.map((p) => {
            const added = existingIds.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                disabled={added}
                onClick={() => onAdd(p)}
                className="rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/30 hover:bg-muted/60 disabled:cursor-default disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-transparent"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{p.name}</span>
                  {added && (
                    <span className="text-[0.65rem] font-medium text-success">Added</span>
                  )}
                </div>
                <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {p.description}
                </div>
              </button>
            )
          })}
        </div>
        <DialogFooter className="justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
              onClick={() => {
                const ollama = presets.find((p) => p.id === 'ollama')
                if (ollama) onAdd(ollama)
              }}
            >
              Ollama (local)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
              onClick={() => onAdd(CUSTOM_PRESET)}
            >
              Custom
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

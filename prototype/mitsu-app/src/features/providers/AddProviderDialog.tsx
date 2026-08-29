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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ADD_MODEL_CATEGORIES, ENTRY_TO_PRESET, type AddModelEntry } from './addModelCatalog'

const CUSTOM_PRESET: ProviderPreset = {
  id: 'custom',
  name: 'Custom',
  description: 'Your own endpoint.',
  endpoint: { format: 'custom', baseUrl: '' },
  capabilities: ['chat'],
  models: [],
  keyMode: 'api',
}

/** Entry with no registry preset becomes an editable custom stub. */
const stubFor = (entry: AddModelEntry): ProviderPreset => ({
  id: entry.id,
  name: entry.name,
  description: entry.desc,
  endpoint: { format: 'custom', baseUrl: '' },
  capabilities: ['chat'],
  models: [],
  keyMode: 'api',
  setupApiUrl: entry.setupApiUrl,
})

interface AddProviderDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  existingIds: string[]
  onAdd(preset: ProviderPreset): void
}

/** Add-provider dialog — category tabs (Starter packs / Open Source / Frontier /
 * Creative), matching the settled prototype (patterns-settings). */
export function AddProviderDialog({ open, onOpenChange, existingIds, onAdd }: AddProviderDialogProps) {
  const [presets, setPresets] = useState<ProviderPreset[]>([])
  const [categoryId, setCategoryId] = useState('starter-packs')
  const [packUsed, setPackUsed] = useState(false)

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

  const entryAdded = (entry: AddModelEntry): boolean => {
    if (entry.id === 'fashion-pack') return packUsed
    const target = ENTRY_TO_PRESET[entry.id] ?? entry.id
    return existingIds.includes(target)
  }

  /** Same business logic as the settled prototype: packs add curated bundles;
   * entries with a preset add a real provider; anything else becomes a stub. */
  const handlePick = (entry: AddModelEntry) => {
    if (entry.comingSoon) return
    if (entry.id === 'fashion-pack') {
      setPackUsed(true)
      const krea = presets.find((p) => p.id === 'krea')
      const deepseek = presets.find((p) => p.id === 'deepseek')
      if (krea) onAdd(krea)
      if (deepseek) onAdd(deepseek)
      return
    }
    const target = ENTRY_TO_PRESET[entry.id] ?? entry.id
    const preset = presets.find((p) => p.id === target)
    if (preset) {
      onAdd(preset)
      return
    }
    onAdd(stubFor(entry))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Add a provider</DialogTitle>
        <DialogDescription>
          Starter packs need no accounts — curated bundles for your use case.
          Providers take an API key.
        </DialogDescription>
        <Tabs value={categoryId} onValueChange={setCategoryId} className="mt-2">
          <TabsList className="w-full">
            {ADD_MODEL_CATEGORIES.map((c) => (
              <TabsTrigger key={c.id} value={c.id} className="text-xs">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {ADD_MODEL_CATEGORIES.map((c) => (
            <TabsContent key={c.id} value={c.id} className="mt-2 max-h-[300px] overflow-y-auto pr-1">
              <div className="flex flex-col gap-1.5">
                {c.entries.map((entry) => {
                  const added = entryAdded(entry)
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      disabled={!!entry.comingSoon || added}
                      onClick={() => handlePick(entry)}
                      className="rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/30 hover:bg-muted/60 disabled:cursor-default disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-transparent"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{entry.name}</span>
                        {entry.comingSoon ? (
                          <span className="text-[0.65rem] font-medium text-muted-foreground">
                            Coming soon
                          </span>
                        ) : added ? (
                          <span className="text-[0.65rem] font-medium text-success">Added</span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {entry.desc}
                      </div>
                    </button>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <DialogFooter className="justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
              onClick={() => {
                const local = presets.find((p) => p.id === 'lm-studio')
                if (local) onAdd(local)
              }}
            >
              LM Studio (local)
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

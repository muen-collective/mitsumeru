import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProviderConfig } from '@/core/contracts/provider'

interface ProviderListProps {
  providers: ProviderConfig[]
  selectedId: string
  onSelect(id: string): void
  onAdd(): void
}

const inUseCount = (p: ProviderConfig) => p.models.filter((m) => m.kept).length

/** Left column — provider list + Add provider (DESIGN.md §Provider panel). */
export function ProviderList({ providers, selectedId, onSelect, onAdd }: ProviderListProps) {
  return (
    <div className="w-[220px] shrink-0 space-y-3 p-4">
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5 border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
        onClick={onAdd}
      >
        <Plus className="size-3.5" aria-hidden="true" /> Add provider
      </Button>
      {providers.map((p) => {
        const active = p.id === selectedId
        const inUse = inUseCount(p)
        return (
          <button
            key={p.id}
            type="button"
            className={`relative w-full rounded-lg p-3 text-left transition-colors ${
              active ? 'bg-primary/5' : 'hover:bg-muted/60'
            }`}
            onClick={() => onSelect(p.id)}
          >
            <div className="text-sm font-medium">{p.name}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={`size-1.5 flex-none rounded-full ${inUse > 0 ? 'bg-success' : 'bg-muted-foreground/40'}`}
              />
              {inUse > 0 ? `In use · ${inUse} ${inUse === 1 ? 'model' : 'models'}` : 'Not in use'}
            </div>
            {p.keyStatus === 'valid' && (
              <span
                className="absolute right-3 top-3 size-1.5 rounded-full bg-primary"
                title="Key added"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

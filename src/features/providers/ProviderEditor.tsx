'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ENDPOINT_FORMATS } from './endpointFormats'
import type { ProviderCapability, ProviderConfig } from '@/core/contracts/provider'

export type PanelTab = 'connection' | 'model' | 'advanced'
export interface TestResult {
  ok: boolean
  msg: string
}

interface ProviderEditorProps {
  provider: ProviderConfig
  panelTab: PanelTab
  onPanelTabChange(tab: PanelTab): void
  apiKey: string
  onApiKeyChange(value: string): void
  baseUrl: string
  onBaseUrlChange(value: string): void
  format: string
  onFormatChange(formatId: string): void
  testing: boolean
  onTest(): void
  testResult: TestResult | null
  activeCap: ProviderCapability
  onActiveCapChange(cap: ProviderCapability): void
  modelSearch: string
  onModelSearchChange(value: string): void
  onSetDefault(modelId: string): void
  onToggleKeep(modelId: string): void
  onPullModels(): void
  onRequestRemove(): void
}

const CAP_LABELS: Record<ProviderCapability, string> = {
  chat: 'Chat',
  reasoning: 'Reasoning',
  image: 'Image',
  video: 'Video',
  '3d': '3D',
}

const spinner = <span className="size-3 animate-spin rounded-full border-2 border-input border-t-primary" />

/** Right column — editor form (connection / model / advanced). */
export function ProviderEditor(props: ProviderEditorProps) {
  const {
    provider,
    panelTab,
    onPanelTabChange,
    apiKey,
    onApiKeyChange,
    baseUrl,
    onBaseUrlChange,
    format,
    onFormatChange,
    testing,
    onTest,
    testResult,
    activeCap,
    onActiveCapChange,
    modelSearch,
    onModelSearchChange,
    onSetDefault,
    onToggleKeep,
    onPullModels,
    onRequestRemove,
  } = props

  const fetchedModels = provider.models.filter((m) => m.capability === activeCap)
  const keptModels = fetchedModels.filter((m) => m.kept)
  const shownModels = fetchedModels.filter(
    (m) => !modelSearch.trim() || m.id.toLowerCase().includes(modelSearch.trim().toLowerCase()),
  )
  const recommendedDefault =
    provider.models.find((m) => m.capability === 'chat' && m.kept) ??
    provider.models.find((m) => m.capability === 'chat')

  const formatDef = ENDPOINT_FORMATS.find((f) => f.id === format)

  return (
    <div className="min-w-0 flex-1 p-4">
      <Tabs value={panelTab} onValueChange={(v) => onPanelTabChange(v as PanelTab)} className="mb-4">
        <div className="flex items-center justify-between">
          <TabsList variant="line">
            {(['connection', 'model', 'advanced'] as const).map((t) => (
              <TabsTrigger key={t} value={t} color="tertiary" className="text-[12.5px]">
                {t[0].toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <span className="text-xs text-muted-foreground">Keys stay on this device</span>
        </div>
      </Tabs>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">{provider.name}</h3>
        {provider.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{provider.description}</p>
        )}
      </div>

      {panelTab === 'connection' && (
        <>
          <div className="mb-3">
            <label className="mb-1.5 block text-sm font-medium">API key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                className="flex-1"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                aria-label="API key"
                aria-invalid={testResult !== null && !testResult.ok}
              />
              <Button
                variant="outline"
                size="sm"
                className="border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
                disabled={testing}
                onClick={onTest}
              >
                {testing ? (
                  <>
                    {spinner} Testing…
                  </>
                ) : (
                  'Test connection'
                )}
              </Button>
            </div>
            {testResult && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className={`size-1.5 flex-none rounded-full ${testResult.ok ? 'bg-success' : 'bg-destructive'}`}
                />
                {testResult.msg}
              </p>
            )}
          </div>

          {provider.kind === 'custom' ? (
            <>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium">Base URL</label>
                <Input
                  className="w-full font-mono"
                  value={baseUrl}
                  onChange={(e) => onBaseUrlChange(e.target.value)}
                  aria-label="Base URL"
                />
              </div>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium">Endpoint format</label>
                <Select value={format} onValueChange={(v) => v && onFormatChange(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENDPOINT_FORMATS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                        {f.path && (
                          <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                            {f.path}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formatDef?.path ? (
                  <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                    POST {formatDef.base || baseUrl}
                    {formatDef.path}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Enter a custom base URL below.
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium">Base URL</label>
                <div className="rounded-md border border-border bg-muted px-2.5 py-2 font-mono text-sm text-foreground">
                  {provider.endpoint.baseUrl}
                </div>
              </div>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium">Endpoint format</label>
                <div className="text-sm text-foreground">
                  {formatDef?.label ?? 'Custom'}
                  {formatDef?.path && (
                    <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                      {formatDef.path}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {recommendedDefault && (
            <Button
              variant="outline"
              size="xs"
              className="border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
              onClick={() => onSetDefault(recommendedDefault.id)}
            >
              Set default · {recommendedDefault.name ?? recommendedDefault.id}
            </Button>
          )}
        </>
      )}

      {panelTab === 'model' && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <Tabs value={activeCap} onValueChange={(v) => onActiveCapChange(v as ProviderCapability)}>
              <TabsList>
                {provider.capabilities.map((cap) => (
                  <TabsTrigger key={cap} value={cap} className="text-xs">
                    {CAP_LABELS[cap]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-foreground" onClick={onPullModels}>
              <RefreshCw className="size-3" aria-hidden="true" />
              {provider.modelsFetched ? 'Fetch again' : 'Pull models'}
            </Button>
          </div>

          <Input
            type="text"
            value={modelSearch}
            onChange={(e) => onModelSearchChange(e.target.value)}
            placeholder={provider.modelsFetched ? 'Filter models…' : 'Pull models first, then choose which to keep.'}
            disabled={!provider.modelsFetched}
            className="mb-2 text-xs"
            aria-label="Filter models"
          />

          <div className="mb-4 min-h-[120px] rounded-lg border border-border bg-muted/30 p-3">
            {!provider.modelsFetched ? (
              <p className="text-sm text-muted-foreground">
                Pull models first, then choose which to keep.
              </p>
            ) : fetchedModels.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No {CAP_LABELS[activeCap].toLowerCase()} models in this preset.
              </p>
            ) : shownModels.length === 0 ? (
              <p className="text-sm text-muted-foreground">No models match the filter.</p>
            ) : (
              <div className="space-y-1.5">
                {shownModels.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-md bg-background px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <button
                        type="button"
                        className={`text-xs ${
                          provider.defaultModelId === m.id
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => onSetDefault(m.id)}
                        title="Set as default model"
                        aria-label={`Set ${m.id} as default`}
                      >
                        ★
                      </button>
                      <span className="truncate font-mono text-sm">{m.id}</span>
                      {provider.defaultModelId === m.id && (
                        <span className="shrink-0 text-[10px] font-medium text-foreground">
                          default
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={m.kept}
                      onCheckedChange={() => onToggleKeep(m.id)}
                      size="sm"
                      aria-label={`Keep ${m.id}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          {provider.modelsFetched && (
            <p className="text-xs text-muted-foreground">
              {keptModels.length} of {fetchedModels.length} {CAP_LABELS[activeCap].toLowerCase()}{' '}
              models enabled
            </p>
          )}
        </>
      )}

      {panelTab === 'advanced' && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
          <div className="text-sm font-semibold text-foreground">Remove provider</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Deletes the key from this device and stops routing to it.
          </p>
          <Button variant="destructive" size="sm" className="mt-3" onClick={onRequestRemove}>
            Remove {provider.name}
          </Button>
        </div>
      )}
    </div>
  )
}

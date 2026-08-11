'use client'

import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { PROVIDER_CAPABILITIES, type ProviderConfig, type ProviderPreset } from '@/core/contracts/provider'
import { useProvidersStore } from '@/core/stores/providers'
import { useWalletStore } from '@/core/stores/wallet'
import { AddProviderDialog } from './AddProviderDialog'
import { ProviderEditor, type PanelTab, type TestResult } from './ProviderEditor'
import { ProviderList } from './ProviderList'

/** Effective capability tabs — declared caps first, then derived from models. */
const capsOf = (p: ProviderConfig) => {
  if (p.capabilities.length > 0) return p.capabilities
  const derived = [...new Set(p.models.map((m) => m.capability))]
  return derived.length > 0 ? derived : [...PROVIDER_CAPABILITIES]
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Provider settings panel — Block #1 (story: Patterns/Mitsu provider panel).
 * Split layout: provider list left, editor right. Reads/writes through the
 * mock seam (stores → adapters); key material never lives in UI state — the
 * key input is a transient field passed to the keychain adapter.
 */
export function ProviderPanel() {
  const providers = useProvidersStore((s) => s.providers)
  const load = useProvidersStore((s) => s.load)
  const patchProvider = useProvidersStore((s) => s.patchProvider)
  const setDefaultModel = useProvidersStore((s) => s.setDefaultModel)
  const toggleKeepModel = useProvidersStore((s) => s.toggleKeepModel)
  const pullModels = useProvidersStore((s) => s.pullModels)
  const saveKey = useProvidersStore((s) => s.saveKey)
  const addFromPreset = useProvidersStore((s) => s.addFromPreset)
  const removeProvider = useProvidersStore((s) => s.removeProvider)

  const meter = useWalletStore((s) => s.meter)
  const walletLoad = useWalletStore((s) => s.load)

  const [selectedId, setSelectedId] = useState<string>('')
  const [panelTab, setPanelTab] = useState<PanelTab>('connection')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [format, setFormat] = useState('openai')
  const [activeCap, setActiveCap] = useState<(typeof PROVIDER_CAPABILITIES)[number]>('chat')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [modelSearch, setModelSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    load().then(() => {
      // Select the first provider once loaded (async so no sync setState in effect)
      const first = useProvidersStore.getState().providers[0]
      if (alive && first) setSelectedId(first.id)
    })
    walletLoad()
    return () => {
      alive = false
    }
  }, [load, walletLoad])

  const selected = providers.find((p) => p.id === selectedId) ?? providers[0] ?? null

  const selectProvider = (id: string) => {
    const p = providers.find((x) => x.id === id)
    if (!p) return
    setSelectedId(id)
    setApiKey('')
    setBaseUrl(p.endpoint.baseUrl)
    setFormat(p.endpoint.format)
    setActiveCap(capsOf(p)[0] ?? 'chat')
    setPanelTab('connection')
    setTestResult(null)
  }

  const handleTest = async () => {
    if (!selected) return
    if (selected.status === 'local') {
      setTestResult({ ok: true, msg: 'Local endpoint — no key needed.' })
      return
    }
    if (!apiKey.trim()) {
      setTestResult({ ok: false, msg: 'Enter an API key first.' })
      return
    }
    setTesting(true)
    setTestResult(null)
    await sleep(400)
    const status = await saveKey(selected.id, apiKey)
    setTesting(false)
    setTestResult(
      status === 'valid'
        ? { ok: true, msg: 'Connected — key works.' }
        : { ok: false, msg: 'Connection failed — check the key and try again.' },
    )
  }

  const handleAdd = (preset: ProviderPreset) => {
    const added = addFromPreset(preset)
    setShowAdd(false)
    selectProvider(added.id)
  }

  const confirmRemove = () => {
    if (!removeId) return
    removeProvider(removeId)
    setRemoveId(null)
    const remaining = providers.filter((p) => p.id !== removeId)
    if (remaining.length > 0) selectProvider(remaining[0].id)
    else setSelectedId('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-semibold">Providers</h2>
        <span className="mt-0.5 text-xs text-muted-foreground">Your keys, your models</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Add a provider, then pull and curate its model list per capability.
      </p>

      <div className="flex rounded-lg border border-border bg-card">
        <ProviderList
          providers={providers}
          selectedId={selected?.id ?? ''}
          onSelect={selectProvider}
          onAdd={() => setShowAdd(true)}
        />
        {selected ? (
          <ProviderEditor
            provider={selected}
            panelTab={panelTab}
            onPanelTabChange={setPanelTab}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            baseUrl={baseUrl}
            onBaseUrlChange={(value) => {
              setBaseUrl(value)
              patchProvider(selected.id, { endpoint: { ...selected.endpoint, baseUrl: value } })
            }}
            format={format}
            onFormatChange={(formatId) => {
              setFormat(formatId)
              const def = selected.endpoint.format === formatId ? selected.endpoint : undefined
              patchProvider(selected.id, {
                endpoint: {
                  format: formatId,
                  baseUrl: def?.baseUrl ?? baseUrl,
                },
              })
            }}
            testing={testing}
            onTest={handleTest}
            testResult={testResult}
            activeCap={activeCap}
            onActiveCapChange={setActiveCap}
            modelSearch={modelSearch}
            onModelSearchChange={setModelSearch}
            onSetDefault={(modelId) => setDefaultModel(selected.id, modelId)}
            onToggleKeep={(modelId) => toggleKeepModel(selected.id, modelId)}
            onPullModels={() => pullModels(selected.id)}
            onRequestRemove={() => setRemoveId(selected.id)}
          />
        ) : (
          <div className="min-w-0 flex-1 p-4">
            <p className="py-3 text-center text-sm text-muted-foreground">No providers yet.</p>
          </div>
        )}
      </div>

      {meter && (
        <p className="text-xs text-muted-foreground">
          Today · {meter.todayCostUsd.toFixed(3)} USD · BYOK — keys stay in your keychain
        </p>
      )}

      <AddProviderDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        existingIds={providers.map((p) => p.id)}
        onAdd={handleAdd}
      />

      <AlertDialog open={removeId !== null} onOpenChange={(o) => !o && setRemoveId(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove provider?</AlertDialogTitle>
            <AlertDialogDescription>
              Deletes the key from this device and stops routing to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setRemoveId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmRemove}>
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

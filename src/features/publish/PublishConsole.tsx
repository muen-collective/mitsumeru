'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Globe, RefreshCw, Rocket, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { usePublishStore } from '@/core/stores/publish'

const spinner = <span className="size-3 animate-spin rounded-full border-2 border-input border-t-primary" />

/* Localhost / loopback — never iframed, always handed to the installed browser. */
const isLocalUrl = (url: string | null) =>
  !!url && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?($|\/)/i.test(url)

/**
 * Publish console — Block #5 (story: Patterns/Mitsu browser block).
 * No embedded browser: the panel hands draft/live URLs to the installed
 * browser (the only reliable preview) and carries the publish loop.
 * Reads/writes the PublishManifest through the mock seam (publish store).
 */
export function PublishConsole() {
  const manifest = usePublishStore((s) => s.manifest)
  const state = usePublishStore((s) => s.state)
  const load = usePublishStore((s) => s.load)
  const createPreview = usePublishStore((s) => s.createPreview)
  const publish = usePublishStore((s) => s.publish)
  const rollback = usePublishStore((s) => s.rollback)

  const [view, setView] = useState<'draft' | 'live'>('draft')
  const [urlInput, setUrlInput] = useState('')
  const [publishOpen, setPublishOpen] = useState(false)

  useEffect(() => {
    let alive = true
    load().then(() => {
      const m = usePublishStore.getState().manifest
      if (alive && m) setUrlInput(m.draftUrl ?? m.liveUrl ?? '')
    })
    return () => {
      alive = false
    }
  }, [load])

  const draft = manifest?.draftUrl ?? null
  const liveUrl = manifest?.liveUrl ?? ''
  const activeUrl = view === 'draft' && draft ? draft : liveUrl
  const hasDraft = !!draft
  const isPublished = !!manifest?.publishedAt

  const openInBrowser = (url: string) => window.open(url, '_blank', 'noopener,noreferrer')

  const viewBtn = (id: 'draft' | 'live', label: string, disabled = false) => (
    <button
      type="button"
      className={cn(
        'rounded-md border px-2.5 py-1 text-xs',
        view === id
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border text-muted-foreground hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-50',
      )}
      onClick={() => {
        setView(id)
        setUrlInput(id === 'draft' && draft ? draft : liveUrl)
      }}
      disabled={disabled}
    >
      {label}
    </button>
  )

  const busy = state === 'previewing' || state === 'publishing' || state === 'rolling-back'

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 pt-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Globe className="size-3.5 flex-none text-muted-foreground" aria-hidden="true" />
          <span className="truncate text-[12.5px] font-medium">{manifest?.siteName}</span>
          <span className="truncate font-mono text-[10.5px] text-muted-foreground">{manifest?.repo}</span>
        </div>
        <span className="flex flex-none items-center gap-1.5 text-[11px] text-muted-foreground">
          <span
            className={cn('size-1.5 rounded-full', isPublished ? 'bg-success' : 'bg-muted-foreground/40')}
          />
          {isPublished ? `Live · published ${manifest.publishedAt}` : 'Draft only'}
        </span>
      </div>

      {/* Address bar — edits a URL and hands it to the installed browser */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex items-center gap-1">
          {viewBtn('draft', 'Draft', !hasDraft)}
          {viewBtn('live', 'Live')}
        </div>
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') openInBrowser(urlInput.trim() || activeUrl)
          }}
          className="h-7 min-w-0 flex-1 font-mono text-[11px]"
          aria-label="Site URL — opens in your browser"
        />
        <Button
          variant="ghost"
          size="xs"
          className="h-7 px-1.5 text-muted-foreground"
          onClick={() => openInBrowser(activeUrl)}
          title="Reopen in browser"
          aria-label="Reopen in browser"
        >
          <RefreshCw className="size-3" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className="h-7 px-1.5 text-muted-foreground"
          onClick={() => openInBrowser(urlInput.trim() || activeUrl)}
          title="Open in browser"
          aria-label="Open in browser"
        >
          <ExternalLink className="size-3" aria-hidden="true" />
        </Button>
      </div>

      {/* Viewport — a handoff card, never a renderer */}
      <div className="mx-3 flex min-h-[280px] flex-1 items-center justify-center rounded-md border border-border bg-muted/30 p-6">
        {!hasDraft ? (
          <div className="flex w-full max-w-[360px] flex-col items-center gap-2.5 text-center">
            <div className="text-sm text-muted-foreground">No preview yet.</div>
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              Create a preview to get a draft deployment URL for the latest content.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
              disabled={busy}
              onClick={() => void createPreview()}
            >
              {state === 'previewing' ? (
                <>
                  {spinner}Creating preview…
                </>
              ) : (
                'Create preview'
              )}
            </Button>
          </div>
        ) : (
          <div className="flex w-full max-w-[380px] flex-col items-center gap-2.5 text-center">
            <Globe className="size-[22px] text-muted-foreground" aria-hidden="true" />
            <div className="text-sm font-medium text-foreground">Preview in your browser</div>
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              Mitsu has no embedded browser — the site opens in your installed browser, which is the most
              reliable preview for deployments{isLocalUrl(activeUrl) ? ', localhost and dev servers' : ''}.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
              onClick={() => openInBrowser(activeUrl)}
            >
              <ExternalLink className="size-3" aria-hidden="true" /> Open {view} in browser
            </Button>
          </div>
        )}
      </div>

      {/* Publish bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        {hasDraft ? (
          <div className="min-w-0 text-[11px] text-muted-foreground">
            {isPublished ? (
              <span>
                <b className="font-medium text-foreground">Live</b> · {manifest?.liveSha ?? manifest?.draftSha} ·{' '}
                {state === 'rolling-back' ? 'rolling back…' : `published ${manifest?.publishedAt}`}
              </span>
            ) : (
              <span>
                <b className="font-medium text-foreground">Draft</b> · {manifest?.draftSha} · not published
              </span>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">Nothing staged yet.</div>
        )}
        <div className="flex flex-none items-center gap-2">
          {isPublished && (
            <Button
              variant="ghost"
              size="xs"
              className="h-6 px-1.5 text-[11px] text-destructive hover:bg-destructive/10"
              disabled={busy}
              onClick={() => void rollback()}
            >
              <RotateCcw className="size-3" aria-hidden="true" /> Rollback
            </Button>
          )}
          {hasDraft && (
            <Button
              variant="default"
              size="xs"
              className="h-6 gap-1.5 px-2.5 text-[11px]"
              disabled={busy}
              onClick={() => setPublishOpen(true)}
            >
              {state === 'publishing' ? (
                <>
                  {spinner}Publishing…
                </>
              ) : (
                <>
                  <Rocket className="size-3" aria-hidden="true" /> Publish
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Why there is no embedded browser */}
      <div className="border-t border-border px-3 py-2 text-[10.5px] text-muted-foreground">
        Websites and Storybook preview in your installed browser. Local HTML documents (moodboards) preview in
        the doc viewer.
      </div>

      {/* Publish confirm */}
      <Dialog open={publishOpen} onOpenChange={(o) => !o && setPublishOpen(false)}>
        <DialogContent className="w-[min(340px,86%)]">
          <DialogTitle>Publish to {manifest?.siteName}?</DialogTitle>
          <DialogDescription>
            One commit to main — Vercel deploys automatically. You can roll back anytime.
          </DialogDescription>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setPublishOpen(false)
                void publish()
              }}
            >
              <Rocket className="size-3" aria-hidden="true" /> Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

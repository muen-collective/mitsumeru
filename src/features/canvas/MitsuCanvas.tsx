"use client"

import * as React from "react"
import { ExternalLink, Hash, Lock, PanelRight, PanelsTopLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { nodeTitle } from "@/core/contracts/content"
import { useContentStore } from "@/core/stores/content"
import { cn } from "@/lib/utils"
import { ContentTree } from "./ContentTree"
import { CanvasPreview } from "./CanvasPreview"
import { guideColor, LEGEND } from "./blockRegistry"

export interface MitsuCanvasProps {
  /**
   * Dev-mode INITIAL state (seeded once); the header Legend button toggles
   * local UI state after mount (kb shortcut key lands with the impl).
   */
  annotations?: boolean
  /** URL handoff — installed browser on web, in-app browser on Electron.
   * The ONLY navigation affordance; never embeds a browser. */
  onOpenInBrowser?: () => void
  className?: string
}

/**
 * MitsuCanvas — Block #3 visual canvas (read-only). Split workspace: the
 * canvas sits beside the composer (agent loop); IRL site testing happens
 * in the installed browser fullscreen, never here. This is a
 * content-production preview (Krea images, DeepSeek copy), not a
 * site-testing surface, and it never wears browser chrome.
 *
 * Settled (2026-08-12, contract #9): clean webpage preview (no
 * card-within-card); tree box right (border-l separator, header = site
 * name, flex-box key footer); A-marker badges styled like the annotation
 * bubbles; dev mode renders square color-coded flex-box guides; header
 * carries Legend / tree / Open-in-browser controls. Selection is
 * store-owned (read-only surface).
 */
export function MitsuCanvas({ annotations = false, onOpenInBrowser, className }: MitsuCanvasProps) {
  const tree = useContentStore((s) => s.tree)
  const status = useContentStore((s) => s.status)
  const selectedId = useContentStore((s) => s.selectedId)
  const select = useContentStore((s) => s.select)
  const load = useContentStore((s) => s.load)

  /* Dev-mode (legend) + tree visibility are local UI state. */
  const [devMode, setDevMode] = React.useState(annotations)
  const [treeVisible, setTreeVisible] = React.useState(true)

  React.useEffect(() => {
    if (!tree && status === "idle") load()
  }, [tree, status, load])

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card", className)}>
      {/* Surface header — structural chrome keeps its border; no browser chrome. */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-[12.5px] font-medium text-foreground">
          <PanelsTopLeft size={14} className="flex-none text-muted-foreground" aria-hidden="true" />
          <span className="truncate">Visual canvas</span>
        </div>
        <div className="flex flex-none items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <Lock size={11} aria-hidden="true" />
            read-only · revision {typeof tree?.revision === "number" ? tree.revision : 1}
            {devMode && <span className="ml-1.5">· legend on</span>}
          </div>
          <Button
            variant="ghost"
            size="xs"
            className={cn("h-6 px-1.5", devMode ? "bg-muted text-foreground" : "text-muted-foreground")}
            onClick={() => setDevMode((d) => !d)}
            title={devMode ? "Hide legend" : "Show legend"}
            aria-label="Toggle legend"
            aria-pressed={devMode}
          >
            <Hash size={13} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className={cn("h-6 px-1.5", treeVisible ? "bg-muted text-foreground" : "text-muted-foreground")}
            onClick={() => setTreeVisible((v) => !v)}
            title={treeVisible ? "Hide tree" : "Show tree"}
            aria-label="Toggle tree"
            aria-pressed={treeVisible}
          >
            <PanelRight size={13} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="h-6 px-1.5 text-muted-foreground"
            onClick={onOpenInBrowser}
            title="Open in browser"
            aria-label="Open in browser"
          >
            <ExternalLink size={13} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {status === "error" ? (
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Couldn’t load content.
        </div>
      ) : !tree ? (
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Loading…
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* Canvas — clean webpage preview of the content tree; no card chrome. */}
          <CanvasPreview tree={tree} selectedId={selectedId} annotations={devMode} onSelect={select} />

          {/* Content tree — annotation key in its own box (right), separated
              by a border; the legend footer keys the flex-box guide colors. */}
          {treeVisible && (
            <aside className="flex w-[240px] shrink-0 flex-col border-l border-border bg-card">
              <div className="px-3 pb-1 pt-2.5 text-xs font-medium text-foreground">{nodeTitle(tree)}</div>
              <ScrollArea className="min-h-0 flex-1">
                <ContentTree tree={tree} selectedId={selectedId} onSelect={select} />
              </ScrollArea>
              <div className="border-t border-border px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Flex-box key</div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {LEGEND.map(([type, label]) => (
                    <div key={type} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className={cn("size-2 rounded-full", guideColor(type).dot)} aria-hidden="true" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  )
}

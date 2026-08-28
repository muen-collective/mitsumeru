"use client"

import * as React from "react"
import {
  Check,
  ChevronRight,
  CircleAlert,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquareText,
  PanelLeft,
  PanelLeftClose,
  Rocket,
  Sparkles,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAgentStore } from "@/core/stores/agent"
import { reduceEvents, type TurnItem } from "./reduceEvents"
import { MarkdownContent } from "./MarkdownContent"
import { AgentComposer } from "./AgentComposer"
import { useProvidersStore } from "@/core/stores/providers"
import { cn } from "@/lib/utils"

/**
 * AgentLoop — Mitsu's ONLY chat surface (Block #4, settled 2026-08-12).
 * Renders the SSE-shaped AgentEvent stream with in-turn progressive
 * disclosure: thinking → tool rows → streamed text → media → per-turn cost.
 * chatArea conventions: user message is the only bubble; assistant renders
 * as plain text under a name header. Width: the composer anchors; the list
 * matches its max-w chain. DESIGN.md: no row dividers, monochrome controls,
 * error = tertiary-text, retry = outline + secondary token.
 */

/* ── Thinking: collapsible chain of thought ────────────────────────────── */

function AgentThinking({
  steps,
  streaming,
}: {
  steps: { label: string; status: "done" | "active" | "pending" }[]
  streaming: boolean
}) {
  // Uncontrolled: defaultOpen latches the streaming state at mount (no
  // setState-in-effect); the chevron follows the panel via CSS group state.
  const doneCount = steps.filter((s) => s.status === "done").length

  return (
    <Collapsible defaultOpen={streaming} className="w-full">
      <CollapsibleTrigger className="group flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring">
        <ChevronRight
          className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-90"
          aria-hidden="true"
        />
        {streaming ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="size-3.5" aria-hidden="true" />
        )}
        <span className="font-medium">
          {streaming ? "Thinking" : "Thought process"}
        </span>
        <span className="text-muted-foreground/60">
          {doneCount}/{steps.length}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1.5 w-full overflow-hidden">
        <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">
                {step.status === "done" && (
                  <Check className="size-3.5 text-foreground/60" aria-hidden="true" />
                )}
                {step.status === "active" && (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                )}
                {step.status === "pending" && (
                  <span className="block size-1.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                )}
              </span>
              <span
                className={cn(
                  "leading-relaxed",
                  step.status === "pending" && "text-muted-foreground/60"
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/* ── Tool row: collapsed row → expandable input/result detail ──────────── */

const toolIcon = (tool: string) => {
  const cls = "size-4 shrink-0 text-muted-foreground"
  if (tool.startsWith("content.")) return <FileText className={cls} aria-hidden="true" />
  if (tool.startsWith("publish.")) return <Rocket className={cls} aria-hidden="true" />
  if (tool.startsWith("image.")) return <ImageIcon className={cls} aria-hidden="true" />
  return <Wrench className={cls} aria-hidden="true" />
}

function ToolRow({ item }: { item: Extract<TurnItem, { kind: "tool" }> }) {
  const [open, setOpen] = React.useState(false)
  const failed = item.status === "failed"
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <CollapsibleTrigger className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring">
        <ChevronRight
          className="size-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]:rotate-90"
          aria-hidden="true"
        />
        {toolIcon(item.tool)}
        <span className="font-mono text-[12.5px] text-foreground">{item.tool}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          {item.status === "active" && (
            <>
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              running…
            </>
          )}
          {item.status === "done" && (
            <>
              <Check className="size-3 text-foreground/60" aria-hidden="true" />
              done
            </>
          )}
          {item.status === "failed" && (
            <>
              <CircleAlert className="size-3 text-tertiary-text" aria-hidden="true" />
              failed
            </>
          )}
          {item.status === "pending" && (
            <span className="block size-1.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
          )}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden">
        <div className="mt-1 space-y-1.5 pb-2 pl-9 pr-3">
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <div className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground/70">
              input
            </div>
            <pre className="mt-1 overflow-x-auto font-mono text-[11.5px] leading-relaxed text-foreground/80">
              {JSON.stringify(item.input, null, 2)}
            </pre>
          </div>
          {item.summary && (
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <div className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground/70">
                result
              </div>
              <div
                className={cn(
                  "mt-1 text-[12.5px] leading-relaxed",
                  failed ? "text-tertiary-text" : "text-foreground/80"
                )}
              >
                {item.summary}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
      {item.media && item.status === "done" && (
        <div className="pb-1 pl-9 pr-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated media has unknown dimensions (BYOK adapters); next/image optimization applies at the real adapter layer */}
          <img
            src={item.media.url}
            alt={`${item.tool} result`}
            className="mt-1.5 max-h-72 rounded-xl border border-border object-cover"
          />
        </div>
      )}
    </Collapsible>
  )
}

/* ── Formatting helpers ────────────────────────────────────────────────── */

const formatTokens = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${Math.round(n / 1_000)}k` : `${n}`

/* ── Surface ───────────────────────────────────────────────────────────── */

export default function AgentLoop({
  panelOpen = false,
  onTogglePanel,
}: {
  panelOpen?: boolean
  onTogglePanel?: () => void
}) {
  const prompt = useAgentStore((s) => s.prompt)
  const events = useAgentStore((s) => s.events)
  const streaming = useAgentStore((s) => s.streaming)
  const usage = useAgentStore((s) => s.usage)
  const stats = useAgentStore((s) => s.stats)
  const retry = useAgentStore((s) => s.retry)
  const loadProviders = useProvidersStore((s) => s.load)

  React.useEffect(() => {
    loadProviders()
  }, [loadProviders])

  const items = React.useMemo(() => reduceEvents(events, streaming), [events, streaming])
  const terminal = items.find((i) => i.kind === "terminal")
  const isEmpty = !prompt && items.length === 0 && !streaming

  const headerState = streaming
    ? "working…"
    : terminal?.state === "done"
      ? "done"
      : terminal?.state === "error"
        ? "error"
        : "idle"

  const lastThinkingActive = items
    .filter((i): i is Extract<TurnItem, { kind: "thinking" }> => i.kind === "thinking")
    .some((i) => i.steps.some((s) => s.status === "active"))

  const toolChips = items
    .filter((i): i is Extract<TurnItem, { kind: "tool" }> => i.kind === "tool")
    .filter((i) => i.status !== "failed")
    .map((i) => ({ name: i.tool, status: i.status }))

  const streamingText = streaming && items[items.length - 1]?.kind === "text"

  return (
    <div className="flex h-full min-h-0 flex-col bg-background font-sans text-foreground">
      {/* Structural chrome keeps its border (DESIGN.md). */}
      <header className="flex items-center gap-2.5 border-b border-border px-3 py-3">
        {onTogglePanel && (
          <button
            type="button"
            onClick={onTogglePanel}
            aria-label="Toggle file tree"
            aria-pressed={panelOpen}
            title={panelOpen ? "Close file tree" : "Open file tree"}
            className="rounded-md p-1.5 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
          >
            {panelOpen ? (
              <PanelLeftClose className="size-4" aria-hidden="true" />
            ) : (
              <PanelLeft className="size-4" aria-hidden="true" />
            )}
          </button>
        )}
        <MessageSquareText className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium">Mitsu</span>
        <span
          className={cn(
            "size-2 rounded-full",
            streaming ? "bg-secondary" : terminal?.state === "error" ? "bg-tertiary" : "bg-muted-foreground/40"
          )}
          aria-hidden="true"
        />
        <span className="text-[11.5px] text-muted-foreground">{headerState}</span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground/70">
          {usage?.model ?? "deepseek-v4-flash"}
        </span>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-4 lg:max-w-3xl 2xl:max-w-4xl">
          {isEmpty ? (
            <div className="grid h-full w-full place-items-center p-6">
              <div className="flex w-full flex-col items-center text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted" aria-hidden="true">
                  <MessageSquareText className="size-4.5 text-muted-foreground" />
                </span>
                <p className="mt-3 text-sm font-medium">Ask Mitsu anything</p>
                <p className="mt-1 max-w-[52ch] text-[12.5px] leading-relaxed text-muted-foreground">
                  Prompt once — Mitsu thinks, calls tools, and lands the result here, with the cost of every turn.
                </p>
              </div>
            </div>
          ) : (
            <>
              {prompt && (
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-[4px] bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                  {prompt}
                </div>
              )}
              {items.length > 0 && (
                <div className="flex w-full flex-col gap-3.5">
                  <div className="text-xs text-muted-foreground">Mitsu</div>
                  {items.map((item, i) => {
                    if (item.kind === "thinking") {
                      return (
                        <AgentThinking
                          key={i}
                          steps={item.steps}
                          streaming={streaming && item.steps.some((s) => s.status === "active")}
                        />
                      )
                    }
                    if (item.kind === "tool") {
                      return <ToolRow key={i} item={item} />
                    }
                    if (item.kind === "text") {
                      return (
                        <div key={i} className="text-sm leading-relaxed text-foreground/90">
                          <MarkdownContent text={item.text} />
                          {streamingText && i === items.length - 1 && (
                            <span
                              className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-foreground/70 align-middle"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      )
                    }
                    if (item.kind === "terminal" && item.state === "error") {
                      return (
                        <Alert key={i} variant="destructive" className="items-start">
                          <CircleAlert className="size-4" aria-hidden="true" />
                          <AlertTitle className="text-[13px]">Turn failed</AlertTitle>
                          <AlertDescription className="text-[12.5px]">{item.message}</AlertDescription>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={retry}
                              className="border-secondary text-secondary hover:bg-secondary/10"
                            >
                              Retry
                            </Button>
                          </div>
                        </Alert>
                      )
                    }
                    if (item.kind === "terminal") {
                      return (
                        <div key={i} className="flex items-center gap-1.5 pt-0.5 text-[11.5px] text-muted-foreground">
                          {item.state === "done" && (
                            <Check className="size-3.5 text-foreground/60" aria-hidden="true" />
                          )}
                          <span>{item.state === "stopped" ? "Stopped" : "Done"}</span>
                          {usage && item.state === "done" && (
                            <span className="ml-1">
                              · {usage.model} · {usage.tokensIn.toLocaleString()} in ·{" "}
                              {usage.tokensOut.toLocaleString()} out ·{" "}
                              <span className="font-mono">${usage.costUsd.toFixed(4)}</span>
                            </span>
                          )}
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Status strip + pinned composer (composer anchors the width). */}
      <div className="relative flex shrink-0 flex-col items-center bg-background px-4 py-3">
        {toolChips.length > 0 && (
          <div className="mx-auto flex w-full max-w-2xl items-center gap-1.5 px-4 pb-1.5 lg:max-w-3xl 2xl:max-w-4xl">
            {toolChips.map((chip, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {chip.status === "done" && <Check className="size-3" aria-hidden="true" />}
                {chip.status === "active" && (
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                )}
                {chip.status === "pending" && (
                  <span className="block size-1.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                )}
                {chip.name}
              </span>
            ))}
            {streaming && (
              <span className="ml-auto animate-pulse text-[11px] text-muted-foreground/60">
                {lastThinkingActive ? "Thinking…" : "Working…"}
              </span>
            )}
          </div>
        )}
        <AgentComposer />
        <p className="mx-auto flex w-full max-w-2xl items-center gap-1.5 px-4 pb-0.5 pt-2 text-[11.5px] leading-none tabular-nums text-muted-foreground lg:max-w-3xl 2xl:max-w-4xl">
          <span>{formatTokens(stats.tokensTotal)} tokens</span>
          <span aria-hidden="true" className="text-muted-foreground/50">•</span>
          <span>${stats.costUsd.toFixed(3)}</span>
          {stats.cachePct !== null && (
            <>
              <span aria-hidden="true" className="text-muted-foreground/50">•</span>
              <span>cache {stats.cachePct}%</span>
            </>
          )}
          <span aria-hidden="true" className="text-muted-foreground/50">•</span>
          <span>{stats.turns} turns</span>
          <span aria-hidden="true" className="text-muted-foreground/50">•</span>
          <span>{stats.tokPerSec} tok/s</span>
        </p>
      </div>
    </div>
  )
}

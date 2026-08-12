"use client"

import * as React from "react"
import { Send, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { useAgentStore, type ReasoningLevel } from "@/core/stores/agent"
import { useProvidersStore } from "@/core/stores/providers"

const REASONING_OPTIONS: { id: ReasoningLevel; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
]

/**
 * AgentComposer — lean Mitsu composer (Block #4). The settled Patterns/Composer
 * design minus Claire's workflow chrome: model + reasoning selects carry the
 * composer state; send/stop is monochrome. Rows separate by spacing, no
 * dividers (DESIGN.md).
 */
export function AgentComposer() {
  const [draft, setDraft] = React.useState("")
  const streaming = useAgentStore((s) => s.streaming)
  const model = useAgentStore((s) => s.model)
  const reasoning = useAgentStore((s) => s.reasoning)
  const send = useAgentStore((s) => s.send)
  const stop = useAgentStore((s) => s.stop)
  const setModel = useAgentStore((s) => s.setModel)
  const setReasoning = useAgentStore((s) => s.setReasoning)
  const providers = useProvidersStore((s) => s.providers)
  const providerModels = React.useMemo(
    () => providers.flatMap((p) => p.models.filter((m) => m.kept)).map((m) => ({ id: m.id, name: m.name })),
    [providers]
  )

  const submit = () => {
    if (!draft.trim() || streaming) return
    send(draft)
    setDraft("")
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-2 shadow-sm lg:max-w-3xl 2xl:max-w-4xl">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={'Ask Mitsu — e.g. "Generate a spring hero image"'}
        rows={2}
        disabled={streaming}
        className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-60"
      />
      <div className="flex items-center gap-1.5 px-1 pb-0.5">
        {providerModels.length > 0 ? (
          <Select value={model} onValueChange={setModel}>
            {/* No SelectValue: Radix measures it to size the trigger, which
             * collapses on first paint when the model list mounts empty.
             * A plain label keeps the trigger width = content, always. */}
            <SelectTrigger className="h-7 w-auto gap-1.5 whitespace-nowrap border-0 bg-transparent px-2 text-[12px] text-muted-foreground hover:text-foreground [&>svg]:size-3.5">
              <span className="max-w-[160px] truncate">
                {providerModels.find((m) => m.id === model)?.name ?? model}
              </span>
            </SelectTrigger>
            <SelectContent>
              {providerModels.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="px-2 font-mono text-[11px] text-muted-foreground/70">{model}</span>
        )}
        <Select value={reasoning} onValueChange={(v) => setReasoning(v as ReasoningLevel)}>
          <SelectTrigger className="h-7 w-auto gap-1.5 whitespace-nowrap border-0 bg-transparent px-2 text-[12px] text-muted-foreground hover:text-foreground [&>svg]:size-3.5">
            <span className="max-w-[120px] truncate">
              {REASONING_OPTIONS.find((r) => r.id === reasoning)?.label ?? reasoning}
            </span>
          </SelectTrigger>
          <SelectContent>
            {REASONING_OPTIONS.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-[10.5px] text-muted-foreground/60">
          Enter to send · Shift+Enter for a new line
        </span>
        {streaming ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={stop}
            className="h-7 gap-1.5 px-2.5 text-[12px]"
          >
            <Square className="size-3 fill-current" aria-hidden="true" />
            Stop
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={submit}
            disabled={!draft.trim()}
            className="h-7 gap-1.5 bg-foreground px-2.5 text-[12px] text-background hover:bg-foreground/90 disabled:opacity-40"
          >
            <Send className="size-3.5" aria-hidden="true" />
            Send
          </Button>
        )}
      </div>
    </div>
  )
}

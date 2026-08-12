"use client"

import * as React from "react"
import AgentLoop from "@/features/agent/AgentLoop"
import { FileTreePanel } from "@/features/agent/FileTreePanel"

/**
 * Agent workspace (Block #4) — the site file tree on the left, toggled from
 * the chat header (panel toggle sits left of the chat icon, settled
 * 2026-08-12); the agent loop is Mitsu's only chat surface.
 */
export default function AgentPage() {
  const [panelOpen, setPanelOpen] = React.useState(true)
  return (
    <main className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      {panelOpen && <FileTreePanel />}
      <div className="min-w-0 flex-1">
        <AgentLoop panelOpen={panelOpen} onTogglePanel={() => setPanelOpen((v) => !v)} />
      </div>
    </main>
  )
}

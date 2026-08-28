"use client"

import { MitsuCanvas } from "@/features/canvas/MitsuCanvas"

/**
 * Canvas workspace (Block #3) — the read-only visual canvas surface.
 * Split workspace: the canvas sits beside the composer in the real
 * workspace; this route is the surface on its own (mock seam). IRL site
 * testing happens in the installed browser (URL handoff), never here.
 */
export default function CanvasPage() {
  return (
    <main className="flex h-screen bg-background p-6 font-sans text-foreground">
      <MitsuCanvas />
    </main>
  )
}

"use client"

import * as React from "react"
import { FileText, Folder, Image as ImageIcon, LayoutGrid } from "lucide-react"
import { useContentStore } from "@/core/stores/content"
import type { ContentNode } from "@/core/contracts/content"
import { cn } from "@/lib/utils"

const nodeIcon = (type: string) => {
  const cls = "size-3.5 shrink-0"
  if (type === "section") return <Folder className={cls} aria-hidden="true" />
  if (type === "image") return <ImageIcon className={cls} aria-hidden="true" />
  if (type === "grid") return <LayoutGrid className={cls} aria-hidden="true" />
  return <FileText className={cls} aria-hidden="true" />
}

function TreeNode({ node, depth }: { node: ContentNode; depth: number }) {
  const label = (node.data?.title as string | undefined) ?? node.id
  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-[12px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
          node.type === "section" && "font-medium text-foreground/90"
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {nodeIcon(node.type)}
        <span className="truncate">{label}</span>
        <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground/50">{node.type}</span>
      </div>
      {node.children?.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

/**
 * FileTreePanel — the site content tree (Block #4 workspace shell). Left
 * panel, toggled from the chat header (AgentLoop's panelOpen). Rows separate
 * by spacing only; the structural border is the panel edge (DESIGN.md).
 */
export function FileTreePanel() {
  const tree = useContentStore((s) => s.tree)
  const status = useContentStore((s) => s.status)
  const load = useContentStore((s) => s.load)

  React.useEffect(() => {
    if (!tree && status === "idle") load()
  }, [tree, status, load])

  return (
    <aside className="flex w-[216px] shrink-0 flex-col border-r border-border bg-card">
      <div className="px-3 py-2.5 text-xs font-medium text-foreground">Hand Me Up · content</div>
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3" aria-label="Site content">
        {status === "ready" && tree?.children?.map((node) => <TreeNode key={node.id} node={node} depth={0} />)}
        {status === "loading" && <div className="px-3 py-1.5 text-[12px] text-muted-foreground/60">Loading…</div>}
        {status === "error" && <div className="px-3 py-1.5 text-[12px] text-muted-foreground/60">Couldn’t load content.</div>}
      </nav>
    </aside>
  )
}

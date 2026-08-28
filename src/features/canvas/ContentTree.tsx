"use client"

import * as React from 'react'
import { ChevronRight, Globe, Image as ImageIcon, LayoutGrid, PanelsTopLeft } from 'lucide-react'
import type { ContentNode } from '@/core/contracts/content'
import { nodeTitle } from '@/core/contracts/content'
import { cn } from '@/lib/utils'
import { collectMarkers, guideColor } from './blockRegistry'

interface TreeRowProps {
  node: ContentNode
  depth: number
  expanded: Set<string>
  selectedId: string | null
  markers: Map<string, number>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}

const typeIcon = (type: string) => {
  const cls = 'size-3.5 shrink-0'
  if (type === 'site') return <Globe className={cls} aria-hidden="true" />
  if (type === 'section') return <PanelsTopLeft className={cls} aria-hidden="true" />
  if (type === 'image') return <ImageIcon className={cls} aria-hidden="true" />
  if (type === 'grid') return <LayoutGrid className={cls} aria-hidden="true" />
  return <PanelsTopLeft className={cls} aria-hidden="true" />
}

function TreeRow({ node, depth, expanded, selectedId, markers, onToggle, onSelect }: TreeRowProps) {
  const hasChildren = Boolean(node.children?.length)
  const isExpanded = expanded.has(node.id)

  /* Single-block sections flatten: the section row merges with its only
   * child (e.g. Product Carousel → its strip) so blocks sit one indent
   * level shallower. Both markers show, keeping the 1:1 bubble pairing. */
  const mergedChild = node.type === 'section' && node.children?.length === 1 ? node.children[0] : null
  const mergedMarker = mergedChild ? markers.get(mergedChild.id) : undefined
  const showChevron = mergedChild ? Boolean(mergedChild.children?.length) : hasChildren

  const selected = node.id === selectedId || mergedChild?.id === selectedId
  const marker = markers.get(node.id)
  const title = nodeTitle(node)

  return (
    <>
      <div
        role="treeitem"
        aria-expanded={showChevron ? isExpanded : undefined}
        aria-selected={selected}
        className={cn(
          'group flex w-full items-center gap-1.5 rounded-md py-2.5 pr-2 text-[12.5px] transition-colors',
          selected ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        )}
        style={{ paddingLeft: 6 + depth * 12 }}
      >
        {showChevron ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
            className="flex-none rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight size={13} className={cn('transition-transform', isExpanded && 'rotate-90')} aria-hidden="true" />
          </button>
        ) : (
          <span className="w-[21px] flex-none" />
        )}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {marker ? (
            <span className="flex flex-none items-center gap-1">
              <span className={cn('rounded border border-border px-1 py-px text-[8.5px] leading-none uppercase tracking-wide', guideColor(node.type).bubble)}>
                A{marker}
              </span>
              {mergedChild && mergedMarker ? (
                <span className={cn('rounded border border-border px-1 py-px text-[8.5px] leading-none uppercase tracking-wide', guideColor(mergedChild.type).bubble)}>
                  A{mergedMarker}
                </span>
              ) : null}
            </span>
          ) : (
            typeIcon(node.type)
          )}
          <span title={title} className="min-w-0 flex-1 truncate">
            {title}
          </span>
        </button>
      </div>
      {mergedChild ? (
        isExpanded &&
        mergedChild.children?.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            selectedId={selectedId}
            markers={markers}
            onToggle={onToggle}
            onSelect={onSelect}
          />
        ))
      ) : (
        hasChildren &&
        isExpanded &&
        node.children!.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            selectedId={selectedId}
            markers={markers}
            onToggle={onToggle}
            onSelect={onSelect}
          />
        ))
      )}
    </>
  )
}

export interface ContentTreeProps {
  tree: ContentNode
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * ContentTree — the annotation-key tree of the canvas surface. Rows carry
 * A-marker badges styled like the annotation bubbles (per-type color);
 * the flex-box key footer maps the colors. Expand/collapse is local UI
 * state; selection is store-owned (read-only surface).
 */
export function ContentTree({ tree, selectedId, onSelect }: ContentTreeProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(() => {
    const seed = new Set<string>()
    const walk = (node: ContentNode) => {
      if (node.children?.length) {
        seed.add(node.id)
        node.children.forEach(walk)
      }
    }
    walk(tree)
    return seed
  })

  const toggle = React.useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const markers = React.useMemo(() => collectMarkers(tree), [tree])

  return (
    <div role="tree" aria-label="Site content tree" className="flex flex-col px-1.5 pb-3">
      {tree.children?.map((child) => (
        <TreeRow
          key={child.id}
          node={child}
          depth={0}
          expanded={expanded}
          selectedId={selectedId}
          markers={markers}
          onToggle={toggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

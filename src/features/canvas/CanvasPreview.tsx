"use client"

import * as React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ContentNode } from '@/core/contracts/content'
import { blockKindOf, imageData, nodeTitle, sectionData, textData, gridData } from '@/core/contracts/content'
import { MarkdownContent } from '@/features/agent/MarkdownContent'
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import { collectMarkers, guideColor, typeLabel } from './blockRegistry'

interface CanvasFrameProps {
  node: ContentNode
  selected: boolean
  marker?: number
  annotations: boolean
  onSelect?: (id: string) => void
  children: React.ReactNode
}

/** Selection chip + hover ring + dev-mode guide/bubble, shared by every node. */
function CanvasFrame({ node, selected, marker, annotations, onSelect, children }: CanvasFrameProps) {
  const guide = guideColor(node.type)
  return (
    <div
      data-canvas-node-id={node.id}
      onClick={() => onSelect?.(node.id)}
      style={annotations ? { outline: `1px dashed ${guide.outlineVar}` } : undefined}
      className={cn(
        'group relative cursor-pointer rounded-lg transition-shadow',
        selected ? 'ring-2 ring-foreground/60' : 'hover:ring-1 hover:ring-foreground/25',
        annotations && 'rounded-none'
      )}
    >
      <span
        className={cn(
          'absolute -top-2.5 left-3 z-10 rounded-md border border-border px-1.5 py-0.5 text-[9.5px] uppercase tracking-wide transition-opacity',
          annotations ? cn(guide.bubble, 'opacity-100') : 'bg-background text-muted-foreground',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        {annotations && marker ? `A${marker}` : typeLabel(node)}
      </span>
      {children}
    </div>
  )
}

/** Read-only carousel block (kind 'carousel'): a scrollable strip of slides. */
function CarouselStrip({
  node,
  selectedId,
  markers,
  annotations,
  onSelect,
}: {
  node: ContentNode
  selectedId: string | null
  markers: Map<string, number>
  annotations: boolean
  onSelect?: (id: string) => void
}) {
  const stripRef = React.useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) => {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Previous slide"
        className="flex-none rounded-md border border-border p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft size={14} aria-hidden="true" />
      </button>
      <div ref={stripRef} className="flex min-w-0 flex-1 gap-3 overflow-x-auto scroll-smooth py-0.5">
        {node.children?.map((child) => (
          <div key={child.id} className="w-60 shrink-0">
            <CanvasNode node={child} selectedId={selectedId} markers={markers} annotations={annotations} onSelect={onSelect} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Next slide"
        className="flex-none rounded-md border border-border p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronRight size={14} aria-hidden="true" />
      </button>
    </div>
  )
}

interface CanvasNodeProps {
  node: ContentNode
  selectedId: string | null
  markers: Map<string, number>
  annotations: boolean
  /** True inside a hero block — headline text renders large, no page heading. */
  isHero?: boolean
  onSelect?: (id: string) => void
}

function CanvasNode({ node, selectedId, markers, annotations, isHero = false, onSelect }: CanvasNodeProps) {
  const selected = node.id === selectedId
  const marker = markers.get(node.id)

  if (node.type === 'site') {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-xl font-semibold tracking-tight">{nodeTitle(node)}</div>
        {node.children?.length ? (
          <div className="flex flex-col gap-6">
            {node.children.map((child) => (
              <CanvasNode key={child.id} node={child} selectedId={selectedId} markers={markers} annotations={annotations} onSelect={onSelect} />
            ))}
          </div>
        ) : (
          <Empty className="rounded-lg border border-dashed border-border">
            <EmptyTitle>No content yet</EmptyTitle>
            <EmptyDescription>Sections will render here once the site content tree has content.</EmptyDescription>
          </Empty>
        )}
      </div>
    )
  }

  if (node.type === 'section') {
    const kind = blockKindOf(node)
    const hero = kind === 'hero'
    const title = sectionData(node).title
    return (
      <CanvasFrame node={node} selected={selected} onSelect={onSelect} marker={marker} annotations={annotations}>
        <div className="flex flex-col gap-3">
          {/* Page heading renders only when the block has one (hero has none). */}
          {typeof title === 'string' && title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : null}
          {kind === 'carousel' ? (
            <CarouselStrip node={node} selectedId={selectedId} markers={markers} annotations={annotations} onSelect={onSelect} />
          ) : node.children?.length ? (
            <div className="flex flex-col gap-4">
              {node.children.map((child) => (
                <CanvasNode key={child.id} node={child} selectedId={selectedId} markers={markers} annotations={annotations} isHero={hero} onSelect={onSelect} />
              ))}
            </div>
          ) : null}
        </div>
      </CanvasFrame>
    )
  }

  if (node.type === 'text') {
    return (
      <CanvasFrame node={node} selected={selected} onSelect={onSelect} marker={marker} annotations={annotations}>
        <MarkdownContent
          text={textData(node).markdown ?? ''}
          className={isHero ? 'text-2xl font-semibold tracking-tight text-foreground' : 'text-sm text-foreground/80'}
        />
      </CanvasFrame>
    )
  }

  if (node.type === 'image') {
    const { src = '', alt = node.id } = imageData(node)
    return (
      <CanvasFrame node={node} selected={selected} onSelect={onSelect} marker={marker} annotations={annotations}>
        <figure>
          {src ? (
            /* Content srcs may be remote (Krea outputs); unoptimized keeps
             * the preview render-anywhere without image-loader config. */
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md">
              <Image src={src} alt={alt} fill unoptimized className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
            </div>
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
              no image
            </div>
          )}
          <figcaption className="mt-1.5 text-[11px] text-muted-foreground">{alt}</figcaption>
        </figure>
      </CanvasFrame>
    )
  }

  if (node.type === 'grid') {
    const columns = Math.min(Math.max(gridData(node).columns ?? 1, 1), 6)
    return (
      <CanvasFrame node={node} selected={selected} onSelect={onSelect} marker={marker} annotations={annotations}>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {node.children?.length ? (
            node.children.map((child) => (
              <div key={child.id} className="min-w-0">
                <CanvasNode node={child} selectedId={selectedId} markers={markers} annotations={annotations} onSelect={onSelect} />
              </div>
            ))
          ) : (
            <div className="col-span-full px-3 py-8 text-center text-xs text-muted-foreground">
              empty grid · {columns} {columns === 1 ? 'column' : 'columns'}
            </div>
          )}
        </div>
      </CanvasFrame>
    )
  }

  // Unknown node type — render as a labeled text node so the tree stays visible.
  return (
    <CanvasFrame node={node} selected={selected} onSelect={onSelect} marker={marker} annotations={annotations}>
      <div className="py-1 text-sm text-muted-foreground">{nodeTitle(node)}</div>
    </CanvasFrame>
  )
}

export interface CanvasPreviewProps {
  tree: ContentNode
  selectedId: string | null
  annotations: boolean
  onSelect?: (id: string) => void
}

/**
 * CanvasPreview — the clean webpage preview of the content tree (Block #3).
 * No card chrome: plain sections, text, images, grids. The only overlays
 * are selection rings and (dev mode) the colored square flex-box guides +
 * A-marker bubbles. It renders the content tree — it never navigates URLs
 * (no browser chrome; URL preview belongs to the installed browser).
 */
export function CanvasPreview({ tree, selectedId, annotations, onSelect }: CanvasPreviewProps) {
  const markers = React.useMemo(() => collectMarkers(tree), [tree])
  const canvasRef = React.useRef<HTMLDivElement>(null)

  /* Tree selection → canvas: bring the node into view (read-only sync). */
  React.useEffect(() => {
    if (!selectedId) return
    const el = canvasRef.current?.querySelector(`[data-canvas-node-id="${selectedId}"]`)
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [selectedId])

  return (
    <main className="min-w-0 flex-1 overflow-auto bg-background">
      <div ref={canvasRef} className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        <CanvasNode node={tree} selectedId={selectedId} markers={markers} annotations={annotations} onSelect={onSelect} />
      </div>
    </main>
  )
}

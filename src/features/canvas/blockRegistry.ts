import type { ContentNode } from '@/core/contracts/content'

/**
 * Dev-mode guide colors — EVA tokens, color-coded per node type
 * (hand-me-up debug-mode convention). Guides are SQUARE (no radius); the
 * outline itself is an inline style (the Tailwind build emits no
 * outline-style utilities — only outline-none/-hidden).
 */
export interface GuideColor {
  /** CSS var used for the inline dashed outline. */
  outlineVar: string
  /** Legend swatch class. */
  dot: string
  /** A-marker bubble classes (bg + fg, token-paired). */
  bubble: string
}

export const guideColor = (type: string): GuideColor => {
  if (type === 'section') return { outlineVar: 'var(--primary)', dot: 'bg-primary', bubble: 'bg-primary text-primary-foreground' }
  if (type === 'text') return { outlineVar: 'var(--secondary)', dot: 'bg-secondary', bubble: 'bg-secondary text-secondary-foreground' }
  if (type === 'image') return { outlineVar: 'var(--tertiary)', dot: 'bg-tertiary', bubble: 'bg-tertiary text-tertiary-foreground' }
  if (type === 'grid') return { outlineVar: 'var(--warning)', dot: 'bg-warning', bubble: 'bg-warning text-warning-foreground' }
  return { outlineVar: 'var(--muted-foreground)', dot: 'bg-muted-foreground', bubble: 'bg-foreground text-background' }
}

export const typeLabel = (node: ContentNode): string => {
  if (node.type === 'grid' && typeof node.data?.columns === 'number') return `grid · ${node.data.columns}`
  return node.type
}

/**
 * A-markers: DFS order over the framed nodes (root excluded). The tree is
 * the key for the annotation bubbles — markers pair 1:1 between tree rows
 * and canvas bubbles.
 */
export function collectMarkers(tree: ContentNode): Map<string, number> {
  const map = new Map<string, number>()
  let n = 0
  const walk = (node: ContentNode) => {
    for (const child of node.children ?? []) {
      n += 1
      map.set(child.id, n)
      walk(child)
    }
  }
  walk(tree)
  return map
}

/** Flex-box key shown at the bottom of the tree box (dev-mode legend). */
export const LEGEND: Array<[string, string]> = [
  ['section', 'Section'],
  ['text', 'Text'],
  ['image', 'Image'],
  ['grid', 'Grid'],
]

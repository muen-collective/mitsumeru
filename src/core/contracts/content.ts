/**
 * ContentNode v0.1 (Block #3) — per-type data typed, block registry added.
 * PRD 5.4 generic content model. The canvas (read-only) renders
 * site → section blocks → content nodes. Sections are template blocks
 * (shadcn-store style): `data.block` is a registry key (e.g.
 * 'storefront-hero', 'product-carousel') that names the block;
 * `data.title` is the optional page heading (hero has none — its headline
 * text IS the hero; a carousel can carry one, e.g. "Lookbook").
 */
export interface SectionData {
  /** Template block name (shadcn-store registry key). */
  block?: string
  /** Optional page heading rendered by the block. */
  title?: string
}

export interface TextData {
  markdown?: string
}

export interface ImageData {
  alt?: string
  src?: string
}

export interface GridData {
  columns?: number
}

export interface ContentNode {
  id: string
  type: string
  /** Type-specific data — typed per node type (v0.1); unknown types stay loose. */
  data?: Record<string, unknown>
  children?: ContentNode[]
  /** Bumped on every edit; the canvas store is read-only. */
  revision?: number
}

export const sectionData = (node: ContentNode): SectionData => (node.data ?? {}) as SectionData
export const textData = (node: ContentNode): TextData => (node.data ?? {}) as TextData
export const imageData = (node: ContentNode): ImageData => (node.data ?? {}) as ImageData
export const gridData = (node: ContentNode): GridData => (node.data ?? {}) as GridData

/* Block registry — block name → renderer kind. Unknown names render as a
 * plain stacked section. Registry reference: shadcn-store taxonomy
 * (Marketing / E-commerce / Application). */
export type BlockKind = 'hero' | 'carousel' | 'default'

export const BLOCK_KIND: Record<string, BlockKind> = {
  'storefront-hero': 'hero',
  hero: 'hero',
  'product-carousel': 'carousel',
  carousel: 'carousel',
}

export const blockKindOf = (node: ContentNode): BlockKind =>
  BLOCK_KIND[String(sectionData(node).block ?? '')] ?? 'default'

export const humanize = (name: string): string =>
  name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

/** Tree label — sections label by block name; then title → alt → markdown → id. */
export const nodeTitle = (node: ContentNode): string => {
  const data = node.data ?? {}
  if (node.type === 'section' && typeof data.block === 'string' && data.block) return humanize(data.block)
  if (typeof data.title === 'string' && data.title) return data.title
  if (typeof data.alt === 'string' && data.alt) return data.alt
  if (typeof data.markdown === 'string') {
    return data.markdown.replace(/[#*_`>]/g, '').trim().split('\n')[0].slice(0, 40)
  }
  return node.id
}

import { describe, expect, it } from 'vitest'
import type { ContentNode } from '@/core/contracts/content'
import { blockKindOf, humanize, nodeTitle } from '@/core/contracts/content'
import { collectMarkers, guideColor, typeLabel } from './blockRegistry'

const TREE: ContentNode = {
  id: 'root',
  type: 'site',
  children: [
    {
      id: 'a',
      type: 'section',
      data: { block: 'storefront-hero' },
      children: [{ id: 'a1', type: 'text' }],
    },
    {
      id: 'b',
      type: 'section',
      children: [
        { id: 'b1', type: 'grid', data: { columns: 3 }, children: [{ id: 'b1a', type: 'image' }] },
      ],
    },
  ],
}

describe('block registry (canvas)', () => {
  it('collectMarkers numbers framed nodes in DFS order, root excluded', () => {
    expect([...collectMarkers(TREE).entries()]).toEqual([
      ['a', 1],
      ['a1', 2],
      ['b', 3],
      ['b1', 4],
      ['b1a', 5],
    ])
  })

  it('guideColor maps node types to EVA token pairs', () => {
    expect(guideColor('section').bubble).toBe('bg-primary text-primary-foreground')
    expect(guideColor('text').bubble).toBe('bg-secondary text-secondary-foreground')
    expect(guideColor('image').bubble).toBe('bg-tertiary text-tertiary-foreground')
    expect(guideColor('grid').bubble).toBe('bg-warning text-warning-foreground')
    expect(guideColor('section').outlineVar).toBe('var(--primary)')
  })

  it('typeLabel shows grid columns', () => {
    expect(typeLabel({ id: 'g', type: 'grid', data: { columns: 3 } })).toBe('grid · 3')
    expect(typeLabel({ id: 't', type: 'text' })).toBe('text')
  })
})

describe('content model naming (v0.1)', () => {
  it('blockKindOf resolves registry keys with default fallback', () => {
    expect(blockKindOf({ id: 'x', type: 'section', data: { block: 'storefront-hero' } })).toBe('hero')
    expect(blockKindOf({ id: 'x', type: 'section', data: { block: 'product-carousel' } })).toBe('carousel')
    expect(blockKindOf({ id: 'x', type: 'section', data: { block: 'future-block' } })).toBe('default')
    expect(blockKindOf({ id: 'x', type: 'section' })).toBe('default')
  })

  it('humanize turns registry keys into labels', () => {
    expect(humanize('storefront-hero')).toBe('Storefront Hero')
    expect(humanize('product-carousel')).toBe('Product Carousel')
  })

  it('nodeTitle labels sections by block name, leaves by content', () => {
    expect(nodeTitle({ id: 'h', type: 'section', data: { block: 'storefront-hero' } })).toBe('Storefront Hero')
    expect(nodeTitle({ id: 'l', type: 'section', data: { block: 'product-carousel', title: 'Lookbook' } })).toBe('Product Carousel')
    expect(nodeTitle({ id: 't', type: 'text', data: { markdown: '**Bold** copy.' } })).toBe('Bold copy.')
    expect(nodeTitle({ id: 'i', type: 'image', data: { alt: 'Cover' } })).toBe('Cover')
    expect(nodeTitle({ id: 'z', type: 'weird' })).toBe('z')
  })
})

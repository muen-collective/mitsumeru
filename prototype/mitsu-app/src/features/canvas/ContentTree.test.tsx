// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { ContentNode } from '@/core/contracts/content'
import { MOCK_CONTENT_TREE } from '@/core/adapters/mock/mock-content-tree'
import { ContentTree } from './ContentTree'

afterEach(cleanup)

/** Single-block section: the flatten rule merges the section row with its only child. */
const SINGLE_BLOCK: ContentNode = {
  id: 'root',
  type: 'site',
  children: [
    {
      id: 's',
      type: 'section',
      data: { block: 'product-carousel', title: 'Lookbook' },
      children: [{ id: 'g', type: 'grid', data: { columns: 3 }, children: [{ id: 'i', type: 'image', data: { alt: 'Item' } }] }],
    },
  ],
}

describe('ContentTree', () => {
  it('labels sections by block name with A-marker badges', () => {
    render(<ContentTree tree={MOCK_CONTENT_TREE} selectedId={null} onSelect={() => {}} />)
    expect(screen.getByText('Storefront Hero')).toBeTruthy()
    expect(screen.getByText('Product Carousel')).toBeTruthy()
    const heroRow = screen.getByText('Storefront Hero').closest('[role="treeitem"]') as HTMLElement
    expect(within(heroRow).getByText('A1')).toBeTruthy()
    // Non-merged section: single marker; items carry their own markers.
    const lookbookRow = screen.getByText('Product Carousel').closest('[role="treeitem"]') as HTMLElement
    expect(within(lookbookRow).getByText('A4')).toBeTruthy()
    expect(within(lookbookRow).queryByText('A5')).toBeNull()
    expect(screen.getByText('Velvet trouser look')).toBeTruthy()
  })

  it('flattens single-block sections: merged row shows both markers, items one indent shallower', () => {
    render(<ContentTree tree={SINGLE_BLOCK} selectedId={null} onSelect={() => {}} />)
    // Row labels by block name (data.title is the page heading, not the label).
    const mergedRow = screen.getByText('Product Carousel').closest('[role="treeitem"]') as HTMLElement
    expect(within(mergedRow).getByText('A1')).toBeTruthy() // section
    expect(within(mergedRow).getByText('A2')).toBeTruthy() // its only child (grid)
    expect(screen.getByText('Item')).toBeTruthy()
    const itemRow = screen.getByText('Item').closest('[role="treeitem"]') as HTMLElement
    expect(itemRow.style.paddingLeft).toBe('18px') // depth 1, not 2
  })

  it('collapses and expands via the row chevron', () => {
    render(<ContentTree tree={MOCK_CONTENT_TREE} selectedId={null} onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Collapse Storefront Hero/ }))
    expect(screen.queryByText('Fashion that moves forward.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Expand Storefront Hero/ }))
    expect(screen.getByText('Fashion that moves forward.')).toBeTruthy()
  })

  it('carries full-label tooltips on truncated rows', () => {
    render(<ContentTree tree={MOCK_CONTENT_TREE} selectedId={null} onSelect={() => {}} />)
    expect(screen.getByText('Velvet trouser look').getAttribute('title')).toBe('Velvet trouser look')
  })

  it('highlights the selected row and reports selection', () => {
    const onSelect = (id: string) => selected.push(id)
    const selected: string[] = []
    render(<ContentTree tree={MOCK_CONTENT_TREE} selectedId="hero-image" onSelect={onSelect} />)
    const row = screen.getByText('Lookbook cover').closest('[role="treeitem"]') as HTMLElement
    expect(row.getAttribute('aria-selected')).toBe('true')
    fireEvent.click(screen.getByText('Lookbook cover'))
    expect(selected).toEqual(['hero-image'])
  })
})

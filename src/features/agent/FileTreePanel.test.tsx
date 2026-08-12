// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { FileTreePanel } from './FileTreePanel'
import { useContentStore } from '@/core/stores/content'

afterEach(() => {
  cleanup()
  useContentStore.setState({ tree: null, status: 'idle' })
})

describe('FileTreePanel', () => {
  it('loads and renders the site content tree (block names + content labels)', async () => {
    render(<FileTreePanel />)
    expect(await screen.findByText('Hand Me Up · content')).toBeTruthy()
    // Sections label by their template block name (shadcn-store style).
    expect(await screen.findByText('Storefront Hero')).toBeTruthy()
    expect(await screen.findByText('Product Carousel')).toBeTruthy()
    // Leaves label by content: markdown for text, alt for images.
    expect(await screen.findByText('Fashion that moves forward.')).toBeTruthy()
    expect(await screen.findByText('Velvet trouser look')).toBeTruthy()
  })
})

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
  it('loads and renders the site content tree (sections + leaves)', async () => {
    render(<FileTreePanel />)
    expect(await screen.findByText('Hand Me Up · content')).toBeTruthy()
    // Sections use their data.title.
    expect(await screen.findByText('Hand-me-up')).toBeTruthy()
    expect(await screen.findByText('Lookbook')).toBeTruthy()
    // Leaves fall back to their id.
    expect(await screen.findByText('hero-text')).toBeTruthy()
    expect(await screen.findByText('lookbook-grid')).toBeTruthy()
  })
})

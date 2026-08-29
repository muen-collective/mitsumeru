// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MOCK_CONTENT_TREE } from '@/core/adapters/mock/mock-content-tree'
import { useContentStore } from '@/core/stores/content'
import { MitsuCanvas } from './MitsuCanvas'

afterEach(() => {
  cleanup()
  useContentStore.setState({ tree: null, status: 'idle', selectedId: null })
})

const seedStore = () =>
  useContentStore.setState({ tree: MOCK_CONTENT_TREE, status: 'ready', selectedId: null })

describe('MitsuCanvas', () => {
  it('renders the clean webpage preview with the tree box and legend footer', () => {
    seedStore()
    render(<MitsuCanvas />)
    expect(screen.getByText('Visual canvas')).toBeTruthy()
    // Site title renders twice: page title on the canvas + tree box header.
    expect(screen.getAllByText('Hand Me Up').length).toBe(2)
    // Headline renders on the canvas AND as the text-node row label in the tree.
    expect(screen.getAllByText('Fashion that moves forward.').length).toBe(2)
    expect(screen.getByRole('heading', { name: 'Lookbook' })).toBeTruthy() // page heading
    expect(screen.getByLabelText('Next slide')).toBeTruthy()
    expect(screen.getByText('Flex-box key')).toBeTruthy()
    expect(screen.getAllByRole('treeitem').length).toBeGreaterThan(0)
  })

  it('Legend button toggles the dev-mode guides and status', () => {
    seedStore()
    render(<MitsuCanvas />)
    const frame = (nodeId: string) =>
      document.querySelector(`[data-canvas-node-id="${nodeId}"]`) as HTMLElement

    expect(frame('hero').style.outline).toBe('')
    fireEvent.click(screen.getByLabelText('Toggle legend'))
    expect(frame('hero').style.outline).toContain('dashed')
    expect(screen.getByText('· legend on')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Toggle legend'))
    expect(frame('hero').style.outline).toBe('')
  })

  it('Tree toggle hides and restores the tree box', () => {
    seedStore()
    render(<MitsuCanvas />)
    expect(screen.getByRole('tree')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Toggle tree'))
    expect(screen.queryByRole('tree')).toBeNull()
    fireEvent.click(screen.getByLabelText('Toggle tree'))
    expect(screen.getByRole('tree')).toBeTruthy()
  })

  it('selection highlights the node on the canvas and the tree row', () => {
    seedStore()
    render(<MitsuCanvas />)
    act(() => useContentStore.setState({ selectedId: 'hero-image' }))
    const frame = document.querySelector('[data-canvas-node-id="hero-image"]') as HTMLElement
    expect(frame.className).toContain('ring-foreground/60')
    const row = screen
      .getAllByText('Lookbook cover')
      .map((el) => el.closest('[role="treeitem"]'))
      .find(Boolean) as HTMLElement
    expect(row.getAttribute('aria-selected')).toBe('true')
  })

  it('exposes the Open-in-browser handoff button', () => {
    seedStore()
    render(<MitsuCanvas />)
    expect(screen.getByLabelText('Open in browser')).toBeTruthy()
  })
})

// @vitest-environment jsdom
import * as React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { PublishConsole } from './PublishConsole'
import { CostStatusBar } from './CostStatusBar'

afterEach(cleanup)

describe('PublishConsole', () => {
  it('renders the site and the empty state, then creates a preview', async () => {
    render(<PublishConsole />)
    expect(await screen.findByText('Hand Me Up')).toBeTruthy()
    expect(screen.getByText('jussaralee/hand-me-up')).toBeTruthy()
    expect(screen.getByText('Nothing staged yet.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Create preview' }))
    // Status line is `<b>Draft</b> · sha · not published` — match the direct-text part
    expect(await screen.findByText(/not published/, undefined, { timeout: 3000 })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Publish/ })).toBeTruthy()
  })

  it('publishes through the confirm dialog and shows the live state', async () => {
    render(<PublishConsole />)
    fireEvent.click(await screen.findByRole('button', { name: 'Create preview' }))
    fireEvent.click(await screen.findByRole('button', { name: /Publish/ }, { timeout: 3000 }))
    // Confirm dialog — scope to the dialog (the bar also has a Publish button)
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Publish to Hand Me Up\?/)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: /^Publish$/ }))
    expect(await screen.findByText(/Live ·/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Rollback' })).toBeTruthy()
  })
})

describe('CostStatusBar', () => {
  it('shows today + total spend from the wallet meter', async () => {
    render(<CostStatusBar />)
    expect(await screen.findByText(/Today ·/)).toBeTruthy()
    expect(screen.getByText(/Total ·/)).toBeTruthy()
    expect(screen.getByText(/BYOK/)).toBeTruthy()
  })
})

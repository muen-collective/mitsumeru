// @vitest-environment jsdom
import * as React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProviderPanel } from './ProviderPanel'

afterEach(cleanup)

describe('ProviderPanel', () => {
  it('renders providers from the mock seam and shows the DeepSeek editor', async () => {
    render(<ProviderPanel />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Providers' })).toBeTruthy())
    // DeepSeek appears in the list AND the editor header
    expect((await screen.findAllByText('DeepSeek')).length).toBeGreaterThan(0)
    expect(screen.getByText('Krea')).toBeTruthy()
    // First provider is selected → connection tab with the API key field
    expect(await screen.findByLabelText('API key')).toBeTruthy()
  })

  it('rejects a short key with an error caption and aria-invalid', async () => {
    render(<ProviderPanel />)
    const keyInput = await screen.findByLabelText('API key')
    fireEvent.change(keyInput, { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))
    await waitFor(() =>
      expect(screen.getByText('Connection failed — check the key and try again.')).toBeTruthy(),
    )
    expect(keyInput.getAttribute('aria-invalid')).toBe('true')
  })

  it('accepts a valid key and shows the connected state', async () => {
    render(<ProviderPanel />)
    const keyInput = await screen.findByLabelText('API key')
    fireEvent.change(keyInput, { target: { value: 'sk-valid-long-key' } })
    fireEvent.click(screen.getByRole('button', { name: 'Test connection' }))
    await waitFor(() => expect(screen.getByText('Connected — key works.')).toBeTruthy())
  })

  it('catalog dialog shows category tabs, added state and coming-soon badges', async () => {
    render(<ProviderPanel />)
    fireEvent.click(await screen.findByRole('button', { name: /add provider/i }))
    // Category tabs per the settled prototype (patterns-settings)
    expect(await screen.findByText('Starter packs')).toBeTruthy()
    expect(screen.getByText('Open Source')).toBeTruthy()
    expect(screen.getByText('Frontier')).toBeTruthy()
    expect(screen.getByText('Creative')).toBeTruthy()
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0)
    // Review mode: every preset is seeded → entries show Added and are disabled
    // (this @radix-ui/react-tabs version activates on mousedown)
    const osTab = screen.getByRole('tab', { name: 'Open Source' })
    fireEvent.mouseDown(osTab)
    fireEvent.click(osTab)
    const qwenEntry = await screen.findByText('Qwen')
    expect(qwenEntry.closest('button')?.disabled).toBe(true)
    expect(screen.getAllByText('Added').length).toBeGreaterThan(0)
  })
})

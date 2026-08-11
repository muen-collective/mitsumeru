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
    expect(screen.getByText('Ollama (local)')).toBeTruthy()
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
})

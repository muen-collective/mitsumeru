// @vitest-environment jsdom
import * as React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SettingsShell } from './SettingsShell'

afterEach(cleanup)

describe('SettingsShell', () => {
  it('renders the fullscreen shell with all nav sections and the embedded providers panel', async () => {
    render(<SettingsShell />)
    expect(screen.getByRole('heading', { name: /settings/i })).toBeTruthy()
    for (const label of ['Profile', 'Sites', 'MCP servers', 'Skills', 'Memory', 'Migrate', 'Sign Out']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy()
    }
    // Default section = Providers, hosting the embedded provider panel
    // (DeepSeek appears in the list AND the editor header)
    expect((await screen.findAllByText('DeepSeek')).length).toBeGreaterThan(0)
  })

  it('switches to Profile and shows the account card', async () => {
    render(<SettingsShell />)
    fireEvent.click(screen.getByRole('button', { name: 'Profile' }))
    expect(screen.getByText('Thuy Pham')).toBeTruthy()
    expect(screen.getByText('thuy@muen.studio')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Manage account' })).toBeTruthy()
  })

  it('shows memory records on the Memory section', async () => {
    render(<SettingsShell />)
    fireEvent.click(screen.getByRole('button', { name: 'Memory' }))
    // Records tab (this @radix-ui/react-tabs version activates on mousedown)
    const recordsTab = screen.getByRole('tab', { name: 'Records' })
    fireEvent.mouseDown(recordsTab)
    fireEvent.click(recordsTab)
    expect(await screen.findByText(/Mitsu = Mitsumeru/)).toBeTruthy()
  })
})

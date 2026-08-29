import { describe, expect, it } from 'vitest'
import { createMockKeychainAdapter, MOCK_MIN_KEY_LENGTH } from './mock-keychain'

describe('mock keychain', () => {
  it('exposes status booleans only — never key material', async () => {
    const adapter = createMockKeychainAdapter()
    await adapter.saveKey('deepseek', 'sk-secret-value-123')
    const state = await adapter.getState()
    expect(state.entries).toHaveLength(1)
    expect(state.entries[0].providerId).toBe('deepseek')
    expect(state.entries[0].status).toBe('valid')
    expect(state.entries[0]).not.toHaveProperty('key')
    expect(JSON.stringify(state)).not.toContain('sk-secret-value-123')
  })

  it('marks short keys invalid and empty keys unset', async () => {
    const adapter = createMockKeychainAdapter()
    await expect(adapter.saveKey('krea', 'short')).resolves.toBe('invalid')
    await expect(adapter.saveKey('krea', '')).resolves.toBe('unset')
    await expect(adapter.testKey('krea')).resolves.toBe('unset')
    expect(MOCK_MIN_KEY_LENGTH).toBe(8)
  })

  it('removeKey clears the entry', async () => {
    const adapter = createMockKeychainAdapter()
    await adapter.saveKey('deepseek', 'sk-valid-long-key')
    await expect(adapter.removeKey('deepseek')).resolves.toBe('unset')
    const state = await adapter.getState()
    expect(state.entries).toHaveLength(0)
  })
})

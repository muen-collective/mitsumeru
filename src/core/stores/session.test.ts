import { describe, expect, it } from 'vitest'
import { createSessionStore } from './session'

describe('session store', () => {
  it('signs in and out through the mock adapter', async () => {
    const store = createSessionStore()
    expect(store.getState().status).toBe('signedOut')
    await store.getState().signIn()
    expect(store.getState().status).toBe('signedIn')
    expect(store.getState().userId).toBeTruthy()
    expect(store.getState().permissions).toContain('providers.manage')
    await store.getState().signOut()
    expect(store.getState().status).toBe('signedOut')
    expect(store.getState().permissions).toHaveLength(0)
  })
})

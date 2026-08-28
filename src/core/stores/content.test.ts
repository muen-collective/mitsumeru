import { describe, expect, it } from 'vitest'
import { createContentStore } from './content'

describe('content store', () => {
  it('loads the site tree from the mock adapter', async () => {
    const store = createContentStore()
    expect(store.getState().status).toBe('idle')
    await store.getState().load()
    const s = store.getState()
    expect(s.status).toBe('ready')
    expect(s.tree?.type).toBe('site')
    expect(s.tree?.children?.length).toBeGreaterThan(0)
  })

  it('holds read-only selection state (canvas ↔ tree sync)', () => {
    const store = createContentStore()
    expect(store.getState().selectedId).toBeNull()
    store.getState().select('hero-image')
    expect(store.getState().selectedId).toBe('hero-image')
    store.getState().select(null)
    expect(store.getState().selectedId).toBeNull()
  })
})

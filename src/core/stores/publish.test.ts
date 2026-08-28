import { describe, expect, it } from 'vitest'
import { createPublishStore } from './publish'

describe('publish store', () => {
  it('loads the site manifest from the mock seam', async () => {
    const store = createPublishStore()
    await store.getState().load()
    const { manifest, state } = store.getState()
    expect(state).toBe('idle')
    expect(manifest?.siteName).toBe('Hand Me Up')
    expect(manifest?.repo).toBe('jussaralee/hand-me-up')
    expect(manifest?.liveUrl).toBe('https://hand-me-up.vercel.app')
    expect(manifest?.entries[0].path).toBe('site-content/index.json')
  })

  it('preview → publish → rollback through the mock adapter', async () => {
    const store = createPublishStore()
    await store.getState().load()

    await store.getState().createPreview()
    let s = store.getState()
    expect(s.state).toBe('idle')
    expect(s.manifest?.draftUrl).toMatch(/^https:\/\/preview\./)
    expect(s.manifest?.draftSha).toMatch(/^draft-/)
    expect(s.manifest?.liveSha).toBeUndefined()

    await store.getState().publish()
    s = store.getState()
    expect(s.state).toBe('live')
    expect(s.manifest?.liveSha).toBe(s.manifest?.draftSha)
    expect(s.manifest?.publishedAt).toBeTruthy()

    await store.getState().rollback()
    s = store.getState()
    expect(s.manifest?.liveSha).toMatch(/^prev-/)
    expect(s.manifest?.liveSha).not.toBe(s.manifest?.draftSha)
  })
})

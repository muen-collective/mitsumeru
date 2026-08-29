import { describe, expect, it } from 'vitest'
import { createMockPublishAdapter } from './mock-publish'
import type { PublishManifest } from '../../contracts/publish'

const MANIFEST: PublishManifest = {
  siteName: 'hand-me-up',
  repo: 'jussaralee/hand-me-up',
  entries: [{ path: 'site-content/index.json', contentSha: 'abc123' }],
  liveUrl: 'https://hand-me-up.vercel.app',
  liveSha: 'live-0000',
}

describe('mock publish', () => {
  it('preview returns a draft url + sha', async () => {
    const adapter = createMockPublishAdapter(0)
    const draft = await adapter.preview(MANIFEST)
    expect(draft.draftUrl).toContain('hand-me-up')
    expect(draft.draftSha).toMatch(/^draft-/)
  })

  it('publish promotes the draft to live with a timestamp', async () => {
    const adapter = createMockPublishAdapter(0)
    const live = await adapter.publish({ ...MANIFEST, draftSha: 'draft-abc' })
    expect(live.liveSha).toBe('draft-abc')
    expect(live.publishedAt).toBeTruthy()
  })

  it('rollback restores a previous sha', async () => {
    const adapter = createMockPublishAdapter(0)
    const live = await adapter.publish({ ...MANIFEST, draftSha: 'draft-abc' })
    const rolled = await adapter.rollback(live)
    expect(rolled.liveSha).toMatch(/^prev-/)
    expect(rolled.liveSha).not.toBe('draft-abc')
  })
})

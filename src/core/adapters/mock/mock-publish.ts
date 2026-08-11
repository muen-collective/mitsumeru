/**
 * Mock publish (UI lane) — fake draft URL after a delay; rollback restores
 * the previous live sha (epic 10 §6). Mirrors PublishManifest; real adapter =
 * preview/publish/rollback → site-content/*.json → one git commit (epic 07).
 */
import type { PublishAdapter } from '../ports'

const FAKE_DELAY_MS = 3000

const fakeSha = (prefix: string) => `${prefix}-${Math.random().toString(16).slice(2, 10)}`

export function createMockPublishAdapter(delayMs: number = FAKE_DELAY_MS): PublishAdapter {
  return {
    async preview(manifest) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      return { draftUrl: `https://preview.${manifest.siteName}.vercel.app`, draftSha: fakeSha('draft') }
    },
    async publish(manifest) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      const draftSha = manifest.draftSha ?? fakeSha('draft')
      return { ...manifest, draftSha, liveSha: draftSha, publishedAt: new Date().toISOString() }
    },
    async rollback(manifest) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      return { ...manifest, liveSha: fakeSha('prev') }
    },
  }
}

/**
 * PublishManifest v0 — publish console (browser block, Block #5).
 * Content-only, path-allowlisted (`site-content/*.json`), sha + rollback
 * (epic 02). One git commit per publish; Vercel auto-deploys (epic 07).
 * Source story: `Patterns/Mitsu browser block`; UI props per DESIGN.md §browser block.
 */
export const PUBLISH_PATH_ALLOWLIST = ['site-content/*.json'] as const

export interface PublishEntry {
  path: string
  contentSha: string
}

export type PublishState =
  | 'idle'
  | 'previewing'
  | 'publishing'
  | 'live'
  | 'rolling-back'
  | 'error'

export interface PublishManifest {
  siteName: string
  /** owner/repo of the published site. */
  repo: string
  entries: PublishEntry[]
  liveUrl?: string
  draftUrl?: string
  liveSha?: string
  draftSha?: string
  /** ISO timestamp of last successful publish. */
  publishedAt?: string
}

/**
 * ContentNode v0 (PROVISIONAL) — visual canvas read-only (Block #3).
 * PRD 5.4 generic content model; shape provisional until Block #3 grounds it
 * against the claire-ai visual editor patterns. Typed per-type data lands with
 * the canvas store.
 */
export interface ContentNode {
  id: string
  type: string
  /** Type-specific data — typed per node type before Block 3. */
  data?: Record<string, unknown>
  children?: ContentNode[]
  /** Bumped on every edit; the Block 3 canvas store is read-only. */
  revision?: number
}

import { create } from 'zustand'
import { getAdapters } from '../config'
import type { ContentNode } from '../contracts/content'

/**
 * Content store (Block #3 canvas, extended from the Block #4 tree panel) —
 * reads the site content tree through the seam. Read-only by design:
 * selection is the only mutable state (store-owned, external to the
 * surface, per the MitsuCanvas contract).
 */
export interface ContentStore {
  tree: ContentNode | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Read-only selection (canvas ↔ tree sync); null = nothing selected. */
  selectedId: string | null
  select(id: string | null): void
  load(): Promise<void>
}

export function createContentStore() {
  return create<ContentStore>((set) => ({
    tree: null,
    status: 'idle',
    selectedId: null,
    select: (id) => set({ selectedId: id }),
    async load() {
      set({ status: 'loading' })
      try {
        const tree = await getAdapters().content.loadTree()
        set({ tree, status: 'ready' })
      } catch {
        set({ status: 'error' })
      }
    },
  }))
}

export const useContentStore = createContentStore()

import { create } from 'zustand'
import { getAdapters } from '../config'
import type { ContentNode } from '../contracts/content'

/**
 * Content store (minimal, Block #4 fileTree panel) — reads the site content
 * tree through the seam. Block #3 extends this with the read-only canvas
 * store (revision + per-type data typing).
 */
export interface ContentStore {
  tree: ContentNode | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  load(): Promise<void>
}

export function createContentStore() {
  return create<ContentStore>((set) => ({
    tree: null,
    status: 'idle',
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

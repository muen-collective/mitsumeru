/**
 * Publish store (thin) — publish console (Block #5). Holds the site manifest
 * (PublishManifest contract) and drives the mock publish adapter:
 * preview → draft URL/sha; publish → live; rollback → previous sha.
 */
import { create } from 'zustand'
import { getAdapters } from '../config'
import type { PublishManifest, PublishState } from '../contracts/publish'

export interface PublishStore {
  manifest: PublishManifest | null
  state: PublishState
  load(): Promise<void>
  createPreview(): Promise<void>
  publish(): Promise<void>
  rollback(): Promise<void>
}

const INITIAL_MANIFEST: PublishManifest = {
  siteName: 'Hand Me Up',
  repo: 'jussaralee/hand-me-up',
  liveUrl: 'https://hand-me-up.vercel.app',
  entries: [{ path: 'site-content/index.json', contentSha: 'a1b2c3d' }],
}

export function createPublishStore() {
  return create<PublishStore>()((set, get) => ({
    manifest: null,
    state: 'idle',

    async load() {
      set({ manifest: { ...INITIAL_MANIFEST }, state: 'idle' })
    },

    async createPreview() {
      const manifest = get().manifest
      if (!manifest) return
      set({ state: 'previewing' })
      const { draftUrl, draftSha } = await getAdapters().publish.preview(manifest)
      set({ state: 'idle', manifest: { ...get().manifest!, draftUrl, draftSha } })
    },

    async publish() {
      const manifest = get().manifest
      if (!manifest) return
      set({ state: 'publishing' })
      const next = await getAdapters().publish.publish(manifest)
      set({ state: 'live', manifest: next })
    },

    async rollback() {
      const manifest = get().manifest
      if (!manifest) return
      set({ state: 'rolling-back' })
      const next = await getAdapters().publish.rollback(manifest)
      set({ state: 'live', manifest: next })
    },
  }))
}

export const usePublishStore = createPublishStore()

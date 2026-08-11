/**
 * Mock content tree (UI lane) — feeds the read-only visual canvas store
 * (Block #3). Mirrors the provisional ContentNode contract.
 */
import type { ContentNode } from '../../contracts/content'

export const MOCK_CONTENT_TREE: ContentNode = {
  id: 'root',
  type: 'site',
  revision: 3,
  children: [
    {
      id: 'hero',
      type: 'section',
      data: { title: 'Hand-me-up' },
      children: [
        { id: 'hero-text', type: 'text', data: { markdown: 'Fashion that moves forward.' } },
        { id: 'hero-image', type: 'image', data: { alt: 'Lookbook cover', src: '/images/hero.jpg' } },
      ],
    },
    {
      id: 'lookbook',
      type: 'section',
      data: { title: 'Lookbook' },
      children: [{ id: 'lookbook-grid', type: 'grid', data: { columns: 3 } }],
    },
  ],
}

/**
 * Mock content tree (UI lane) — feeds the read-only canvas store
 * (Block #3) and the agent workspace tree panel. Mirrors the ContentNode
 * v0.1 contract: sections are template blocks (data.block registry keys),
 * data.title is the optional page heading.
 */
import type { ContentNode } from '../../contracts/content'

export const MOCK_CONTENT_TREE: ContentNode = {
  id: 'root',
  type: 'site',
  revision: 3,
  data: { title: 'Hand Me Up' },
  children: [
    {
      id: 'hero',
      type: 'section',
      data: { block: 'storefront-hero' },
      children: [
        { id: 'hero-text', type: 'text', data: { markdown: 'Fashion that moves forward.' } },
        {
          id: 'hero-image',
          type: 'image',
          data: { alt: 'Lookbook cover', src: '/demo-images/flatlay-generated.svg' },
        },
      ],
    },
    {
      id: 'lookbook',
      type: 'section',
      data: { block: 'product-carousel', title: 'Lookbook' },
      children: [
        { id: 'lookbook-1', type: 'image', data: { alt: 'Velvet trouser look', src: '/demo-images/russe.png' } },
        {
          id: 'lookbook-2',
          type: 'image',
          data: { alt: 'Spring event card', src: '/demo-images/bf37673d-8c36-4305-882c-2f9217e460ce.jpg' },
        },
        { id: 'lookbook-3', type: 'image', data: { alt: 'Flatlay upload', src: '/demo-images/flatlay-upload.svg' } },
      ],
    },
  ],
}

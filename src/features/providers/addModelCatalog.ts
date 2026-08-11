/**
 * Add-provider catalog — categories with available and coming-soon entries.
 * Ported from claire-ai `ai/providerCatalog.ts` (settled prototype, 2026-08-10).
 * `setupUrl` = provider console where the user registers and creates an API key.
 */
export interface AddModelEntry {
  id: string
  name: string
  desc: string
  comingSoon?: boolean
  /** Substrings of `desc` rendered with emphasis (strong) in the card. */
  emphasis?: string[]
  setupUrl?: string
}

export interface AddModelCategory {
  id: string
  label: string
  entries: AddModelEntry[]
}

export const ADD_MODEL_CATEGORIES: AddModelCategory[] = [
  {
    id: 'starter-packs',
    label: 'Starter packs',
    entries: [
      {
        id: 'fashion-pack',
        name: 'Fashion Starter Pack',
        desc: 'A staff recommendation for fashion designers, built around your day-to-day: Krea 2 for fast, cheap ideation; extract to flat for merchandise planning; sketch to image lets you visualize your sketches as final products; image to flat for tech packs; vibe-code HTML pages (landing, lookbook) to hand off. DeepSeek powers chat — no provider accounts to manage; swap in your own as you grow.',
        emphasis: ['ideation', 'merchandise planning', 'final products', 'tech packs', 'vibe-code HTML pages'],
      },
      { id: 'pack-uiux', name: 'Product UI UX Design', desc: 'Interface mockups and design-system generation workflows.', comingSoon: true },
      { id: 'pack-agency', name: 'Agency', desc: 'Brand, campaign and content workflows for agencies. Contents to be defined.', comingSoon: true },
      { id: 'pack-photo', name: 'Photography', desc: 'Editorial, product photography and light studies.', comingSoon: true },
      { id: 'pack-interior', name: 'Interior Design', desc: 'Room renders, mood boards and furniture ideation.', comingSoon: true },
      { id: 'pack-industrial', name: 'Industrial Design', desc: 'Product concept renders and material studies.', comingSoon: true },
      { id: 'pack-graphic', name: 'Graphic Design', desc: 'Brand assets, posters and illustration pipelines.', comingSoon: true },
    ],
  },
  {
    id: 'open-source',
    label: 'Open Source',
    entries: [
      { id: 'deepseek', name: 'DeepSeek', desc: 'Best bang for your buck — V4 Pro is top-50 on arena.ai text, but newer checkpoints like V4 Flash 0731 beat it on coding. Checkpoints move fast; ranks are per version.', setupUrl: 'https://platform.deepseek.com/api_keys' },
      { id: 'xiaomi', name: 'Xiaomi MiMo', desc: 'Arena rank #40 — above Kimi K2.6, Qwen3.7 Plus and DeepSeek V4 Pro on the text board at a budget price. Multimodal with vision models.', setupUrl: 'https://platform.mimo.xiaomi.com' },
      { id: 'moonshot', name: 'Moonshot (Kimi)', desc: 'Kimi K3 Max ranks #13 on arena.ai — frontier-tier, ahead of DeepSeek and Qwen on the text board. Easy to set up.', setupUrl: 'https://platform.moonshot.cn' },
      { id: 'qwen', name: 'Qwen', desc: 'Excellent all-rounder — and the deepest family: Qwen3.8 Max (#5 text), Qwen Image 3.0 Pro (#5 image), Wan 2.7 video (i2v #6), plus VL and image-edit lines. Open-source alternative to ChatGPT and Gemini.', setupUrl: 'https://modelstudio.console.alibabacloud.com' },
      { id: 'minimax', name: 'MiniMax', desc: 'One API for text, image and video — M3 (arena #69, multimodal) plus H3 video at #4, just behind Seedance 2.0, at a fraction of the price. A clear pick if video is your main output.', setupUrl: 'https://platform.minimax.io' },
    ],
  },
  {
    id: 'frontier',
    label: 'Frontier',
    entries: [
      { id: 'openai', name: 'OpenAI', desc: 'The full-stack leader — GPT Image 2 is #1 on arena.ai image, GPT-5.6 Sol XHigh is top-15 on text and #4 on the coding harness, Sora 2 Pro #6 on video. GPT-5.6 Luna was cut ~80% on July 30, 2026 — a compelling value pick.', setupUrl: 'https://platform.openai.com/api-keys' },
      { id: 'google', name: 'Google Gemini', desc: 'The all-in-one for non-coders — Gemini 3.5 Flash is strong on general tasks, while Nano Banana 2/Pro image, Veo 3.1 video and Omni Flash cover everything on one API.', setupUrl: 'https://aistudio.google.com/apikey' },
      { id: 'anthropic', name: 'Anthropic', desc: 'The text and coding king — Fable 5 and the Opus line hold ranks #1-8 on arena.ai, with Opus 4.8 close behind. Premium price, though: for day-to-day work DeepSeek V4 Flash and Qwen deliver comparable quality at a fraction of the cost. Requires separate creative models — pair it with the Fashion Starter Pack or Krea.ai.', setupUrl: 'https://console.anthropic.com' },
    ],
  },
  {
    id: 'creative',
    label: 'Creative',
    entries: [
      { id: 'krea', name: 'Krea', desc: 'Krea 2, Nano Banana, Flux — image and video.', setupUrl: 'https://krea.ai' },
    ],
  },
]

/** Catalog entry id → registry preset id (entries without a preset become custom stubs). */
export const ENTRY_TO_PRESET: Record<string, string> = {
  moonshot: 'moonshot',
  google: 'gemini',
}

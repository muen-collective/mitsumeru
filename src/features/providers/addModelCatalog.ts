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
      { id: 'xiaomi', name: 'Xiaomi MiMo', desc: 'Arena rank #40 — above Kimi K2.6, Qwen3.7 Plus and DeepSeek V4 Pro on the text board. Multimodal with vision models. Subscription plans from $5.28/mo (credits-based, not per-token).', setupUrl: 'https://platform.xiaomimimo.com' },
      { id: 'moonshot', name: 'Moonshot (Kimi)', desc: 'Kimi K3 — most capable model, 1M ctx, native visual understanding and deep reasoning (reasoning_effort low/high/max). K2.7 Code high-speed for coding agents.', setupUrl: 'https://platform.kimi.ai/console/api-keys' },
      { id: 'qwen', name: 'Qwen', desc: 'Excellent all-rounder — and the deepest family: Qwen3.8 Max (#5 text), Qwen Image 3.0 Pro (#5 image), Wan 2.7 video (i2v #6), plus VL and image-edit lines. Open-source alternative to ChatGPT and Gemini. Token Plan subscription (Lite/Standard/Pro) or pay-as-you-go.', setupUrl: 'https://home.qwencloud.com/api-keys' },
      { id: 'minimax', name: 'MiniMax', desc: 'One API for text, image and video — M3 (1M ctx, multimodal, arena #69) plus H3 video at #4, just behind Seedance 2.0, at a fraction of the price. Pay-as-you-go or Token Plan subscription.', setupUrl: 'https://platform.minimax.io/' },
      { id: 'lm-studio', name: 'LM Studio (local)', desc: 'Local models via LM Studio (localhost:1234). Small VL models — Qwen3-VL 4B/8B, abliterated variants included — run on most machines and give you vision when cloud chat providers do not (DeepSeek has no vision API). No account, no per-token cost.' },
      { id: 'zai', name: 'Z.ai (GLM)', desc: 'Open-source GLM line — GLM-5.2 flagship (reasoning built-in), GLM-5V Turbo vision, CogVideoX-3 video gen. GLM Coding Plan from $18/mo for coding tools.', setupUrl: 'https://z.ai/manage-apikey/apikey-list' },
    ],
  },
  {
    id: 'frontier',
    label: 'Frontier',
    entries: [
      { id: 'openai', name: 'OpenAI', desc: 'The full-stack leader — GPT Image 2 is #1 on arena.ai image, GPT-5.6 Sol XHigh is top-15 on text and #4 on the coding harness, Sora 2 Pro #6 on video. GPT-5.6 Luna is the value pick ($0.20 in / $1.20 out per 1M); Batch/Flex tiers are −50%.', setupUrl: 'https://platform.openai.com/api-keys' },
      { id: 'google', name: 'Google Gemini', desc: 'The all-in-one — Gemini 3.6/3.5 Flash text, Nano Banana 2/Pro image, Veo 3.1 video, Omni Flash. Free tier; paid = Prepay credits or Postpay, batch −50%.', setupUrl: 'https://aistudio.google.com/apikey' },
      { id: 'anthropic', name: 'Anthropic', desc: 'The text and coding king — Fable 5 flagship ($10/$50 per MTok), Opus 5 ($5/$25), Sonnet 5 at $2/$10 (intro extended). Premium vs DeepSeek/Qwen value; pair with the Fashion Starter Pack or Krea for creative.', setupUrl: 'https://platform.claude.com/' },
      { id: 'openrouter', name: 'OpenRouter', desc: 'One API, 500+ models across every provider — 406 text, 41 image, 22 video, free models, automatic routing and fallbacks. Pay-per-token (credits top-up, no subscription). One key replaces many.', setupUrl: 'https://openrouter.ai/keys' },
    ],
  },
  {
    id: 'creative',
    label: 'Creative',
    entries: [
      { id: 'krea', name: 'Krea', desc: 'Aggregator API — 40+ image/video models (Nano Banana, Flux, Imagen, Veo, Kling, Sora) on one endpoint, compute-unit pricing ($0.04–$0.15/image, $0.05–$0.50/sec video). Topaz upscale to 22K, LoRA training.', setupUrl: 'https://www.krea.ai/app/api/tokens' },
    ],
  },
]

/** Catalog entry id → registry preset id (entries without a preset become custom stubs). */
export const ENTRY_TO_PRESET: Record<string, string> = {
  moonshot: 'moonshot',
  google: 'gemini',
  'lm-studio': 'lm-studio',
  xiaomi: 'mimo',
  zai: 'zai',
  openrouter: 'openrouter',
}

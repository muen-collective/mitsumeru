/**
 * Mock provider registry (UI lane) — hardcoded catalog presets + fetched
 * model lists. Grounded in claire-ai `ai/providerCatalog.ts` + the provider
 * panel's FETCHED table. Read-only catalog; `fetchModels` simulates the
 * real adapter's pull (epic 10 §6).
 *
 * Capability claims verified against official API docs 2026-08-11:
 * - DeepSeek: api-docs.deepseek.com (chat+reasoning only; no vision API)
 * - Qwen/DashScope: alibabacloud.com/help/en/model-studio/{text-to-image,use-video-generation,3d-generation}
 * - MiniMax: platform.minimaxi.com/docs/guides/models-intro
 * - Moonshot/Kimi: platform.kimi.ai/docs/overview (base api.moonshot.ai/v1; verified 2026-08-12)
 * - OpenAI: developers.openai.com/api/docs/models (sora-2: v1/videos)
 * - Krea: krea.ai/docs
 * Note: "capabilities" (tabs) are independent of the model list — a tab may
 * show with zero models until the real adapter's fetch lands (e.g. Qwen 3D,
 * Tripo; MiniMax speech/music are outside the CapTab set entirely).
 */
import type { ProviderAdapter } from '../ports'
import type { ProviderConfig, ProviderModel, ProviderPreset } from '../../contracts/provider'

const PRESETS: ProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    setupUrl: 'https://platform.deepseek.com/api_keys',
    description:
      'Chat + built-in thinking mode (1M ctx, 384K out). No vision API. Price increase announced 2026-08.',
    endpoint: { format: 'deepseek', baseUrl: 'https://api.deepseek.com' },
    capabilities: ['chat', 'reasoning'],
    models: [
      // Thinking is a MODE on both models (docs 2026-08-12) — there is no separate reasoner model
      { id: 'deepseek-v4-flash', capability: 'chat', name: 'DeepSeek V4 Flash', kept: true },
      { id: 'deepseek-v4-pro', capability: 'chat', name: 'DeepSeek V4 Pro', kept: true },
    ],
  },
  {
    id: 'qwen',
    name: 'Qwen (DashScope)',
    setupUrl: 'https://home.qwencloud.com/api-keys',
    description:
      'Chat + built-in reasoning, image (Wan/Qwen-Image), video (Wan), 3D (Tripo) and TTS. International API base (dashscope-intl); Token Plan subscription also available (QwenCloud).',
    endpoint: { format: 'openai', baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1' },
    capabilities: ['chat', 'reasoning', 'image', 'video', '3d'],
    models: [
      { id: 'qwen3.8-max', capability: 'chat', name: 'Qwen3.8 Max', kept: true },
      { id: 'qwen3.7-plus', capability: 'chat', name: 'Qwen3.7 Plus', kept: true },
      { id: 'qwen3.7-flash', capability: 'chat', name: 'Qwen3.7 Flash (cost)', kept: false },
      { id: 'qwen3-vl-plus', capability: 'chat', name: 'Qwen3 VL Plus (vision input)', kept: true },
      { id: 'qwen-image-3.0-pro', capability: 'image', name: 'Qwen Image 3.0 Pro', kept: true },
      { id: 'wan2.7-image-pro', capability: 'image', name: 'Wan 2.7 Image Pro', kept: false },
      { id: 'wan2.7-t2v', capability: 'video', name: 'Wan 2.7 T2V', kept: true },
      { id: 'wan2.6-t2v', capability: 'video', name: 'Wan 2.6 T2V', kept: false },
      { id: 'wan2.6-i2v-flash', capability: 'video', name: 'Wan 2.6 I2V Flash', kept: false },
      // 3D (Tripo) exists via Model Studio — model ids are doc-page-table only; tab shows empty until real fetch
    ],
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    setupUrl: 'https://platform.minimax.io/',
    description:
      'M3 (1M ctx, multimodal) / M2.7 LLMs, H3 video, image-01, speech-2.8. Base https://api.minimax.io/v1 (OpenAI-compat) or /anthropic. Pay-as-you-go or Token Plan subscription (monthly quota reset); separate key types per billing mode.',
    endpoint: { format: 'openai', baseUrl: 'https://api.minimax.io/v1' },
    capabilities: ['chat', 'image', 'video'],
    models: [
      { id: 'minimax-m3', capability: 'chat', name: 'MiniMax M3 (multimodal, 1M ctx)', kept: true },
      { id: 'minimax-m2.7', capability: 'chat', name: 'MiniMax M2.7', kept: true },
      {
        id: 'minimax-m2.7-highspeed',
        capability: 'chat',
        name: 'MiniMax M2.7 Highspeed',
        kept: false,
      },
      { id: 'image-01', capability: 'image', name: 'MiniMax Image-01', kept: true },
      { id: 'minimax-h3', capability: 'video', name: 'MiniMax H3 (multimodal to video)', kept: true },
      // speech (speech-2.8-hd/turbo) + music (music-3.0) exist but are outside the CapTab set
    ],
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    setupUrl: 'https://platform.kimi.ai/console/api-keys',
    description:
      'Kimi K3 — 1M ctx, native visual understanding (image + video input), deep reasoning via reasoning_effort (low/high/max, default max). K2.7 Code high-speed for coding.',
    endpoint: { format: 'openai', baseUrl: 'https://api.moonshot.ai/v1' },
    capabilities: ['chat', 'reasoning'],
    models: [
      { id: 'kimi-k3', capability: 'chat', name: 'Kimi K3', kept: true },
      {
        id: 'kimi-k2.7-code-highspeed',
        capability: 'reasoning',
        name: 'Kimi K2.7 Code (high speed)',
        kept: true,
      },
      { id: 'kimi-k2.5', capability: 'chat', name: 'Kimi K2.5', kept: false },
    ],
  },
  {
    id: 'mimo',
    name: 'Xiaomi MiMo',
    setupUrl: 'https://platform.xiaomimimo.com/console/api-keys',
    description:
      'V2.5 series — cheap + agentic. mimo-v2.5 native multimodal input (1M ctx), v2.5-pro reasoning (thinking mode default on). V2 deprecated 2026-06-30. Auth: api-key header. Token plan = subscription credits; pay-as-you-go also exists.',
    endpoint: { format: 'openai', baseUrl: 'https://api.xiaomimimo.com/v1' },
    capabilities: ['chat', 'reasoning'],
    models: [
      { id: 'mimo-v2.5', capability: 'chat', name: 'MiMo-V2.5 (multimodal input)', kept: true },
      { id: 'mimo-v2.5-pro', capability: 'reasoning', name: 'MiMo-V2.5-Pro (agent/reasoning)', kept: true },
      {
        id: 'mimo-v2.5-pro-ultraspeed',
        capability: 'reasoning',
        name: 'MiMo-V2.5-Pro-UltraSpeed (closed beta)',
        kept: false,
      },
      // TTS/ASR exist (MiMo-V2.5-TTS) but are outside the CapTab set
    ],
  },
  {
    id: 'lm-studio',
    name: 'LM Studio (local)',
    description:
      'Local models via LM Studio — native REST at localhost:1234/api/v1 (stateful /api/v1/chat with `input`; /api/v1/models; download endpoint; MCP integrations via `integrations`). No auth by default, optional Bearer token. Small VL models (Qwen3-VL 4B/8B, incl. abliterated) cover vision when cloud chat providers lack it. OpenAI-compat base (/v1) exists per separate docs — unverified here.',
    endpoint: { format: 'lm-studio', baseUrl: 'http://localhost:1234/api/v1' },
    capabilities: ['chat', 'reasoning'],
    models: [
      {
        id: 'qwen3-vl-4b-abliterated',
        capability: 'chat',
        name: 'Qwen3 VL 4B (abliterated, vision input)',
        kept: true,
      },
      {
        id: 'qwen3-vl-8b-abliterated',
        capability: 'chat',
        name: 'Qwen3 VL 8B (abliterated, vision input)',
        kept: false,
      },
      { id: 'llama-3.2-3b', capability: 'chat', name: 'Llama 3.2 3B', kept: false },
      { id: 'deepseek-r1-8b', capability: 'reasoning', name: 'DeepSeek R1 8B', kept: false },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    setupUrl: 'https://platform.openai.com/api-keys',
    description:
      'GPT-5.6 Sol/Terra/Luna (reasoning/chat tiers), GPT Image 2, Sora 2 video. Pricing tiers: Standard / Batch (−50%) / Flex (−50%) / Fast (2×). Luna ≈ $0.20 in / $1.20 out per 1M.',
    endpoint: { format: 'openai', baseUrl: 'https://api.openai.com/v1' },
    capabilities: ['chat', 'reasoning', 'image', 'video'],
    models: [
      { id: 'gpt-5.6-luna', capability: 'chat', name: 'GPT-5.6 Luna', kept: true },
      { id: 'gpt-5.6-terra', capability: 'chat', name: 'GPT-5.6 Terra', kept: false },
      { id: 'gpt-5.6-sol', capability: 'reasoning', name: 'GPT-5.6 Sol', kept: true },
      { id: 'gpt-image-2', capability: 'image', name: 'GPT Image 2', kept: true },
      { id: 'sora-2', capability: 'video', name: 'Sora 2 (text/image to video)', kept: true },
    ],
  },
  {
    id: 'zai',
    name: 'Z.ai (GLM)',
    setupUrl: 'https://z.ai/manage-apikey/apikey-list',
    description:
      'GLM-5.2 chat with built-in reasoning, GLM-5V Turbo vision input, CogVideoX-3 video gen. OpenAI-compatible /api/paas/v4 (Bearer). GLM Coding Plan subscription ($18/mo) uses a dedicated endpoint.',
    endpoint: { format: 'openai', baseUrl: 'https://api.z.ai/api/paas/v4' },
    capabilities: ['chat', 'reasoning', 'video'],
    models: [
      // reasoning is a mode on GLM-5.2 (no separate model id), like DeepSeek
      { id: 'glm-5.2', capability: 'chat', name: 'GLM-5.2', kept: true },
      { id: 'glm-5v-turbo', capability: 'chat', name: 'GLM-5V Turbo (vision input)', kept: true },
      { id: 'cogvideox-3', capability: 'video', name: 'CogVideoX-3', kept: true },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    setupUrl: 'https://aistudio.google.com/apikey',
    description:
      'Chat/reasoning (Gemini 3.6/3.5 Flash, 3.1 Pro), image (Nano Banana 2/Pro), video (Veo 3.1), omni/TTS. Free tier + Prepay credits ($10 min / $5k max, 12-mo expiry) or Postpay; Batch API −50%.',
    endpoint: {
      format: 'google',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    },
    capabilities: ['chat', 'reasoning', 'image', 'video'],
    models: [
      { id: 'gemini-3.6-flash', capability: 'chat', name: 'Gemini 3.6 Flash', kept: true },
      { id: 'gemini-3.5-flash', capability: 'chat', name: 'Gemini 3.5 Flash', kept: true },
      {
        id: 'gemini-3.1-pro-preview',
        capability: 'reasoning',
        name: 'Gemini 3.1 Pro (preview)',
        kept: true,
      },
      { id: 'gemini-3.1-flash-image', capability: 'image', name: 'Nano Banana 2', kept: true },
      { id: 'gemini-3-pro-image', capability: 'image', name: 'Nano Banana Pro', kept: false },
      { id: 'veo-3.1', capability: 'video', name: 'Veo 3.1', kept: true },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    setupUrl: 'https://platform.claude.com/',
    description:
      'Fable 5 / Opus 5 frontier reasoning; Sonnet 5 at $2/$10 (intro extended — no Sept 1 increase); Haiku 4.5 $1/$5. Cache writes $1.25–$20/MTok; 10% regional-endpoint premium (4.5+).',
    endpoint: { format: 'anthropic', baseUrl: 'https://api.anthropic.com/v1' },
    capabilities: ['chat', 'reasoning'],
    models: [
      { id: 'claude-sonnet-5', capability: 'chat', name: 'Claude Sonnet 5', kept: true },
      { id: 'claude-haiku-4.5', capability: 'chat', name: 'Claude Haiku 4.5', kept: false },
      { id: 'claude-opus-5', capability: 'reasoning', name: 'Claude Opus 5', kept: true },
      { id: 'claude-fable-5', capability: 'reasoning', name: 'Claude Fable 5', kept: false },
    ],
  },
  {
    id: 'krea',
    name: 'Krea',
    setupUrl: 'https://www.krea.ai/app/api/tokens',
    description:
      'Aggregator API — 40+ image/video models on one endpoint (Nano Banana 2/Pro, Flux, Imagen 4, Veo 3.1, Kling, Sora 2). Compute-unit pricing: $0.04–$0.15/image, $0.05–$0.50/sec video; Topaz upscale to 22K; LoRA training; webhooks.',
    endpoint: { format: 'custom', baseUrl: 'https://api.krea.ai/v1' },
    capabilities: ['image', 'video', '3d'],
    models: [
      { id: 'nano-banana-2', capability: 'image', name: 'Nano Banana 2', kept: true },
      { id: 'flux-1.1-pro', capability: 'image', name: 'Flux 1.1 Pro', kept: true },
      { id: 'imagen-4', capability: 'image', name: 'Imagen 4', kept: false },
      { id: 'veo-3.1', capability: 'video', name: 'Veo 3.1', kept: true },
      { id: 'kling-2.6', capability: 'video', name: 'Kling 2.6', kept: true },
      { id: 'wan-2.5', capability: 'video', name: 'Wan 2.5', kept: false },
      { id: 'sora-2', capability: 'video', name: 'Sora 2', kept: false },
      { id: 'hunyuan3d-2-mini-turbo', capability: '3d', name: 'Hunyuan3D 2 Mini Turbo', kept: true },
      { id: 'trellis-2', capability: '3d', name: 'Trellis 2', kept: false },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    setupUrl: 'https://openrouter.ai/keys',
    description:
      'Aggregator router — 500+ models across every provider (406 text / 41 image / 22 video / 33 embedding / 19 speech), one OpenAI-compatible endpoint. Pay-per-token (or per-unit for image/video), free models, automatic routing + fallbacks. Credits top-up, no subscription.',
    endpoint: { format: 'openai', baseUrl: 'https://openrouter.ai/api/v1' },
    capabilities: ['chat', 'reasoning', 'image', 'video'],
    models: [
      {
        id: 'deepseek/deepseek-v4-flash',
        capability: 'chat',
        name: 'DeepSeek V4 Flash (routed)',
        kept: true,
      },
      { id: 'openai/gpt-5.6-sol', capability: 'reasoning', name: 'GPT-5.6 Sol (routed)', kept: true },
      {
        id: 'anthropic/claude-sonnet-5',
        capability: 'chat',
        name: 'Claude Sonnet 5 (routed)',
        kept: false,
      },
      { id: 'qwen/qwen-image-3-pro', capability: 'image', name: 'Qwen Image 3 Pro (routed)', kept: true },
      {
        id: 'bytedance/seedance-2.5',
        capability: 'video',
        name: 'Seedance 2.5 (routed)',
        kept: false,
      },
      // Real adapter: GET /api/v1/models (~545 models); Bearer auth with optional
      // HTTP-Referer + X-OpenRouter-Title attribution headers; "~provider/model"
      // latest-aliases resolve to the newest flagship (docs quickstart 2026-08-12)
    ],
  },
  {
    id: 'magnific',
    name: 'Magnific (Freepik)',
    setupUrl: 'https://www.magnific.com/user/api-keys',
    description:
      'Freepik rebrand — REST API (api.magnific.com, magnificApiKey, async + webhooks): Mystic ultra-realistic image gen, the flagship Magnific upscaler, image editing, Kling v2 image-to-video, stock library, classifier, MCP. One credit balance with the subscription plan.',
    endpoint: { format: 'custom', baseUrl: 'https://api.magnific.com' },
    capabilities: ['image', 'video'],
    models: [
      { id: 'mystic', capability: 'image', name: 'Mystic (ultra-realistic image gen)', kept: true },
      { id: 'image-upscaler', capability: 'image', name: 'Magnific Upscaler', kept: true },
      { id: 'kling-v2', capability: 'video', name: 'Kling V2 (image-to-video)', kept: true },
      // Real adapter maps these to the API's model values (docs 2026-08-12)
    ],
  },
  {
    id: 'runninghub',
    name: 'RunningHub',
    setupUrl: 'https://www.runninghub.ai/enterprise-api/consumerApi',
    description:
      'Workflow + model aggregator (ComfyUI native): run full ComfyUI workflows as APIs plus standard model endpoints — Sora 2, Kling 3.0/o-series, Seedance 2.5, Vidu, Wan, Midjourney, Suno, Meshy 3D, Topaz. Async tasks + webhooks, LoRA/uploads. Base https://www.runninghub.ai; AI App contract verified in claire-ai services/runninghub.ts (submit /task/openapi/ai-app/run {webappId, apiKey, nodeInfoList}; poll /task/openapi/outputs; v2 /run/ai-app/{appId} Bearer).',
    endpoint: { format: 'custom', baseUrl: 'https://www.runninghub.ai' },
    capabilities: ['image', 'video', '3d'],
    models: [
      {
        id: 'kling-v3.0-pro-image-to-video',
        capability: 'video',
        name: 'Kling 3.0 Pro (image-to-video)',
        kept: true,
      },
      { id: 'seedance-2.5/image-to-video', capability: 'video', name: 'Seedance 2.5 (i2v)', kept: true },
      { id: 'vidu-image-to-video-q3-pro', capability: 'video', name: 'Vidu Q3 Pro (i2v)', kept: false },
      { id: 'nano-banana', capability: 'image', name: 'Nano Banana (image)', kept: true },
      { id: 'gpt-image', capability: 'image', name: 'GPT Image', kept: false },
      { id: 'meshy', capability: '3d', name: 'Meshy (3D)', kept: true },
      // Full catalog = per-model endpoints (docs 2026-08-12); LLM API is new/UNVERIFIED
    ],
  },
]

/** Simulated fetched model lists, keyed by provider id (mirrors the story's FETCHED). */
const FETCHED: Record<string, ProviderModel[]> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p.models]),
)

/**
 * Seeded providers — review mode: EVERY catalog preset is pre-added so each
 * provider's capability tabs + pull-models flow can be inspected immediately
 * (2026-08-11, user request). DeepSeek starts configured (valid key demo);
 * LM Studio is 'local' with its models fetched. The real adapter's initial
 * state will come from the user's actual configured providers, not this list.
 */
const PROVIDERS: ProviderConfig[] = PRESETS.map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  kind: 'catalog',
  endpoint: { ...p.endpoint },
  capabilities: [...p.capabilities],
  models: p.id === 'lm-studio' ? p.models.map((m) => ({ ...m })) : [],
  modelsFetched: p.id === 'lm-studio',
  defaultModelId: p.models.find((m) => m.capability === 'chat' && m.kept)?.id,
  keyStatus: p.id === 'deepseek' ? 'valid' : 'unset',
  status: p.id === 'deepseek' ? 'ready' : p.id === 'lm-studio' ? 'local' : 'unconfigured',
}))

export function mockProviderAdapter(): ProviderAdapter {
  return {
    async listPresets() {
      return PRESETS
    },
    async loadProviders() {
      return PROVIDERS
    },
    async fetchModels(providerId) {
      return FETCHED[providerId] ?? []
    },
  }
}

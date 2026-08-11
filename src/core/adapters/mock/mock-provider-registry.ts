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
 * - Moonshot/Kimi: platform.kimi.com/docs/guide/use-kimi-vision-model.md
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
    description: 'Chat and reasoning. Cheap and strong at coding. No vision API.',
    endpoint: { format: 'deepseek', baseUrl: 'https://api.deepseek.com' },
    capabilities: ['chat', 'reasoning'],
    models: [
      { id: 'deepseek-v4-flash', capability: 'chat', name: 'DeepSeek V4 Flash', kept: true },
      { id: 'deepseek-v4-pro', capability: 'chat', name: 'DeepSeek V4 Pro', kept: true },
      { id: 'deepseek-reasoner', capability: 'reasoning', name: 'DeepSeek Reasoner', kept: true },
    ],
  },
  {
    id: 'qwen',
    name: 'Qwen (DashScope)',
    description:
      'Chat + built-in reasoning, image (Wan/Qwen-Image), video (Wan), 3D (Tripo) and TTS.',
    endpoint: { format: 'openai', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
    capabilities: ['chat', 'reasoning', 'image', 'video', '3d'],
    models: [
      { id: 'qwen3.8-max', capability: 'chat', name: 'Qwen3.8 Max', kept: true },
      { id: 'qwen3.7-plus', capability: 'chat', name: 'Qwen3.7 Plus', kept: true },
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
    description: 'Language, video (H3), image, speech and music.',
    endpoint: { format: 'openai', baseUrl: 'https://api.minimax.chat/v1' },
    capabilities: ['chat', 'image', 'video'],
    models: [
      { id: 'minimax-m3', capability: 'chat', name: 'MiniMax M3', kept: true },
      { id: 'minimax-m2.7', capability: 'chat', name: 'MiniMax M2.7', kept: true },
      { id: 'image-01', capability: 'image', name: 'MiniMax Image-01', kept: true },
      { id: 'minimax-h3', capability: 'video', name: 'MiniMax H3 (text/image to video)', kept: true },
      // speech (Speech-2.8-HD) + music (music-3.0) exist but are outside the CapTab set
    ],
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    description: 'Long-context chat, reasoning and multimodal understanding (image + video input).',
    endpoint: { format: 'openai', baseUrl: 'https://api.moonshot.cn/v1' },
    capabilities: ['chat', 'reasoning'],
    models: [
      { id: 'kimi-k3', capability: 'chat', name: 'Kimi K3', kept: true },
      { id: 'kimi-k2.7-code', capability: 'reasoning', name: 'Kimi K2.7 Code', kept: true },
      { id: 'kimi-k2.5', capability: 'chat', name: 'Kimi K2.5', kept: false },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT chat/reasoning, GPT Image 2, Sora 2 video.',
    endpoint: { format: 'openai', baseUrl: 'https://api.openai.com/v1' },
    capabilities: ['chat', 'reasoning', 'image', 'video'],
    models: [
      { id: 'gpt-5.6-luna', capability: 'chat', name: 'GPT-5.6 Luna', kept: true },
      { id: 'gpt-5.6-sol', capability: 'reasoning', name: 'GPT-5.6 Sol', kept: true },
      { id: 'gpt-image-2', capability: 'image', name: 'GPT Image 2', kept: true },
      { id: 'sora-2', capability: 'video', name: 'Sora 2 (text/image to video)', kept: true },
    ],
  },
  {
    id: 'krea',
    name: 'Krea',
    description: 'Image, video and 3D generation.',
    endpoint: { format: 'custom', baseUrl: 'https://api.krea.ai/v1' },
    capabilities: ['image', 'video', '3d'],
    models: [
      { id: 'krea-2-medium', capability: 'image', name: 'Krea 2 Medium', kept: true },
      { id: 'krea-2-large', capability: 'image', name: 'Krea 2 Large', kept: true },
      { id: 'nano-banana-2', capability: 'image', name: 'Nano Banana 2', kept: true },
      { id: 'flux-1.1-pro', capability: 'image', name: 'Flux 1.1 Pro', kept: false },
      { id: 'veo-3.1', capability: 'video', name: 'Veo 3.1', kept: true },
      { id: 'kling-2.5', capability: 'video', name: 'Kling 2.5', kept: true },
      { id: 'wan-2.5', capability: 'video', name: 'Wan 2.5', kept: false },
      { id: 'hunyuan3d-2-mini-turbo', capability: '3d', name: 'Hunyuan3D 2 Mini Turbo', kept: true },
      { id: 'trellis-2', capability: '3d', name: 'Trellis 2', kept: false },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (local)',
    description: 'Local models, no key needed — chat, reasoning, vision.',
    endpoint: { format: 'openai', baseUrl: 'http://localhost:11434/v1' },
    capabilities: ['chat', 'reasoning'],
    models: [
      { id: 'llama3.2:3b', capability: 'chat', name: 'Llama 3.2 3B', kept: true },
      { id: 'qwen2.5:7b', capability: 'chat', name: 'Qwen 2.5 7B', kept: true },
      { id: 'deepseek-r1:8b', capability: 'reasoning', name: 'DeepSeek R1 8B', kept: true },
      { id: 'llama3.2-vision', capability: 'chat', name: 'Llama 3.2 Vision', kept: false },
    ],
  },
]

/** Simulated fetched model lists, keyed by provider id (mirrors the story's FETCHED). */
const FETCHED: Record<string, ProviderModel[]> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p.models]),
)

/** Seeded providers mirror the panel's initial state: DeepSeek configured,
 * Krea added without a key, plus a local (keyless) Ollama custom provider. */
const PROVIDERS: ProviderConfig[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Chat and reasoning. Cheap and strong at coding. No vision API.',
    kind: 'catalog',
    endpoint: { format: 'deepseek', baseUrl: 'https://api.deepseek.com' },
    capabilities: ['chat', 'reasoning'],
    models: [],
    modelsFetched: false,
    defaultModelId: 'deepseek-v4-flash',
    keyStatus: 'valid',
    status: 'ready',
  },
  {
    id: 'krea',
    name: 'Krea',
    description: 'Image, video and 3D generation.',
    kind: 'catalog',
    endpoint: { format: 'custom', baseUrl: 'https://api.krea.ai/v1' },
    capabilities: ['image', 'video', '3d'],
    models: [],
    modelsFetched: false,
    keyStatus: 'unset',
    status: 'unconfigured',
  },
  {
    id: 'ollama',
    name: 'Ollama (local)',
    kind: 'custom',
    endpoint: { format: 'openai', baseUrl: 'http://localhost:11434/v1' },
    capabilities: ['chat', 'reasoning'],
    models: FETCHED['ollama'] ?? [],
    modelsFetched: true,
    defaultModelId: 'llama3.2:3b',
    keyStatus: 'unset',
    status: 'local',
  },
]

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

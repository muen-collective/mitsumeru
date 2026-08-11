/**
 * Mock provider registry (UI lane) — hardcoded catalog presets + fetched
 * model lists. Grounded in claire-ai `ai/providerCatalog.ts` + the provider
 * panel's FETCHED table. Read-only catalog; `fetchModels` simulates the
 * real adapter's pull (epic 10 §6).
 */
import type { ProviderAdapter } from '../ports'
import type { ProviderConfig, ProviderModel, ProviderPreset } from '../../contracts/provider'

const PRESETS: ProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Chat, vision and reasoning. Cheap and strong at coding.',
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
    description: 'Vision + text — chat and reasoning models.',
    endpoint: { format: 'openai', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
    capabilities: ['chat', 'reasoning'],
    models: [
      { id: 'qwen3.7-plus', capability: 'chat', name: 'Qwen3.7 Plus', kept: true },
      { id: 'qwen3.5-max', capability: 'chat', name: 'Qwen3.5 Max', kept: false },
      { id: 'qwen3-turbo', capability: 'chat', name: 'Qwen3 Turbo', kept: true },
    ],
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    description: 'Text generation.',
    endpoint: { format: 'openai', baseUrl: 'https://api.minimax.chat/v1' },
    capabilities: ['chat'],
    models: [{ id: 'minimax-m2.7', capability: 'chat', name: 'MiniMax M2.7', kept: true }],
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    description: 'Vision + text.',
    endpoint: { format: 'openai', baseUrl: 'https://api.moonshot.cn/v1' },
    capabilities: ['chat', 'reasoning'],
    models: [{ id: 'kimi-k3', capability: 'chat', name: 'Kimi K3', kept: true }],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models + GPT Image 2.',
    endpoint: { format: 'openai', baseUrl: 'https://api.openai.com/v1' },
    capabilities: ['chat', 'reasoning', 'image'],
    models: [
      { id: 'gpt-5.6-luna', capability: 'chat', name: 'GPT-5.6 Luna', kept: true },
      { id: 'gpt-5.6-sol', capability: 'reasoning', name: 'GPT-5.6 Sol', kept: true },
      { id: 'gpt-image-2', capability: 'image', name: 'GPT Image 2', kept: true },
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
      { id: 'krea-2-medium-turbo', capability: 'image', name: 'Krea 2 Medium Turbo', kept: true },
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
    description: 'Local models, no key needed.',
    endpoint: { format: 'openai', baseUrl: 'http://localhost:11434/v1' },
    capabilities: ['chat', 'reasoning'],
    models: [
      { id: 'llama3.2:3b', capability: 'chat', name: 'Llama 3.2 3B', kept: true },
      { id: 'qwen2.5:7b', capability: 'chat', name: 'Qwen 2.5 7B', kept: true },
      { id: 'deepseek-r1:8b', capability: 'reasoning', name: 'DeepSeek R1 8B', kept: true },
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
    description: 'Chat, vision and reasoning. Cheap and strong at coding.',
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

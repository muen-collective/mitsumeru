/**
 * Mock provider registry (UI lane) — hardcoded catalog presets.
 * Grounded in claire-ai `ai/providerCatalog.ts` + MitsuProvidersPanel initial
 * state. Read-only, matches the catalog (epic 10 §6).
 */
import type { ProviderAdapter } from '../ports'
import type { ProviderConfig, ProviderPreset } from '../../contracts/provider'

const PRESETS: ProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Chat, vision and reasoning. Cheap and strong at coding.',
    endpoint: { format: 'deepseek', baseUrl: 'https://api.deepseek.com' },
    capabilities: ['chat', 'reasoning'],
    models: [
      { id: 'deepseek-v4-flash', capability: 'chat', name: 'DeepSeek V4 Flash' },
      { id: 'deepseek-v4-pro', capability: 'chat', name: 'DeepSeek V4 Pro' },
    ],
  },
  {
    id: 'qwen',
    name: 'Qwen (DashScope)',
    description: 'Vision + text — chat and reasoning models.',
    endpoint: { format: 'openai', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
    capabilities: ['chat', 'reasoning'],
    models: [
      { id: 'qwen3.7-plus', capability: 'chat', name: 'Qwen3.7 Plus' },
      { id: 'qwen3.5-max', capability: 'chat', name: 'Qwen3.5 Max' },
      { id: 'qwen3-turbo', capability: 'chat', name: 'Qwen3 Turbo' },
    ],
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    description: 'Text generation.',
    endpoint: { format: 'openai', baseUrl: 'https://api.minimax.chat/v1' },
    capabilities: ['chat'],
    models: [{ id: 'minimax-m2.7', capability: 'chat', name: 'MiniMax M2.7' }],
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    description: 'Vision + text.',
    endpoint: { format: 'openai', baseUrl: 'https://api.moonshot.cn/v1' },
    capabilities: ['chat', 'reasoning'],
    models: [{ id: 'kimi-k3', capability: 'chat', name: 'Kimi K3' }],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models + GPT Image 2.',
    endpoint: { format: 'openai', baseUrl: 'https://api.openai.com/v1' },
    capabilities: ['chat', 'reasoning', 'image'],
    models: [
      { id: 'gpt-5.6-luna', capability: 'chat', name: 'GPT-5.6 Luna' },
      { id: 'gpt-5.6-sol', capability: 'reasoning', name: 'GPT-5.6 Sol' },
      { id: 'gpt-image-2', capability: 'image', name: 'GPT Image 2' },
    ],
  },
  {
    id: 'krea',
    name: 'Krea',
    description: 'Image, video and 3D generation.',
    endpoint: { format: 'custom', baseUrl: 'https://api.krea.ai/v1' },
    capabilities: ['image', 'video', '3d'],
    models: [],
  },
]

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
    models: [
      { id: 'deepseek-v4-flash', capability: 'chat', name: 'DeepSeek V4 Flash' },
      { id: 'deepseek-v4-pro', capability: 'chat', name: 'DeepSeek V4 Pro' },
    ],
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
    keyStatus: 'unset',
    status: 'unconfigured',
  },
  {
    id: 'ollama',
    name: 'Ollama (local)',
    kind: 'custom',
    endpoint: { format: 'openai', baseUrl: 'http://localhost:11434/v1' },
    capabilities: ['chat', 'reasoning'],
    models: [{ id: 'llama-3.3-70b', capability: 'chat', name: 'Llama 3.3 70B' }],
    defaultModelId: 'llama-3.3-70b',
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
  }
}

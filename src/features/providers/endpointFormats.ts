/**
 * Endpoint formats for custom providers (researched 2026-08-10, claire-ai
 * ENDPOINT_FORMATS): base URL + request path. OpenAI-compatible
 * (/v1/chat/completions) is the de-facto standard; Anthropic uses /v1/messages.
 */
export interface EndpointFormat {
  id: string
  label: string
  base: string
  path: string
}

export const ENDPOINT_FORMATS: EndpointFormat[] = [
  { id: 'openai', label: 'OpenAI compatible', base: 'https://api.openai.com/v1', path: '/chat/completions' },
  { id: 'deepseek', label: 'DeepSeek', base: 'https://api.deepseek.com', path: '/chat/completions' },
  { id: 'anthropic', label: 'Anthropic', base: 'https://api.anthropic.com/v1', path: '/messages' },
  { id: 'google', label: 'Google Gemini', base: 'https://generativelanguage.googleapis.com/v1beta/openai', path: '/chat/completions' },
  { id: 'moonshot', label: 'Moonshot (Kimi)', base: 'https://api.moonshot.cn/v1', path: '/chat/completions' },
  { id: 'lm-studio', label: 'LM Studio (local)', base: 'http://localhost:1234/v1', path: '/chat/completions' },
  { id: 'minimax', label: 'MiniMax', base: 'https://api.minimax.chat/v1', path: '/text/chatcompletion_v2' },
  { id: 'custom', label: 'Custom', base: '', path: '' },
]

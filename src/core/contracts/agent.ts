/**
 * AgentEvent v0 — agent loop UI + progressive disclosure (Block #4).
 * SSE-shaped (PRD §4.9); the mock yields these on an interval, the real
 * adapter consumes an SSE stream. The fork's CLI-first emission may need a
 * rewrite — Pratap's spike decides (epic 10 §7).
 */
export type AgentEvent =
  | { type: 'thinking'; id: string; text: string; at: string }
  | { type: 'tool_call'; id: string; tool: string; input: Record<string, unknown>; at: string }
  | { type: 'tool_result'; id: string; tool: string; ok: boolean; summary?: string; at: string }
  | { type: 'text_chunk'; id: string; text: string; at: string }
  | { type: 'done'; id: string; at: string }
  | { type: 'error'; id: string; message: string; at: string }

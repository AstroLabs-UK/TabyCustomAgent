/**
 * AI provider interface — pluggable (Groq, OpenAI-compatible, mock).
 * Stage 0: interface + mock only. Live calls land in Stage 3+.
 */

export type AiRole = "system" | "user" | "assistant" | "tool";

export interface AiMessage {
  role: AiRole;
  content: string;
  name?: string;
}

export interface AiStreamChunk {
  type: "token" | "tool_call" | "done" | "error";
  text?: string;
  toolName?: string;
  toolArgs?: unknown;
  error?: string;
}

export interface AiProviderConfig {
  provider: "groq" | "openai-compatible" | "mock";
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature?: number;
}

export interface AiProvider {
  readonly id: string;
  completeStream(
    messages: AiMessage[],
    config: AiProviderConfig,
    signal?: AbortSignal
  ): AsyncIterable<AiStreamChunk>;
}

export const DEFAULT_AI_CONFIG: AiProviderConfig = {
  provider: "mock",
  apiKey: "",
  baseUrl: "https://api.groq.com/openai/v1",
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
};

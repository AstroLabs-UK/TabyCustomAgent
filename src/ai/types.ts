/**
 * AI provider interface — pluggable.
 * Agent name in UX is always "Taby".
 */

export type AiRole = "system" | "user" | "assistant" | "tool";

export interface AiToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface AiMessage {
  role: AiRole;
  content: string;
  name?: string;
  /** Present on tool-result messages */
  tool_call_id?: string;
  /** Present on assistant messages that requested tools */
  tool_calls?: AiToolCall[];
}

export interface AiStreamChunk {
  type: "token" | "tool_call" | "done" | "error";
  text?: string;
  toolName?: string;
  toolArgs?: unknown;
  /** Stable id for this tool call (for multi-step loops) */
  toolCallId?: string;
  error?: string;
}

/** Built-in + future harnesses (all OpenAI-compatible HTTP unless mock). */
export type AiProviderId =
  | "mock"
  | "groq"
  | "openai-compatible"
  | "openclaw"
  | "hermes"
  | "ollama"
  | "custom";

export interface AiProviderConfig {
  provider: AiProviderId;
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

/** Sensible defaults per provider id (user can override baseUrl/model). */
export const PROVIDER_PRESETS: Record<
  AiProviderId,
  { label: string; baseUrl: string; model: string; needsKey: boolean }
> = {
  mock: {
    label: "Mock (offline)",
    baseUrl: "",
    model: "mock",
    needsKey: false,
  },
  groq: {
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    needsKey: true,
  },
  "openai-compatible": {
    label: "OpenAI-compatible",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    needsKey: true,
  },
  openclaw: {
    label: "OpenClaw",
    baseUrl: "http://127.0.0.1:18789/v1",
    model: "openclaw",
    needsKey: false,
  },
  hermes: {
    label: "Hermes",
    baseUrl: "http://127.0.0.1:8080/v1",
    model: "hermes",
    needsKey: false,
  },
  ollama: {
    label: "Ollama",
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "llama3.2",
    needsKey: false,
  },
  custom: {
    label: "Custom endpoint",
    baseUrl: "http://127.0.0.1:8000/v1",
    model: "default",
    needsKey: false,
  },
};

export const DEFAULT_AI_CONFIG: AiProviderConfig = {
  provider: "mock",
  apiKey: "",
  baseUrl: "https://api.groq.com/openai/v1",
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
};

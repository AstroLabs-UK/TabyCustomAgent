import type { AiMessage, AiProvider, AiProviderConfig, AiStreamChunk } from "./types";
import { mockAi } from "./mockProvider";
import { liveAi } from "./openaiCompatibleProvider";

export function selectProvider(config: AiProviderConfig): AiProvider {
  if (config.provider === "mock") return mockAi;
  // groq + openai-compatible share the OpenAI-compatible HTTP client
  return liveAi;
}

/** Validate before live calls. Returns error message or null if OK. */
export function validateLiveConfig(config: AiProviderConfig): string | null {
  if (config.provider === "mock") return null;
  if (!(config.apiKey ?? "").trim()) {
    return "API key is required for live mode.";
  }
  if (!(config.baseUrl ?? "").trim()) {
    return "API endpoint (base URL) is required.";
  }
  if (!(config.model ?? "").trim()) {
    return "Model is required.";
  }
  return null;
}

/**
 * Human-readable connection status for HUD.
 * Never includes the API key.
 */
export function aiStatusLabel(config: AiProviderConfig): string {
  if (config.provider === "mock") return "AI: mock (offline)";
  if (!(config.apiKey ?? "").trim()) return "AI: key missing";
  const host = safeHost(config.baseUrl);
  return `AI: ${config.provider} · ${host}`;
}

export function aiStatusOk(config: AiProviderConfig): boolean {
  if (config.provider === "mock") return true;
  return Boolean((config.apiKey ?? "").trim() && (config.baseUrl ?? "").trim());
}

function safeHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).host || "endpoint";
  } catch {
    return "endpoint";
  }
}

export async function* completeStream(
  messages: AiMessage[],
  config: AiProviderConfig,
  signal?: AbortSignal
): AsyncIterable<AiStreamChunk> {
  const err = validateLiveConfig(config);
  if (err) {
    yield { type: "error", error: err };
    return;
  }
  const provider = selectProvider(config);
  yield* provider.completeStream(messages, config, signal);
}

/** Test helper: ensure a string does not contain the key (logging safety). */
export function assertNoKeyInText(text: string, apiKey: string): boolean {
  if (!apiKey) return true;
  return !text.includes(apiKey);
}

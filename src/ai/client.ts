import type { AiMessage, AiProvider, AiProviderConfig, AiStreamChunk } from "./types";
import { PROVIDER_PRESETS } from "./types";
import { mockAi } from "./mockProvider";
import { liveAi } from "./openaiCompatibleProvider";

export function selectProvider(config: AiProviderConfig): AiProvider {
  if (config.provider === "mock") return mockAi;
  // All other harnesses speak OpenAI-compatible chat completions
  return liveAi;
}

export function validateLiveConfig(config: AiProviderConfig): string | null {
  if (config.provider === "mock") return null;
  const preset = PROVIDER_PRESETS[config.provider];
  if (preset?.needsKey && !config.apiKey.trim()) {
    return "API key required for this provider";
  }
  if (!config.baseUrl.trim()) return "API endpoint required";
  if (!config.model.trim()) return "Model required";
  return null;
}

export function aiStatusLabel(config: AiProviderConfig): string {
  if (config.provider === "mock") return "AI: mock (offline)";
  let host = config.baseUrl;
  try {
    host = new URL(config.baseUrl).host;
  } catch {
    /* keep raw */
  }
  const label = PROVIDER_PRESETS[config.provider]?.label ?? config.provider;
  return `AI: ${label} · ${host}`;
}

export function aiStatusOk(config: AiProviderConfig): boolean {
  if (config.provider === "mock") return true;
  return validateLiveConfig(config) === null;
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

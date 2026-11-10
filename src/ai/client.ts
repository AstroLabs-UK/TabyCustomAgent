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
  if (config.provider === "mock") return "AI: mock";
  const label = PROVIDER_PRESETS[config.provider]?.label ?? config.provider;
  let host = "";
  try {
    const u = new URL(config.baseUrl);
    host = u.hostname;
    if (host === "127.0.0.1" || host === "localhost") {
      // Avoid ugly "localhost:port" in the HUD chrome
      return `AI: ${label}`;
    }
    if (u.port && u.port !== "80" && u.port !== "443") {
      host = `${host}`;
    }
  } catch {
    host = "";
  }
  return host ? `AI: ${label} · ${host}` : `AI: ${label}`;
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

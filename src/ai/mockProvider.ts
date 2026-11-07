import type { AiMessage, AiProvider, AiProviderConfig, AiStreamChunk } from "./types";

export class MockAiProvider implements AiProvider {
  readonly id = "mock";

  async *completeStream(
    messages: AiMessage[],
    _config: AiProviderConfig,
    signal?: AbortSignal
  ): AsyncIterable<AiStreamChunk> {
    if (signal?.aborted) {
      yield { type: "error", error: "aborted" };
      return;
    }
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const reply = lastUser
      ? `Mock reply to: "${lastUser.content.slice(0, 80)}"`
      : "Mock assistant ready.";
    const tokens = reply.split(/(\s+)/);
    for (const t of tokens) {
      if (signal?.aborted) {
        yield { type: "error", error: "aborted" };
        return;
      }
      yield { type: "token", text: t };
      await delay(5);
    }
    yield { type: "done" };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const mockAi = new MockAiProvider();

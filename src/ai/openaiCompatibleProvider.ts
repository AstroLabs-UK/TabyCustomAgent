import type { AiMessage, AiProvider, AiProviderConfig, AiStreamChunk } from "./types";

/**
 * Live OpenAI-compatible chat completions (Groq, OpenAI, etc.).
 * Streams SSE `data:` lines; never logs the API key.
 */
export class OpenAiCompatibleProvider implements AiProvider {
  readonly id = "openai-compatible";

  async *completeStream(
    messages: AiMessage[],
    config: AiProviderConfig,
    signal?: AbortSignal
  ): AsyncIterable<AiStreamChunk> {
    const key = (config.apiKey ?? "").trim();
    if (!key) {
      yield {
        type: "error",
        error: "API key is required for live mode. Add it in Settings.",
      };
      return;
    }

    const base = (config.baseUrl || "https://api.groq.com/openai/v1").replace(/\/$/, "");
    const url = `${base}/chat/completions`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: config.model,
          temperature: config.temperature ?? 0.7,
          stream: true,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Never include headers/key in error text
      yield { type: "error", error: `Network error: ${msg}` };
      return;
    }

    if (!response.ok) {
      let detail = `${response.status} ${response.statusText}`;
      try {
        const t = await response.text();
        // Redact any accidental key echo
        detail = t.slice(0, 200).replace(key, "[redacted]");
      } catch {
        /* ignore */
      }
      yield { type: "error", error: `API error: ${detail}` };
      return;
    }

    if (!response.body) {
      yield { type: "error", error: "Empty response body" };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        if (signal?.aborted) {
          yield { type: "error", error: "aborted" };
          return;
        }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") {
            yield { type: "done" };
            return;
          }
          try {
            const json = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const token = json.choices?.[0]?.delta?.content;
            if (token) yield { type: "token", text: token };
          } catch {
            /* skip malformed chunk */
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    yield { type: "done" };
  }
}

export const liveAi = new OpenAiCompatibleProvider();

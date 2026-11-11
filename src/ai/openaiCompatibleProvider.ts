import type { AiMessage, AiProvider, AiProviderConfig, AiStreamChunk } from "./types";
import { TOOL_DEFINITIONS } from "../tools/registry";

/**
 * Live OpenAI-compatible chat completions (Groq, OpenAI, etc.).
 * Streams SSE; supports tool_calls when the model emits them.
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

    const base = (config.baseUrl || "https://api.groq.com/openai/v1").replace(
      /\/$/,
      ""
    );
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
          tools: TOOL_DEFINITIONS,
          messages: messages.map((m) => {
            const base: Record<string, unknown> = {
              role: m.role,
              content: m.content ?? "",
            };
            if (m.name) base.name = m.name;
            if (m.role === "tool" && m.tool_call_id) {
              base.tool_call_id = m.tool_call_id;
            }
            if (m.role === "assistant" && m.tool_calls?.length) {
              base.tool_calls = m.tool_calls;
              // Some providers want content null when tool_calls present
              if (!m.content) base.content = null;
            }
            return base;
          }),
        }),
        signal,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      yield { type: "error", error: `Network error: ${msg}` };
      return;
    }

    if (!response.ok) {
      let detail = `${response.status} ${response.statusText}`;
      try {
        const t = await response.text();
        detail = t.slice(0, 240).replace(key, "[redacted]");
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
    const toolBuf: Record<
      number,
      { id: string; name: string; args: string }
    > = {};

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
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data) as {
              choices?: Array<{
                delta?: {
                  content?: string;
                  tool_calls?: Array<{
                    index?: number;
                    id?: string;
                    function?: { name?: string; arguments?: string };
                  }>;
                };
              }>;
            };
            const delta = json.choices?.[0]?.delta;
            if (delta?.content) {
              yield { type: "token", text: delta.content };
            }
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolBuf[idx]) {
                  toolBuf[idx] = {
                    id: tc.id || `call_${idx}_${Date.now()}`,
                    name: "",
                    args: "",
                  };
                }
                if (tc.id) toolBuf[idx].id = tc.id;
                if (tc.function?.name) toolBuf[idx].name += tc.function.name;
                if (tc.function?.arguments)
                  toolBuf[idx].args += tc.function.arguments;
              }
            }
          } catch {
            /* skip partial */
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    for (const tc of Object.values(toolBuf)) {
      if (!tc.name) continue;
      let args: unknown = {};
      try {
        args = tc.args ? JSON.parse(tc.args) : {};
      } catch {
        args = {};
      }
      yield {
        type: "tool_call",
        toolName: tc.name,
        toolArgs: args,
        toolCallId: tc.id,
      };
    }
    yield { type: "done" };
  }
}

export const liveAi = new OpenAiCompatibleProvider();

import { describe, it, expect } from "vitest";
import { MockAiProvider } from "../ai/mockProvider";
import { DEFAULT_AI_CONFIG } from "../ai/types";

describe("MockAiProvider", () => {
  it("streams tokens then done", async () => {
    const ai = new MockAiProvider();
    const chunks: string[] = [];
    let done = false;
    for await (const c of ai.completeStream(
      [{ role: "user", content: "ping" }],
      DEFAULT_AI_CONFIG
    )) {
      if (c.type === "token" && c.text) chunks.push(c.text);
      if (c.type === "done") done = true;
    }
    expect(done).toBe(true);
    expect(chunks.join("")).toContain("ping");
  });
});

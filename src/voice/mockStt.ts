import type { SttProvider, SttResult } from "./types";

export class MockSttProvider implements SttProvider {
  readonly name = "mock";
  async transcribe(_blob: Blob): Promise<SttResult> {
    return { transcript: "Mock transcript from voice input", confidence: 1 };
  }
}

export const mockStt = new MockSttProvider();

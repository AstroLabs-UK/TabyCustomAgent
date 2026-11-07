import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  resetSettings,
  setStorageBackend,
} from "../settings";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
}

describe("settings store", () => {
  beforeEach(() => {
    setStorageBackend(memoryStorage());
    resetSettings();
  });

  it("returns defaults when empty", () => {
    const s = loadSettings();
    expect(s.hud.dwellMs).toBe(500);
    expect(s.ai.provider).toBe("mock");
    expect(s.ai.baseUrl).toContain("groq.com");
  });

  it("round-trips save/load", () => {
    const next = structuredClone(DEFAULT_SETTINGS);
    next.ai.apiKey = "test-key-not-real";
    next.ai.baseUrl = "https://example.com/v1";
    next.hud.dwellMs = 600;
    saveSettings(next);
    const loaded = loadSettings();
    expect(loaded.ai.apiKey).toBe("test-key-not-real");
    expect(loaded.ai.baseUrl).toBe("https://example.com/v1");
    expect(loaded.hud.dwellMs).toBe(600);
  });
});

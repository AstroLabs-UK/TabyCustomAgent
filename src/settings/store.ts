import { DEFAULT_SETTINGS, type AppSettings } from "./types";
import { loadApiKey, saveApiKey } from "./secureStore";

const STORAGE_KEY = "taby-custom-agent-settings";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function getStorage(): StorageLike {
  if (typeof localStorage !== "undefined") return localStorage;
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

let storage: StorageLike = getStorage();

/** Test helper */
export function setStorageBackend(backend: StorageLike): void {
  storage = backend;
}

export function loadSettings(): AppSettings {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const base = structuredClone(DEFAULT_SETTINGS);
    if (!raw) {
      base.ai.apiKey = loadApiKey();
      return base;
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    // Prefer dedicated secure store for apiKey; fall back to legacy field once
    const legacyKey =
      typeof parsed.ai?.apiKey === "string" ? parsed.ai.apiKey : "";
    const secureKey = loadApiKey();
    const apiKey = secureKey || legacyKey;
    return {
      ...base,
      ...parsed,
      ai: { ...base.ai, ...parsed.ai, apiKey },
      hud: { ...base.hud, ...parsed.hud },
      device: { ...base.device, ...parsed.device },
    };
  } catch {
    const base = structuredClone(DEFAULT_SETTINGS);
    base.ai.apiKey = loadApiKey();
    return base;
  }
}

export function saveSettings(settings: AppSettings): void {
  // Persist API key only in secure store — strip from general JSON
  saveApiKey(settings.ai.apiKey ?? "");
  const publicCopy = structuredClone(settings);
  publicCopy.ai.apiKey = "";
  storage.setItem(STORAGE_KEY, JSON.stringify(publicCopy));
}

export function resetSettings(): void {
  storage.removeItem(STORAGE_KEY);
}

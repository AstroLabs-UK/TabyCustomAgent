import { DEFAULT_SETTINGS, type AppSettings } from "./types";

const STORAGE_KEY = "taby-custom-agent-settings";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function getStorage(): StorageLike {
  if (typeof localStorage !== "undefined") return localStorage;
  // Node / test fallback
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
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...structuredClone(DEFAULT_SETTINGS),
      ...parsed,
      ai: { ...DEFAULT_SETTINGS.ai, ...parsed.ai },
      hud: { ...DEFAULT_SETTINGS.hud, ...parsed.hud },
      device: { ...DEFAULT_SETTINGS.device, ...parsed.device },
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings: AppSettings): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resetSettings(): void {
  storage.removeItem(STORAGE_KEY);
}

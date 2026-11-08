/**
 * Sensitive settings storage.
 * Stage 3: localStorage under a dedicated key (never logged).
 * Later: OS keychain / Tauri stronghold.
 */

const SECURE_KEY = "taby-custom-agent-secure";

export type SecureBlob = {
  apiKey: string;
};

export type SecureStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function backend(): SecureStorageLike {
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

let store: SecureStorageLike = backend();

export function setSecureStorageBackend(b: SecureStorageLike): void {
  store = b;
}

export function loadApiKey(): string {
  try {
    const raw = store.getItem(SECURE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as SecureBlob;
    return typeof parsed.apiKey === "string" ? parsed.apiKey : "";
  } catch {
    return "";
  }
}

export function saveApiKey(apiKey: string): void {
  const blob: SecureBlob = { apiKey };
  store.setItem(SECURE_KEY, JSON.stringify(blob));
}

export function clearApiKey(): void {
  store.removeItem(SECURE_KEY);
}

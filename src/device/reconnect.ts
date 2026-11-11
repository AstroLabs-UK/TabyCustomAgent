/**
 * Exponential reconnect backoff for BLE / Wi‑Fi.
 * Pure logic — unit tested with fake clock.
 */

export type BackoffOptions = {
  /** Initial delay ms (default 500) */
  baseMs?: number;
  /** Cap delay ms (default 30000) */
  maxMs?: number;
  /** Multiplier (default 2) */
  factor?: number;
  /** Max attempts before giving up (default 8) */
  maxAttempts?: number;
};

export type BackoffState = {
  attempt: number;
  nextDelayMs: number;
  exhausted: boolean;
};

export function initialBackoff(opts: BackoffOptions = {}): BackoffState {
  const baseMs = opts.baseMs ?? 500;
  return { attempt: 0, nextDelayMs: baseMs, exhausted: false };
}

/** Advance after a failed connect; returns delay to wait before next try */
export function nextBackoff(
  state: BackoffState,
  opts: BackoffOptions = {}
): BackoffState {
  const baseMs = opts.baseMs ?? 500;
  const maxMs = opts.maxMs ?? 30_000;
  const factor = opts.factor ?? 2;
  const maxAttempts = opts.maxAttempts ?? 8;
  const attempt = state.attempt + 1;
  if (attempt >= maxAttempts) {
    return { attempt, nextDelayMs: 0, exhausted: true };
  }
  const raw = baseMs * Math.pow(factor, attempt - 1);
  const nextDelayMs = Math.min(maxMs, Math.round(raw));
  return { attempt, nextDelayMs, exhausted: false };
}

export function resetBackoff(opts: BackoffOptions = {}): BackoffState {
  return initialBackoff(opts);
}

/**
 * Run connect with retries. `connectOnce` should throw on failure.
 * `sleep` injected for tests.
 */
export async function connectWithBackoff(
  connectOnce: () => Promise<void>,
  opts: BackoffOptions = {},
  sleep: (ms: number) => Promise<void> = (ms) =>
    new Promise((r) => setTimeout(r, ms))
): Promise<{ ok: boolean; attempts: number; error?: string }> {
  let state = initialBackoff(opts);
  let lastErr = "";
  while (!state.exhausted) {
    try {
      await connectOnce();
      return { ok: true, attempts: state.attempt + 1 };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      state = nextBackoff(state, opts);
      if (state.exhausted) break;
      await sleep(state.nextDelayMs);
    }
  }
  return { ok: false, attempts: state.attempt, error: lastErr };
}

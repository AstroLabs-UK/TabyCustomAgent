import { dbGet, dbSet, newId, dayKey } from "../data/localDb";

const KEY = "taby-focus-sessions";

export type FocusSession = {
  id: string;
  durationSec: number;
  startedAt: number;
  endedAt?: number;
  completed: boolean;
};

export type FocusPhase = "idle" | "running" | "paused" | "done";

export function loadFocusSessions(): FocusSession[] {
  return dbGet<FocusSession[]>(KEY, []);
}

export function saveFocusSessions(s: FocusSession[]): void {
  dbSet(KEY, s);
}

export function startFocusSession(durationSec: number, now = Date.now()): FocusSession {
  const s: FocusSession = {
    id: newId("focus"),
    durationSec,
    startedAt: now,
    completed: false,
  };
  const all = loadFocusSessions();
  all.unshift(s);
  saveFocusSessions(all);
  return s;
}

export function completeFocusSession(
  id: string,
  now = Date.now()
): FocusSession | null {
  const all = loadFocusSessions();
  const i = all.findIndex((s) => s.id === id);
  if (i < 0) return null;
  all[i] = { ...all[i], endedAt: now, completed: true };
  saveFocusSessions(all);
  return all[i];
}

export function remainingSec(
  session: FocusSession,
  now = Date.now()
): number {
  const elapsed = Math.floor((now - session.startedAt) / 1000);
  return Math.max(0, session.durationSec - elapsed);
}

export function focusMinutesToday(now = new Date()): number {
  const k = dayKey(now);
  return loadFocusSessions()
    .filter((s) => s.completed && dayKey(new Date(s.endedAt ?? s.startedAt)) === k)
    .reduce((acc, s) => acc + Math.round(s.durationSec / 60), 0);
}

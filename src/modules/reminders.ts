import { dbGet, dbSet, newId } from "../data/localDb";

const KEY = "taby-reminders";

export type Reminder = {
  id: string;
  title: string;
  fireAt: number; // epoch ms
  fired: boolean;
  dismissed: boolean;
  faceNudge?: boolean;
  createdAt: number;
};

export type Clock = () => number;

export function loadReminders(): Reminder[] {
  return dbGet<Reminder[]>(KEY, []);
}

export function saveReminders(list: Reminder[]): void {
  dbSet(KEY, list);
}

export function scheduleReminder(
  title: string,
  fireAt: number,
  faceNudge = true
): Reminder {
  const r: Reminder = {
    id: newId("rem"),
    title: title.trim(),
    fireAt,
    fired: false,
    dismissed: false,
    faceNudge,
    createdAt: Date.now(),
  };
  const all = loadReminders();
  all.push(r);
  saveReminders(all);
  return r;
}

export function dismissReminder(id: string): void {
  const all = loadReminders().map((r) =>
    r.id === id ? { ...r, dismissed: true } : r
  );
  saveReminders(all);
}

/** Fire due reminders at `now` (injectable clock). */
export function tickReminders(now: number = Date.now()): Reminder[] {
  const fired: Reminder[] = [];
  const all = loadReminders().map((r) => {
    if (!r.fired && !r.dismissed && r.fireAt <= now) {
      const next = { ...r, fired: true };
      fired.push(next);
      return next;
    }
    return r;
  });
  if (fired.length) saveReminders(all);
  return fired;
}

export function upcomingReminders(now = Date.now()): Reminder[] {
  return loadReminders()
    .filter((r) => !r.dismissed && (!r.fired || r.fireAt > now - 60_000))
    .sort((a, b) => a.fireAt - b.fireAt);
}


export function updateReminder(
  id: string,
  patch: Partial<Pick<Reminder, "title" | "fireAt" | "faceNudge">>
): Reminder | null {
  const all = loadReminders();
  const i = all.findIndex((r) => r.id === id);
  if (i < 0) return null;
  all[i] = { ...all[i], ...patch };
  saveReminders(all);
  return all[i];
}

export function findReminder(query: string): Reminder | undefined {
  const q = query.trim().toLowerCase();
  const all = loadReminders().filter((r) => !r.dismissed);
  return (
    all.find((r) => r.id === query) ||
    all.find((r) => r.title.toLowerCase() === q) ||
    all.find((r) => r.title.toLowerCase().includes(q))
  );
}

export function deleteReminder(id: string): void {
  saveReminders(loadReminders().filter((r) => r.id !== id));
}

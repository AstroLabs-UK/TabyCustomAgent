import { dbGet, dbSet, newId } from "../data/localDb";

const KEY = "taby-reminders";
const WELLNESS_KEY = "taby-wellness-toggles";

export type Reminder = {
  id: string;
  title: string;
  fireAt: number; // epoch ms
  fired: boolean;
  dismissed: boolean;
  faceNudge?: boolean;
  createdAt: number;
};

export type WellnessToggleId = "drink_water" | "sit_up_straight";

export type WellnessToggle = {
  id: WellnessToggleId;
  title: string;
  /** Repeat interval while enabled. */
  intervalMs: number;
  enabled: boolean;
  faceNudge: boolean;
  /** Preferred Taby face animation id when this fires. */
  faceAnimation: string;
  /** Next time this toggle should fire; null when disabled. */
  nextFireAt: number | null;
};

export type Clock = () => number;

const DEFAULT_WELLNESS: WellnessToggle[] = [
  {
    id: "drink_water",
    title: "Drink water",
    intervalMs: 60 * 60_000,
    enabled: false,
    faceNudge: true,
    faceAnimation: "drink_water",
    nextFireAt: null,
  },
  {
    id: "sit_up_straight",
    title: "Sit up straight",
    intervalMs: 60 * 60_000,
    enabled: false,
    faceNudge: true,
    faceAnimation: "posture_check",
    nextFireAt: null,
  },
];

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

/** Fire due one-shot reminders at `now` (injectable clock). */
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

// ——— Wellness / default recurring toggles ————————————————————————————

function mergeWellnessDefaults(
  stored: WellnessToggle[] | null | undefined
): WellnessToggle[] {
  const byId = new Map((stored ?? []).map((t) => [t.id, t]));
  return DEFAULT_WELLNESS.map((d) => {
    const prev = byId.get(d.id);
    if (!prev) return { ...d };
    const intervalMs =
      typeof prev.intervalMs === "number" && prev.intervalMs >= 60_000
        ? prev.intervalMs
        : d.intervalMs;
    return {
      ...d,
      enabled: Boolean(prev.enabled),
      faceNudge: prev.faceNudge !== false,
      intervalMs,
      nextFireAt:
        prev.enabled && typeof prev.nextFireAt === "number"
          ? prev.nextFireAt
          : prev.enabled
            ? Date.now() + intervalMs
            : null,
      title: d.title,
      faceAnimation: d.faceAnimation,
    };
  });
}


export function loadWellnessToggles(): WellnessToggle[] {
  const raw = dbGet<WellnessToggle[] | null>(WELLNESS_KEY, null);
  return mergeWellnessDefaults(raw);
}

export function saveWellnessToggles(list: WellnessToggle[]): void {
  dbSet(WELLNESS_KEY, list);
}

/** Enable/disable a preset; when enabling, schedules first fire after one interval. */
export function setWellnessEnabled(
  id: WellnessToggleId,
  enabled: boolean,
  now = Date.now()
): WellnessToggle[] {
  const list = loadWellnessToggles().map((t) => {
    if (t.id !== id) return t;
    if (!enabled) {
      return { ...t, enabled: false, nextFireAt: null };
    }
    return {
      ...t,
      enabled: true,
      nextFireAt: now + t.intervalMs,
    };
  });
  saveWellnessToggles(list);
  return list;
}

/** Update interval (ms). Minimum 1 minute. Reschedules next fire if enabled. */
export function setWellnessInterval(
  id: WellnessToggleId,
  intervalMs: number,
  now = Date.now()
): WellnessToggle[] {
  const ms = Math.max(60_000, Math.round(intervalMs));
  const list = loadWellnessToggles().map((t) => {
    if (t.id !== id) return t;
    return {
      ...t,
      intervalMs: ms,
      nextFireAt: t.enabled ? now + ms : null,
    };
  });
  saveWellnessToggles(list);
  return list;
}

/**
 * Fire due wellness toggles and push nextFireAt forward by intervalMs.
 * Returns synthetic Reminder-shaped objects so existing UI/status can reuse them.
 */
export function tickWellness(now: number = Date.now()): Reminder[] {
  const fired: Reminder[] = [];
  let changed = false;
  const list = loadWellnessToggles().map((t) => {
    if (!t.enabled || t.nextFireAt == null || t.nextFireAt > now) return t;
    // Catch up if the app was closed for a long time: schedule next from now
    let next = t.nextFireAt + t.intervalMs;
    while (next <= now) next += t.intervalMs;
    changed = true;
    fired.push({
      id: `wellness:${t.id}:${t.nextFireAt}`,
      title: t.title,
      fireAt: t.nextFireAt,
      fired: true,
      dismissed: false,
      faceNudge: t.faceNudge,
      createdAt: t.nextFireAt,
    });
    return { ...t, nextFireAt: next };
  });
  if (changed) saveWellnessToggles(list);
  return fired;
}

/** One-shot reminders + wellness presets that are due. */
export function tickAllReminders(now: number = Date.now()): Reminder[] {
  return [...tickReminders(now), ...tickWellness(now)];
}

export function formatInterval(ms: number): string {
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `every ${mins} min`;
  const hours = mins / 60;
  if (Number.isInteger(hours)) {
    return hours === 1 ? "every hour" : `every ${hours} hours`;
  }
  return `every ${mins} min`;
}

/** Map a fired reminder to the best Taby face animation id. */
export function resolveFaceAnimationForReminder(r: Reminder): string | null {
  if (!r.faceNudge) return null;
  if (r.id.startsWith("wellness:")) {
    const wellnessId = r.id.split(":")[1] as WellnessToggleId;
    const preset = DEFAULT_WELLNESS.find((t) => t.id === wellnessId);
    if (preset?.faceAnimation) return preset.faceAnimation;
  }
  // Generic one-shot reminders: friendly acknowledgment
  return "confirmation";
}

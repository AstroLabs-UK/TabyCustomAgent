import { dbGet, dbSet, newId, dayKey, addDays } from "../data/localDb";

const KEY = "taby-habits";

export type Habit = {
  id: string;
  title: string;
  /** day keys YYYY-MM-DD when checked */
  checks: string[];
  createdAt: number;
};

export function loadHabits(): Habit[] {
  return dbGet<Habit[]>(KEY, []);
}

export function saveHabits(h: Habit[]): void {
  dbSet(KEY, h);
}

export function createHabit(title: string): Habit {
  const h: Habit = {
    id: newId("habit"),
    title: title.trim(),
    checks: [],
    createdAt: Date.now(),
  };
  const all = loadHabits();
  all.unshift(h);
  saveHabits(all);
  return h;
}

export function toggleHabitCheck(
  id: string,
  day = dayKey(),
  checked?: boolean
): Habit | null {
  const all = loadHabits();
  const i = all.findIndex((h) => h.id === id);
  if (i < 0) return null;
  const has = all[i].checks.includes(day);
  const should = checked ?? !has;
  let checks = all[i].checks.filter((d) => d !== day);
  if (should) checks = [...checks, day].sort();
  all[i] = { ...all[i], checks };
  saveHabits(all);
  return all[i];
}

export function logHabit(id: string, day = dayKey()): Habit | null {
  return toggleHabitCheck(id, day, true);
}

/** Streak: consecutive days ending today (or yesterday if not yet checked today). */
export function streakFor(habit: Habit, today = new Date()): number {
  let streak = 0;
  let cursor = new Date(today);
  // If today not checked, start from yesterday
  if (!habit.checks.includes(dayKey(cursor))) {
    cursor = addDays(cursor, -1);
  }
  while (habit.checks.includes(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function habitsDueToday(today = new Date()): Habit[] {
  const k = dayKey(today);
  return loadHabits().filter((h) => !h.checks.includes(k));
}

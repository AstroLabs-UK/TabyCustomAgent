import { dbGet, dbSet, newId, dayKey } from "../data/localDb";

const KEY = "taby-tasks";

export type Task = {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string; // YYYY-MM-DD
  createdAt: number;
  completedAt?: number;
  /** Soft-delete: when set, item is in Archive */
  archivedAt?: number;
};

const ARCHIVE_PURGE_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export function loadTasks(): Task[] {
  const all = dbGet<Task[]>(KEY, []);
  // Auto-purge archives older than 5 days
  const cutoff = Date.now() - ARCHIVE_PURGE_MS;
  const kept = all.filter(
    (t) => !t.archivedAt || t.archivedAt >= cutoff
  );
  if (kept.length !== all.length) saveTasks(kept);
  return kept;
}

export function saveTasks(tasks: Task[]): void {
  dbSet(KEY, tasks);
}

export function createTask(title: string, dueDate?: string): Task {
  const task: Task = {
    id: newId("task"),
    title: title.trim(),
    done: false,
    dueDate,
    createdAt: Date.now(),
  };
  const all = loadTasks();
  all.unshift(task);
  saveTasks(all);
  return task;
}

export function completeTask(id: string, done = true): Task | null {
  const all = loadTasks();
  const i = all.findIndex((t) => t.id === id);
  if (i < 0) return null;
  all[i] = {
    ...all[i],
    done,
    completedAt: done ? Date.now() : undefined,
  };
  saveTasks(all);
  return all[i];
}

/** Soft-delete → archive. Hard-delete only from archive or purge. */
export function deleteTask(id: string, hard = false): void {
  const all = loadTasks();
  if (hard) {
    saveTasks(all.filter((t) => t.id !== id));
    return;
  }
  const i = all.findIndex((t) => t.id === id);
  if (i < 0) return;
  all[i] = { ...all[i], archivedAt: Date.now() };
  saveTasks(all);
}

export function restoreTask(id: string): Task | null {
  const all = loadTasks();
  const i = all.findIndex((t) => t.id === id);
  if (i < 0) return null;
  const { archivedAt: _, ...rest } = all[i];
  all[i] = { ...rest };
  saveTasks(all);
  return all[i];
}

export function updateTask(
  id: string,
  patch: Partial<Pick<Task, "title" | "dueDate" | "done">>
): Task | null {
  const all = loadTasks();
  const i = all.findIndex((t) => t.id === id);
  if (i < 0) return null;
  const next = { ...all[i], ...patch };
  if (patch.done === true) next.completedAt = Date.now();
  if (patch.done === false) next.completedAt = undefined;
  all[i] = next;
  saveTasks(all);
  return all[i];
}

export function findTask(query: string): Task | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const all = activeTasks();
  return (
    all.find((t) => t.id === query) ||
    all.find((t) => t.title.toLowerCase() === q) ||
    all.find((t) => t.title.toLowerCase().includes(q))
  );
}

export function activeTasks(): Task[] {
  return loadTasks().filter((t) => !t.archivedAt);
}

export function archivedTasks(): Task[] {
  return loadTasks().filter((t) => !!t.archivedAt);
}

export function tasksDueOn(date = new Date()): Task[] {
  const k = dayKey(date);
  return activeTasks().filter((t) => !t.done && t.dueDate === k);
}

export function tasksOpen(): Task[] {
  return activeTasks().filter((t) => !t.done);
}

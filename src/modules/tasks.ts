import { dbGet, dbSet, newId, dayKey } from "../data/localDb";

const KEY = "taby-tasks";

export type Task = {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string; // YYYY-MM-DD
  createdAt: number;
  completedAt?: number;
};

export function loadTasks(): Task[] {
  return dbGet<Task[]>(KEY, []);
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

export function deleteTask(id: string): void {
  saveTasks(loadTasks().filter((t) => t.id !== id));
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
  const all = loadTasks();
  return (
    all.find((t) => t.id === query) ||
    all.find((t) => t.title.toLowerCase() === q) ||
    all.find((t) => t.title.toLowerCase().includes(q))
  );
}


export function tasksDueOn(date = new Date()): Task[] {
  const k = dayKey(date);
  return loadTasks().filter((t) => !t.done && t.dueDate === k);
}

export function tasksOpen(): Task[] {
  return loadTasks().filter((t) => !t.done);
}

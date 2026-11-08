import { createTask, completeTask, loadTasks } from "../modules/tasks";
import { logHabit, loadHabits } from "../modules/habits";
import { createNote } from "../modules/notes";
import { scheduleReminder } from "../modules/reminders";

export type ToolResult = { ok: boolean; message: string; data?: unknown };

export type ToolHandler = (args: Record<string, unknown>) => ToolResult;

const tools: Record<string, ToolHandler> = {
  create_task: (args) => {
    const title = String(args.title ?? "").trim();
    if (!title) return { ok: false, message: "title required" };
    const due = args.dueDate ? String(args.dueDate) : undefined;
    const t = createTask(title, due);
    return { ok: true, message: `Created task ${t.id}`, data: t };
  },
  complete_task: (args) => {
    const id = String(args.id ?? "");
    const t = completeTask(id, true);
    if (!t) return { ok: false, message: "task not found" };
    return { ok: true, message: `Completed ${id}`, data: t };
  },
  list_tasks: () => {
    const data = loadTasks();
    return { ok: true, message: `${data.length} tasks`, data };
  },
  log_habit: (args) => {
    const id = String(args.id ?? "");
    const h = logHabit(id);
    if (!h) return { ok: false, message: "habit not found" };
    return { ok: true, message: `Logged habit ${id}`, data: h };
  },
  list_habits: () => {
    const data = loadHabits();
    return { ok: true, message: `${data.length} habits`, data };
  },
  create_note: (args) => {
    const title = String(args.title ?? "Untitled");
    const body = String(args.body ?? "");
    const n = createNote(title, body);
    return { ok: true, message: `Note ${n.id}`, data: n };
  },
  schedule_reminder: (args) => {
    const title = String(args.title ?? "").trim();
    const fireAt = Number(args.fireAt);
    if (!title || !fireAt) return { ok: false, message: "title and fireAt required" };
    const r = scheduleReminder(title, fireAt, Boolean(args.faceNudge ?? true));
    return { ok: true, message: `Reminder ${r.id}`, data: r };
  },
};

export function listToolNames(): string[] {
  return Object.keys(tools);
}

export function invokeTool(
  name: string,
  args: Record<string, unknown> = {}
): ToolResult {
  const fn = tools[name];
  if (!fn) return { ok: false, message: `unknown tool: ${name}` };
  return fn(args);
}

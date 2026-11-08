import {
  createTask,
  completeTask,
  deleteTask,
  loadTasks,
} from "../modules/tasks";
import { logHabit, loadHabits, createHabit } from "../modules/habits";
import { createNote, deleteNote, loadNotes } from "../modules/notes";
import {
  scheduleReminder,
  dismissReminder,
  loadReminders,
} from "../modules/reminders";
import { startFocusSession, loadFocusSessions } from "../modules/focus";

export type ToolResult = { ok: boolean; message: string; data?: unknown };

export type ToolHandler = (args: Record<string, unknown>) => ToolResult;

const tools: Record<string, ToolHandler> = {
  create_task: (args) => {
    const title = String(args.title ?? "").trim();
    if (!title) return { ok: false, message: "title required" };
    const due = args.dueDate ? String(args.dueDate) : undefined;
    const t = createTask(title, due);
    return { ok: true, message: `Created task “${t.title}”`, data: t };
  },
  complete_task: (args) => {
    const id = String(args.id ?? "");
    const title = String(args.title ?? "").toLowerCase();
    let t = id ? completeTask(id, true) : null;
    if (!t && title) {
      const match = loadTasks().find(
        (x) => !x.done && x.title.toLowerCase().includes(title)
      );
      if (match) t = completeTask(match.id, true);
    }
    if (!t) return { ok: false, message: "task not found" };
    return { ok: true, message: `Completed “${t.title}”`, data: t };
  },
  delete_task: (args) => {
    const id = String(args.id ?? "");
    const title = String(args.title ?? "").toLowerCase();
    let target = id ? loadTasks().find((t) => t.id === id) : undefined;
    if (!target && title) {
      target = loadTasks().find((t) => t.title.toLowerCase().includes(title));
    }
    if (!target) return { ok: false, message: "task not found" };
    deleteTask(target.id);
    return { ok: true, message: `Deleted task “${target.title}”` };
  },
  list_tasks: () => {
    const data = loadTasks();
    return { ok: true, message: `${data.length} tasks`, data };
  },
  log_habit: (args) => {
    const id = String(args.id ?? "");
    const title = String(args.title ?? "").toLowerCase();
    let h = id ? logHabit(id) : null;
    if (!h && title) {
      const match = loadHabits().find((x) =>
        x.title.toLowerCase().includes(title)
      );
      if (match) h = logHabit(match.id);
    }
    if (!h) return { ok: false, message: "habit not found" };
    return { ok: true, message: `Logged habit “${h.title}”`, data: h };
  },
  create_habit: (args) => {
    const title = String(args.title ?? "").trim();
    if (!title) return { ok: false, message: "title required" };
    const h = createHabit(title);
    return { ok: true, message: `Created habit “${h.title}”`, data: h };
  },
  list_habits: () => {
    const data = loadHabits();
    return { ok: true, message: `${data.length} habits`, data };
  },
  create_note: (args) => {
    const title = String(args.title ?? "Untitled");
    const body = String(args.body ?? "");
    const n = createNote(title, body);
    return { ok: true, message: `Note “${n.title}” saved`, data: n };
  },
  list_notes: () => {
    const data = loadNotes();
    return { ok: true, message: `${data.length} notes`, data };
  },
  delete_note: (args) => {
    const id = String(args.id ?? "");
    if (!id) return { ok: false, message: "id required" };
    deleteNote(id);
    return { ok: true, message: `Deleted note ${id}` };
  },
  schedule_reminder: (args) => {
    const title = String(args.title ?? "").trim();
    let fireAt = Number(args.fireAt);
    const inMinutes = Number(args.inMinutes);
    if (!fireAt && inMinutes > 0) fireAt = Date.now() + inMinutes * 60_000;
    if (!title || !fireAt) {
      return { ok: false, message: "title and fireAt or inMinutes required" };
    }
    const r = scheduleReminder(
      title,
      fireAt,
      Boolean(args.faceNudge ?? true)
    );
    return {
      ok: true,
      message: `Reminder “${r.title}” at ${new Date(r.fireAt).toLocaleString()}`,
      data: r,
    };
  },
  list_reminders: () => {
    const data = loadReminders().filter((r) => !r.dismissed);
    return { ok: true, message: `${data.length} reminders`, data };
  },
  dismiss_reminder: (args) => {
    const id = String(args.id ?? "");
    if (!id) return { ok: false, message: "id required" };
    dismissReminder(id);
    return { ok: true, message: `Dismissed ${id}` };
  },
  start_focus: (args) => {
    const minutes = Number(args.minutes ?? 25);
    const sec = Math.max(60, Math.round(minutes * 60));
    const s = startFocusSession(sec);
    return {
      ok: true,
      message: `Focus started for ${minutes} minutes`,
      data: s,
    };
  },
  list_focus_sessions: () => {
    const data = loadFocusSessions().slice(0, 10);
    return { ok: true, message: `${data.length} sessions`, data };
  },
};

export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a to-do task",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          dueDate: { type: "string", description: "YYYY-MM-DD optional" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "complete_task",
      description: "Mark a task complete by id or title substring",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_task",
      description: "Delete a task by id or title",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, title: { type: "string" } },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_tasks",
      description: "List all tasks",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "schedule_reminder",
      description: "Schedule a local reminder",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          inMinutes: { type: "number" },
          fireAt: { type: "number" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_note",
      description: "Save a note",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_habit",
      description: "Create a habit",
      parameters: {
        type: "object",
        properties: { title: { type: "string" } },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "log_habit",
      description: "Check in a habit for today",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, title: { type: "string" } },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "start_focus",
      description: "Start a focus timer session",
      parameters: {
        type: "object",
        properties: {
          minutes: { type: "number", description: "Duration minutes default 25" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_habits",
      description: "List habits",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_reminders",
      description: "List reminders",
      parameters: { type: "object", properties: {} },
    },
  },
];

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

export const SYSTEM_TOOL_PROMPT = `You are Custom Taby Agent, a local desktop assistant.
You can call tools to manage the user's productivity data on this device.
When the user asks to add/remove/complete tasks, schedule reminders, take notes, log habits, or start focus, CALL the appropriate tool.
Available tools: ${Object.keys(tools).join(", ")}.
Be concise. After tools run, confirm what changed in plain language.`;

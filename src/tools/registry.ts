import {
  createTask,
  completeTask,
  deleteTask,
  loadTasks,
  updateTask,
  findTask,
  tasksOpen,
  tasksDueOn,
} from "../modules/tasks";
import {
  logHabit,
  loadHabits,
  createHabit,
  deleteHabit,
  updateHabit,
  findHabit,
  habitsDueToday,
  streakFor,
} from "../modules/habits";
import {
  createNote,
  deleteNote,
  loadNotes,
  updateNote,
  searchNotes,
} from "../modules/notes";
import {
  scheduleReminder,
  dismissReminder,
  loadReminders,
  updateReminder,
  findReminder,
  deleteReminder,
  upcomingReminders,
} from "../modules/reminders";
import {
  startFocusSession,
  loadFocusSessions,
  focusMinutesToday,
} from "../modules/focus";
import { dayKey } from "../data/localDb";
import {
  CATALOG_ANIMATION_IDS,
  GIF_PATHS,
  REACTION_PRESETS,
  gifForAnimationId,
} from "../device/animationMap";
import { FACE_LABELS, publishFaceState } from "../device/faceBus";
import { getDevice } from "../device/registry";

export type ToolResult = {
  ok: boolean;
  message: string;
  data?: unknown;
};

export type ToolHandler = (
  args: Record<string, unknown>
) => ToolResult | Promise<ToolResult>;

function str(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v).trim();
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const tools: Record<string, ToolHandler> = {
  // ── Tasks ──────────────────────────────────────────────────
  list_tasks: (args) => {
    const filter = str(args.filter, "all"); // all | open | done | today
    let data = loadTasks();
    if (filter === "open") data = tasksOpen();
    else if (filter === "done") data = data.filter((t) => t.done);
    else if (filter === "today") data = tasksDueOn(new Date());
    return {
      ok: true,
      message: `${data.length} task(s) [${filter}]`,
      data: data.map((t) => ({
        id: t.id,
        title: t.title,
        done: t.done,
        dueDate: t.dueDate ?? null,
      })),
    };
  },
  create_task: (args) => {
    const title = str(args.title);
    if (!title) return { ok: false, message: "title required" };
    const due = str(args.dueDate) || undefined;
    const t = createTask(title, due);
    return { ok: true, message: `Created task “${t.title}”`, data: t };
  },
  update_task: (args) => {
    const id = str(args.id);
    const titleQ = str(args.title);
    const t = id ? findTask(id) : titleQ ? findTask(titleQ) : undefined;
    if (!t) return { ok: false, message: "task not found" };
    const patch: Parameters<typeof updateTask>[1] = {};
    if (args.newTitle != null) patch.title = str(args.newTitle);
    if (args.dueDate !== undefined) {
      patch.dueDate = str(args.dueDate) || undefined;
    }
    if (args.done !== undefined) patch.done = Boolean(args.done);
    const updated = updateTask(t.id, patch);
    return {
      ok: !!updated,
      message: updated
        ? `Updated task “${updated.title}”`
        : "update failed",
      data: updated,
    };
  },
  complete_task: (args) => {
    const id = str(args.id);
    const title = str(args.title);
    const t0 = id ? findTask(id) : title ? findTask(title) : undefined;
    if (!t0) return { ok: false, message: "task not found" };
    const t = completeTask(t0.id, true);
    return { ok: !!t, message: t ? `Completed “${t.title}”` : "failed", data: t };
  },
  delete_task: (args) => {
    const id = str(args.id);
    const title = str(args.title);
    const t = id ? findTask(id) : title ? findTask(title) : undefined;
    if (!t) return { ok: false, message: "task not found" };
    deleteTask(t.id);
    return { ok: true, message: `Deleted task “${t.title}”` };
  },

  // ── Notes ──────────────────────────────────────────────────
  list_notes: () => {
    const data = loadNotes().map((n) => ({
      id: n.id,
      title: n.title,
      bodyPreview: n.body.slice(0, 160),
      updatedAt: n.updatedAt,
    }));
    return { ok: true, message: `${data.length} note(s)`, data };
  },
  search_notes: (args) => {
    const q = str(args.query);
    if (!q) return { ok: false, message: "query required" };
    const data = searchNotes(q).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body.slice(0, 400),
    }));
    return { ok: true, message: `${data.length} match(es) for “${q}”`, data };
  },
  create_note: (args) => {
    const title = str(args.title, "Untitled");
    const body = str(args.body);
    const n = createNote(title, body);
    return { ok: true, message: `Note “${n.title}” saved`, data: n };
  },
  update_note: (args) => {
    const id = str(args.id);
    const titleQ = str(args.title);
    let n = id ? loadNotes().find((x) => x.id === id) : undefined;
    if (!n && titleQ) {
      n = loadNotes().find((x) =>
        x.title.toLowerCase().includes(titleQ.toLowerCase())
      );
    }
    if (!n) return { ok: false, message: "note not found" };
    const patch: Parameters<typeof updateNote>[1] = {};
    if (args.newTitle != null) patch.title = str(args.newTitle);
    if (args.body != null) patch.body = str(args.body);
    if (args.appendBody) {
      patch.body = `${n.body}\n${str(args.appendBody)}`.trim();
    }
    const updated = updateNote(n.id, patch);
    return {
      ok: !!updated,
      message: updated ? `Updated note “${updated.title}”` : "failed",
      data: updated,
    };
  },
  delete_note: (args) => {
    const id = str(args.id);
    if (!id) return { ok: false, message: "id required" };
    deleteNote(id);
    return { ok: true, message: `Deleted note ${id}` };
  },

  // ── Reminders / calendar-ish ───────────────────────────────
  list_reminders: () => {
    const data = upcomingReminders().map((r) => ({
      id: r.id,
      title: r.title,
      fireAt: r.fireAt,
      when: new Date(r.fireAt).toLocaleString(),
      fired: r.fired,
    }));
    return { ok: true, message: `${data.length} reminder(s)`, data };
  },
  schedule_reminder: (args) => {
    const title = str(args.title);
    let fireAt = num(args.fireAt);
    const inMinutes = num(args.inMinutes);
    const atIso = str(args.at);
    if (!fireAt && inMinutes > 0) fireAt = Date.now() + inMinutes * 60_000;
    if (!fireAt && atIso) {
      const parsed = Date.parse(atIso);
      if (!Number.isNaN(parsed)) fireAt = parsed;
    }
    if (!title || !fireAt) {
      return {
        ok: false,
        message: "title and fireAt, at (ISO), or inMinutes required",
      };
    }
    const r = scheduleReminder(title, fireAt, Boolean(args.faceNudge ?? true));
    return {
      ok: true,
      message: `Reminder “${r.title}” at ${new Date(r.fireAt).toLocaleString()}`,
      data: r,
    };
  },
  update_reminder: (args) => {
    const id = str(args.id);
    const titleQ = str(args.title);
    const r = id ? findReminder(id) : titleQ ? findReminder(titleQ) : undefined;
    if (!r) return { ok: false, message: "reminder not found" };
    const patch: Parameters<typeof updateReminder>[1] = {};
    if (args.newTitle != null) patch.title = str(args.newTitle);
    if (args.fireAt != null) patch.fireAt = num(args.fireAt);
    if (args.at) {
      const parsed = Date.parse(str(args.at));
      if (!Number.isNaN(parsed)) patch.fireAt = parsed;
    }
    if (args.inMinutes != null) {
      patch.fireAt = Date.now() + num(args.inMinutes) * 60_000;
    }
    const updated = updateReminder(r.id, patch);
    return {
      ok: !!updated,
      message: updated
        ? `Updated reminder “${updated.title}”`
        : "failed",
      data: updated,
    };
  },
  dismiss_reminder: (args) => {
    const id = str(args.id);
    const titleQ = str(args.title);
    const r = id ? findReminder(id) : titleQ ? findReminder(titleQ) : undefined;
    if (!r) return { ok: false, message: "reminder not found" };
    dismissReminder(r.id);
    return { ok: true, message: `Dismissed “${r.title}”` };
  },
  delete_reminder: (args) => {
    const id = str(args.id);
    const titleQ = str(args.title);
    const r = id ? findReminder(id) : titleQ ? findReminder(titleQ) : undefined;
    if (!r) return { ok: false, message: "reminder not found" };
    deleteReminder(r.id);
    return { ok: true, message: `Deleted reminder “${r.title}”` };
  },

  // ── Habits ─────────────────────────────────────────────────
  list_habits: () => {
    const data = loadHabits().map((h) => ({
      id: h.id,
      title: h.title,
      streak: streakFor(h),
      checkedToday: h.checks.includes(dayKey()),
    }));
    return { ok: true, message: `${data.length} habit(s)`, data };
  },
  create_habit: (args) => {
    const title = str(args.title);
    if (!title) return { ok: false, message: "title required" };
    const h = createHabit(title);
    return { ok: true, message: `Created habit “${h.title}”`, data: h };
  },
  update_habit: (args) => {
    const id = str(args.id);
    const titleQ = str(args.title);
    const h = id ? findHabit(id) : titleQ ? findHabit(titleQ) : undefined;
    if (!h) return { ok: false, message: "habit not found" };
    const newTitle = str(args.newTitle);
    if (!newTitle) return { ok: false, message: "newTitle required" };
    const updated = updateHabit(h.id, { title: newTitle });
    return {
      ok: !!updated,
      message: updated ? `Renamed habit to “${updated.title}”` : "failed",
      data: updated,
    };
  },
  log_habit: (args) => {
    const id = str(args.id);
    const title = str(args.title);
    const h0 = id ? findHabit(id) : title ? findHabit(title) : undefined;
    if (!h0) return { ok: false, message: "habit not found" };
    const h = logHabit(h0.id);
    return { ok: !!h, message: h ? `Logged “${h.title}”` : "failed", data: h };
  },
  delete_habit: (args) => {
    const id = str(args.id);
    const title = str(args.title);
    const h = id ? findHabit(id) : title ? findHabit(title) : undefined;
    if (!h) return { ok: false, message: "habit not found" };
    deleteHabit(h.id);
    return { ok: true, message: `Deleted habit “${h.title}”` };
  },

  // ── Focus ──────────────────────────────────────────────────
  start_focus: (args) => {
    const minutes = num(args.minutes, 25);
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
    return {
      ok: true,
      message: `${data.length} session(s); ${focusMinutesToday()} focused min today`,
      data,
    };
  },

  // ── Today dashboard ────────────────────────────────────────
  get_today_overview: () => {
    const open = tasksOpen();
    const due = tasksDueOn(new Date());
    const rems = upcomingReminders().slice(0, 8);
    const habits = habitsDueToday();
    const focusMin = focusMinutesToday();
    const data = {
      date: dayKey(),
      openTasks: open.map((t) => t.title),
      dueToday: due.map((t) => t.title),
      reminders: rems.map((r) => ({
        title: r.title,
        when: new Date(r.fireAt).toLocaleString(),
      })),
      habitsStillDue: habits.map((h) => h.title),
      focusMinutesToday: focusMin,
    };
    return {
      ok: true,
      message: `Today: ${due.length} due tasks, ${rems.length} reminders, ${habits.length} habits left, ${focusMin} focus min`,
      data,
    };
  },

  // ── Utilities ──────────────────────────────────────────────
  get_current_time: () => {
    const now = new Date();
    return {
      ok: true,
      message: now.toLocaleString(),
      data: {
        iso: now.toISOString(),
        local: now.toLocaleString(),
        dayKey: dayKey(now),
        weekday: now.toLocaleDateString(undefined, { weekday: "long" }),
      },
    };
  },

  calculate: (args) => {
    const expr = str(args.expression);
    if (!expr) return { ok: false, message: "expression required" };
    // Safe-ish arithmetic only
    if (!/^[\d\s+\-*/().%]+$/.test(expr)) {
      return { ok: false, message: "only numbers and + - * / ( ) % allowed" };
    }
    try {
      // eslint-disable-next-line no-new-func
      const value = Function(`"use strict"; return (${expr});`)();
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return { ok: false, message: "could not evaluate" };
      }
      return { ok: true, message: String(value), data: { expression: expr, value } };
    } catch {
      return { ok: false, message: "invalid expression" };
    }
  },

  open_url: async (args) => {
    const url = str(args.url);
    if (!url) return { ok: false, message: "url required" };
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
      return { ok: true, message: `Opened ${url}` };
    } catch {
      try {
        window.open(url, "_blank");
        return { ok: true, message: `Opened ${url}` };
      } catch {
        return { ok: false, message: `Could not open ${url}` };
      }
    }
  },


  /** Force a Taby face reaction by catalog id or preset mood. */
  play_reaction: (args) => {
    const force = args.force !== false && args.force !== "false";
    let id = String(args.animationId || args.id || "").trim();
    const mood = String(args.mood || args.reaction || "").trim().toLowerCase();
    if (!id && mood) {
      const pool = REACTION_PRESETS[mood] || REACTION_PRESETS.fun;
      id = pool[Math.floor(Math.random() * pool.length)];
    }
    if (!id) {
      return {
        ok: false,
        message:
          "animationId or mood required (moods: " +
          Object.keys(REACTION_PRESETS).join(", ") +
          ")",
      };
    }
    if (!gifForAnimationId(id) && !(id in GIF_PATHS)) {
      // allow unknown ids that exist in catalog list
      if (!(CATALOG_ANIMATION_IDS as readonly string[]).includes(id)) {
        return {
          ok: false,
          message: `Unknown animation “${id}”. Use list_reactions to see options.`,
        };
      }
    }
    const label = FACE_LABELS[id] || id;
    publishFaceState({
      animationId: id,
      label,
      at: Date.now(),
      connected: true,
      force,
    });
    // Also try device play when connected
    try {
      const transport = (String(args.transport || "mock") as
        | "mock"
        | "ble"
        | "usb"
        | "wifi");
      const dev = getDevice(transport);
      void Promise.resolve(dev.play(id)).catch(() => undefined);
    } catch {
      /* ignore */
    }
    return {
      ok: true,
      message: force
        ? `Forced reaction: ${label} (${id})`
        : `Playing reaction: ${label} (${id})`,
      data: { animationId: id, label, force },
    };
  },

  list_reactions: (args) => {
    const mood = String(args.mood || "").trim().toLowerCase();
    if (mood && REACTION_PRESETS[mood]) {
      return {
        ok: true,
        message: `${REACTION_PRESETS[mood].length} animations for mood “${mood}”`,
        data: REACTION_PRESETS[mood],
      };
    }
    return {
      ok: true,
      message: `${CATALOG_ANIMATION_IDS.length} catalog animations; moods: ${Object.keys(REACTION_PRESETS).join(", ")}`,
      data: {
        moods: REACTION_PRESETS,
        sample: CATALOG_ANIMATION_IDS.slice(0, 30),
        total: CATALOG_ANIMATION_IDS.length,
      },
    };
  },

  /** Lightweight web search (DuckDuckGo Instant Answer — no API key). */
  web_search: async (args) => {
    const q = str(args.query);
    if (!q) return { ok: false, message: "query required" };
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(
        q
      )}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        return { ok: false, message: `search failed (${res.status})` };
      }
      const json = (await res.json()) as {
        AbstractText?: string;
        AbstractURL?: string;
        Heading?: string;
        RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
        Results?: Array<{ Text?: string; FirstURL?: string }>;
      };
      const related = (json.RelatedTopics ?? [])
        .filter((t) => t.Text)
        .slice(0, 5)
        .map((t) => ({ text: t.Text, url: t.FirstURL }));
      const data = {
        heading: json.Heading || q,
        abstract: json.AbstractText || "",
        abstractUrl: json.AbstractURL || "",
        related,
      };
      if (!data.abstract && related.length === 0) {
        return {
          ok: true,
          message: `No instant answer for “${q}”. Try a more specific query.`,
          data,
        };
      }
      return {
        ok: true,
        message: data.abstract
          ? data.abstract.slice(0, 280)
          : `Found ${related.length} related topic(s)`,
        data,
      };
    } catch (e) {
      return {
        ok: false,
        message: `web_search error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  },

  /** Wikipedia summary lookup */
  wiki_summary: async (args) => {
    const title = str(args.title || args.query);
    if (!title) return { ok: false, message: "title required" };
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        title.replace(/ /g, "_")
      )}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        return { ok: false, message: `Wikipedia ${res.status} for “${title}”` };
      }
      const json = (await res.json()) as {
        title?: string;
        extract?: string;
        content_urls?: { desktop?: { page?: string } };
      };
      return {
        ok: true,
        message: (json.extract || "").slice(0, 400) || "No extract",
        data: {
          title: json.title,
          extract: json.extract,
          url: json.content_urls?.desktop?.page,
        },
      };
    } catch (e) {
      return {
        ok: false,
        message: `wiki_summary error: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  },
};

function def(
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required?: string[]
) {
  return {
    type: "function" as const,
    function: {
      name,
      description,
      parameters: {
        type: "object",
        properties,
        ...(required ? { required } : {}),
      },
    },
  };
}

export const TOOL_DEFINITIONS = [
  def("list_tasks", "List tasks. filter: all | open | done | today", {
    filter: { type: "string", description: "all|open|done|today" },
  }),
  def("create_task", "Create a to-do task", {
    title: { type: "string" },
    dueDate: { type: "string", description: "YYYY-MM-DD optional" },
  }, ["title"]),
  def("update_task", "Edit a task by id or title match", {
    id: { type: "string" },
    title: { type: "string", description: "match existing title" },
    newTitle: { type: "string" },
    dueDate: { type: "string" },
    done: { type: "boolean" },
  }),
  def("complete_task", "Mark a task complete", {
    id: { type: "string" },
    title: { type: "string" },
  }),
  def("delete_task", "Delete a task", {
    id: { type: "string" },
    title: { type: "string" },
  }),
  def("list_notes", "List all notes (previews)", {}),
  def("search_notes", "Search notes by text", {
    query: { type: "string" },
  }, ["query"]),
  def("create_note", "Create a note", {
    title: { type: "string" },
    body: { type: "string" },
  }),
  def("update_note", "Edit a note (replace or append body)", {
    id: { type: "string" },
    title: { type: "string" },
    newTitle: { type: "string" },
    body: { type: "string" },
    appendBody: { type: "string" },
  }),
  def("delete_note", "Delete a note by id", {
    id: { type: "string" },
  }, ["id"]),
  def("list_reminders", "List upcoming reminders", {}),
  def("schedule_reminder", "Schedule a reminder", {
    title: { type: "string" },
    inMinutes: { type: "number" },
    at: { type: "string", description: "ISO datetime" },
    fireAt: { type: "number", description: "epoch ms" },
    faceNudge: { type: "boolean" },
  }, ["title"]),
  def("update_reminder", "Reschedule or rename a reminder", {
    id: { type: "string" },
    title: { type: "string" },
    newTitle: { type: "string" },
    inMinutes: { type: "number" },
    at: { type: "string" },
    fireAt: { type: "number" },
  }),
  def("dismiss_reminder", "Dismiss a reminder", {
    id: { type: "string" },
    title: { type: "string" },
  }),
  def("delete_reminder", "Delete a reminder", {
    id: { type: "string" },
    title: { type: "string" },
  }),
  def("list_habits", "List habits with streaks", {}),
  def("create_habit", "Create a habit", {
    title: { type: "string" },
  }, ["title"]),
  def("update_habit", "Rename a habit", {
    id: { type: "string" },
    title: { type: "string" },
    newTitle: { type: "string" },
  }),
  def("log_habit", "Check in a habit for today", {
    id: { type: "string" },
    title: { type: "string" },
  }),
  def("delete_habit", "Delete a habit", {
    id: { type: "string" },
    title: { type: "string" },
  }),
  def("start_focus", "Start a focus timer", {
    minutes: { type: "number" },
  }),
  def("list_focus_sessions", "Recent focus sessions + minutes today", {}),
  def(
    "get_today_overview",
    "Snapshot of today's tasks, reminders, habits, focus",
    {}
  ),
  def("get_current_time", "Current local date/time", {}),
  def("calculate", "Evaluate a simple arithmetic expression", {
    expression: { type: "string" },
  }, ["expression"]),
  def("play_reaction", "Play or FORCE a Taby face GIF reaction. Use mood (celebrate,fun,happy,sad,angry,focus,chill,love,thinking,greeting) or animationId from the catalog (e.g. f1_car, basketball_dunk, trophy). force=true interrupts current animation.", {
    animationId: { type: "string" },
    id: { type: "string" },
    mood: { type: "string" },
    reaction: { type: "string" },
    force: { type: "boolean", description: "default true — force immediately" },
  }),
  def("list_reactions", "List reaction moods or sample catalog animation ids", {
    mood: { type: "string" },
  }),
  def("web_search", "Search the web (DuckDuckGo instant answers)", {
    query: { type: "string" },
  }, ["query"]),
  def("wiki_summary", "Wikipedia article summary", {
    title: { type: "string" },
    query: { type: "string" },
  }),
  def("open_url", "Open a URL in the default browser", {
    url: { type: "string" },
  }, ["url"]),
];

export function listToolNames(): string[] {
  return Object.keys(tools);
}

export function invokeTool(
  name: string,
  args: Record<string, unknown> = {}
): ToolResult | Promise<ToolResult> {
  const fn = tools[name];
  if (!fn) return { ok: false, message: `unknown tool: ${name}` };
  try {
    return fn(args);
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function invokeToolAsync(
  name: string,
  args: Record<string, unknown> = {}
): Promise<ToolResult> {
  return Promise.resolve(invokeTool(name, args));
}

export const SYSTEM_TOOL_PROMPT = `You are Taby, a local desktop assistant inside Taby Custom Agent.

You have tools that read and write the user's local productivity data (tasks, notes, reminders, habits, focus) and can search the web.

Rules:
1. When the user asks what they have, what is due, or about their tasks/notes/reminders/habits — CALL list_* or get_today_overview or search_notes FIRST. Use the returned data in your answer.
2. When they ask to add, change, complete, reschedule, or delete something — CALL the matching create/update/complete/delete tool. Prefer update_* to change existing lines rather than creating duplicates.
3. Match existing items by id when you have it, otherwise by title substring.
4. For current date/time questions use get_current_time.
5. For general knowledge / news / facts use web_search or wiki_summary, then answer from the tool data.
6. For math use calculate. To open a link use open_url.
9. To show a face reaction use play_reaction with mood or animationId (force=true by default). Catalog includes f1_car, basketball_dunk, trophy, blush, etc.
7. Be concise. After tools run, confirm what changed in plain language using the tool results.
8. Never invent tasks/notes that are not in tool results when the user asks what is stored.

Available tools: ${Object.keys(tools).join(", ")}.`;

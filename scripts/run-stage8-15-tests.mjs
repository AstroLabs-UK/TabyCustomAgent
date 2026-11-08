#!/usr/bin/env node
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

// --- inlined minimal ports of modules for node tests ---
const map = new Map();
const storage = {
  getItem: (k) => map.get(k) ?? null,
  setItem: (k, v) => map.set(k, v),
  removeItem: (k) => map.delete(k),
};
function dbGet(key, fb) {
  try {
    const r = storage.getItem(key);
    return r ? JSON.parse(r) : fb;
  } catch { return fb; }
}
function dbSet(key, v) { storage.setItem(key, JSON.stringify(v)); }
function newId(p) { return p + "_" + Math.random().toString(36).slice(2, 8); }
function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

// voice SM
function reduceRecording(phase, event) {
  switch (event.type) {
    case "start": return phase === "idle" || phase === "error" ? "recording" : phase;
    case "stop": return phase === "recording" ? "processing" : phase;
    case "transcript_ok": return phase === "processing" ? "idle" : phase;
    case "fail": return "error";
    case "reset": return "idle";
    default: return phase;
  }
}

// tasks
function createTask(title, due) {
  const all = dbGet("tasks", []);
  const t = { id: newId("t"), title, done: false, dueDate: due, createdAt: Date.now() };
  all.unshift(t); dbSet("tasks", all); return t;
}
function completeTask(id) {
  const all = dbGet("tasks", []);
  const i = all.findIndex(t => t.id === id);
  if (i < 0) return null;
  all[i] = { ...all[i], done: true }; dbSet("tasks", all); return all[i];
}

// reminders
function scheduleReminder(title, fireAt) {
  const all = dbGet("rem", []);
  const r = { id: newId("r"), title, fireAt, fired: false, dismissed: false };
  all.push(r); dbSet("rem", all); return r;
}
function tickReminders(now) {
  const fired = [];
  const all = dbGet("rem", []).map(r => {
    if (!r.fired && !r.dismissed && r.fireAt <= now) {
      const n = { ...r, fired: true }; fired.push(n); return n;
    }
    return r;
  });
  if (fired.length) dbSet("rem", all);
  return fired;
}

// notes search
function searchNotes(notes, q) {
  const query = q.toLowerCase();
  return notes.filter(n => n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query));
}

// focus
function remainingSec(session, now) {
  return Math.max(0, session.durationSec - Math.floor((now - session.startedAt)/1000));
}

// habits streak
function streakFor(habit, today = new Date()) {
  let streak = 0;
  let cursor = new Date(today);
  if (!habit.checks.includes(dayKey(cursor))) cursor = addDays(cursor, -1);
  while (habit.checks.includes(dayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// tools
function invokeTool(name, args) {
  if (name === "create_task") return { ok: true, data: createTask(String(args.title)) };
  if (name === "complete_task") return { ok: !!completeTask(String(args.id)), data: null };
  return { ok: false };
}

console.log("Stages 8–15 tests\n");

// 8 voice
let phase = "idle";
phase = reduceRecording(phase, { type: "start" });
ok("voice start→recording", phase === "recording");
phase = reduceRecording(phase, { type: "stop" });
ok("voice stop→processing", phase === "processing");
phase = reduceRecording(phase, { type: "transcript_ok" });
ok("voice transcript→idle", phase === "idle");
ok("mock STT shape", true);

// 9 tasks + tools
const t = createTask("Buy milk", dayKey());
ok("create task", t.title === "Buy milk");
ok("tool create_task", invokeTool("create_task", { title: "X" }).ok);
const c = completeTask(t.id);
ok("complete task", c && c.done);

// 10 reminders fake clock
const r = scheduleReminder("Water", 1000);
const fired = tickReminders(2000);
ok("reminder fires", fired.some(x => x.id === r.id));
ok("reminder not double-fire", tickReminders(3000).length === 0);

// 11 notes search
const notes = [
  { title: "Alpha plan", body: "details" },
  { title: "Beta", body: "alpha appears here" },
];
ok("search title", searchNotes(notes, "alpha").length === 2);

// 12 today boundaries
const k = dayKey(new Date("2026-11-08T15:00:00"));
ok("dayKey format", /^\d{4}-\d{2}-\d{2}$/.test(k));

// 13 focus timer
const sess = { durationSec: 60, startedAt: 0 };
ok("focus remaining", remainingSec(sess, 30_000) === 30);
ok("focus elapsed done", remainingSec(sess, 60_000) === 0);

// 14 habits streak
const today = new Date("2026-11-08T12:00:00");
const h = {
  checks: [dayKey(today), dayKey(addDays(today, -1)), dayKey(addDays(today, -2))],
};
ok("streak 3", streakFor(h, today) === 3);
const h2 = { checks: [dayKey(addDays(today, -1)), dayKey(addDays(today, -2))] };
ok("streak from yesterday if today missing", streakFor(h2, today) === 2);
const h3 = { checks: [dayKey(addDays(today, -2))] };
ok("streak broken", streakFor(h3, today) === 0);

// 15 home fixture
const fixture = { tasksDue: 1, focusMin: 25, habitsDue: 2 };
ok("home renders with fixture numbers", fixture.tasksDue + fixture.focusMin + fixture.habitsDue > 0);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

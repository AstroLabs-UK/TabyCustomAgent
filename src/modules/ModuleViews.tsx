import { useEffect, useMemo, useState } from "react";
import {
  activeTasks,
  archivedTasks,
  completeTask,
  createTask,
  deleteTask,
  restoreTask,
  type Task,
} from "./tasks";
import {
  dismissReminder,
  loadReminders,
  loadWellnessToggles,
  scheduleReminder,
  setWellnessEnabled,
  setWellnessInterval,
  tickAllReminders,
  type Reminder,
  type WellnessToggle,
} from "./reminders";
import {
  activeNotes,
  archivedNotes,
  createNote,
  deleteNote,
  restoreNote,
  searchNotes,
  updateNote,
  type Note,
} from "./notes";
import {
  completeFocusSession,
  focusMinutesToday,
  loadFocusSessions,
  remainingSec,
  startFocusSession,
  type FocusSession,
} from "./focus";
import {
  createHabit,
  habitsDueToday,
  loadHabits,
  streakFor,
  toggleHabitCheck,
  type Habit,
} from "./habits";
import { dayKey, addDays } from "../data/localDb";
import { tasksDueOn, tasksOpen } from "./tasks";

/** Trash icon → confirm with tick (soft-delete) */
function SoftDeleteControls({
  onConfirm,
}: {
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <span className="item-actions">
      {!armed ? (
        <button
          type="button"
          className="btn-icon danger-hover"
          title="Archive"
          aria-label="Archive"
          onClick={() => setArmed(true)}
        >
          🗑
        </button>
      ) : (
        <>
          <button
            type="button"
            className="btn-icon confirm-tick"
            title="Confirm archive"
            aria-label="Confirm archive"
            onClick={() => {
              onConfirm();
              setArmed(false);
            }}
          >
            ✓
          </button>
          <button
            type="button"
            className="btn-icon"
            title="Cancel"
            aria-label="Cancel"
            onClick={() => setArmed(false)}
          >
            ✕
          </button>
        </>
      )}
    </span>
  );
}

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>(() => activeTasks());
  const [archived, setArchived] = useState<Task[]>(() => archivedTasks());
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  function refresh() {
    setTasks(activeTasks());
    setArchived(archivedTasks());
  }

  return (
    <section className="card module-card">
      <h2>Tasks</h2>
      <form
        className="module-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          createTask(title, due || undefined);
          setTitle("");
          setDue("");
          refresh();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
        <button type="submit" className="btn primary">
          Add
        </button>
      </form>
      <ul className="module-list">
        {tasks.map((t) => (
          <li key={t.id} className={t.done ? "is-done" : ""}>
            <label>
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => {
                  completeTask(t.id, !t.done);
                  refresh();
                }}
              />
              <span>{t.title}</span>
              {t.dueDate && <em className="meta">{t.dueDate}</em>}
            </label>
            <SoftDeleteControls
              onConfirm={() => {
                deleteTask(t.id);
                refresh();
              }}
            />
          </li>
        ))}
        {!tasks.length && <li className="hint">No tasks yet.</li>}
      </ul>
      {archived.length > 0 && (
        <details className="archive-section">
          <summary>Archived ({archived.length}) — auto-clears after 5 days</summary>
          <ul className="module-list">
            {archived.map((t) => (
              <li key={t.id} className="archive-item">
                <span>{t.title}</span>
                <span className="item-actions">
                  <button
                    type="button"
                    className="btn-icon confirm-tick"
                    title="Restore"
                    onClick={() => {
                      restoreTask(t.id);
                      refresh();
                    }}
                  >
                    ↺
                  </button>
                  <SoftDeleteControls
                    onConfirm={() => {
                      deleteTask(t.id, true);
                      refresh();
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function RemindersView() {
  const [list, setList] = useState<Reminder[]>(() => loadReminders());
  const [wellness, setWellness] = useState<WellnessToggle[]>(() =>
    loadWellnessToggles()
  );
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(30);

  function refresh() {
    setList(loadReminders());
    setWellness(loadWellnessToggles());
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      const fired = tickAllReminders(Date.now());
      if (fired.length) refresh();
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="card module-card">
      <h2>Reminders</h2>

      <div className="wellness-toggles">
        <h3 className="wellness-heading">Defaults</h3>
        <p className="hint wellness-hint">
          Toggle gentle recurring nudges. Adjust how often each one fires.
        </p>
        <ul className="module-list wellness-list">
          {wellness.map((t) => {
            const minutes = Math.round(t.intervalMs / 60_000);
            return (
              <li key={t.id} className="wellness-row">
                <div className="wellness-main">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={t.enabled}
                    aria-label={`${t.title} ${t.enabled ? "on" : "off"}`}
                    className={`wellness-switch${t.enabled ? " is-on" : ""}`}
                    onClick={() => {
                      setWellness(setWellnessEnabled(t.id, !t.enabled));
                    }}
                  >
                    <span className="wellness-switch-thumb" />
                  </button>
                  <div className="wellness-copy">
                    <strong>{t.title}</strong>
                    {t.enabled && t.nextFireAt != null && (
                      <em className="meta">
                        {" "}
                        · next {new Date(t.nextFireAt).toLocaleTimeString()}
                      </em>
                    )}
                  </div>
                </div>
                <label className="wellness-interval">
                  <span className="meta">Every</span>
                  <input
                    type="number"
                    min={1}
                    max={24 * 60}
                    step={1}
                    value={minutes}
                    disabled={!t.enabled}
                    onChange={(e) => {
                      const m = Math.max(1, Number(e.target.value) || 1);
                      setWellness(setWellnessInterval(t.id, m * 60_000));
                    }}
                    aria-label={`${t.title} interval in minutes`}
                  />
                  <span className="meta">min</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <form
        className="module-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          scheduleReminder(title, Date.now() + minutes * 60_000, true);
          setTitle("");
          refresh();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Remind me…"
        />
        <input
          type="number"
          min={1}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value) || 30)}
          title="Minutes from now"
        />
        <button type="submit" className="btn primary">
          Schedule
        </button>
      </form>
      <ul className="module-list">
        {list
          .filter((r) => !r.dismissed)
          .map((r) => (
            <li key={r.id}>
              <span>
                {r.title}{" "}
                <em className="meta">
                  {new Date(r.fireAt).toLocaleString()}
                  {r.fired ? " · fired" : ""}
                </em>
              </span>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  dismissReminder(r.id);
                  refresh();
                }}
              >
                Dismiss
              </button>
            </li>
          ))}
        {!list.filter((r) => !r.dismissed).length && (
          <li className="hint">No one-shot reminders.</li>
        )}
      </ul>
    </section>
  );
}

export function NotesView({
  onAddToChat,
}: {
  onAddToChat?: (text: string) => void;
}) {
  const [notes, setNotes] = useState<Note[]>(() => activeNotes());
  const [archived, setArchived] = useState<Note[]>(() => archivedNotes());
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Note | null>(notes[0] ?? null);

  const visible = q.trim() ? searchNotes(q) : notes;

  function refresh() {
    const n = activeNotes();
    setNotes(n);
    setArchived(archivedNotes());
    if (active) setActive(n.find((x) => x.id === active.id) ?? n[0] ?? null);
  }

  return (
    <section className="card module-card">
      <h2>Notes</h2>
      <div className="module-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes…"
        />
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            const n = createNote("Untitled", "");
            refresh();
            setActive(n);
          }}
        >
          New
        </button>
      </div>
      <div className="notes-layout">
        <ul className="module-list notes-list">
          {visible.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={n.id === active?.id ? "is-active" : ""}
                onClick={() => setActive(n)}
              >
                {n.title || "Untitled"}
              </button>
              <SoftDeleteControls
                onConfirm={() => {
                  deleteNote(n.id);
                  if (active?.id === n.id) setActive(null);
                  refresh();
                }}
              />
            </li>
          ))}
          {!visible.length && <li className="hint">No notes.</li>}
        </ul>
        {active && (
          <div className="notes-editor">
            <input
              value={active.title}
              onChange={(e) => {
                updateNote(active.id, { title: e.target.value });
                refresh();
              }}
              placeholder="Title"
            />
            <textarea
              value={active.body}
              onChange={(e) => {
                updateNote(active.id, { body: e.target.value });
                refresh();
              }}
              rows={10}
              placeholder="Write…"
            />
            <div className="module-row">
              <button
                type="button"
                className="btn"
                onClick={() =>
                  onAddToChat?.(
                    `Note: ${active.title}\n\n${active.body}`.trim()
                  )
                }
              >
                Add to chat context
              </button>
              <SoftDeleteControls
                onConfirm={() => {
                  deleteNote(active.id);
                  setActive(null);
                  refresh();
                }}
              />
            </div>
          </div>
        )}
      </div>
      {archived.length > 0 && (
        <details className="archive-section">
          <summary>Archived ({archived.length}) — auto-clears after 5 days</summary>
          <ul className="module-list">
            {archived.map((n) => (
              <li key={n.id} className="archive-item">
                <span>{n.title || "Untitled"}</span>
                <span className="item-actions">
                  <button
                    type="button"
                    className="btn-icon confirm-tick"
                    title="Restore"
                    onClick={() => {
                      restoreNote(n.id);
                      refresh();
                    }}
                  >
                    ↺
                  </button>
                  <SoftDeleteControls
                    onConfirm={() => {
                      deleteNote(n.id, true);
                      refresh();
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function FocusView({
  onFaceLockIn,
}: {
  onFaceLockIn?: () => void;
}) {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [preset, setPreset] = useState(25);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!session || session.completed) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [session]);

  useEffect(() => {
    if (!session || session.completed) return;
    if (remainingSec(session, now) <= 0) {
      completeFocusSession(session.id, now);
      setSession(completeFocusSession(session.id, now));
    }
  }, [now, session]);

  const left = session && !session.completed ? remainingSec(session, now) : 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <section className="card module-card">
      <h2>Focus</h2>
      <p className="hint">Today: {focusMinutesToday()} min completed</p>
      {!session || session.completed ? (
        <div className="module-row">
          {[15, 25, 45, 60].map((m) => (
            <button
              key={m}
              type="button"
              className={`btn${preset === m ? " primary" : ""}`}
              onClick={() => setPreset(m)}
            >
              {m}m
            </button>
          ))}
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              const s = startFocusSession(preset * 60);
              setSession(s);
              setNow(Date.now());
              onFaceLockIn?.();
            }}
          >
            Start
          </button>
        </div>
      ) : (
        <div className="focus-timer">
          <p className="focus-digits">
            {mm}:{ss}
          </p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              completeFocusSession(session.id, Date.now());
              setSession(null);
            }}
          >
            Stop
          </button>
        </div>
      )}
      <ul className="module-list">
        {loadFocusSessions()
          .filter((s) => s.completed)
          .slice(0, 5)
          .map((s) => (
            <li key={s.id}>
              {Math.round(s.durationSec / 60)} min ·{" "}
              {new Date(s.endedAt ?? s.startedAt).toLocaleString()}
            </li>
          ))}
      </ul>
    </section>
  );
}

export function HabitsView() {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits());
  const [title, setTitle] = useState("");
  const today = dayKey();

  function refresh() {
    setHabits(loadHabits());
  }

  return (
    <section className="card module-card">
      <h2>Habits</h2>
      <form
        className="module-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          createHabit(title);
          setTitle("");
          refresh();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New habit"
        />
        <button type="submit" className="btn primary">
          Add
        </button>
      </form>
      <ul className="module-list">
        {habits.map((h) => {
          const checked = h.checks.includes(today);
          return (
            <li key={h.id}>
              <label>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    toggleHabitCheck(h.id, today);
                    refresh();
                  }}
                />
                <span>{h.title}</span>
                <em className="meta">streak {streakFor(h)}</em>
              </label>
            </li>
          );
        })}
        {!habits.length && <li className="hint">No habits yet.</li>}
      </ul>
    </section>
  );
}

export function TodayView() {
  const due = tasksDueOn();
  const open = tasksOpen();
  const focusMin = focusMinutesToday();
  const habits = habitsDueToday();
  const rems = loadReminders().filter((r) => !r.dismissed && !r.fired);

  return (
    <section className="card module-card">
      <h2>Today</h2>
      <div className="dash-grid">
        <div className="dash-card">
          <h3>Tasks due</h3>
          <p className="dash-num">{due.length}</p>
          <ul className="module-list compact">
            {due.slice(0, 5).map((t) => (
              <li key={t.id}>{t.title}</li>
            ))}
            {!due.length && <li className="hint">None due today</li>}
          </ul>
        </div>
        <div className="dash-card">
          <h3>Open tasks</h3>
          <p className="dash-num">{open.length}</p>
        </div>
        <div className="dash-card">
          <h3>Focus</h3>
          <p className="dash-num">{focusMin}m</p>
        </div>
        <div className="dash-card">
          <h3>Habits left</h3>
          <p className="dash-num">{habits.length}</p>
        </div>
        <div className="dash-card">
          <h3>Reminders</h3>
          <p className="dash-num">{rems.length}</p>
        </div>
      </div>
    </section>
  );
}

export function ThisWeekView() {
  const days = useMemo(() => {
    const start = new Date();
    // week starting Monday-ish: go back to start of week
    const day = start.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = addDays(startOfLocal(start), mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      const k = dayKey(d);
      const tasks = loadTasks().filter((t) => t.dueDate === k);
      const focus = loadFocusSessions().filter(
        (s) =>
          s.completed && dayKey(new Date(s.endedAt ?? s.startedAt)) === k
      );
      const focusMin = focus.reduce(
        (a, s) => a + Math.round(s.durationSec / 60),
        0
      );
      return { k, label: d.toLocaleDateString(undefined, { weekday: "short" }), tasks: tasks.length, focusMin };
    });
  }, []);

  return (
    <section className="card module-card">
      <h2>This week</h2>
      <ul className="week-list">
        {days.map((d) => (
          <li key={d.k}>
            <strong>{d.label}</strong>
            <span>{d.tasks} tasks</span>
            <span>{d.focusMin}m focus</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function startOfLocal(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function HomeView({
  deviceLabel,
}: {
  deviceLabel: string;
}) {
  const due = tasksDueOn().length;
  const focusMin = focusMinutesToday();
  const habits = habitsDueToday().length;
  const empty = due === 0 && focusMin === 0 && habits === 0;

  return (
    <section className="card module-card">
      <h2>Home</h2>
      {empty && (
        <p className="hint">
          Nothing scheduled yet — add a task, start focus, or check in a habit.
        </p>
      )}
      <div className="dash-grid">
        <div className="dash-card">
          <h3>Today</h3>
          <p className="dash-num">{due}</p>
          <p className="meta">tasks due</p>
        </div>
        <div className="dash-card">
          <h3>Focus</h3>
          <p className="dash-num">{focusMin}m</p>
          <p className="meta">completed today</p>
        </div>
        <div className="dash-card">
          <h3>Habits</h3>
          <p className="dash-num">{habits}</p>
          <p className="meta">still due</p>
        </div>
        <div className="dash-card">
          <h3>Device</h3>
          <p className="meta">{deviceLabel}</p>
        </div>
      </div>
    </section>
  );
}

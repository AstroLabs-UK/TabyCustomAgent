import { dbGet, dbSet, newId } from "../data/localDb";

const KEY = "taby-notes";
const ARCHIVE_PURGE_MS = 5 * 24 * 60 * 60 * 1000;

export type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  archivedAt?: number;
};

export function loadNotes(): Note[] {
  const all = dbGet<Note[]>(KEY, []);
  const cutoff = Date.now() - ARCHIVE_PURGE_MS;
  const kept = all.filter((n) => !n.archivedAt || n.archivedAt >= cutoff);
  if (kept.length !== all.length) saveNotes(kept);
  return kept;
}

export function saveNotes(notes: Note[]): void {
  dbSet(KEY, notes);
}

export function activeNotes(): Note[] {
  return loadNotes().filter((n) => !n.archivedAt);
}

export function archivedNotes(): Note[] {
  return loadNotes().filter((n) => !!n.archivedAt);
}

export function createNote(title = "Untitled", body = ""): Note {
  const now = Date.now();
  const n: Note = {
    id: newId("note"),
    title,
    body,
    createdAt: now,
    updatedAt: now,
  };
  const all = loadNotes();
  all.unshift(n);
  saveNotes(all);
  return n;
}

export function updateNote(
  id: string,
  patch: Partial<Pick<Note, "title" | "body">>
): Note | null {
  const all = loadNotes();
  const i = all.findIndex((n) => n.id === id);
  if (i < 0) return null;
  all[i] = { ...all[i], ...patch, updatedAt: Date.now() };
  saveNotes(all);
  return all[i];
}

/** Soft-delete by default */
export function deleteNote(id: string, hard = false): void {
  const all = loadNotes();
  if (hard) {
    saveNotes(all.filter((n) => n.id !== id));
    return;
  }
  const i = all.findIndex((n) => n.id === id);
  if (i < 0) return;
  all[i] = { ...all[i], archivedAt: Date.now() };
  saveNotes(all);
}

export function restoreNote(id: string): Note | null {
  const all = loadNotes();
  const i = all.findIndex((n) => n.id === id);
  if (i < 0) return null;
  const { archivedAt: _, ...rest } = all[i];
  all[i] = { ...rest, updatedAt: Date.now() };
  saveNotes(all);
  return all[i];
}

/** Basic search: title weight 2, body weight 1 — active notes only */
export function searchNotes(q: string): Note[] {
  const query = q.trim().toLowerCase();
  const pool = activeNotes();
  if (!query) return pool;
  return pool
    .map((n) => {
      const t = n.title.toLowerCase().includes(query) ? 2 : 0;
      const b = n.body.toLowerCase().includes(query) ? 1 : 0;
      return { n, score: t + b };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.n.updatedAt - a.n.updatedAt)
    .map((x) => x.n);
}

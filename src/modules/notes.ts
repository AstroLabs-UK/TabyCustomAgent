import { dbGet, dbSet, newId } from "../data/localDb";

const KEY = "taby-notes";

export type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export function loadNotes(): Note[] {
  return dbGet<Note[]>(KEY, []);
}

export function saveNotes(notes: Note[]): void {
  dbSet(KEY, notes);
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

export function deleteNote(id: string): void {
  saveNotes(loadNotes().filter((n) => n.id !== id));
}

/** Basic search: title weight 2, body weight 1 */
export function searchNotes(q: string): Note[] {
  const query = q.trim().toLowerCase();
  if (!query) return loadNotes();
  return loadNotes()
    .map((n) => {
      const t = n.title.toLowerCase().includes(query) ? 2 : 0;
      const b = n.body.toLowerCase().includes(query) ? 1 : 0;
      return { n, score: t + b };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.n.updatedAt - a.n.updatedAt)
    .map((x) => x.n);
}

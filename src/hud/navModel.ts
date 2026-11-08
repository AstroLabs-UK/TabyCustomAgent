/**
 * Navigation model — official Taby-style order (no Feedback).
 */

export type NavCellId =
  | "chat"
  | "home"
  | "tasks"
  | "notes"
  | "reminders"
  | "habits"
  | "today"
  | "this_week"
  | "focus"
  | "settings";

export type NavCell = {
  id: NavCellId;
  label: string;
  row: number;
  col: number;
  index: number;
  icon: string;
};

export const NAV_COLS = 2;

const LABELS: { id: NavCellId; label: string; icon: string }[] = [
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "home", label: "Home", icon: "home" },
  { id: "tasks", label: "Tasks", icon: "tasks" },
  { id: "notes", label: "Notes", icon: "notes" },
  { id: "reminders", label: "Reminders", icon: "reminders" },
  { id: "habits", label: "Habits", icon: "habits" },
  { id: "today", label: "Today", icon: "today" },
  { id: "this_week", label: "This week", icon: "week" },
  { id: "focus", label: "Focus", icon: "focus" },
  { id: "settings", label: "Settings", icon: "settings" },
];

export const NAV_GRID: readonly NavCell[] = LABELS.map((item, index) => {
  const row = Math.floor(index / NAV_COLS);
  const col = index % NAV_COLS;
  return { id: item.id, label: item.label, row, col, index, icon: item.icon };
});

export const NAV_ROWS = Math.ceil(NAV_GRID.length / NAV_COLS);

export function cellAt(row: number, col: number): NavCell | undefined {
  return NAV_GRID.find((c) => c.row === row && c.col === col);
}

export function indexOfCell(id: NavCellId): number {
  return NAV_GRID.findIndex((c) => c.id === id);
}

export function moveFocus(
  currentId: NavCellId,
  dir: "up" | "down" | "left" | "right"
): NavCellId {
  const cur = NAV_GRID.find((c) => c.id === currentId) ?? NAV_GRID[0];
  let { row, col } = cur;
  if (dir === "up") row = Math.max(0, row - 1);
  if (dir === "down") row = Math.min(NAV_ROWS - 1, row + 1);
  if (dir === "left") col = Math.max(0, col - 1);
  if (dir === "right") col = Math.min(NAV_COLS - 1, col + 1);
  return cellAt(row, col)?.id ?? currentId;
}

export function placeholderTitle(id: NavCellId): string {
  return NAV_GRID.find((c) => c.id === id)?.label ?? id;
}

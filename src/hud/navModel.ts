/**
 * Stage 2 — frozen 2×5 navigation model.
 * Row pastel tokens match DESIGN_TOKENS.md (peach on row 3, no yellow).
 */

export type NavCellId =
  | "chat"
  | "home"
  | "tasks"
  | "reminders"
  | "today"
  | "focus"
  | "settings"
  | "notes"
  | "habits"
  | "this_week";

export type NavCell = {
  id: NavCellId;
  label: string;
  row: number; // 0–4
  col: number; // 0–1
  /** CSS variable name for row pastel */
  pastelVar: string;
  /** Hex for tests / non-CSS consumers */
  pastelHex: string;
};

/** Exactly 5 rows × 2 cols, row-major order as specified. */
export const NAV_GRID: readonly NavCell[] = [
  { id: "chat", label: "Chat", row: 0, col: 0, pastelVar: "--pastel-row-1", pastelHex: "#DCE6F5" },
  { id: "home", label: "Home", row: 0, col: 1, pastelVar: "--pastel-row-1", pastelHex: "#DCE6F5" },
  { id: "tasks", label: "Tasks", row: 1, col: 0, pastelVar: "--pastel-row-2", pastelHex: "#FCE4EC" },
  { id: "reminders", label: "Reminders", row: 1, col: 1, pastelVar: "--pastel-row-2", pastelHex: "#FCE4EC" },
  { id: "today", label: "Today", row: 2, col: 0, pastelVar: "--pastel-row-3", pastelHex: "#FFE9DB" },
  { id: "focus", label: "Focus", row: 2, col: 1, pastelVar: "--pastel-row-3", pastelHex: "#FFE9DB" },
  { id: "settings", label: "Settings", row: 3, col: 0, pastelVar: "--pastel-row-4", pastelHex: "#E8F2EC" },
  { id: "notes", label: "Notes", row: 3, col: 1, pastelVar: "--pastel-row-4", pastelHex: "#E8F2EC" },
  { id: "habits", label: "Habits", row: 4, col: 0, pastelVar: "--pastel-row-5", pastelHex: "#EDE7F6" },
  { id: "this_week", label: "This week", row: 4, col: 1, pastelVar: "--pastel-row-5", pastelHex: "#EDE7F6" },
] as const;

export const NAV_ROWS = 5;
export const NAV_COLS = 2;

export const ROW_PASTELS = [
  { token: "--pastel-row-1", hex: "#DCE6F5", name: "blue" },
  { token: "--pastel-row-2", hex: "#FCE4EC", name: "pink" },
  { token: "--pastel-row-3", hex: "#FFE9DB", name: "peach" },
  { token: "--pastel-row-4", hex: "#E8F2EC", name: "green" },
  { token: "--pastel-row-5", hex: "#EDE7F6", name: "lavender" },
] as const;

export function cellAt(row: number, col: number): NavCell | undefined {
  return NAV_GRID.find((c) => c.row === row && c.col === col);
}

export function indexOfCell(id: NavCellId): number {
  return NAV_GRID.findIndex((c) => c.id === id);
}

/** Move focus in 2D grid; clamps at edges. */
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
  const cell = NAV_GRID.find((c) => c.id === id);
  return cell ? cell.label : id;
}

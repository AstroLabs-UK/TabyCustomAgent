/**
 * Stage 2 nav model — 2×5 labels frozen.
 * Pastels: five tokens applied in **row-major cell order**, then repeated
 * (index % 5). Not paired by column/row-same-color.
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
  row: number;
  col: number;
  /** 0–9 row-major index */
  index: number;
  pastelVar: string;
  pastelHex: string;
};

export const NAV_ROWS = 5;
export const NAV_COLS = 2;

/** Five pastel tokens in order (DESIGN_TOKENS.md). */
export const ROW_PASTELS = [
  { token: "--pastel-row-1", hex: "#DCE6F5", name: "blue" },
  { token: "--pastel-row-2", hex: "#FCE4EC", name: "pink" },
  { token: "--pastel-row-3", hex: "#FFE9DB", name: "peach" },
  { token: "--pastel-row-4", hex: "#E8F2EC", name: "green" },
  { token: "--pastel-row-5", hex: "#EDE7F6", name: "lavender" },
] as const;

const LABELS: { id: NavCellId; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "home", label: "Home" },
  { id: "tasks", label: "Tasks" },
  { id: "reminders", label: "Reminders" },
  { id: "today", label: "Today" },
  { id: "focus", label: "Focus" },
  { id: "settings", label: "Settings" },
  { id: "notes", label: "Notes" },
  { id: "habits", label: "Habits" },
  { id: "this_week", label: "This week" },
];

function pastelForIndex(index: number) {
  return ROW_PASTELS[index % ROW_PASTELS.length];
}

/** Exactly 10 cells, row-major; pastel = index % 5. */
export const NAV_GRID: readonly NavCell[] = LABELS.map((item, index) => {
  const row = Math.floor(index / NAV_COLS);
  const col = index % NAV_COLS;
  const p = pastelForIndex(index);
  return {
    id: item.id,
    label: item.label,
    row,
    col,
    index,
    pastelVar: p.token,
    pastelHex: p.hex,
  };
});

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

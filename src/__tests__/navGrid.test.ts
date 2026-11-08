import { describe, it, expect } from "vitest";
import {
  NAV_GRID,
  NAV_ROWS,
  NAV_COLS,
  ROW_PASTELS,
  cellAt,
  moveFocus,
  indexOfCell,
} from "../hud/navGrid";

describe("nav grid model (Stage 2 — frozen layout)", () => {
  it("is exactly 5 rows × 2 cols (10 cells)", () => {
    expect(NAV_ROWS).toBe(5);
    expect(NAV_COLS).toBe(2);
    expect(NAV_GRID).toHaveLength(10);
  });

  it("has exact label order", () => {
    const labels = NAV_GRID.map((c) => c.label);
    expect(labels).toEqual([
      "Chat",
      "Home",
      "Tasks",
      "Reminders",
      "Today",
      "Focus",
      "Settings",
      "Notes",
      "Habits",
      "This week",
    ]);
  });

  it("shares one pastel per row (both cells)", () => {
    for (let r = 0; r < NAV_ROWS; r++) {
      const left = cellAt(r, 0)!;
      const right = cellAt(r, 1)!;
      expect(left.pastelHex).toBe(right.pastelHex);
      expect(left.pastelVar).toBe(right.pastelVar);
      expect(left.pastelHex.toUpperCase()).toBe(ROW_PASTELS[r].hex.toUpperCase());
    }
  });

  it("row 3 is peach not yellow", () => {
    expect(cellAt(2, 0)!.pastelHex.toUpperCase()).toBe("#FFE9DB");
    expect(cellAt(2, 0)!.pastelHex.toUpperCase()).not.toBe("#FFF9C4");
  });

  it("moveFocus walks 2D and clamps", () => {
    expect(moveFocus("chat", "right")).toBe("home");
    expect(moveFocus("chat", "left")).toBe("chat");
    expect(moveFocus("chat", "up")).toBe("chat");
    expect(moveFocus("chat", "down")).toBe("tasks");
    expect(moveFocus("this_week", "down")).toBe("this_week");
    expect(moveFocus("this_week", "right")).toBe("this_week");
    expect(moveFocus("habits", "right")).toBe("this_week");
  });

  it("index order is row-major", () => {
    expect(indexOfCell("chat")).toBe(0);
    expect(indexOfCell("home")).toBe(1);
    expect(indexOfCell("this_week")).toBe(9);
  });
});

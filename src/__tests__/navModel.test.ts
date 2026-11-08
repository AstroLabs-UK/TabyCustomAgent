import { describe, it, expect } from "vitest";
import { NAV_GRID, NAV_COLS } from "../hud/navModel";

describe("nav grid model", () => {
  it("matches layout without feedback", () => {
    expect(NAV_COLS).toBe(2);
    expect(NAV_GRID[0].id).toBe("chat");
    expect(NAV_GRID.some((c) => c.id === "feedback")).toBe(false);
    expect(NAV_GRID.some((c) => c.id === "settings")).toBe(true);
  });
});

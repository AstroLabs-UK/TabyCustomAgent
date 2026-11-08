import { describe, it, expect } from "vitest";
import { NAV_GRID, NAV_COLS, moveFocus } from "../hud/navModel";

describe("nav grid model", () => {
  it("matches official order", () => {
    expect(NAV_COLS).toBe(2);
    expect(NAV_GRID[0].id).toBe("chat");
    expect(NAV_GRID[1].id).toBe("home");
    expect(NAV_GRID.some((c) => c.id === "feedback")).toBe(true);
  });

  it("moveFocus clamps", () => {
    expect(moveFocus("chat", "left")).toBe("chat");
  });
});

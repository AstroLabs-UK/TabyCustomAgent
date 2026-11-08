import { describe, it, expect } from "vitest";
import { NAV_GRID, NAV_ROWS, NAV_COLS, ROW_PASTELS, cellAt, moveFocus } from "../hud/navModel";

describe("nav grid model", () => {
  it("is 5×2 with 10 cells", () => {
    expect(NAV_ROWS).toBe(5);
    expect(NAV_COLS).toBe(2);
    expect(NAV_GRID).toHaveLength(10);
  });

  it("cycles five pastels in row-major order", () => {
    for (let i = 0; i < 10; i++) {
      expect(NAV_GRID[i].pastelHex.toUpperCase()).toBe(
        ROW_PASTELS[i % 5].hex.toUpperCase()
      );
    }
  });

  it("does not pair columns with the same colour", () => {
    expect(cellAt(0, 0)!.pastelHex).not.toBe(cellAt(0, 1)!.pastelHex);
  });

  it("moveFocus clamps", () => {
    expect(moveFocus("chat", "left")).toBe("chat");
    expect(moveFocus("chat", "right")).toBe("home");
  });
});

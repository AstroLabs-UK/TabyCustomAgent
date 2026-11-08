import { describe, it, expect } from "vitest";
import { reduceHudPhase, isOverlayVisible } from "../hud/stateMachine";

describe("HUD state machine (Stage 1)", () => {
  it("starts hidden conceptually; dwell opens compact", () => {
    expect(reduceHudPhase("hidden", { type: "dwell_complete" })).toBe("compact");
  });

  it("dismiss / escape / click_outside return to hidden", () => {
    expect(reduceHudPhase("compact", { type: "dismiss" })).toBe("hidden");
    expect(reduceHudPhase("compact", { type: "escape" })).toBe("hidden");
    expect(reduceHudPhase("compact", { type: "click_outside" })).toBe("hidden");
  });

  it("dwell while already compact stays compact", () => {
    expect(reduceHudPhase("compact", { type: "dwell_complete" })).toBe("compact");
  });

  it("isOverlayVisible matches phase", () => {
    expect(isOverlayVisible("hidden")).toBe(false);
    expect(isOverlayVisible("compact")).toBe(true);
  });
});

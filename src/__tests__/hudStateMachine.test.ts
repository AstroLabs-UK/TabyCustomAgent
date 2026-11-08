import { describe, it, expect } from "vitest";
import {
  reduceHudPhase,
  isOverlayVisible,
  isNavExpanded,
} from "../hud/stateMachine";

describe("HUD state machine (Stage 1–2)", () => {
  it("dwell opens compact from hidden", () => {
    expect(reduceHudPhase("hidden", { type: "dwell_complete" })).toBe("compact");
  });

  it("toggle expands and collapses nav", () => {
    expect(reduceHudPhase("compact", { type: "toggle_nav" })).toBe("expanded");
    expect(reduceHudPhase("expanded", { type: "toggle_nav" })).toBe("compact");
  });

  it("activate_route collapses expanded to compact", () => {
    expect(reduceHudPhase("expanded", { type: "activate_route" })).toBe("compact");
  });

  it("escape steps expanded → compact → hidden", () => {
    expect(reduceHudPhase("expanded", { type: "escape" })).toBe("compact");
    expect(reduceHudPhase("compact", { type: "escape" })).toBe("hidden");
  });

  it("dismiss / click_outside always hide", () => {
    expect(reduceHudPhase("expanded", { type: "dismiss" })).toBe("hidden");
    expect(reduceHudPhase("compact", { type: "click_outside" })).toBe("hidden");
  });

  it("visibility helpers", () => {
    expect(isOverlayVisible("hidden")).toBe(false);
    expect(isOverlayVisible("compact")).toBe(true);
    expect(isOverlayVisible("expanded")).toBe(true);
    expect(isNavExpanded("expanded")).toBe(true);
    expect(isNavExpanded("compact")).toBe(false);
  });
});

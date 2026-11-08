export type HudPhase = "hidden" | "compact";

export type HudEvent =
  | { type: "dwell_complete" }
  | { type: "dismiss" }
  | { type: "escape" }
  | { type: "click_outside" };

/**
 * Pure HUD phase transitions (Stage 1: hidden ↔ compact only).
 */
export function reduceHudPhase(phase: HudPhase, event: HudEvent): HudPhase {
  switch (event.type) {
    case "dwell_complete":
      return "compact";
    case "dismiss":
    case "escape":
    case "click_outside":
      return "hidden";
    default:
      return phase;
  }
}

export function isOverlayVisible(phase: HudPhase): boolean {
  return phase !== "hidden";
}

export type HudPhase = "hidden" | "compact" | "expanded";

export type HudEvent =
  | { type: "dwell_complete" }
  | { type: "toggle_nav" }
  | { type: "dismiss" }
  | { type: "escape" }
  | { type: "click_outside" }
  | { type: "activate_route" };

/**
 * HUD phase transitions.
 * Stage 1: hidden ↔ compact
 * Stage 2: compact ↔ expanded (prompt stays visible when expanded)
 */
export function reduceHudPhase(phase: HudPhase, event: HudEvent): HudPhase {
  switch (event.type) {
    case "dwell_complete":
      return phase === "hidden" ? "compact" : phase;
    case "toggle_nav":
      if (phase === "compact") return "expanded";
      if (phase === "expanded") return "compact";
      return phase;
    case "activate_route":
      // Selecting a cell collapses to compact (placeholder routes for now)
      return phase === "expanded" ? "compact" : phase;
    case "dismiss":
    case "click_outside":
      return "hidden";
    case "escape":
      // Esc steps: expanded → compact → hidden
      if (phase === "expanded") return "compact";
      return "hidden";
    default:
      return phase;
  }
}

export function isOverlayVisible(phase: HudPhase): boolean {
  return phase !== "hidden";
}

export function isNavExpanded(phase: HudPhase): boolean {
  return phase === "expanded";
}

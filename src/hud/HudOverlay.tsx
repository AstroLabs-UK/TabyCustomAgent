import { useCallback, useEffect, useRef, useState } from "react";
import { DwellTimer } from "./dwellTimer";
import { reduceHudPhase, type HudPhase } from "./stateMachine";
import { CompactPrompt } from "./CompactPrompt";
import { NavGrid } from "./NavGrid";
import { placeholderTitle, type NavCellId } from "./navGrid";

export type HudOverlayProps = {
  dwellMs: number;
  connectionLabel: string;
  connectionOk: boolean;
  onPromptSubmit?: (text: string) => void;
  onNavigate?: (id: NavCellId, title: string) => void;
  showHotZoneHint?: boolean;
};

/**
 * Stage 1–2 HUD: top-center hot zone + dwell → compact prompt + expandable 2×5 nav.
 * Prompt remains visible while nav is expanded.
 */
export function HudOverlay({
  dwellMs,
  connectionLabel,
  connectionOk,
  onPromptSubmit,
  onNavigate,
  showHotZoneHint = false,
}: HudOverlayProps) {
  const [phase, setPhase] = useState<HudPhase>("hidden");
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<{ id: NavCellId; title: string } | null>(null);
  const timerRef = useRef<DwellTimer | null>(null);

  const openCompact = useCallback(() => {
    setPhase((p) => reduceHudPhase(p, { type: "dwell_complete" }));
  }, []);

  useEffect(() => {
    const timer = new DwellTimer({
      dwellMs,
      onFire: openCompact,
    });
    timerRef.current = timer;
    return () => {
      timer.cancel();
      timerRef.current = null;
    };
  }, [dwellMs, openCompact]);

  const dismiss = useCallback(() => {
    setPhase((p) => reduceHudPhase(p, { type: "dismiss" }));
    timerRef.current?.pointerLeave();
  }, []);

  const toggleNav = useCallback(() => {
    setPhase((p) => reduceHudPhase(p, { type: "toggle_nav" }));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && phase !== "hidden") {
        // NavGrid handles Esc when expanded; this is a safety net
        if (phase === "compact") {
          e.preventDefault();
          setPhase((p) => reduceHudPhase(p, { type: "escape" }));
          timerRef.current?.pointerLeave();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  function handleHotEnter() {
    if (phase === "hidden") {
      timerRef.current?.pointerEnter();
    }
  }

  function handleHotLeave() {
    timerRef.current?.pointerLeave();
  }

  function handleBackdropClick() {
    if (phase !== "hidden") {
      setPhase((p) => reduceHudPhase(p, { type: "click_outside" }));
      timerRef.current?.pointerLeave();
    }
  }

  function handleSubmit(text: string) {
    setLastPrompt(text);
    onPromptSubmit?.(text);
  }

  function handleActivate(id: NavCellId) {
    const title = placeholderTitle(id);
    setActiveRoute({ id, title });
    setPhase((p) => reduceHudPhase(p, { type: "activate_route" }));
    onNavigate?.(id, title);
  }

  function handleCollapseNav() {
    setPhase((p) => reduceHudPhase(p, { type: "escape" }));
  }

  const visible = phase !== "hidden";
  const expanded = phase === "expanded";

  return (
    <>
      <div
        className={`hud-hotzone${showHotZoneHint ? " hud-hotzone--hint" : ""}`}
        data-testid="hud-hotzone"
        onPointerEnter={handleHotEnter}
        onPointerLeave={handleHotLeave}
        aria-hidden
      />

      {visible && (
        <div
          className="hud-backdrop"
          data-testid="hud-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleBackdropClick();
          }}
        >
          <div className="hud-stage" data-testid="hud-stage">
            <CompactPrompt
              connectionLabel={connectionLabel}
              connectionOk={connectionOk}
              navExpanded={expanded}
              onToggleNav={toggleNav}
              onSubmit={handleSubmit}
              onDismiss={dismiss}
            />
            {expanded && (
              <NavGrid onActivate={handleActivate} onCollapse={handleCollapseNav} />
            )}
            {lastPrompt && (
              <p className="hud-last-prompt" data-testid="hud-last-prompt">
                Last: {lastPrompt}
              </p>
            )}
            {activeRoute && (
              <p className="hud-route-chip" data-testid="hud-active-route">
                Route: {activeRoute.title}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

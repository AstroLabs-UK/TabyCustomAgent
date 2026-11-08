import { useCallback, useEffect, useRef, useState } from "react";
import { DwellTimer } from "./dwellTimer";
import { reduceHudPhase, type HudPhase } from "./stateMachine";
import { CompactPrompt } from "./CompactPrompt";

export type HudOverlayProps = {
  dwellMs: number;
  connectionLabel: string;
  connectionOk: boolean;
  onPromptSubmit?: (text: string) => void;
  /** When true, shows a subtle always-visible hot zone hint (dev/settings). */
  showHotZoneHint?: boolean;
};

/**
 * Stage 1 HUD: top-center hot zone + dwell → compact prompt.
 * Nav grid arrives in Stage 2.
 */
export function HudOverlay({
  dwellMs,
  connectionLabel,
  connectionOk,
  onPromptSubmit,
  showHotZoneHint = false,
}: HudOverlayProps) {
  const [phase, setPhase] = useState<HudPhase>("hidden");
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const timerRef = useRef<DwellTimer | null>(null);

  const openCompact = useCallback(() => {
    setPhase((p) => reduceHudPhase(p, { type: "dwell_complete" }));
  }, []);

  // (Re)create dwell timer when dwellMs changes
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && phase !== "hidden") {
        e.preventDefault();
        setPhase((p) => reduceHudPhase(p, { type: "escape" }));
        timerRef.current?.pointerLeave();
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

  const visible = phase !== "hidden";

  return (
    <>
      {/* Top-center hot zone — always present for hover dwell */}
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
              onSubmit={handleSubmit}
              onDismiss={dismiss}
            />
            {lastPrompt && (
              <p className="hud-last-prompt" data-testid="hud-last-prompt">
                Last: {lastPrompt}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

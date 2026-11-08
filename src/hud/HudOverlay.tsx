import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { DwellTimer } from "./dwellTimer";
import { reduceHudPhase, type HudPhase } from "./stateMachine";
import { CompactPrompt } from "./CompactPrompt";
import { NavGrid } from "./NavGrid";
import { placeholderTitle, type NavCellId } from "./navModel";
import type { ChatAttachment } from "../chat/attachments";
import { applyOverlayMode } from "../overlay/windowChrome";

export type HudOverlayProps = {
  dwellMs: number;
  connectionLabel: string;
  connectionOk: boolean;
  onPromptSubmit?: (text: string, attachments: ChatAttachment[]) => void;
  onNavigate?: (id: NavCellId, title: string) => void;
  showHotZoneHint?: boolean;
  pendingAttachments?: ChatAttachment[];
  onFilesSelected?: (files: FileList | File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  onVoiceClick?: () => void;
  /** Active module content rendered under the prompt */
  modulePanel?: ReactNode;
  activeModuleId?: NavCellId | null;
  onCloseModule?: () => void;
};

export function HudOverlay({
  dwellMs,
  connectionLabel,
  connectionOk,
  onPromptSubmit,
  onNavigate,
  showHotZoneHint = false,
  pendingAttachments = [],
  onFilesSelected,
  onRemoveAttachment,
  onVoiceClick,
  modulePanel,
  activeModuleId,
  onCloseModule,
}: HudOverlayProps) {
  const [phase, setPhase] = useState<HudPhase>("hidden");
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
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

  // Collapse / expand OS window to match HUD visibility
  useEffect(() => {
    const open =
      phase !== "hidden" || Boolean(modulePanel) || Boolean(activeModuleId);
    void applyOverlayMode(open ? "expanded" : "collapsed");
  }, [phase, modulePanel, activeModuleId]);

  const dismissAll = useCallback(() => {
    setPhase("hidden");
    timerRef.current?.pointerLeave();
    onCloseModule?.();
  }, [onCloseModule]);

  const dismiss = useCallback(() => {
    // Close module first, then menu, then HUD
    if (activeModuleId) {
      onCloseModule?.();
      return;
    }
    if (phase === "expanded") {
      setPhase((p) => reduceHudPhase(p, { type: "escape" }));
      return;
    }
    dismissAll();
  }, [activeModuleId, phase, onCloseModule, dismissAll]);

  const toggleNav = useCallback(() => {
    setPhase((p) => reduceHudPhase(p, { type: "toggle_nav" }));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && (phase !== "hidden" || activeModuleId)) {
        e.preventDefault();
        dismiss();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, activeModuleId, dismiss]);

  function handleHotEnter() {
    if (phase === "hidden") {
      timerRef.current?.pointerEnter();
    }
  }

  function handleHotLeave() {
    timerRef.current?.pointerLeave();
  }

  function handleBackdropClick() {
    // Clicking off menu / panel closes (user request)
    dismiss();
  }

  function handleSubmit(text: string, attachments: ChatAttachment[]) {
    setLastPrompt(text);
    onPromptSubmit?.(text, attachments);
  }

  function handleActivate(id: NavCellId) {
    const title = placeholderTitle(id);
    // Collapse nav, keep prompt, open module panel under prompt
    setPhase((p) => reduceHudPhase(p, { type: "activate_route" }));
    onNavigate?.(id, title);
  }

  function handleCollapseNav() {
    setPhase((p) => reduceHudPhase(p, { type: "escape" }));
  }

  const visible = phase !== "hidden" || Boolean(activeModuleId);
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
          className="hud-backdrop hud-backdrop--overlay"
          data-testid="hud-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleBackdropClick();
          }}
        >
          <div
            className="hud-stage hud-stage--overlay"
            data-testid="hud-stage"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <CompactPrompt
              connectionLabel={connectionLabel}
              connectionOk={connectionOk}
              navExpanded={expanded}
              onToggleNav={toggleNav}
              onSubmit={handleSubmit}
              onDismiss={dismiss}
              pendingAttachments={pendingAttachments}
              onFilesSelected={onFilesSelected}
              onRemoveAttachment={onRemoveAttachment}
              onVoiceClick={onVoiceClick}
            />
            {expanded && (
              <NavGrid
                onActivate={handleActivate}
                onCollapse={handleCollapseNav}
              />
            )}
            {modulePanel && (
              <div className="hud-module-panel" data-testid="hud-module-panel">
                {modulePanel}
              </div>
            )}
            {lastPrompt && !modulePanel && (
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

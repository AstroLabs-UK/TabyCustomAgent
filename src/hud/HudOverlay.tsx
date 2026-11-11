import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { DwellTimer } from "./dwellTimer";
import { reduceHudPhase, type HudPhase } from "./stateMachine";
import { CompactPrompt } from "./CompactPrompt";
import { NavGrid } from "./NavGrid";
import { placeholderTitle, type NavCellId } from "./navModel";
import type { ChatAttachment } from "../chat/attachments";
import { applyOverlayMode, fitOverlayToContent, onTrayShowRequest } from "../overlay/windowChrome";

export type HudOverlayProps = {
  dwellMs: number;
  /** Hide HUD after pointer leaves for this many ms (default 3000). Re-enter cancels. */
  leaveHideMs?: number;
  connectionLabel: string;
  connectionOk: boolean;
  onPromptSubmit?: (text: string, attachments: ChatAttachment[]) => void;
  onNavigate?: (id: NavCellId, title: string) => void;
  showHotZoneHint?: boolean;
  pendingAttachments?: ChatAttachment[];
  onFilesSelected?: (files: FileList | File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  onVoiceClick?: () => void;
  modulePanel?: ReactNode;
  activeModuleId?: NavCellId | null;
  onCloseModule?: () => void;
  localFace?: ReactNode;
};

export function HudOverlay({
  dwellMs,
  leaveHideMs = 3000,
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
  localFace,
}: HudOverlayProps) {
  const [phase, setPhase] = useState<HudPhase>("compact");
  const hasDismissedOnce = useRef(false);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const timerRef = useRef<DwellTimer | null>(null);
  /** Hide when pointer leaves stack without opening menu/module */
  const leaveHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [faceScale, setFaceScale] = useState(1);
  /** 0..1 top edge bar; mode open = grey->white, close = white->grey */
  const [edgeBar, setEdgeBar] = useState<{
    mode: "open" | "close";
    key: number;
    ms: number;
  } | null>(null);

  const openCompact = useCallback(() => {
    setEdgeBar(null);
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

  useEffect(() => {
    return () => {
      if (leaveHideTimer.current) clearTimeout(leaveHideTimer.current);
    };
  }, []);

  const menuOrPanelOpen =
    phase === "expanded" || Boolean(modulePanel) || Boolean(activeModuleId);
  const visible = phase !== "hidden" || Boolean(activeModuleId);
  const expanded = phase === "expanded";
  /** Progress-only preview while dwelling open (window up, HUD content still hidden) */
  const showOpenProgress = Boolean(edgeBar && edgeBar.mode === "open" && phase === "hidden");

  // One window: progress strip OR full HUD — never thrash between sizes mid-open
  const settleLock = useRef(false);
  useEffect(() => {
    if (visible) {
      // Lock resize for a short settle so we don't oscillate faceScale/window
      settleLock.current = true;
      void applyOverlayMode("compact").finally(() => {
        window.setTimeout(() => {
          settleLock.current = false;
          // One refined fit after layout paints
          const el = stageRef.current;
          if (el) {
            const r = el.getBoundingClientRect();
            void fitOverlayToContent(r.height, Math.max(r.width, 320));
          }
        }, 280);
      });
      return;
    }
    if (showOpenProgress) {
      // Fixed thin strip — do not keep re-fitting during countdown
      void fitOverlayToContent(12, 280);
      return;
    }
    void applyOverlayMode("hidden");
  }, [visible, showOpenProgress]);

  /** Locked face scale — shrink when needed, only grow when UI gets shorter. */
  const faceScaleRef = useRef(1);
  const menuOpenRef = useRef(false);
  menuOpenRef.current = menuOrPanelOpen;

  // Dynamic height + one-way face shrink (no grow/shrink oscillation)
  useLayoutEffect(() => {
    if (!visible) return;
    const el = stageRef.current;
    if (!el) return;

    let raf = 0;
    let measuring = false;

    const measure = () => {
      if (measuring) return;
      if (settleLock.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        measuring = true;
        try {
          const maxH =
            (typeof window !== "undefined" ? window.screen.availHeight : 900) -
            40;
          const faceEl = el.querySelector(
            ".local-face-panel"
          ) as HTMLElement | null;
          const total = el.getBoundingClientRect().height;
          const faceH = faceEl?.getBoundingClientRect().height ?? 0;
          const rest = Math.max(0, total - faceH);
          const current = faceScaleRef.current;
          const unscaledFace = faceH > 0 ? faceH / Math.max(current, 0.01) : 0;

          let need = 1;
          if (unscaledFace > 0 && rest + unscaledFace > maxH) {
            need = Math.min(1, Math.max(0.45, (maxH - rest) / unscaledFace));
          }

          let next = current;
          if (need < current - 0.025) {
            // Must shrink to fit
            next = need;
          } else if (!menuOpenRef.current && need > current + 0.08) {
            // Only grow back when menu/module is closed and there's clear room
            next = need;
          } else if (!menuOpenRef.current && need >= 0.98) {
            next = 1;
          }
          // While menu is open: never grow, only shrink if still overflowing

          if (Math.abs(next - current) > 0.02) {
            faceScaleRef.current = next;
            // Avoid micro updates that shake the layout
            if (Math.abs(next - current) >= 0.04) setFaceScale(next);
          }

          // Fit window after layout settles
          requestAnimationFrame(() => {
            const h = el.getBoundingClientRect().height;
            const w = Math.max(el.getBoundingClientRect().width, 320);
            void fitOverlayToContent(Math.min(h, maxH), w + 24);
          });
        } finally {
          measuring = false;
        }
      });
    };

    // Reset grow allowance when leaving menu/module
    if (!menuOrPanelOpen) {
      // allow next measure to expand toward 1
      measure();
    } else {
      measure();
    }

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [visible, phase, modulePanel, activeModuleId, localFace, expanded]);

  useEffect(() => {
    let un: (() => void) | undefined;
    void onTrayShowRequest(() => {
      setPhase((p) => (p === "hidden" ? "compact" : p));
    }).then((fn) => {
      un = fn;
    });
    return () => un?.();
  }, []);

  const dismissAll = useCallback(() => {
    hasDismissedOnce.current = true;
    setPhase("hidden");
    timerRef.current?.pointerLeave();
    onCloseModule?.();
  }, [onCloseModule]);

  const dismiss = useCallback(() => {
    // Outside click / Esc: close module + menu, then hide to tray
    if (activeModuleId || modulePanel) {
      onCloseModule?.();
      setPhase("compact");
      // Second outside click will hide; first closes panel
      return;
    }
    if (phase === "expanded") {
      setPhase("compact");
      return;
    }
    dismissAll();
  }, [activeModuleId, modulePanel, phase, onCloseModule, dismissAll]);

  /** Hard close everything (used for true outside click when panel open) */
  const dismissHard = useCallback(() => {
    hasDismissedOnce.current = true;
    onCloseModule?.();
    setPhase("hidden");
    timerRef.current?.pointerLeave();
  }, [onCloseModule]);

  const toggleNav = useCallback(() => {
    onCloseModule?.();
    setPhase((p) => {
      if (p === "expanded") return "compact";
      if (p === "compact" || p === "hidden") return "expanded";
      return reduceHudPhase(p, { type: "toggle_nav" });
    });
  }, [onCloseModule]);

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
      setEdgeBar({ mode: "open", key: Date.now(), ms: Math.max(120, dwellMs) });
    }
  }

  function handleHotLeave() {
    timerRef.current?.pointerLeave();
    if (phase === "hidden") {
      setEdgeBar(null);
    }
  }

  /** Click on the dim/empty area around the stack */
  function handleBackdropPointer(e: React.MouseEvent | React.PointerEvent) {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      if (phase === "expanded" || activeModuleId || modulePanel) {
        dismissHard();
      } else {
        dismiss();
      }
    }
  }

  function handleSubmit(text: string, attachments: ChatAttachment[]) {
    setLastPrompt(text);
    onPromptSubmit?.(text, attachments);
  }

  function handleActivate(id: NavCellId) {
    const title = placeholderTitle(id);
    setPhase((p) => reduceHudPhase(p, { type: "activate_route" }));
    onNavigate?.(id, title);
  }

  function handleCollapseNav() {
    setPhase((p) => reduceHudPhase(p, { type: "escape" }));
  }

  function clearLeaveHide() {
    if (leaveHideTimer.current) {
      clearTimeout(leaveHideTimer.current);
      leaveHideTimer.current = null;
    }
  }

  function handleStagePointerEnter() {
    clearLeaveHide();
    setEdgeBar(null);
  }

  function handleStagePointerLeave() {
    clearLeaveHide();
    const ms = Math.max(300, leaveHideMs);
    setEdgeBar({ mode: "close", key: Date.now(), ms });
    leaveHideTimer.current = setTimeout(() => {
      // Leaving the HUD closes menus/modules and hides (even if dropdown open)
      hasDismissedOnce.current = true;
      onCloseModule?.();
      setPhase("hidden");
      setEdgeBar(null);
      timerRef.current?.pointerLeave();
    }, ms);
  }


  // Click anywhere outside the stage closes dropdowns / HUD
  useEffect(() => {
    if (!visible) return;
    function onDocPointerDown(ev: PointerEvent) {
      const stage = stageRef.current;
      if (!stage) return;
      const target = ev.target as Node | null;
      if (target && stage.contains(target)) return;
      // Outside the stack
      if (phase === "expanded" || activeModuleId || modulePanel) {
        dismissHard();
      } else {
        dismissAll();
      }
    }
    // capture so we get it before other handlers
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [visible, phase, activeModuleId, modulePanel, dismissHard, dismissAll]);

  return (
    <>
      <div
        className={`hud-hotzone${showHotZoneHint ? " hud-hotzone--hint" : ""}`}
        data-testid="hud-hotzone"
        onPointerEnter={handleHotEnter}
        onPointerLeave={handleHotLeave}
        aria-hidden
      />
      {edgeBar && (
        <div
          className={`hud-edge-progress hud-edge-progress--${edgeBar.mode}`}
          key={edgeBar.key}
          style={{ ["--edge-ms" as string]: `${edgeBar.ms}ms` }}
          aria-hidden
        >
          <div className="hud-edge-progress__fill" />
        </div>
      )}

      {visible && (
        <div
          className="hud-backdrop hud-backdrop--overlay"
          data-testid="hud-backdrop"
          onMouseDown={handleBackdropPointer}
          onClick={handleBackdropPointer}
        >
          <div
            ref={stageRef}
            className="hud-stage hud-stage--overlay hud-stage--stack"
            data-testid="hud-stage"
            style={{ ["--face-scale" as string]: String(faceScale) }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onPointerEnter={handleStagePointerEnter}
            onPointerLeave={handleStagePointerLeave}
          >
            {localFace}
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
            {expanded && !activeModuleId && (
              <NavGrid
                onActivate={handleActivate}
                onCollapse={handleCollapseNav}
              />
            )}
            {!expanded && modulePanel && (
              <div className="hud-module-panel" data-testid="hud-module-panel">
                {modulePanel}
              </div>
            )}
            {lastPrompt && !modulePanel && !expanded && (
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

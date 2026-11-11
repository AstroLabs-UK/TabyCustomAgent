/**
 * Overlay window chrome — size to content, top-centred.
 * Debounced / thresholded so we never thrash setSize (was causing open shake).
 */

export type OverlayMode = "hidden" | "compact" | "scrim" | "expanded";

const HUD_WIDTH = 420;
const TOP_MARGIN = 0;
const PAD = 8;
/** Ignore size changes smaller than this (logical px) */
const SIZE_EPS = 6;
const POS_EPS = 4;

let lastApplied = { w: 0, h: 0, x: 0, y: 0 };
let fitInFlight = false;
let pending: { h: number; w: number } | null = null;

async function getWin() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

function screenBudget(): { w: number; h: number; maxH: number } {
  const w = typeof window !== "undefined" ? window.screen.availWidth : 1280;
  const h = typeof window !== "undefined" ? window.screen.availHeight : 900;
  return { w, h, maxH: Math.max(200, h - TOP_MARGIN - 24) };
}

async function applySize(contentHeightPx: number, contentWidthPx: number) {
  const { LogicalSize, LogicalPosition } = await import("@tauri-apps/api/dpi");
  const { invoke } = await import("@tauri-apps/api/core");
  const win = await getWin();
  const { w: screenW, maxH } = screenBudget();
  const width = Math.min(Math.max(contentWidthPx, 280), screenW - 24);
  const height = Math.min(
    Math.max(Math.ceil(contentHeightPx) + PAD, 40),
    maxH
  );
  const x = Math.round((screenW - width) / 2);
  const y = TOP_MARGIN;

  const sameSize =
    Math.abs(lastApplied.w - width) < SIZE_EPS &&
    Math.abs(lastApplied.h - height) < SIZE_EPS;
  const samePos =
    Math.abs(lastApplied.x - x) < POS_EPS &&
    Math.abs(lastApplied.y - y) < POS_EPS;

  if (!sameSize) {
    await win.setSize(new LogicalSize(width, height));
    lastApplied.w = width;
    lastApplied.h = height;
  }
  if (!samePos) {
    await win.setPosition(new LogicalPosition(x, y));
    lastApplied.x = x;
    lastApplied.y = y;
  }

  await win.setAlwaysOnTop(true);
  try {
    await invoke("show_main_window");
  } catch {
    await win.show();
  }
}

/** Resize the window to hug content height (clamped to screen). */
export async function fitOverlayToContent(
  contentHeightPx: number,
  contentWidthPx = HUD_WIDTH
): Promise<void> {
  try {
    pending = { h: contentHeightPx, w: contentWidthPx };
    if (fitInFlight) return;
    fitInFlight = true;
    while (pending) {
      const job = pending;
      pending = null;
      await applySize(job.h, job.w);
    }
    fitInFlight = false;
  } catch {
    fitInFlight = false;
    /* browser */
  }
}

export async function applyOverlayMode(mode: OverlayMode): Promise<void> {
  try {
    if (mode === "hidden") {
      const { invoke } = await import("@tauri-apps/api/core");
      try {
        await invoke("hide_main_window");
      } catch {
        const win = await getWin();
        await win.hide();
      }
      // reset so next show always applies size
      lastApplied = { w: 0, h: 0, x: 0, y: 0 };
      return;
    }
    // Stable default size — HudOverlay will refine once after settle
    const { maxH } = screenBudget();
    await fitOverlayToContent(Math.min(380, maxH * 0.48), HUD_WIDTH);
  } catch {
    /* browser */
  }
}

export async function hideToTray(): Promise<void> {
  await applyOverlayMode("hidden");
}

export async function showFromTray(): Promise<void> {
  await applyOverlayMode("compact");
}

export async function onTrayShowRequest(
  handler: () => void
): Promise<() => void> {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    const un = await listen("overlay://show", () => handler());
    return () => {
      void un();
    };
  } catch {
    return () => undefined;
  }
}

export { TOP_MARGIN, HUD_WIDTH };

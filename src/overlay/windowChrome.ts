/**
 * Overlay window chrome — size to content, top-centred.
 */

export type OverlayMode = "hidden" | "compact" | "scrim" | "expanded";

const HUD_WIDTH = 420;
const TOP_MARGIN = 12;
const PAD = 16;

async function getWin() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

function screenBudget(): { w: number; h: number; maxH: number } {
  const w = typeof window !== "undefined" ? window.screen.availWidth : 1280;
  const h = typeof window !== "undefined" ? window.screen.availHeight : 900;
  return { w, h, maxH: Math.max(200, h - TOP_MARGIN - 24) };
}

/** Resize the window to hug content height (clamped to screen). */
export async function fitOverlayToContent(
  contentHeightPx: number,
  contentWidthPx = HUD_WIDTH
): Promise<void> {
  try {
    const { LogicalSize, LogicalPosition } = await import("@tauri-apps/api/dpi");
    const { invoke } = await import("@tauri-apps/api/core");
    const win = await getWin();
    const { w: screenW, maxH } = screenBudget();
    const width = Math.min(Math.max(contentWidthPx, 280), screenW - 24);
    const height = Math.min(
      Math.max(Math.ceil(contentHeightPx) + PAD, 100),
      maxH
    );
    const x = Math.round((screenW - width) / 2);
    await win.setSize(new LogicalSize(width, height));
    await win.setPosition(new LogicalPosition(x, TOP_MARGIN));
    await win.setAlwaysOnTop(true);
    try {
      await invoke("show_main_window");
    } catch {
      await win.show();
    }
  } catch {
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
      return;
    }
    // Show with a modest default; HudOverlay will fit-to-content next frame
    const { maxH } = screenBudget();
    await fitOverlayToContent(Math.min(360, maxH * 0.45));
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

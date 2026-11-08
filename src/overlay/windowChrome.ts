/**
 * Resize / hit-test the Tauri overlay window.
 * Collapsed: thin top strip (hot zone only).
 * Expanded: tall transparent overlay so glass HUD can show.
 */

export type OverlayMode = "collapsed" | "expanded";

const COLLAPSED_H = 14;
const EXPANDED_H = 720;

export async function applyOverlayMode(mode: OverlayMode): Promise<void> {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const { LogicalSize, LogicalPosition } = await import("@tauri-apps/api/dpi");
    const win = getCurrentWindow();
    const screenW =
      typeof window !== "undefined" ? window.screen.availWidth : 1280;
    if (mode === "collapsed") {
      await win.setIgnoreCursorEvents(false);
      await win.setSize(new LogicalSize(screenW, COLLAPSED_H));
      await win.setPosition(new LogicalPosition(0, 0));
      await win.setAlwaysOnTop(true);
    } else {
      await win.setIgnoreCursorEvents(false);
      await win.setSize(new LogicalSize(screenW, EXPANDED_H));
      await win.setPosition(new LogicalPosition(0, 0));
      await win.setAlwaysOnTop(true);
    }
  } catch {
    // Browser / non-Tauri: no-op
  }
}

export async function setOverlayClickThrough(through: boolean): Promise<void> {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().setIgnoreCursorEvents(through);
  } catch {
    /* no-op */
  }
}

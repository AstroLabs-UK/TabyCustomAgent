/**
 * Overlay window chrome.
 * - hidden  → tray (no interactive window)
 * - compact → narrow top-centered HUD (default when visible)
 * - scrim   → full work-area only when menu/module needs click-outside
 */

export type OverlayMode = "hidden" | "compact" | "scrim" | "expanded";

const HUD_WIDTH = 420;
const HUD_HEIGHT = 780;
const TOP_MARGIN = 12;

async function getWin() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

export async function applyOverlayMode(mode: OverlayMode): Promise<void> {
  try {
    const { LogicalSize, LogicalPosition } = await import("@tauri-apps/api/dpi");
    const { invoke } = await import("@tauri-apps/api/core");
    const win = await getWin();
    const screenW =
      typeof window !== "undefined" ? window.screen.availWidth : 1280;
    const screenH =
      typeof window !== "undefined" ? window.screen.availHeight : 900;

    // Treat legacy "expanded" as compact (HUD sized, not fullscreen)
    if (mode === "expanded") mode = "compact";

    if (mode === "hidden") {
      try {
        await invoke("hide_main_window");
      } catch {
        await win.hide();
      }
      return;
    }

    if (mode === "scrim") {
      // Full work-area — only while nav/module is open for outside-click
      await win.setSize(new LogicalSize(screenW, screenH));
      await win.setPosition(new LogicalPosition(0, 0));
    } else {
      // compact — sized to the HUD stack so the user always sees content
      const h = Math.min(HUD_HEIGHT, Math.max(560, screenH - TOP_MARGIN - 40));
      const x = Math.round((screenW - HUD_WIDTH) / 2);
      await win.setSize(new LogicalSize(HUD_WIDTH, h));
      await win.setPosition(new LogicalPosition(x, TOP_MARGIN));
    }

    await win.setAlwaysOnTop(true);
    try {
      await invoke("show_main_window");
    } catch {
      await win.show();
      await win.setFocus();
    }
  } catch {
    /* browser / non-tauri */
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

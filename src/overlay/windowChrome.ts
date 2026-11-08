/**
 * Overlay window chrome — expanded when open; hide to system tray when dismissed.
 */

export type OverlayMode = "hidden" | "expanded";

const EXPANDED_H = 720;

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

    if (mode === "hidden") {
      // Prefer Rust hide (tray-friendly)
      try {
        await invoke("hide_main_window");
      } catch {
        await win.hide();
      }
      return;
    }

    // expanded
    await win.setSize(new LogicalSize(screenW, EXPANDED_H));
    await win.setPosition(new LogicalPosition(0, 0));
    await win.setAlwaysOnTop(true);
    try {
      await invoke("show_main_window");
    } catch {
      await win.show();
      await win.setFocus();
    }
  } catch {
    // Browser / non-Tauri: no-op
  }
}

export async function hideToTray(): Promise<void> {
  await applyOverlayMode("hidden");
}

export async function showFromTray(): Promise<void> {
  await applyOverlayMode("expanded");
}

/** Listen for tray “Show” so React can open the HUD phase. */
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

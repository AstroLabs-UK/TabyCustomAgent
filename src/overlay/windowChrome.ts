/**
 * Overlay window chrome — expanded when open; hide to system tray when dismissed.
 */

export type OverlayMode = "hidden" | "expanded";

async function getWin() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

function expandedHeight(): number {
  if (typeof window === "undefined") return 900;
  return Math.max(560, window.screen.availHeight - 4);
}

export async function applyOverlayMode(mode: OverlayMode): Promise<void> {
  try {
    const { LogicalSize, LogicalPosition } = await import("@tauri-apps/api/dpi");
    const { invoke } = await import("@tauri-apps/api/core");
    const win = await getWin();
    const screenW =
      typeof window !== "undefined" ? window.screen.availWidth : 1280;

    if (mode === "hidden") {
      try {
        await invoke("hide_main_window");
      } catch {
        await win.hide();
      }
      return;
    }

    await win.setSize(new LogicalSize(screenW, expandedHeight()));
    await win.setPosition(new LogicalPosition(0, 0));
    await win.setAlwaysOnTop(true);
    try {
      await invoke("show_main_window");
    } catch {
      await win.show();
      await win.setFocus();
    }
  } catch {
    /* browser */
  }
}

export async function hideToTray(): Promise<void> {
  await applyOverlayMode("hidden");
}

export async function showFromTray(): Promise<void> {
  await applyOverlayMode("expanded");
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

/**
 * Overlay window — only as wide as the HUD stack, top-centered.
 */

export type OverlayMode = "hidden" | "expanded";

/** Match CSS stack width */
const HUD_WIDTH = 400;
const HUD_HEIGHT = 760;
const TOP_MARGIN = 16;

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

    if (mode === "hidden") {
      try {
        await invoke("hide_main_window");
      } catch {
        await win.hide();
      }
      return;
    }

    const h = Math.min(HUD_HEIGHT, Math.max(520, screenH - TOP_MARGIN - 48));
    const x = Math.round((screenW - HUD_WIDTH) / 2);
    await win.setSize(new LogicalSize(HUD_WIDTH, h));
    await win.setPosition(new LogicalPosition(x, TOP_MARGIN));
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

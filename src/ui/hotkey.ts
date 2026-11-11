/**
 * Global hotkey registration — Tauri plugin when available, no-op in browser/tests.
 */

export type HotkeyHandle = { unregister: () => Promise<void> };

export async function registerGlobalHotkey(
  accel: string,
  onTrigger: () => void
): Promise<HotkeyHandle> {
  try {
    // Optional plugin — may not be installed yet
    const mod = await import("@tauri-apps/api/core");
    await mod.invoke("register_global_hotkey", { accel });
    // Listen via custom event if native side emits it
    const handler = () => onTrigger();
    window.addEventListener("taby-hotkey", handler);
    return {
      unregister: async () => {
        window.removeEventListener("taby-hotkey", handler);
        try {
          await mod.invoke("unregister_global_hotkey", { accel });
        } catch {
          /* ignore */
        }
      },
    };
  } catch {
    // Browser / tests: Ctrl+Shift+Space on window
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        onTrigger();
      }
    };
    window.addEventListener("keydown", handler);
    return {
      unregister: async () => window.removeEventListener("keydown", handler),
    };
  }
}

/**
 * Open the mock Taby face window.
 * Prefer Tauri WebviewWindow; fall back to window.open (dev / browser).
 */

const FACE_LABEL = "face";

export async function openFaceWindow(): Promise<"tauri" | "browser" | "failed"> {
  // Tauri 2
  try {
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const existing = await WebviewWindow.getByLabel(FACE_LABEL);
    if (existing) {
      await existing.setFocus();
      await existing.show();
      return "tauri";
    }
    const win = new WebviewWindow(FACE_LABEL, {
      url: "index.html?face=1",
      title: "Mock Taby Face",
      width: 340,
      height: 420,
      resizable: true,
      center: true,
      focus: true,
      visible: true,
    });
    await new Promise<void>((resolve, reject) => {
      win.once("tauri://created", () => resolve());
      win.once("tauri://error", (e) => reject(e));
      // Don't hang forever in case events differ
      setTimeout(() => resolve(), 1500);
    });
    return "tauri";
  } catch {
    /* not in Tauri or permission missing */
  }

  // Browser / fallback
  try {
    const w = window.open(
      `${window.location.pathname}?face=1`,
      "taby-mock-face",
      "width=340,height=420,menubar=no,toolbar=no,status=no"
    );
    if (w) {
      w.focus();
      return "browser";
    }
  } catch {
    /* blocked */
  }
  return "failed";
}

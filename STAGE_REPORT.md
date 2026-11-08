# Global top-edge open (not window tracking)

## How it works
While the overlay is **hidden in the tray**, a **Rust background thread** polls the **global** mouse position (`mouse_position` crate / OS cursor API) every ~40ms.

If the cursor stays in the **top ~8 physical pixels** of the desktop for **~450ms**, the overlay is shown and `overlay://show` is emitted (same path as tray “Show”).

This does **not** rely on a thin visible window or WebView hover — it works over any other app.

## Still available
- Tray icon left-click / “Show overlay”
- Click-off / Escape → hide to tray
- Close → tray (not quit)

## Tune
`TOP_EDGE_PX` and `EDGE_DWELL_MS` in `src-tauri/src/lib.rs`.

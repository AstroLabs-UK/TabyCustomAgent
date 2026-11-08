# Overlay mode

## Behaviour
- **No full app page** — only top-screen overlay
- Hover **top of screen** (dwell) → glass prompt
- **Menu** expands under prompt (official dark style)
- Click a nav item → **module glass panel** under the prompt (settings, tasks, …)
- **Click off** the menu/panel (backdrop) closes it; Escape too
- Window **collapses** to a thin top strip when HUD is hidden so other apps stay usable
- Desktop / apps visible around and through the glass

## Tauri
- `transparent`, `decorations: false`, `alwaysOnTop`
- Resize collapsed ↔ expanded with HUD phase

## Test in packaged / `tauri dev`
Browser-only won’t fully resize the OS window.

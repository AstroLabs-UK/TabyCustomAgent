# System tray

## Behaviour
- **Click off** the HUD (or Escape until closed) → window **hides to system tray**
- **Close button / Alt+F4** → tray (does not quit)
- **Left-click tray icon** or **Show overlay** menu → window shows + prompt opens
- **Quit** only from tray menu

## Note
Top-of-screen hover only works while the overlay window is visible. After hide-to-tray, use the tray icon to bring it back.

## Build
Requires `tauri` feature `tray-icon` (already set in Cargo.toml).

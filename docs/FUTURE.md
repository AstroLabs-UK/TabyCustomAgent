# Future fixes & additions

## Solidify current tools / functions
- [ ] End-to-end live tool loop against Groq (not only mock) with multi-tool chains
- [ ] Soft-delete + archive for **reminders** and **habits** (tasks/notes done)
- [ ] Confirm tool results always produce a non-empty assistant message (edge cases)
- [ ] Settings validation for BLE MAC / Wi‑Fi IP formats
- [ ] Persist provision identity securely; never log Wi‑Fi passwords
- [ ] Reconnect BLE automatically when device wakes (real hardware path)
- [ ] Wi‑Fi `/cmd` auth token optional for LAN safety

## Hardware (PENDING_HARDWARE)
- [ ] Real USB serial flash / provision (replace sim)
- [ ] Real BLE GATT (Web Bluetooth or Tauri plugin)
- [ ] Push GIF/firmware packs from desktop assets
- [ ] Device-side idle; desktop only sends event animations
- [ ] Recovery mode when flash fails

## Desktop product
- [ ] Auto-update from GitHub Releases (Tauri updater)
- [ ] Code signing / SmartScreen reputation (fewer “unrecognized app” warnings)
- [ ] Global hotkey via real Tauri plugin (browser fallback exists)
- [ ] Optional `run_command` tool — gated, confirm each run, no silent shell
- [ ] Richer Home dashboard empty states + weekly summary
- [ ] Voice STT beyond mock
- [ ] Attachment OCR / image describe via model vision APIs

## Onboarding & docs
- [ ] Live “practice summon” detection (not only checkbox)
- [ ] In-app browser for `docs/PHYSICAL_TABY.md` when offline
- [ ] Short video or GIFs for SmartScreen + USB plug-in

## Quality
- [ ] Windows signed CI artifact smoke test
- [ ] Accessibility pass (keyboard, reduced motion already partially there)
- [ ] Linux packaged binary release
- [ ] Crash/error reporting opt-in (no PII)

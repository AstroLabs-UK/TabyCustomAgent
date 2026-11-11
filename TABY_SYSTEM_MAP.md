# Taby system map (keep tiny — agent maintains)

> Agent rule: after any stage that changes architecture, transports, onboarding, or face/device flow, rewrite this file in full (same path). Prefer ≤120 lines. No secrets.

## Two runtimes
| Piece | What it is | Today | Target |
|-------|------------|-------|--------|
| **Desktop** | Tauri 2 + React HUD (Windows/Linux) | Full agent + local face | + updater, USB provision |
| **Screen** | Physical Taby (MCU + AMOLED) **or** on-screen face window | Local face GIFs; BLE/USB/Wi‑Fi **stubs** | Firmware + real transports |

Desktop **never** needs the screen online for chat/tasks. Screen is an output surface.

## Desktop parts (short)
- **HUD** `src/hud/*` — dwell open, prompt, 2×5 nav, leave-hide.
- **AI** `src/ai/*` — Groq default; mock offline; multi-step tools.
- **Tools** `src/tools/registry.ts` — tasks/notes/reminders/habits/focus/web.
- **Modules** `src/modules/*` — CRUD UIs; soft-delete archive.
- **Chat** `src/chat/*` — threads, attachments, typewriter.
- **Settings** `src/settings/*` — keys local; dwell/leaveHide/edge zone.
- **Onboarding** `src/onboarding/*` — first-run wizard (expand Stage 17).
- **Overlay** `src/overlay/*` — edge zone → native watcher.
- **Data** `src/data/localDb.ts` — localStorage-backed stores.

## Screen / device
- **Local face** `LocalFacePanel` + `faceBus` — GIF player in desktop; idle loops + reactions.
- **Mock** `mockDevice` — default; logs play/text commands.
- **BLE** `bleClient` — interface only → `PENDING_HARDWARE`.
- **USB** `usbClient` — stub; **first-setup path** (see below).
- **Wi‑Fi** — planned HTTP `/cmd` to device IP (Stage 16); not live.
- **Orchestrator** — maps chat phases → animation ids; push only when needed; idle stays on device when possible.

### How screen connects (target)
1. **USB cable (first boot / wiped)** — desktop detects serial/USB, flashes or extracts firmware+assets, reads identity (BLE MAC, serial), writes Wi‑Fi + owner config. User never types on the screen.
2. **BLE** — day-to-day: desktop sends play/text/choice by MAC saved in Settings.
3. **Wi‑Fi** — same commands over LAN when IP known (fallback / bulk).
4. **On-screen only** — no hardware; local GIFs only.

### Provision flow (go-for-it design)
Wiped screen → USB → Desktop “Set up Physical Taby” → push runtime+GIF pack → read MAC → user enters Wi‑Fi on **desktop** → device stores creds → disconnect USB → BLE/Wi‑Fi ready. Cable remains for recovery/update.

## Auto-update
| Surface | Today | Target |
|---------|-------|--------|
| Desktop | Manual zip / rebuild | Tauri updater + GitHub Releases (Stage 17+) |
| Screen assets/firmware | Manual | USB push from desktop; optional Wi‑Fi OTA later |

## Not built yet (QOL backlog)
- Real BLE reconnect + USB provision + Wi‑Fi client (Stage 16)
- Onboarding: edge size practice, summon practice, Physical vs screen-only, USB setup wizard (Stage 17)
- Desktop auto-update from GitHub
- Shell/run_command tool (gated; safety UX required)
- Global hotkey, error toasts, reduced motion
- Habits/reminders polish, Home empty states visual GO

## Stage gate
Stage 15 in progress (Home + recent UX). Next after **GO**: Stage 16 transports. Do not implement 16 until user says GO.

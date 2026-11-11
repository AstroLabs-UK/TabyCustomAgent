# Taby system map (keep tiny — agent maintains)

> After architecture/onboarding/device changes: rewrite this file (≤120 lines, no secrets).

## Runtimes
| Piece | Today | Notes |
|-------|-------|-------|
| **Desktop** | Tauri 2 + React HUD | Stages 0–17 software complete |
| **Screen** | Local GIFs; BLE/USB/Wi‑Fi **sim** | Real GATT/serial = PENDING_HARDWARE |

## Desktop map
- HUD `src/hud/*` · AI `src/ai/*` · Tools `src/tools/*` · Modules `src/modules/*`
- Chat `src/chat/*` · Settings `src/settings/*` · Onboarding `src/onboarding/*`
- Overlay `src/overlay/*` · Data `src/data/localDb.ts` · UI toasts/hotkey `src/ui/*`

## Device
- **USB** `usbClient.provision` — wiped setup sim: push → identity → Wi‑Fi SSID
- **BLE** `bleClient` — sim connect + `reconnect.ts` backoff
- **Wi‑Fi** `wifiClient` — POST `{base}/cmd`
- **Mock** default offline face
- Registry picks client by `settings.device.transport`

## Provision (target + sim)
USB cable → desktop Run USB setup → MAC/serial saved → transport switches to BLE → day-to-day BLE/Wi‑Fi.

## Onboarding (17)
Welcome → AI → key → Physical? → [USB setup] → face → edge size → practice summon → done.

## Auto-update
Desktop: not yet (manual zip). Screen: USB push (sim); OTA later.

## Stages
15–17 GO path 2026-11-11. Hardware validation still PENDING_HARDWARE.

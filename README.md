# Taby Custom Agent

Local desktop overlay agent (Hey Taby–inspired) using **your** AI (Groq by default), not the official Taby cloud. Optional Physical Taby over BLE / USB / Wi‑Fi.

## Platforms
- **Windows 10/11** — primary; `npm run tauri:build` → `.exe` / NSIS
- **Linux** — first-class for tests and core

## Quick start
```bash
npm install
npm test
npm run tauri:dev
```

API keys: Settings only (never commit). Mock provider works offline.

## Physical Taby (target flow)
1. **USB** on a wiped device — Settings → Device → USB → Run USB setup (or onboarding).
2. Desktop pushes runtime, reads **BLE MAC**, writes **Wi‑Fi SSID** from the PC.
3. Day-to-day: **BLE**; Wi‑Fi HTTP `/cmd` as fallback.

Until hardware plugins land, USB/BLE run in **simulation** so UI and tests pass without a device.

## Docs
| File | Role |
|------|------|
| `TABY_ROADMAP.md` | Gated stages |
| `TABY_SYSTEM_MAP.md` | Compact architecture |
| `DEV_WORKFLOW.md` | Agent vs human split |
| `design.md` / `DESIGN_TOKENS.md` | Look |

## Tests
```bash
npm test
```

## License
Private / your project — no secrets in the repo.

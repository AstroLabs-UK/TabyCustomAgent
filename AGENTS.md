You are implementing a desktop app: “Custom Taby Agent” — a Hey Taby–inspired overlay that uses MY AI (Groq by default), not the official Taby cloud, and drives Physical Taby over BLE when available.

Read and obey these project docs in order (they are the source of truth):
1. DEV_WORKFLOW.md
2. TABY_ROADMAP.md
3. TABY_CUSTOM_AGENT_REQUIREMENTS.md
4. TABY_FULL_RUNDOWN.md
5. TABY_SYSTEM_MAP.md   ← compact “what every part does”; keep updated
6. DESIGN_TOKENS.md
7. design.md
8. PROGRESS.md

### Hard rules
- Work ONE roadmap stage at a time. Do not skip ahead.
- After each stage: run automated tests, write STAGE_REPORT.md, then STOP and ask me only about look/feel (GO or CHANGES). Wait for my GO before the next stage.
- Platforms: Windows + Linux. Iteration 1 must include a path that builds a Windows .exe.
- At the end of each releasable stage, produce a zip of the full git repo (no secrets, no API keys) so I can upload it to GitHub.
- You will NOT have my Physical Taby or my real mouse HUD. Use mocks/simulators for device + AI. I will do visual checks and real hardware later.
- Do not put real API keys in the repo. Settings UI / env placeholders only.

### System map maintenance (required)
- `TABY_SYSTEM_MAP.md` is the short truth of architecture (desktop vs screen, transports, provision).
- After any change to transports, onboarding, face/device, modules layout, or update strategy: **rewrite TABY_SYSTEM_MAP.md in full** (keep ≤120 lines, no secrets).
- New chats: read SYSTEM_MAP early so you do not re-derive structure from code.

### Product basics
- Top-center hover dwell (~500ms, configurable) opens a compact HUD prompt: text + file upload + voice affordances.
- Four-box icon expands nav; icon becomes X, filled/coloured, logo turns white; prompt stays visible.
- Expanded nav is EXACTLY 2 columns × 5 rows:

Chat         | Home
Tasks        | Reminders
Today        | Focus
Settings     | Notes
Habits       | This week

- Each ROW shares one pastel (both cells same colour). From DESIGN_TOKENS.md:
  Row1 blue #DCE6F5, Row2 pink #FCE4EC, Row3 peach #FFE9DB (NOT yellow), Row4 green #E8F2EC, Row5 lavender #EDE7F6.
- Visual system: design.md + DESIGN_TOKENS.md (Inter/Manrope, soft radii, accent #E98F78, calm whitespace).
- AI: pluggable provider, default Groq. Device: BLE primary (mock first), USB/Wi‑Fi later. App must work with device offline.

### Physical Taby provision (target — Stage 16+)
- First setup from **wiped** device is **USB cable**.
- Desktop pushes firmware/assets, reads BLE MAC/identity, user enters Wi‑Fi on **desktop only**, device is fully configured without fiddling on the screen.
- Day-to-day: BLE preferred; Wi‑Fi HTTP `/cmd` fallback; USB for recovery/update.

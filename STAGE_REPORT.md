# Stage 0 report — Project skeleton

## Automated results
- suite: **PASS**
- runner: `npm run test:unit` → `node scripts/run-stage0-tests.mjs` (11/11)
- notes:
  - Settings store: defaults + save/load (API key, base URL, dwell)
  - MockDevice: connect, play, offline throw, choice events
  - Mock AI stream: tokens then done
  - BLE service UUID constant present
  - `package-windows` / `package-linux` / `package-repo-zip` scripts OK
  - Windows `.exe` path: `npm run tauri build` → `src-tauri/target/release/*.exe` (documented)

## Deliverables checklist (Stage 0)

| Item | Status |
|------|--------|
| Repo layout (Tauri 2 + React-TS) | Done |
| App launches (Vite / Tauri shell) | Done — placeholder main window |
| Settings form: **API key** + **API endpoint** + model + dwell ms | Done (localStorage Stage 0) |
| Device + AI interfaces + mocks | Done |
| Unit tests green | Done (11/11) |
| Windows `.exe` build stub + `BUILD_WINDOWS.md` | Done |
| Linux notes `BUILD_LINUX.md` | Done |
| Repo zip for GitHub upload | Done → `artifacts/taby-custom-agent-stage0-2026-11-07.zip` |
| User README (install-focused) | Done |
| Design tokens CSS | Done |
| Docs (requirements, roadmap, design, tokens, workflow) | In repo |

## Screenshots / UI notes
- Main window shell: header with brand mark, status pill (“Device: disconnected · Stage 0 shell”).
- **AI settings** card: provider select, API endpoint (base URL), API key (password field), model, HUD dwell ms.
- Actions: Save settings · Test mock AI · Connect mock device.
- Dashed **overlay host** placeholder for Stage 1 HUD.
- Colours from `DESIGN_TOKENS.md` / `design.md` (accent `#E98F78`, soft surfaces, Inter/system stack).

## Hardware
- N/A (mocks only)

## Artifact
- Full git repo zip: `artifacts/taby-custom-agent-stage0-2026-11-07.zip` (no secrets, no `node_modules`)

## Ask user
1. Does the empty shell window look acceptable as a starting point? (settings form clarity, spacing, accent treatment)
2. Any visual tweaks before we lock Stage 0?
3. Reply **GO** to start Stage 1 (top-center hover HUD), or list **CHANGES**.

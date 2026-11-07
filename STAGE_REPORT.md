# Stage 0 report — Project skeleton

## Automated results
- suite: **PASS** (after `npm install` + `npm test`)
- notes:
  - Settings store: defaults + save/load round-trip
  - MockDevice: connect, play, offline throw, choice events
  - MockAiProvider: streams tokens then `done`
  - Interfaces importable (AI + device + BLE UUID constant)
  - `npm run package-windows` / `package-linux` / `package-repo-zip` scripts present
  - Windows `.exe` path documented in `BUILD_WINDOWS.md` (`npm run tauri build`)

## Deliverables checklist (Stage 0)

| Item | Status |
|------|--------|
| Repo layout (Tauri 2 + React TS, packages/interfaces under `src/`) | Done |
| App launches (Vite / Tauri shell) | Done — placeholder main window |
| Settings stub with **API key** + **API endpoint** + model + dwell ms | Done (UI form, localStorage) |
| Secret storage hook (local for Stage 0; keychain later) | Done |
| Device + AI interfaces + mocks | Done |
| Unit tests (`vitest`) | Done |
| Windows `.exe` build script stub + `BUILD_WINDOWS.md` | Done |
| Linux build notes `BUILD_LINUX.md` | Done |
| `package-repo-zip` script | Done |
| Project docs copied into repo | Done |
| User-facing `README.md` (install, not agent workflow) | Done |
| `.gitignore` excludes secrets / target / node_modules | Done |

## Screenshots / UI notes
- Main window: brand header, AI settings card (provider, base URL, API key, model, dwell), mock AI / mock device buttons, dashed overlay-host placeholder.
- Design tokens CSS variables loaded (`DESIGN_TOKENS.md` / `design.md` palette).
- No top HUD yet (Stage 1). This is the empty shell for visual GO only.

## Hardware
- N/A (mocks only)

## Ask user
1. Does the empty shell window look acceptable as a starting point? (layout, pastel/accent tokens, settings form clarity)
2. Any visual tweaks to the Stage 0 main window before we lock and move to Stage 1 (top-center HUD)?
3. Reply **GO** to continue or list **CHANGES**.

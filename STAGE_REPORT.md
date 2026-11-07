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

---

## Post-Stage-0 patch (CI only — not Stage 1)

Added GitHub Actions workflow so **every push** builds a Windows `.exe`:

- `.github/workflows/build-windows.yml`
- Triggers: push (all branches), pull_request, workflow_dispatch
- Artifact name: `taby-custom-agent-windows-exe`
- Docs updated: `BUILD_WINDOWS.md`, `README.md`

No Stage 1 UI work. Stage 0 remains awaiting visual GO / CHANGES.

## Patch — Releases + installer + git identity

- `.git/config` fixed to AstroLabs / https://github.com/AstroLabs-UK/TabyCustomAgent
- `tauri.conf.json`: NSIS + MSI targets; WebView2 `downloadBootstrapper` (silent) so installer brings in runtime deps
- `build-windows.yml`: on push to main/master or tag `v*`, publishes GitHub Release with assets + install tutorial in body
- Docs updated (BUILD_WINDOWS.md, README.md)

Still Stage 0 — no Stage 1 UI.


## Patch — package-lock.json for CI

- Added root `package-lock.json` so `actions/setup-node` `cache: npm` and `npm ci` succeed on Windows runners.
- Fixes failed **Setup Node.js** step on GitHub Actions.

## Patch — Windows CI: resolve Tauri CLI

- Workflow now runs `npm run tauri:build` (not `npm run tauri build`).
- `tauri:build` / `tauri:dev` scripts use `npx --no-install tauri …` so the local `@tauri-apps/cli` is found on Windows runners.

## Patch — invoke Tauri CLI via node path

- `npx --no-install tauri` fails on Windows because the package is `@tauri-apps/cli`, not `tauri`.
- Scripts now call `node ./node_modules/@tauri-apps/cli/tauri.js …` (works on Windows + Linux).
- Workflow verifies `tauri.js` exists after `npm ci` before building.

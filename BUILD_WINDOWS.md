# Build Windows `.exe`

**Primary target for iteration 1.**

## Prerequisites (Windows 10/11)

1. [Node.js 20+](https://nodejs.org/) (LTS)
2. [Rust](https://rustup.rs/) (`rustup default stable`)
3. [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Desktop development with C++)
4. WebView2 is usually preinstalled on Windows 10/11

## Commands

```bash
git clone <your-repo-url> taby-custom-agent
cd taby-custom-agent
npm install
npm run tauri build
```

## Output

- Portable binary: `src-tauri/target/release/taby-custom-agent.exe`
- Installers (if bundle targets enabled): under `src-tauri/target/release/bundle/`

## Dev mode

```bash
npm run tauri dev
```

## Notes

- API keys are entered in **Settings** inside the app (never via `.env` in the shipped package).
- Close the official Hey Taby desktop app before connecting Physical Taby over BLE.
- Cross-compiling the Windows `.exe` from Linux is possible but not required for v1; build on Windows when practical.

## GitHub Actions (automatic `.exe` on every push)

This repo includes `.github/workflows/build-windows.yml`.

- **Triggers:** every `push` (any branch), every `pull_request`, and manual **workflow_dispatch**.
- **Runner:** `windows-latest`
- **Steps:** Node 20 → Rust stable → `npm ci` → `npm run tauri build`
- **Artifacts:** uploaded as `taby-custom-agent-windows-exe` (the `.exe` plus any NSIS/MSI under `bundle/`). Retention 14 days.

### How to get the `.exe` after a push

1. Push to GitHub (or open a PR).
2. Open the repo → **Actions** → latest **Build Windows EXE** run.
3. Download the artifact **taby-custom-agent-windows-exe**.

No secrets or API keys are required for the CI build. The app still expects the user to enter their own key in Settings after install.

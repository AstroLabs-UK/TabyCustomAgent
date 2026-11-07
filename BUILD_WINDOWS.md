# Build Windows `.exe` / installer

**Primary target for iteration 1.**

The preferred ship form is the **NSIS setup `.exe`**. It installs the app and, when needed, downloads the **Microsoft Edge WebView2** runtime (silent bootstrapper configured in `tauri.conf.json`).

## Prerequisites (local Windows 10/11 build)

1. [Node.js 20+](https://nodejs.org/) (LTS)
2. [Rust](https://rustup.rs/) (`rustup default stable`)
3. [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Desktop development with C++)
4. WebView2 is usually preinstalled on Windows 10/11

## Commands

```bash
git clone https://github.com/AstroLabs-UK/TabyCustomAgent.git
cd TabyCustomAgent
npm install
npm run tauri build
```

## Output

| Path | What |
|------|------|
| `src-tauri/target/release/bundle/nsis/*-setup.exe` | **Installer** (app + WebView2 bootstrapper) — prefer this |
| `src-tauri/target/release/bundle/msi/*.msi` | MSI package |
| `src-tauri/target/release/taby-custom-agent.exe` | Portable binary (no installer) |

## Dev mode

```bash
npm run tauri dev
```

## GitHub Actions → Releases

Workflow: `.github/workflows/build-windows.yml`

| Event | Result |
|-------|--------|
| Push to `main` / `master` | Build + **GitHub Release** (prerelease tag `continuous-<sha>`) with NSIS/MSI/portable assets and install tutorial in the description |
| Tag `v*` (e.g. `v0.1.0`) | Build + **GitHub Release** (stable, non-prerelease) with same assets |
| Pull request | Build + CI artifact only (no release) |
| Manual `workflow_dispatch` | Same as PR (artifact only) unless run on main |

**Install from (also written into each Release body):**

1. Download the **NSIS `*-setup.exe`** from the Release **Assets**.
2. Run it (allows WebView2 install if missing).
3. Launch **Custom Taby Agent**.
4. Settings → API key + endpoint (Groq: `https://api.groq.com/openai/v1`).
5. Optional BLE: close official Hey Taby first.

CI uses the default `GITHUB_TOKEN` (contents: write). No extra secrets or API keys are required for the build.

## Notes

- API keys are entered in **Settings** inside the app (never via `.env` in the shipped package).
- Close the official Hey Taby desktop app before connecting Physical Taby over BLE.

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

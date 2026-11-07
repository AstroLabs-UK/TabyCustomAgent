# Build on Linux

## Prerequisites

Follow [Tauri Linux prerequisites](https://tauri.app/start/prerequisites/):

- Node.js 20+
- Rust (`rustup`)
- `webkit2gtk`, `librsvg2`, build essentials (distro packages)

Example (Debian/Ubuntu):

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

## Commands

```bash
npm install
npm run tauri build
```

## Dev

```bash
npm run tauri dev
```

For UI-only iteration without native shell:

```bash
npm run dev
```

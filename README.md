# Custom Taby Agent v1.0.0

Local desktop overlay agent (Hey Taby–inspired) using **your** AI (Groq by default), not the official Taby cloud. Optional Physical Taby over BLE / USB / Wi‑Fi.

## Install (Windows)

1. Download the **setup .exe** from [Releases](../../releases).
2. Run it. If Windows says the app is unrecognized: **More info → Run anyway** (SmartScreen).
3. Complete onboarding.
4. Optional: connect a Physical Taby (USB first — can install firmware onto the device).

Portable build: **tryCustomTabyAgent.exe** in the same release assets.

## Platforms

- **Windows 10/11** — primary; GitHub Actions builds NSIS setup + portable exe
- **Linux** — core + tests

## Quick start (dev)

```bash
npm install
npm test
npm run tauri:dev
```

API keys stay in Settings on your machine only.

## Physical Taby

See **[docs/PHYSICAL_TABY.md](docs/PHYSICAL_TABY.md)** — how to build a device and connect it to **this** app (not official Hey Taby). Hardware/firmware upstream: [TRIIIS-LABS/firmware-taby](https://github.com/TRIIIS-LABS/firmware-taby).

## License

Personal, non-commercial use free. Commercial use or renaming/rebranding requires written approval from **Lucas Stevens** (`lucas@astrolabs.uk`). Face animations acknowledge [firmware-taby](https://github.com/TRIIIS-LABS/firmware-taby). Full text: [LICENSE](LICENSE).

## Docs

| File | Role |
|------|------|
| `TABY_ROADMAP.md` | Stages |
| `TABY_SYSTEM_MAP.md` | Architecture map |
| `docs/PHYSICAL_TABY.md` | Build + pair Physical Taby |
| `docs/FUTURE.md` | Backlog |
| `DEV_WORKFLOW.md` | Agent workflow |

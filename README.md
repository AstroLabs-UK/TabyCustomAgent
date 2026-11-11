# Custom Taby Agent v1.0.0

Local desktop overlay agent (Hey Taby–inspired) using **your** AI (Groq by default), not the official Taby cloud. Optional Physical Taby over BLE / USB / Wi‑Fi.

## Install (Windows)

1. Download the **setup .exe** from the [Latest Release](https://github.com/AstroLabs-UK/TabyCustomAgent/releases/latest).
2. Run it. If Windows says the app is unrecognized: **More info → Run anyway** (SmartScreen).
3. Complete onboarding.
4. Optional: connect a Physical Taby (USB first — can install firmware onto the device).

Portable build: **tryCustomTabyAgent.exe** in the same release assets.

## Platforms

- **Windows 10/11** — primary; GitHub Actions builds setup + portable exe
- **Linux** — core + tests

## Quick start (dev)

```bash
npm install
npm test
npm run tauri:dev
```

API keys stay in Settings on your machine only.

## Physical Taby

Full guide (board → firmware → **connect to this app** → case):

**[docs/PHYSICAL_TABY.md](docs/PHYSICAL_TABY.md)**

Hardware/firmware upstream: [TRIIIS-LABS/firmware-taby](https://github.com/TRIIIS-LABS/firmware-taby)  
(adapted so step 3 pairs with Custom Taby Agent, not official Hey Taby.)

## License

Personal, non-commercial use free. Commercial use or renaming/rebranding requires written approval from **Lucas Stevens** (`lucas@astrolabs.uk`). Face animations acknowledge [firmware-taby](https://github.com/TRIIIS-LABS/firmware-taby). Full text: [LICENSE](LICENSE).

## Docs

| File | Role |
|------|------|
| [docs/PHYSICAL_TABY.md](docs/PHYSICAL_TABY.md) | Build + pair Physical Taby |
| [docs/FUTURE.md](docs/FUTURE.md) | Backlog |
| `TABY_SYSTEM_MAP.md` | Architecture map |
| `TABY_ROADMAP.md` | Stages |
| `DEV_WORKFLOW.md` | Agent workflow |

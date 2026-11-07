# Custom Taby Agent

A **local-first desktop companion** inspired by Hey Taby. Chat with **your** AI (Groq by default, or any OpenAI-compatible endpoint), use a top-of-screen HUD, and optionally drive **Physical Taby** over Bluetooth LE. The official Taby cloud and official desktop app are **not** required.

## What you get

- Top-center hover HUD (prompt, file/voice affordances as stages land)
- Expandable **2×5** navigation (Chat, Home, Tasks, Reminders, Today, Focus, Settings, Notes, Habits, This week)
- Your API key & base URL in Settings — keys stay on your machine
- Physical face animations when a device is paired (stock firmware)
- Windows and Linux; Windows **`.exe`** build path documented

## Install (users)

### Windows

1. Download a release `.exe` or build from source (see [BUILD_WINDOWS.md](BUILD_WINDOWS.md)).
2. Run the app.
3. Open **Settings**, paste your **API key** and confirm the **API endpoint** (Groq: `https://api.groq.com/openai/v1`).
4. Optional: pair Physical Taby over BLE — **close the official Taby app first**.

### Linux

See [BUILD_LINUX.md](BUILD_LINUX.md) to build from source, or install a published package when available.

### From source (developers)

```bash
git clone <repo-url>
cd taby-custom-agent
npm install
npm run tauri dev    # native shell
# or
npm run dev          # web UI only (Vite)
```

Run tests:

```bash
npm test
```

## Privacy

- Local-first: chats, tasks, and settings live on your PC.
- No telemetry by default.
- API keys are stored locally (secure storage in later stages); never commit them.

## Hardware

Physical Taby is optional. Without a device, chat and productivity modules still work. With BLE paired, the face reacts to conversation state.

Protocol reference: [firmware-taby](https://github.com/TRIIIS-LABS/firmware-taby).

## Project docs

| File | Role |
|------|------|
| `TABY_CUSTOM_AGENT_REQUIREMENTS.md` | Product & engineering requirements |
| `TABY_ROADMAP.md` | Staged delivery |
| `DESIGN_TOKENS.md` / `design.md` | Visual system |
| `DEV_WORKFLOW.md` | Agent vs human workflow |
| `PROGRESS.md` | Stage sign-off log |

## License / assets

Official Taby artwork and animations remain subject to upstream terms (personal use). Do not rebrand the face as a different product. This app is an independent client using the public device protocol and your own AI provider.

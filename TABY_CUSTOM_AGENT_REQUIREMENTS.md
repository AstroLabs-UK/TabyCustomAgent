# Custom Taby Agent — Product & Engineering Requirements

**Document purpose:** Single source of truth for a coding agent to implement a desktop companion that drives Physical Taby with a **custom AI backend** (e.g. Groq), while matching and eventually expanding the interaction model of the official Taby desktop app.

**Status:** Draft v1.2 — Win/Linux + .exe zip delivery; pastel 2×5 nav; see DEV_WORKFLOW.md + DESIGN_TOKENS.md  
**License / asset note:** Official Taby artwork and animations remain subject to upstream license terms (personal use; do not rebrand the face as a different product). Firmware protocol is used as a client only — do not require patched firmware for MVP.

---

## 1. Vision

Build a **local-first desktop agent** that:

1. Lets the user chat with **their own AI** (API key / provider of choice; default target: Groq free tier).
2. Controls the **Physical Taby** face (animations, text cards, choices) primarily over **Bluetooth LE**, with USB and local Wi‑Fi HTTP as fallback transports.
3. Provides a **desktop overlay UX** comparable to the official Taby app: hover-to-invoke at the top-center of the screen, compact prompt surface, expandable navigation, and progressive feature modules (tasks, reminders, focus, notes, habits, etc.).
4. Stays usable **without** the official Taby desktop app running (exclusive device ownership while connected).

**One-line product promise:**  
*Ask anything from a thin top-of-screen HUD; the physical face reacts; your AI does the thinking.*

---

## 1.1 Delivery & platforms (iteration 1)

- Ship a **desktop app** (not a website-only MVP).
- Must build and run on **Windows** and **Linux**.
- Iteration 1 Windows artifact: compile to **`.exe`** (portable and/or installer).
- Coding agent ends each releasable slice by producing a **zip of the full git repository** for the user to upload to GitHub (no secrets).
- Visual system: `design.md` + `DESIGN_TOKENS.md` (pastel rows for the feature menu).
- Workflow authority: `DEV_WORKFLOW.md`.

## 2. Non-goals (explicit)

- Do **not** reverse-engineer or depend on private official Taby cloud APIs for the brain.
- Do **not** require modified device firmware for MVP (use stock public protocol).
- Do **not** rebrand upstream face/animation art as a different character/product.
- Do **not** expose device HTTP endpoints beyond the trusted LAN.
- Do **not** fight the official app for the same BLE/USB session; document “close official app first.”

---

## 3. Architecture overview

```
User (hover HUD / keyboard / voice / files)
        │
        ▼
┌───────────────────────────────────────────┐
│  Custom Taby Desktop Agent                │
│  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Overlay UI  │  │ Session / Router    │ │
│  │ (top HUD)   │──│ modules + tools     │ │
│  └─────────────┘  └──────────┬──────────┘ │
│                              │            │
│         ┌────────────────────┼──────────┐ │
│         ▼                    ▼          ▼ │
│  ┌────────────┐      ┌────────────┐ ┌──────────┐
│  │ AI provider│      │ Device I/O │ │ Local DB │
│  │ (Groq…)    │      │ BLE/USB/Wi‑Fi│ │ tasks…  │
│  └────────────┘      └─────┬──────┘ └──────────┘
└────────────────────────────┼──────────────────┘
                             │ BLE (primary)
                             ▼
                    Physical Taby (stock firmware)
                    animations + on-device UI + touch
```

### 3.1 Transports (device)

| Priority | Transport | Use |
|----------|-----------|-----|
| 1 | **Bluetooth LE** | Primary daily control |
| 2 | USB serial 115200 | Setup, recovery, debugging |
| 3 | Local Wi‑Fi HTTP | Cable-free when BLE awkward; LAN only |

**BLE (from public firmware docs):**

- Service: `54414259-0000-4000-a000-000000000001`
- Write commands → characteristic ending `0002` (UTF-8, **no** newline)
- Subscribe events → characteristic ending `0003` (`READY` / `OK` / `ERR` style)
- Read state → `0004`
- Read power → `0005`
- One controller at a time; no bonding required

**Command examples (same semantics as USB):**

- Animation ID: `confirmation`, `listening_loop`, `working_loop`, …
- UI: `UI/title_subtitle?demo:TITLE|SUBTITLE`
- Choice: `UI/choice_2?demo:PROMPT|A|B`
- `CLEAR`, timer UI, etc.

**Wi‑Fi HTTP (after device onboarded to LAN):**

- `GET /ping`, `/state`, `/touch`, `/v1/reusable/choice-signal`
- `GET /cmd?c=<url-encoded-command>`
- No auth — trusted LAN only

### 3.2 AI brain

- Pluggable provider interface (OpenAI-compatible first).
- Default implementation: **Groq** (user supplies API key; store in OS keychain / local secrets, never in git).
- System prompt must define role: harness + tool user; physical face is an output channel.
- Tool-calling supported where the model allows (play animation, create task, etc.).
- Streaming responses preferred for UI responsiveness.

### 3.3 Local data

- SQLite (or equivalent) for tasks, reminders, notes, habits, settings, chat history.
- File uploads stored in an app data directory with explicit user consent paths.
- Export/import later; MVP can be local-only.

---

## 4. Desktop overlay UX (must match user specification)

### 4.1 Invocation — top-center hover

- **Hot zone:** top edge of the primary display, **horizontally centered**, in the region under the laptop camera / notch area (middle of the top bezel edge).
- **Activation:** user holds the mouse pointer in that hot zone for approximately the **same dwell time as the official Taby desktop app** (implement as a configurable constant; default target **~400–600 ms**, tunable in Settings to match feel).
- On successful dwell:
  - A **compact overlay panel** appears anchored to the top-center.
  - Focus moves to the prompt field so the user can type immediately.
- Dismiss: Escape, click outside, or explicit close; optional auto-hide when focus lost (setting).

### 4.2 Compact state (default after invoke)

Visible:

- **Prompt bar** — “Ask anything…” (or equivalent).
- Support **text**, **file upload**, and **voice recording** entry points on/near the prompt bar.
- A **four-box (grid) icon** for expanding navigation.
- Physical-device connection indicator (BLE connected / connecting / missing).
- Optional small face/status glyph (do not misuse upstream branding beyond allowed personal use).

### 4.3 Expanded navigation state

**Interaction:**

1. User clicks the **four-box icon**.
2. Icon morphs to an **X**.
3. Icon becomes **filled / coloured-in**.
4. Associated **logo mark turns white** (or high-contrast inverse) while expanded.
5. **Dropdown / expanded panel** opens with navigation destinations.
6. **Prompt bar remains visible** while expanded.

**Navigation grid (exact layout — 2 columns × 5 rows):**

```
┌─────────────┬─────────────┐
│ Chat        │ Home        │
│ Tasks       │ Reminders   │
│ Today       │ Focus       │
│ Settings    │ Notes       │
│ Habits      │ This week   │
└─────────────┴─────────────┘
```

| Row | Left column | Right column |
|----:|-------------|--------------|
| 1 | Chat | Home |
| 2 | Tasks | Reminders |
| 3 | Today | Focus |
| 4 | Settings | Notes |
| 5 | Habits | This week |

- **10 items only** (no Feedback in this menu).
- Equal-width columns; consistent row height; readable hit targets (min ~40px height).
- Keyboard: arrow keys move in 2D grid; Enter activates; Escape collapses.

**Collapse:** click the X (or outside / Escape) → icon returns to four-box outline, logo returns to default styling, dropdown closes, prompt bar stays unless whole HUD dismissed.

### 4.4 Prompt capabilities (compact + expanded)

- **Text input** with send on Enter (Shift+Enter newline).
- **File upload:** button + drag-drop onto prompt; images and common docs first; show chip/preview; pass path or extracted text to the agent per policy.
- **Voice recording:** press-to-talk or toggle; waveform/timer affordance; STT pipeline (local or API — pluggable); transcript lands in prompt or sends directly per setting.
- Streaming assistant tokens in a thread view (Chat module) or ephemeral reply card in compact mode (product choice; prefer full Chat for long replies).

### 4.5 Visual / interaction quality bar

- Always-on-top overlay option; click-through when hidden.
- Multi-monitor: hot zone on **focused** or **primary** display (setting).
- Respect reduced-motion OS preference where reasonable.
- Keyboard: global shortcut optional (e.g. Alt+Space) in addition to hover.
- Does not steal focus from fullscreen games when “gaming mode” enabled (setting).

---

## 5. Physical face behaviour

### 5.1 State → animation mapping (MVP defaults)

| Agent / UX state | Suggested animation IDs (1.64 pack) |
|------------------|-------------------------------------|
| Idle / waiting | `idle_01_loop` |
| Listening / mic open | `listening_in` → `listening_loop` |
| Thinking / API call | `busy_loop` or `working_loop` |
| Laptop-work metaphor | `working_laptop_*` variants |
| Answer ready | `taby_response_ready_in` / `_loop` or `confirmation` |
| Affirmative | `yeah`, `thumbs_up` |
| Negative | `no`, `disappointed` |
| Task created / done | `task_created`, `task_completed` |
| Focus start | `lockin` |
| Break / water / posture | `break_start`, `drink_water`, `posture_check` |

Mapping must be data-driven (JSON/YAML) so it can be edited without code changes.

### 5.2 On-device UI

- Support text cards and 2-choice prompts via protocol.
- When user selects a choice on the device, agent receives event and treats it as input.
- Never assume `OK` means the user saw the frame; optional “ack” only from protocol.

### 5.3 Connection lifecycle

- Auto-reconnect BLE with backoff.
- Clear UI status when device lost.
- Prefer BLE; allow manual transport override in Settings.
- Document: close official Taby app before connecting.

---

## 6. Feature modules — parity roadmap

Build in phases. Each module must work **without** Physical Taby connected (face features degrade gracefully). Device enhances the experience but is not a hard dependency for pure software features.

### Phase 0 — Foundation (ship first)

- [ ] Project scaffold (desktop shell: Tauri / Electron / native — pick one and stick to it).
- [ ] Secrets storage for API keys.
- [ ] AI provider interface + Groq implementation.
- [ ] Device transport interface + **BLE client** + USB client stub.
- [ ] Animation play + simple text card.
- [ ] Top-center **hover HUD** + prompt bar + four-box → X expanded nav shell (routes can be placeholders).
- [ ] Chat module: threaded history, streaming, basic markdown.
- [ ] Settings: API key, model, hot-zone dwell ms, transport preference, start at login (optional).

### Phase 1 — Core productivity

- [ ] **Tasks:** create, list, complete, due dates; agent tools to add/complete.
- [ ] **Reminders:** local scheduler; notification + optional face nudge (`drink_water`, etc.).
- [ ] **Notes:** create/search; attach to chat context on demand.
- [ ] **Today:** list of reminders + tasks due today + optional calendar file/URL later.
- [ ] File upload path into chat (text extraction for pdf/txt/md; images as vision if model supports).
- [ ] Voice input MVP (record → STT → prompt).

### Phase 2 — Focus & habits

- [ ] **Focus:** timer UI in app + optional `UI/timer` on device; start/stop; lock-in animation.
- [ ] **Habits:** daily check-ins; streaks; agent can log habits from chat.
- [ ] **This week:** aggregate tasks/habits/focus time.
- [ ] **Home:** cards summarizing Today, Focus status, device battery/state if available.

### Phase 3 — Deeper agent & integrations

- [ ] Tool framework: structured tools for tasks, reminders, notes, face commands, web search (user-provided key), local files (opt-in directories).
- [ ] MCP **client** optional: attach external MCP servers the user configures.
- [ ] Calendar integration (read-only first: ICS / Google with user OAuth — only if free tiers allow).
- [ ] Multi-provider AI (OpenAI-compatible base URL, Anthropic, local OpenAI-compatible endpoint).
- [ ] Conversation memory / profiles (local).

### Phase 4 — Polish & parity stretch

- [ ] **Feedback** (optional, not in main 2×5 nav): collect text + optional logs (no secrets); entry from Settings or About.
- [ ] Rich settings: eye-motion only if exposed on transport; theme; HUD size; animation intensity policy.
- [ ] Onboarding wizard: flash pointer to upstream INSTALL.md; pair BLE; test `confirmation`.
- [ ] Auto-update of **this app**; optional check of upstream firmware-taby releases (notify only).
- [ ] Accessibility: screen reader labels, high contrast, keyboard-only nav for HUD.
- [ ] Windows / macOS / Linux support matrix documented.

### Official-app capability checklist (track parity)

Use this as a living backlog. Mark items as Done / Partial / N/A (custom brain).

| Area | Official-like capability | Target phase |
|------|--------------------------|--------------|
| Overlay invoke | Top hover dwell | 0 |
| Ask anything | Chat + streaming | 0 |
| File upload | Into prompt | 1 |
| Voice | Record + STT | 1 |
| Nav grid | Four-box → X + listed routes | 0 shell / 1–2 fill |
| Tasks | CRUD + natural language | 1 |
| Reminders | Schedule + notify | 1 |
| Today / week | Agenda views | 1–2 |
| Focus | Timer + face | 2 |
| Notes | Capture + retrieve | 1 |
| Habits | Track + streaks | 2 |
| Settings | AI, device, UX | 0+ |
| Feedback | In-app | 4 |
| Physical face | Animations + UI cards | 0 |
| Device choice input | Touch → agent | 1 |
| Computer use / deep OS control | Optional later; high risk | Stretch |
| Cloud sync | Optional; local-first default | Stretch |

---

## 7. Functional requirements (normative)

### FR-UI

1. FR-UI-01: Hot zone at top-center; configurable dwell time; default matches official feel band (400–600 ms).
2. FR-UI-02: Compact overlay shows prompt, upload, voice, four-box control, connection status.
3. FR-UI-03: Four-box click expands nav; icon becomes X; filled colour; logo turns white; prompt remains.
4. FR-UI-04: Expanded nav is a **2-column × 5-row grid** in this exact order: (Chat, Home), (Tasks, Reminders), (Today, Focus), (Settings, Notes), (Habits, This week). No Feedback item in this menu.
5. FR-UI-05: Escape / outside click collapses or dismisses per rules above.
6. FR-UI-06: Expanded nav cells use **five pastel row colours** from DESIGN_TOKENS.md; both items in a row share one colour; **no yellow** (row 3 is peach `#FFE9DB`).
7. FR-UI-07: Visual system follows design.md + DESIGN_TOKENS.md (typography, radius, accent-strong for open four-box control, white logo when expanded).

### FR-AI

1. FR-AI-01: User-configurable API key and model.
2. FR-AI-02: Streaming chat with persistent local history per conversation.
3. FR-AI-03: System prompt states device is a display harness; AI must not claim to be official Taby cloud.
4. FR-AI-04: Optional tools for face + productivity modules.

### FR-DEVICE

1. FR-DEV-01: BLE connect, write animation/UI, receive notifications.
2. FR-DEV-02: Graceful offline mode if no device.
3. FR-DEV-03: USB and Wi‑Fi transports implement the same device facade interface.
4. FR-DEV-04: Animation map loaded from config; unknown IDs handled without crashing (protocol may return unsupported_animation).

### FR-DATA

1. FR-DATA-01: Local DB for modules listed in Phase 1+.
2. FR-DATA-02: Secrets never written to world-readable project files.
3. FR-DATA-03: User can clear chat history and revoke file access paths.

### FR-QUALITY

1. FR-Q-01: Unit tests for animation map, command encoding, reminder scheduling logic.
2. FR-Q-02: Manual test checklist for BLE against real hardware when available.
3. FR-Q-03: README with run instructions, pairing, and “close official app” note.

---

## 8. Non-functional requirements

- **Performance:** HUD appears within one frame budget after dwell success; chat input remains responsive during streaming.
- **Privacy:** Local-first; no telemetry by default; Feedback is explicit opt-in.
- **Security:** API keys in secure storage; LAN HTTP device control not bound to 0.0.0.0 public.
- **Resilience:** AI or device failure shows clear inline error; does not freeze overlay.
- **Cost:** Default path runs on Groq free tier limits; surface rate-limit errors helpfully.

---

## 9. Configuration surface (Settings)

Minimum settings:

- AI: provider, base URL, model, API key, temperature
- Device: transport (BLE/USB/Wi‑Fi), preferred device id/address, reconnect, test animation button
- HUD: dwell ms, hot-zone width/height, display selection, always-on-top, global hotkey, gaming mode
- Voice / files: STT provider, max upload size, allowed directories
- Face: enable face reactions, animation map profile (default/calm/minimal)
- Data: open data folder, export, wipe chats

---

## 10. Suggested repository layout

```
taby-custom-agent/
  README.md
  REQUIREMENTS.md          # this document
  apps/
    desktop/               # UI shell + overlay
  packages/
    core/                  # session, tools, DB
    ai/                    # providers
    device/                # ble | usb | http
    animation-map/         # JSON maps per board
  configs/
    animations.amoled-1.64.json
    animations.round-1.32.json
  docs/
    architecture.md
    protocol-notes.md
    manual-test-ble.md
```

---

## 11. Acceptance criteria — MVP (Phase 0 exit)

1. User can set Groq API key and complete a streaming chat turn in the Chat view.
2. User can invoke the HUD by holding the mouse at top-center for the configured dwell time.
3. Compact prompt supports text; UI shows affordances for file and voice (voice may be stubbed if STT not ready, but control visible).
4. Four-box → expanded nav with all listed destinations (placeholder pages OK except Chat + Settings).
5. Expanded state shows X, filled icon treatment, white logo treatment, prompt still visible.
6. With Physical Taby paired over BLE, sending a chat turns face to a thinking animation then a completion animation at least once end-to-end.
7. Without device, app still chats normally and shows “device offline.”
8. No secrets committed; README explains pairing and official-app conflict.

---

## 12. Future plans (beyond parity)

- Optional self-hosted brain (Ollama / llama.cpp) with same UI.
- Mobile companion that only mirrors HUD actions (stretch).
- User-authored animation policies (“when coding → working_laptop_loop”).
- Plugin API for community tools.
- Firmware upstream watch: notify on new asset packs; never auto-flash without consent.
- Optional fork path for custom firmware only if user explicitly wants new animations not in stock packs (separate project).

---

## 13. Open decisions (coding agent should confirm or pick defaults)

| Topic | Default if unspecified |
|-------|------------------------|
| Desktop framework | Tauri 2 + Rust/TS **or** Electron + React — prefer Tauri for footprint |
| Primary OS for MVP | Windows first if user is on Windows; else macOS |
| STT | Whisper API or Groq audio if available; else browser Web Speech fallback |
| Exact dwell ms | 500 ms default |
| Compact reply UI | Short reply toast + “Open Chat” vs always full thread — prefer link to Chat for long answers |
| Nav label “Ŏ Focus” | Render as **Focus** |
| Nav layout | **2 columns × 5 rows**, order fixed in §4.3 |

---

## 14. Implementation notes for the coding agent

1. Prefer small vertical slices: HUD shell → Chat → BLE play → wire state machine.
2. Do not block UI on BLE; all device I/O async.
3. Encode UI commands carefully (`|` separators, URL-encode for HTTP).
4. Keep animation IDs validated against known manifest lists for 1.64 / 1.32.
5. Treat device choice events as first-class user messages.
6. Write tests for pure logic; document hardware tests.
7. When unsure about official visual polish, prioritize **interaction parity** (hover, expand, prompt, modules) over pixel-perfect cloning.
8. Re-read upstream `firmware/README.md` Talk to Taby / BLE sections before changing protocol code.

---

## 15. Reference links

- Firmware & protocol: https://github.com/TRIIIS-LABS/firmware-taby  
- Install guide: https://github.com/TRIIIS-LABS/firmware-taby/blob/main/INSTALL.md  
- Animation manifests: `assets/amoled-1.64/manifest.json`, `assets/round-1.32/manifest.json`  
- Product site (behaviour reference only): https://www.heytaby.com  

---

*End of requirements. Coding agents should implement Phase 0 against §11 acceptance criteria, then proceed phase-by-phase unless the user prioritizes otherwise.*

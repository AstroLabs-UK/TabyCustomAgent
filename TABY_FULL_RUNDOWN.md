# Custom Taby Agent — Full Rundown

Companion to `TABY_CUSTOM_AGENT_REQUIREMENTS.md` and `TABY_ROADMAP.md`.  
This file is the **orientation brief**: what we are building, how pieces connect, and what “done” means for the product as a whole.

---

## 1. Product in one paragraph

A desktop overlay sits at the top-center of the screen. Hold the mouse under the camera area briefly and a compact prompt appears: type, upload a file, or record voice. A four-box icon expands a **2×5 navigation grid**. Chat is powered by **your** AI (default Groq). If Physical Taby is paired over **Bluetooth**, the face animates with the conversation and can show simple on-device UI. Tasks, reminders, focus, notes, habits, and day/week views grow module by module. The official Taby app is **not** required and must be closed while this agent owns the device.

---

## 2. System map

| Layer | Responsibility |
|-------|----------------|
| **Overlay HUD** | Hover invoke, prompt, file/voice, 2×5 nav, module shells |
| **Session / router** | Active conversation, tool calls, which module owns UI |
| **AI provider** | Groq (or compatible); streaming; optional tools |
| **Device facade** | `play()`, `show_text()`, `show_choice()`, events — BLE first |
| **Local data** | SQLite (or equivalent): chats, tasks, reminders, notes, habits, settings |
| **Physical Taby** | Stock firmware; renderer only |

**Data / control flow (chat turn):**

1. User opens HUD → optional `listening_*` on device  
2. User sends text / file / voice transcript  
3. Agent sets face to busy/working  
4. AI streams reply (+ optional tools: create task, play anim, …)  
5. Agent sets face to confirmation / response-ready  
6. Optional on-device text card for short status  

---

## 3. Navigation (locked)

Expanded menu = **2 columns × 5 rows**:

| | Left | Right |
|---|------|-------|
| 1 | **Chat** | **Home** |
| 2 | **Tasks** | **Reminders** |
| 3 | **Today** | **Focus** |
| 4 | **Settings** | **Notes** |
| 5 | **Habits** | **This week** |

Expand control: four-box icon → **X**, filled/coloured, logo turns **white**; prompt bar **stays visible**.

---

## 4. Module cheat sheet

| Module | User value | Depends on |
|--------|------------|------------|
| Chat | Ask anything; main AI surface | AI provider |
| Home | Snapshot of day + device status | Tasks/Reminders/Focus data (can be empty) |
| Tasks | Capture and complete work items | Local DB; AI tools optional |
| Reminders | Time-based nudges + optional face | Scheduler + notifications |
| Today | What matters today | Tasks + Reminders (+ later calendar) |
| Focus | Timer / lock-in; face `lockin` | Timer; device optional |
| Settings | Keys, model, HUD dwell, transport | Secure secret storage |
| Notes | Quick capture / recall | Local DB |
| Habits | Check-ins and streaks | Local DB + day boundary |
| This week | Weekly rollup | Tasks/Habits/Focus history |

---

## 5. Device protocol (summary)

- **BLE primary:** service `54414259-0000-4000-a000-000000000001`; write `…0002`; notify `…0003`; read state/power `…0004` / `…0005`  
- Commands: animation IDs, `UI/title_subtitle?…`, `UI/choice_2?…`, `CLEAR`, …  
- **USB** for install/debug; **Wi‑Fi HTTP** `/cmd?c=` on LAN after onboard  
- App works **without** hardware; face features no-op with clear “offline” status  

Animation IDs: see upstream manifests (`amoled-1.64` ≈ 84, `round-1.32` ≈ 27). Mapping is config-driven.

---

## 6. UX invariants (do not regress)

1. Top-center dwell opens HUD (default ~500 ms, configurable).  
2. Prompt always available in compact and expanded nav states.  
3. File upload + voice controls present on prompt (voice may stub early).  
4. Nav grid order and 2×5 layout fixed.  
5. Device never blocks typing; all I/O async.  
6. Secrets never in git; local-first privacy.  

---

## 7. Testing philosophy

- **Automated:** unit + integration + headless UI where possible; CI-friendly.  
- **Simulators:** fake BLE/USB device returning `OK` / choice events.  
- **Human only when needed:** visual polish, hover feel, spacing, “does this look right?”  
- **Gate rule:** do not start the next roadmap stage until the current stage’s automated suite is green **and** any required human visual check is signed off (see `TABY_ROADMAP.md`).  

---

## 8. Platforms & packaging

- Windows + Linux; iteration 1 ships **`.exe`** build instructions/artifact.
- Agent delivers a **git repo zip** for the user to push to GitHub.
- UI: design.md + DESIGN_TOKENS.md pastels on the 2×5 menu (paired by row).

## 9. Related files

| File | Role |
|------|------|
| `TABY_CUSTOM_AGENT_REQUIREMENTS.md` | Normative requirements |
| `TABY_ROADMAP.md` | Staged delivery + test gates |
| Upstream firmware README | Protocol authority |
| `DEV_WORKFLOW.md` | Win/Linux, .exe, zip, agent vs user |
| `DESIGN_TOKENS.md` | Pastels + core tokens |
| `design.md` | Full visual/interaction system |

---

*Use this rundown for onboarding any coding agent; use the roadmap for execution order.*

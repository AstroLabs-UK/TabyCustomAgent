# Custom Taby Agent — Gated Roadmap

**Platforms:** Windows + Linux. Iteration 1 produces a Windows **`.exe`** build path and a **repo zip** for GitHub upload (`DEV_WORKFLOW.md`).

**Look:** `design.md` + pastel nav tokens in `DESIGN_TOKENS.md`.

**Rule:** Finish one stage completely → automated tests green → **ask the user only about look & feel** (screenshots / short checklist) → get explicit **GO** → start the next stage.

The coding agent must **not** skip ahead. If blocked on hardware the user does not have yet, use **device simulators** and mark hardware checks as `PENDING_HARDWARE` without stopping software stages.

---

## How each stage works

```
Implement stage
    → Run automated tests for this stage
    → Produce STAGE_REPORT.md (pass/fail + notes)
    → If UI stage: capture screenshots or describe exact UI state
    → Ask user ONLY:
         • Does the layout/look feel right?
         • Any visual tweaks before we lock this stage?
    → User replies GO / CHANGES
    → On GO: tag stage done, begin next stage
```

### What the agent tests itself

- Unit tests (pure logic)
- Integration tests with **mock AI** and **mock device**
- Command encoding (BLE payload / HTTP query)
- Nav grid structure (2×5 order)
- DB migrations and CRUD
- Reminder scheduler math (no real OS notifications required in CI)
- Headless component tests where the stack allows

### What the agent asks the user

- Hover dwell feel (too fast/slow)
- Spacing, colours, icon morph (four-box → X, fill, white logo)
- Prompt bar density; expanded grid readability
- “Does this screen look good enough to keep?”

### What the agent must not ask unless blocked

- Implementation design trivia already decided in requirements
- Permission to start coding the current stage (already granted by GO on previous)

---

## Stage 0 — Project skeleton

**Goal:** Runnable desktop app shell with config and test harness.

**Deliverables**

- [ ] Repo layout per requirements
- [ ] App launches on target OS
- [ ] Placeholder main window + empty overlay host
- [ ] Env/settings stub; secret storage hook
- [ ] `npm test` / `cargo test` / equivalent runs in CI locally
- [ ] Device + AI interfaces defined (unimplemented OK)
- [ ] Windows `.exe` build script stub documented (Tauri/Electron)
- [ ] `package-repo-zip` script or documented zip steps for GitHub upload

**Automated tests**

- App boots without crash
- Settings read/write default JSON
- Interface mocks importable

**Human review**

- “Does the empty shell window look acceptable as a starting point?” (low bar)

**Exit:** GO from user

---

## Stage 1 — Top HUD invoke (no nav content yet)

**Goal:** Top-center hot zone + dwell + compact prompt chrome.

**Deliverables**

- [ ] Hot zone geometry (top center)
- [ ] Dwell timer (default 500 ms, configurable)
- [ ] Compact overlay: prompt field, send, placeholders for upload/voice, connection dot
- [ ] Dismiss: Escape / click outside
- [ ] Optional always-on-top flag

**Automated tests**

- Dwell threshold fires only after configured ms (fake clock)
- Dismiss clears overlay state
- Prompt state machine: hidden → compact

**Human review (required)**

- Hold mouse at top center — does timing feel close to official?
- Is the bar centered and comfortable under the camera area?

**Exit:** GO

---

## Stage 2 — Expanded 2×5 navigation

**Goal:** Four-box control, morph to X, grid layout locked.

**Deliverables**

- [ ] Four-box icon → **X**, filled/coloured, logo **white** when open
- [ ] Grid **exactly**:

```
Chat         Home
Tasks        Reminders
Today        Focus
Settings     Notes
Habits       This week
```

- [ ] Prompt remains visible while expanded
- [ ] Each cell navigates to a **placeholder** route (title only)
- [ ] Keyboard: arrows in 2D, Enter, Escape
- [ ] Each row uses shared pastel from DESIGN_TOKENS.md (peach on row 3, no yellow)

**Automated tests**

- Grid model: 5 rows × 2 cols; order assertion test
- Expand/collapse state transitions
- Active route updates on cell activate
- Snapshot/DOM test of structure if web UI
- Assert row→colour mapping (5 tokens)

**Human review (required)**

- Screenshot expanded menu: columns, spacing, X/logo treatment
- Confirm labels and 2×5 layout match intent

**Exit:** GO — **nav layout is frozen** after this stage

---

## Stage 3 — Settings + AI key path

**Goal:** User can save provider settings and complete a mocked or live chat call from code.

**Deliverables**

- [ ] Settings route real form: API key, model, base URL, dwell ms, transport preference
- [ ] Secure storage for API key
- [ ] AI client with **mock mode** (no network) + live Groq mode
- [ ] Connection status string in HUD

**Automated tests**

- Key never logged
- Mock provider returns fixed stream chunks
- Validation errors on empty key in live mode

**Human review**

- Settings page readability only

**Exit:** GO

---

## Stage 4 — Chat module (software only)

**Goal:** Full chat thread with streaming in Chat route; HUD prompt can send to active chat.

**Deliverables**

- [ ] Conversation list + messages UI
- [ ] Streaming tokens render
- [ ] History persisted locally
- [ ] HUD prompt sends into current/new chat
- [ ] Markdown basic rendering

**Automated tests**

- Persist/reload messages
- Stream assembler
- “send from HUD” integration with mock AI

**Human review (required)**

- Chat layout and streaming feel
- HUD → chat handoff looks clear

**Exit:** GO

---

## Stage 5 — Device facade + simulators

**Goal:** One API for play/text/choice; mock transport green without hardware.

**Deliverables**

- [ ] `DeviceFacade` interface
- [ ] `MockDevice` (records commands, emits fake OK/choice)
- [ ] BLE client implementation (may be incomplete until hardware)
- [ ] USB client stub
- [ ] Animation map JSON load + validate IDs
- [ ] Chat orchestrator calls face states: listening → busy → done

**Automated tests**

- Mock receives `confirmation` etc.
- Unsupported ID handled
- Orchestrator sequence with mock AI + mock device

**Human review**

- None required if no real device; optional log paste

**Hardware optional**

- If user has device: manual BLE play `confirmation` → mark `HARDWARE_OK`

**Exit:** GO (software). Hardware may stay pending.

---

## Stage 6 — Wire face reactions to chat

**Goal:** Real end-to-end policy: every chat turn drives animations via facade.

**Deliverables**

- [ ] Data-driven state → animation map
- [ ] Enable/disable face reactions in Settings
- [ ] Offline device: no throw; status only

**Automated tests**

- Map coverage for core states
- Offline path

**Human review (required if hardware)**

- “Do the face changes feel right during a short chat?”

**Exit:** GO

---

## Stage 7 — File upload into chat

**Goal:** Attach files from HUD/Chat; text extraction for common types.

**Deliverables**

- [ ] File picker + drag-drop on prompt
- [ ] Chips/previews; size limit setting
- [ ] txt/md/pdf text extract MVP; images passed per model capability

**Automated tests**

- Reject oversize
- Extract fixtures for txt/md
- Message includes attachment metadata

**Human review**

- Chip UI and errors look clear

**Exit:** GO

---

## Stage 8 — Voice input MVP

**Goal:** Record from HUD; transcript into prompt or auto-send.

**Deliverables**

- [ ] Record control + timer/waveform basic
- [ ] STT provider interface; mock + one real path
- [ ] Mic-in face state when device present

**Automated tests**

- Mock STT
- Recording state machine

**Human review (required)**

- Controls discoverable; recording feedback clear

**Exit:** GO

---

## Stage 9 — Tasks

**Goal:** CRUD tasks + AI tool `create_task` / `complete_task`.

**Deliverables**

- [ ] Tasks view in grid cell
- [ ] DB schema; due dates; complete toggle
- [ ] Agent tools registered

**Automated tests**

- CRUD + tool invocations with mock AI tool calls

**Human review**

- Task list UI

**Exit:** GO

---

## Stage 10 — Reminders

**Goal:** Schedule local reminders; notification path; optional face nudge.

**Deliverables**

- [ ] Reminders UI + scheduler service
- [ ] Due firing in tests via fake clock
- [ ] OS notification best-effort
- [ ] Optional device animation on fire

**Automated tests**

- Schedule / fire / dismiss with fake clock
- Persistence across restart (DB)

**Human review**

- Reminder form clarity

**Exit:** GO

---

## Stage 11 — Notes

**Goal:** Quick notes + search; optional inject into chat context.

**Deliverables**

- [ ] Notes list/editor
- [ ] Search
- [ ] “Add to chat context” action

**Automated tests**

- CRUD + search ranking basic

**Human review**

- Editor simplicity

**Exit:** GO

---

## Stage 12 — Today + This week

**Goal:** Aggregate views.

**Deliverables**

- [ ] Today: tasks due + reminders + focus summary placeholder
- [ ] This week: counts / list by day

**Automated tests**

- Date-boundary fixtures (timezone-aware helper)

**Human review**

- Scanability of both views

**Exit:** GO

---

## Stage 13 — Focus mode

**Goal:** Timer + lock-in face + session log.

**Deliverables**

- [ ] Focus UI start/stop; duration presets
- [ ] Optional on-device timer UI command
- [ ] Log completed focus sessions for This week

**Automated tests**

- Timer elapse with fake clock
- Session written to DB

**Human review (required)**

- Timer UX; start/stop affordances

**Exit:** GO

---

## Stage 14 — Habits

**Goal:** Define habits; check in; streaks.

**Deliverables**

- [ ] Habits UI
- [ ] Daily check-in; streak calculation
- [ ] Agent tool to log habit

**Automated tests**

- Streak edge cases (missed day, timezone)

**Human review**

- Check-in ease

**Exit:** GO

---

## Stage 15 — Home dashboard

**Goal:** Single overview using real data from prior modules.

**Deliverables**

- [ ] Cards: Today snapshot, Focus status, Habits due, device status
- [ ] Empty states when no data

**Automated tests**

- Renders with fixture DB

**Human review (required)**

- First impression of Home

**Exit:** GO

---

## Stage 16 — Transport hardening (BLE/USB/Wi‑Fi)

**Goal:** Prefer BLE; fallbacks documented and testable.

**Deliverables**

- [ ] BLE stable reconnect
- [ ] USB path for debug commands
- [ ] Wi‑Fi HTTP client for `/cmd` when configured with device IP
- [ ] Settings: choose transport + device address/IP

**Automated tests**

- HTTP client against mock server
- Reconnect backoff unit test

**Human review**

- Settings copy only; hardware as available

**Exit:** GO

---

## Stage 17 — Polish pass

**Goal:** Accessibility, errors, onboarding, README.

**Deliverables**

- [ ] Onboarding: pair device, set API key, test animation
- [ ] Global hotkey optional
- [ ] Error toasts for rate limits / device lost
- [ ] README + manual hardware checklist
- [ ] Reduced motion / keyboard paths

**Automated tests**

- Onboarding state machine
- Hotkey registration mock

**Human review (required)**

- Full walkthrough: invoke → chat → expand nav → one module each
- Final “ship look” sign-off

**Exit:** **DONE v1**

---

## Stage report template (agent fills each time)

```markdown
# Stage N report — <title>

## Automated results
- suite: PASS / FAIL
- notes:

## Screenshots / UI notes
- (paths or descriptions)

## Hardware
- N/A | PENDING_HARDWARE | HARDWARE_OK

## Ask user
1. Visual/look questions only…
2. Reply **GO** to continue or list **CHANGES**.
```

---

## Parallelism policy

- **Forbidden:** implementing Stage N+1 features before GO on N.  
- **Allowed:** fixing bugs in earlier stages anytime.  
- **Allowed:** writing **failing** tests for the *next* stage only as a queue, not implementation.

---

## Priority overrides

If the user says e.g. “do Focus before Notes,” reorder remaining stages but **keep the gate rule** (test + visual GO).

---

*Start at Stage 0. After each GO, append a line to `PROGRESS.md`: `Stage N — GO — YYYY-MM-DD`.*

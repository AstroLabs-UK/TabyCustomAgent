# Stage 1 report — Top HUD invoke

## Automated results
- suite: **PASS**
- runner: `npm run test:unit` → stage0 (11/11) + stage1 (10/10)
- notes:
  - DwellTimer with fake clock: no fire before threshold; fires at ms; leave cancels; once per hover; configurable dwell
  - State machine: hidden → compact on dwell; dismiss / Escape / click-outside → hidden
  - Compact prompt chrome: input, send, upload/voice placeholders, connection dot
  - Hot zone top-center; backdrop dismiss; Esc dismiss
  - Settings: dwell ms + always-on-top flag + hot-zone hint toggle

## Deliverables checklist (Stage 1)

| Item | Status |
|------|--------|
| Hot zone geometry (top center) | Done |
| Dwell timer (default 500 ms, configurable) | Done |
| Compact overlay: prompt, send, upload/voice placeholders, connection dot | Done |
| Dismiss: Escape / click outside | Done |
| Optional always-on-top flag (settings) | Done (flag stored; native always-on-top later) |
| Unit tests green | Done (10 Stage 1 + 11 Stage 0) |
| Windows `.exe` CI path | Inherited from Stage 0 |

## Screenshots / UI notes (for human review)

Main window still hosts settings + mocks. HUD is a **fixed top-center hot zone** (subtle peach hint when enabled). After dwell, a centered compact bar appears with:

- Green/grey connection dot  
- “Ask anything…” input  
- File + voice icon buttons (placeholders)  
- Accent **Send** pill (`#E98F78`)

Backdrop soft dim; Esc or outside click closes.

## Human review questions only

1. Hold mouse at top center — does **timing** feel close enough to official (default 500 ms)?  
2. Is the **bar centered** and comfortable under the camera / top edge area?  
3. Any visual tweaks to density, radius, or hint strip before we lock Stage 1?

Reply **GO** or list **CHANGES**.

# Stage 15 report — Home dashboard + agent-loop / UX sweep

## Automated results
- suite: PASS (vitest stages 0–15)
- notes:
  - Multi-step tool loop implemented (max 6 steps). Tool results are fed back as `tool` messages; model writes a final natural-language reply.
  - Mock provider updated to only emit `tool_call` on first turn, then a written reply after tool results.
  - Soft-delete (archive) + 5-day purge for Tasks and Notes; trash → confirm tick UI.
  - HUD leave-hide timeout configurable (`hud.leaveHideMs`, default 3000 ms); re-enter cancels.
  - Liquid glass / muted dark banners strengthened in CSS.
  - Expanded face GIF map + occasional idle fun activities (~2 min) + paste → `copy_paste` reaction.

## Screenshots / UI notes
- Agent thinking strip shows “Thinking… · Running list_tasks… · Writing reply…”
- Module lists: 🗑 then ✓ confirm; Archived section at bottom with restore / hard-delete.
- Notes / module banners should now be dark muted glass, not pure white.
- Face: mostly idle loops; every ~2 min may play fishing / stretch / etc. Paste into prompt plays `copy_paste`.

## Hardware
- PENDING_HARDWARE — Physical Taby: prefer device-side idle; only push explicit animations when the agent needs them (done / error / forced reactions). Firmware push workflow still future.

## Shell commands
- **Not enabled in this build.** Running arbitrary OS commands is powerful and risky. Planned as a later gated Settings toggle + per-command confirmation. Do not enable unrestricted shell from the agent without your explicit GO on safety UX.

## Ask user
1. Does the multi-step tool flow feel right (thinking strip + written answer after tools)?
2. Soft-delete (trash → tick) + Archived section — look / feel OK?
3. Banners + liquid glass — readable against the dark background?
4. Leave-hide at 3 s (configurable) — too long / short?
5. Idle fun reactions (~ every 2 min) — keep / change interval?
6. Reply **GO** to continue or list **CHANGES**.

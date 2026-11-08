# UI + tools pass (post Stage 15)

## Changes
1. **HUD looks like official Taby** — dark glass panel, circular X / mic / attach / send, icon+label nav
2. **Nav order** matches screenshot: Chat|Home, Tasks|Notes, Reminders|Habits, Today|This week, Focus|Feedback, Settings
3. **Idle loops cycle** — after each idle GIF duration + ~900ms still pause → next idle variant
4. **AI tools** — mock keyword intents + live `tools` API; can create/complete/delete tasks, reminders, notes, habits, start focus

## Tests
Stage 2 (nav): PASS · Stages 8–15: PASS

## Try
- Hover top → expand menu (should match dark official look)
- “add task buy milk” with mock AI
- Connect mock face → watch idle variants swap after each loop

# Stage 6 report — CHANGES applied (not GO yet)

## Your notes addressed
1. **AI loading** → `working_loop` (`ff09215b.gif`)
2. **GIF restart** — each `play()` cache-busts + remounts `<img>` so the clip starts from frame 0
3. **Return to idle** — one-shots (`confirmation`, `disappointed`, …) schedule `idle_01_loop` after clip duration
4. **Orientation** — face GIFs use `transform: rotate(-90deg)` (90° left)

## Mapping
| State | ID |
|-------|-----|
| Listening | `listening_loop` |
| AI loading | `working_loop` |
| Done | `confirmation` → then `idle_01_loop` |
| Error | `disappointed` → then `idle_01_loop` |
| Idle | `idle_01_loop` |

## Review
- Loading = working_loop?
- After done, returns to idle without a hard freeze?
- Rotation look correct (90° left)?

Reply **GO** or **CHANGES**.

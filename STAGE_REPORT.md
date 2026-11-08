# Stage 6 report — Face reactions + official GIFs (map fix)

## Animation mapping (fixed)
| State | Animation ID | Notes |
|-------|--------------|-------|
| Listening | `listening_loop` | OK |
| AI thinking / busy | **`busy_loop`** | Thinking energy — **not** `working_loop` |
| Done | `confirmation` | OK |
| Error | `disappointed` | OK |
| Idle | `idle_01_loop` | OK |

`working_loop` is reserved for when **you** are in a work/focus context, not for AI processing.

## Policy
- Face window opens **only** on **Connect mock device**
- Face reactions toggle in Settings

## Tests
Stage 6: PASS (including busy ≠ working_loop)

Reply **GO** for Stage 7, or **CHANGES**.

# Stage 6 report — Face reactions + official Taby GIFs

## Automated results
- Stage 5: PASS · Stage 6: **10/10** PASS

## Behaviour
- **Connect mock device** → opens Mock Taby Face window (only then — **not** on each message)
- Face window plays **official GIFs** from `firmware-taby` amoled-1.64 pack
- Chat turn drives stock IDs: `listening_loop` → `busy_loop` → `confirmation`
- Settings: **Face reactions on chat** toggle (disabled = no play, no throw)
- Offline device: skip play, status only

## Assets
`public/taby-faces/*.gif` — upstream TRIIIS LABS artwork; keep identified as Taby.

## Human review
1. Connect mock → does the GIF window open once?
2. Chat turn — do real listening/busy/confirmation clips play?
3. Toggle face reactions off — stays idle?

Reply **GO** or **CHANGES**.

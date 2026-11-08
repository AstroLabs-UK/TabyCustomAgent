# Stage 5 report — Device facade + simulators

## Automated results
- suite: **PASS**
- Stage 5: **11/11**
- notes:
  - `DeviceFacade` + `MockDevice` (command log, choice events, unsupported IDs)
  - `BleDeviceClient` / `UsbDeviceClient` stubs (`PENDING_HARDWARE`)
  - Animation map load/validate (`configs/animation-map.json` + TS default)
  - `ChatDeviceOrchestrator`: listening → busy → done; offline skips without throw
  - Chat send path drives orchestrator when mock connected

## Deliverables

| Item | Status |
|------|--------|
| DeviceFacade interface | Done |
| MockDevice | Done |
| BLE client (incomplete until HW) | Done (stub, PENDING_HARDWARE) |
| USB client stub | Done |
| Animation map JSON + validate IDs | Done |
| Orchestrator listening→busy→done | Done |

## Human review
- None required without hardware
- Optional: paste mock command log after a chat turn

## Hardware
- `PENDING_HARDWARE` for real BLE `play confirmation`

## Exit
Software GO when you approve. Hardware may stay pending.

Reply **GO** or **CHANGES**.

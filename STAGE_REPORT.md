# Stage 16 report — Transport hardening (BLE / USB / Wi‑Fi)

## Automated results
- suite: PASS (stage 0–15 + stage 16 transport tests)
- notes:
  - USB provision simulator: detect → push → read identity → write Wi‑Fi SSID (password never logged)
  - BLE client: sim connect + reconnect backoff helper (`reconnect.ts`)
  - Wi‑Fi HTTP client: POST `/cmd` with injectable fetch
  - Settings: transport, BLE MAC, Wi‑Fi IP, USB setup button + status
  - Registry routes ble/usb/wifi/mock to real clients (sim mode on)

## Screenshots / UI notes
- Settings → Device: transport select, BLE MAC, Wi‑Fi IP, USB setup copy + Run USB setup
- After sim provision: switches transport to BLE and stores MAC/serial

## Hardware
- PENDING_HARDWARE — real GATT/serial not in this build; simulateHardware / simulateConnected = true for CI

## Ask user
1. USB setup copy clear?
2. Reply **GO** / **CHANGES** (batching 17 next per user request).

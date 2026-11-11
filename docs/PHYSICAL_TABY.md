# Build a Physical Taby for Custom Taby Agent

This guide is for **Custom Taby Agent** (this app), not the official Hey Taby cloud app.

Hardware firmware and print files come from the open [firmware-taby](https://github.com/TRIIIS-LABS/firmware-taby) project. Face GIFs and animations are acknowledged from that upstream work.

## 1. Get a board

You need a supported board and a **USB data cable** (not charge-only).

| Model | Board | Notes |
|-------|--------|--------|
| Taby 1.64 (recommended) | [Waveshare ESP32-S3-Touch-AMOLED-1.64](https://www.waveshare.com/esp32-s3-touch-amoled-1.64.htm) | 280×456 AMOLED, full animation pack |
| Taby Round 1.32 | Waveshare ESP32-S3-Touch-AMOLED-1.32 | Smaller pack |

Upstream install notes: [INSTALL.md](https://github.com/TRIIIS-LABS/firmware-taby/blob/main/INSTALL.md)

## 2. Install firmware (first time)

1. Plug the board into this PC with USB.
2. Prefer **Custom Taby Agent → Settings → Device → USB → Run USB setup** when available (pushes runtime, reads BLE MAC, can write Wi‑Fi from the desktop).
3. Or follow upstream flash steps in [firmware-taby INSTALL](https://github.com/TRIIIS-LABS/firmware-taby/blob/main/INSTALL.md), then come back here to pair with **this** app.

After a successful flash you should see animations on the screen.

## 3. Connect to Custom Taby Agent (not official Taby)

1. Open **Custom Taby Agent**.
2. Finish onboarding or open **Settings → Device**.
3. **USB first:** Run USB setup so the app stores the device BLE MAC / serial.
4. Switch transport to **BLE** for day-to-day use (close any official Hey Taby app if it holds the device).
5. Optional: set **Wi‑Fi** IP under Device if you use LAN `/cmd`.

You should **not** need to pair through the official Hey Taby cloud for this custom agent.

## 4. Case (optional)

Print packs and magnet notes live upstream:  
[hardware README](https://github.com/TRIIIS-LABS/firmware-taby/blob/main/hardware/README.md)

## Credits

- Firmware, cases, and original animation packs: [TRIIIS-LABS/firmware-taby](https://github.com/TRIIIS-LABS/firmware-taby)
- Desktop agent and custom integration: Lucas Stevens / this repository

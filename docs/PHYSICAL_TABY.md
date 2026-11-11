# Physical Taby for Custom Taby Agent

**Your Taby, on your desk — driven by [Custom Taby Agent](https://github.com/AstroLabs-UK/TabyCustomAgent), not the official Hey Taby cloud.**

Hardware firmware, animations, and case files come from the open upstream project  
[TRIIIS-LABS/firmware-taby](https://github.com/TRIIIS-LABS/firmware-taby).  
Face GIFs used in this app acknowledge that work.

**Let’s make one:**  
[1. Choose your board](#1-choose-your-board) →  
[2. Install the firmware](#2-install-the-firmware) →  
[3. Connect to Custom Taby Agent](#3-connect-to-custom-taby-agent) →  
[4. Print a case](#4-print-a-case)

---

## 1. Choose your board

You’ll need a supported board and a **USB data cable** (not charge-only).

| Model | Board | Notes |
|-------|--------|--------|
| **Taby 1.64** (recommended) | [Waveshare ESP32-S3-Touch-AMOLED-1.64](https://www.waveshare.com/esp32-s3-touch-amoled-1.64.htm) | Rectangular · 280×456 AMOLED · full animation pack |
| **Taby Round 1.32** | [Waveshare ESP32-S3-Touch-AMOLED-1.32](https://www.waveshare.com/esp32-s3-touch-amoled-1.32.htm) | Round · 466×466 · smaller pack · case coming soon |

More screens may appear upstream. Check [board compatibility](https://github.com/TRIIIS-LABS/firmware-taby/blob/main/INSTALL.md) before buying.

---

## 2. Install the firmware

Plug the board into **this PC** with the USB data cable.

### Option A — Custom Taby Agent (preferred)

1. Plug the board in with a **data** USB cable.
2. Open **Custom Taby Agent** → **Settings → Device → USB**.
3. **Scan USB ports** to confirm the board is seen.
4. Optional: enter Wi‑Fi **SSID**.
5. Click **Detect & install firmware**.

The app lists serial ports, pulls [firmware-taby](https://github.com/TRIIIS-LABS/firmware-taby) tools into app data, bootstraps esptool, and runs the upstream installer on the detected port.

**Requirements on the PC:** Python 3, git, and network (first run). Close other apps using the serial port.

### Option B — Upstream flash (works today)

Follow the official firmware install guide:

**[firmware-taby INSTALL.md](https://github.com/TRIIIS-LABS/firmware-taby/blob/main/INSTALL.md)**

Or ask a local AI agent:

```text
Help me install Physical Taby on my connected device.
Read and follow this guide:
https://github.com/TRIIIS-LABS/firmware-taby/blob/main/INSTALL.md

Install any missing USB/ESP32 tools and list the connected ports. If Taby is
already running, read its board metadata. For a blank board or vendor demo,
identify the exact board/revision from its marking or ask me when uncertain;
do not require device identify to succeed before the first flash. Install
the complete matching release, verify it, and play an animation so I can
check the screen.
Then help me connect it to Custom Taby Agent
(https://github.com/AstroLabs-UK/TabyCustomAgent) — not the official Hey Taby app.
```

Current upstream firmware releases:  
https://github.com/TRIIIS-LABS/firmware-taby/releases  

After a good flash you should see animations on the screen.

---

## 3. Connect to Custom Taby Agent

This is the important difference from the upstream README: you pair with **this** desktop app.

1. Install/open **[Custom Taby Agent](https://github.com/AstroLabs-UK/TabyCustomAgent/releases)** and finish onboarding.
2. **Settings → Device**
   - **USB first:** Run USB setup (or enter BLE MAC if you already flashed with Option B).
   - Switch transport to **BLE** for day-to-day use.
   - Optional: **Wi‑Fi** IP for LAN `/cmd` fallback.
3. Close **official Hey Taby** if it’s open — it can hold the BLE connection.
4. Trigger a chat reply or reaction and confirm the face moves.

You do **not** need the official Hey Taby cloud account for Custom Taby Agent.

Device command reference (upstream):  
[Talk to Taby](https://github.com/TRIIIS-LABS/firmware-taby/blob/main/firmware/README.md#talk-to-taby)

---

## 4. Print a case

Cases and print packs are upstream:

- [Print pack (Taby 1.64)](https://github.com/TRIIIS-LABS/firmware-taby/releases/download/prints-1.64-1.0.0/taby-1.64-print-pack-1.0.0.zip)
- [Printing guide](https://github.com/TRIIIS-LABS/firmware-taby/blob/main/hardware/README.md)

For the 1.64 desktop case you’ll typically want an **extra-strong neodymium block magnet, 20 × 10 × 2 mm**, and **self-adhesive rubber grip** over the magnet face (see upstream magnet notes).

---

## Credits

| Piece | Source |
|-------|--------|
| Firmware, cases, original animation packs | [TRIIIS-LABS/firmware-taby](https://github.com/TRIIIS-LABS/firmware-taby) |
| Desktop agent, custom BLE/USB/Wi‑Fi integration | [AstroLabs-UK/TabyCustomAgent](https://github.com/AstroLabs-UK/TabyCustomAgent) |

Upstream code/mechanics: Apache-2.0. Upstream artwork has its own terms — keep it Taby; don’t rebrand the face as a different character.  
This app’s license: see [LICENSE](../LICENSE) (personal non-commercial; commercial / rename needs written approval).

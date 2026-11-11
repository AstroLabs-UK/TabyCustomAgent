import { describe, it, expect, vi } from "vitest";
import {
  initialBackoff,
  nextBackoff,
  resetBackoff,
  connectWithBackoff,
} from "../device/reconnect";
import { UsbDeviceClient } from "../device/usbClient";
import { WifiDeviceClient } from "../device/wifiClient";
import { BleDeviceClient } from "../device/bleClient";

describe("reconnect backoff", () => {
  it("starts at base", () => {
    const s = initialBackoff({ baseMs: 500 });
    expect(s.attempt).toBe(0);
    expect(s.nextDelayMs).toBe(500);
    expect(s.exhausted).toBe(false);
  });

  it("doubles until max", () => {
    let s = initialBackoff({ baseMs: 100, maxMs: 400, factor: 2, maxAttempts: 10 });
    s = nextBackoff(s, { baseMs: 100, maxMs: 400, factor: 2, maxAttempts: 10 });
    expect(s.attempt).toBe(1);
    expect(s.nextDelayMs).toBe(100);
    s = nextBackoff(s, { baseMs: 100, maxMs: 400, factor: 2, maxAttempts: 10 });
    expect(s.nextDelayMs).toBe(200);
    s = nextBackoff(s, { baseMs: 100, maxMs: 400, factor: 2, maxAttempts: 10 });
    expect(s.nextDelayMs).toBe(400);
    s = nextBackoff(s, { baseMs: 100, maxMs: 400, factor: 2, maxAttempts: 10 });
    expect(s.nextDelayMs).toBe(400); // capped
  });

  it("exhausts after maxAttempts", () => {
    let s = initialBackoff({ maxAttempts: 3, baseMs: 10 });
    s = nextBackoff(s, { maxAttempts: 3, baseMs: 10 });
    s = nextBackoff(s, { maxAttempts: 3, baseMs: 10 });
    s = nextBackoff(s, { maxAttempts: 3, baseMs: 10 });
    expect(s.exhausted).toBe(true);
  });

  it("reset returns initial", () => {
    const s = resetBackoff({ baseMs: 200 });
    expect(s.nextDelayMs).toBe(200);
    expect(s.attempt).toBe(0);
  });

  it("connectWithBackoff succeeds first try", async () => {
    const r = await connectWithBackoff(async () => undefined, { maxAttempts: 3 }, async () => undefined);
    expect(r.ok).toBe(true);
    expect(r.attempts).toBe(1);
  });

  it("connectWithBackoff retries then fails", async () => {
    let n = 0;
    const r = await connectWithBackoff(
      async () => {
        n++;
        throw new Error("fail");
      },
      { maxAttempts: 3, baseMs: 1 },
      async () => undefined
    );
    expect(r.ok).toBe(false);
    expect(n).toBe(3);
  });
});

describe("USB provision", () => {
  it("simulates wiped setup and returns identity", async () => {
    const usb = new UsbDeviceClient();
    usb.simulateHardware = true;
    const phases: string[] = [];
    const result = await usb.provision(
      { ssid: "TestNet", password: "secret" },
      {
        sleep: async () => undefined,
        onPhase: (p) => phases.push(p),
        identityFactory: () => ({
          serial: "TABY-TEST-1",
          bleMac: "AA:BB:CC:11:22:33",
          firmware: "sim",
        }),
      }
    );
    expect(result.ok).toBe(true);
    expect(result.identity?.bleMac).toBe("AA:BB:CC:11:22:33");
    expect(phases).toContain("detecting");
    expect(phases).toContain("pushing");
    expect(phases).toContain("reading_identity");
    expect(phases).toContain("writing_wifi");
    expect(phases).toContain("done");
    // password must not appear in command log
    expect(usb.commandLog.join(" ")).not.toContain("secret");
    expect(usb.commandLog.some((c) => c.includes("TestNet"))).toBe(true);
  });

  it("fails when no hardware and sim off", async () => {
    const usb = new UsbDeviceClient();
    usb.simulateHardware = false;
    const result = await usb.provision(undefined, { sleep: async () => undefined });
    expect(result.ok).toBe(false);
    expect(result.phase).toBe("error");
  });
});

describe("Wi‑Fi HTTP client", () => {
  it("posts /cmd against mock fetch", async () => {
    const calls: string[] = [];
    const fetchFn = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method} ${url}`);
      return {
        ok: true,
        status: 200,
        text: async () => "OK",
      } as Response;
    });
    const wifi = new WifiDeviceClient();
    wifi.configure({ baseUrl: "http://10.0.0.5", fetchFn: fetchFn as unknown as typeof fetch });
    await wifi.connect();
    await wifi.play("confirmation");
    expect(fetchFn).toHaveBeenCalled();
    expect(wifi.commandLog.some((c) => c.includes("play:confirmation"))).toBe(true);
  });
});

describe("BLE sim", () => {
  it("connects in simulate mode", async () => {
    const ble = new BleDeviceClient();
    ble.simulateConnected = true;
    ble.backoffOpts = { maxAttempts: 2, baseMs: 1 };
    await ble.connect("AA:BB:CC:DD:EE:FF");
    expect(ble.getConnectionState()).toBe("connected");
    await ble.play("yeah");
    expect(ble.commandLog[0]).toContain("yeah");
  });
});

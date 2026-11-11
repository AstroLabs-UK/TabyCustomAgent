/**
 * USB transport + first-boot provision simulator.
 * Real serial/flash needs hardware; CI uses simulateProvision().
 */
import type {
  DeviceConnectionState,
  DeviceEvent,
  DeviceFacade,
  DeviceIdentity,
  DeviceTransport,
  ProvisionPhase,
  ProvisionResult,
  WifiCredentials,
} from "./types";

export type UsbProvisionHooks = {
  onPhase?: (phase: ProvisionPhase, detail?: string) => void;
  sleep?: (ms: number) => Promise<void>;
  identityFactory?: () => DeviceIdentity;
};

function defaultIdentity(): DeviceIdentity {
  const n = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")
    .toUpperCase();
  return {
    serial: `TABY-SIM-${n}`,
    bleMac: `AA:BB:CC:${n.slice(0, 2)}:${n.slice(2, 4)}:${n.slice(4, 6)}`,
    firmware: "sim-0.3.3",
    model: "amoled-1.64",
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class UsbDeviceClient implements DeviceFacade {
  readonly transport: DeviceTransport = "usb";
  private state: DeviceConnectionState = "disconnected";
  private handlers = new Set<(ev: DeviceEvent) => void>();
  readonly commandLog: string[] = [];
  lastIdentity: DeviceIdentity | null = null;
  /** When true, connect/provision succeed without real USB (dev / CI) */
  simulateHardware = true;

  getConnectionState(): DeviceConnectionState {
    return this.state;
  }

  async connect(_addressOrId?: string): Promise<void> {
    this.state = "connecting";
    if (!this.simulateHardware) {
      this.state = "error";
      this.emit({ type: "err", payload: "USB device not found" });
      throw new Error("USB device not found");
    }
    await delay(20);
    this.state = "connected";
    this.emit({ type: "ready", payload: "USB_READY" });
  }

  async disconnect(): Promise<void> {
    this.state = "disconnected";
  }

  async play(animationId: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(`usb:play:${animationId}`);
    this.emit({ type: "ok", payload: "OK" });
  }

  async showText(title: string, subtitle?: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(
      `usb:text:${title}${subtitle ? `|${subtitle}` : ""}`
    );
    this.emit({ type: "ok", payload: "OK" });
  }

  async showChoice(prompt: string, a: string, b: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(`usb:choice:${prompt}|${a}|${b}`);
    this.emit({ type: "ok", payload: "OK" });
  }

  async clear(): Promise<void> {
    this.ensureConnected();
    this.commandLog.push("usb:CLEAR");
    this.emit({ type: "ok", payload: "OK" });
  }

  onEvent(handler: (ev: DeviceEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Wiped device: detect → push runtime → read MAC → write Wi‑Fi (desktop-side).
   */
  async provision(
    wifi?: WifiCredentials,
    hooks: UsbProvisionHooks = {}
  ): Promise<ProvisionResult> {
    const sleep = hooks.sleep ?? delay;
    const report = (phase: ProvisionPhase, detail?: string) => {
      hooks.onPhase?.(phase, detail);
      this.emit({
        type: "provision",
        payload: `${phase}${detail ? `:${detail}` : ""}`,
      });
    };

    try {
      report("detecting");
      await sleep(30);
      if (!this.simulateHardware) {
        return {
          ok: false,
          phase: "error",
          message: "No USB Taby detected — plug in the cable and retry",
        };
      }

      report("pushing", "firmware+assets");
      await sleep(40);
      this.commandLog.push("usb:provision:push");

      report("reading_identity");
      await sleep(20);
      const identity = (hooks.identityFactory ?? defaultIdentity)();
      this.lastIdentity = identity;
      this.commandLog.push(`usb:provision:identity:${identity.bleMac}`);

      if (wifi?.ssid) {
        report("writing_wifi", wifi.ssid);
        await sleep(20);
        this.commandLog.push(`usb:provision:wifi:${wifi.ssid}`);
      }

      report("done");
      this.state = "connected";
      this.emit({ type: "ready", payload: identity.bleMac });
      return {
        ok: true,
        phase: "done",
        identity,
        message: `Provisioned ${identity.serial} · BLE ${identity.bleMac}`,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      report("error", message);
      this.state = "error";
      return { ok: false, phase: "error", message };
    }
  }

  private ensureConnected(): void {
    if (this.state !== "connected") {
      throw new Error("USB device not connected");
    }
  }

  private emit(ev: DeviceEvent): void {
    for (const h of this.handlers) h(ev);
  }
}

export const usbDevice = new UsbDeviceClient();

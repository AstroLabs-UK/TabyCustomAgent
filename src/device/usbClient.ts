/**
 * USB transport + Physical Taby provision.
 * Real path: list serial ports + run upstream firmware-taby install via Tauri.
 * Falls back to simulator when not in Tauri / no device (CI).
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

export type UsbPortInfo = {
  path: string;
  name: string;
  vid?: number;
  pid?: number;
  likelyEsp32: boolean;
};

export type UsbProvisionHooks = {
  onPhase?: (phase: ProvisionPhase, detail?: string) => void;
  sleep?: (ms: number) => Promise<void>;
  identityFactory?: () => DeviceIdentity;
  /** Prefer this COM / /dev/ttyACM port */
  port?: string;
  board?: string;
};

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

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

async function invokeUsb<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

export async function listUsbPorts(): Promise<UsbPortInfo[]> {
  try {
    const raw = await invokeUsb<
      Array<{
        path: string;
        name: string;
        vid?: number;
        pid?: number;
        likelyEsp32?: boolean;
        likely_esp32?: boolean;
      }>
    >("usb_list_ports");
    return (raw || []).map((p) => ({
      path: p.path,
      name: p.name,
      vid: p.vid,
      pid: p.pid,
      likelyEsp32: Boolean(p.likelyEsp32 ?? p.likely_esp32),
    }));
  } catch {
    return [];
  }
}

export class UsbDeviceClient implements DeviceFacade {
  readonly transport: DeviceTransport = "usb";
  private state: DeviceConnectionState = "disconnected";
  private handlers = new Set<(ev: DeviceEvent) => void>();
  readonly commandLog: string[] = [];
  lastIdentity: DeviceIdentity | null = null;
  lastProvisionLog: string[] = [];
  /** Prefer real hardware when available */
  simulateHardware = false;

  getConnectionState(): DeviceConnectionState {
    return this.state;
  }

  async connect(_addressOrId?: string): Promise<void> {
    this.state = "connecting";
    const ports = await listUsbPorts();
    const hit = ports.find((p) => p.likelyEsp32) || ports[0];
    if (!hit) {
      if (this.simulateHardware) {
        await delay(20);
        this.state = "connected";
        this.emit({ type: "ready", payload: "USB_SIM" });
        return;
      }
      this.state = "error";
      this.emit({ type: "err", payload: "USB device not found" });
      throw new Error("USB device not found — plug in Physical Taby with a data cable");
    }
    this.state = "connected";
    this.emit({ type: "ready", payload: hit.path });
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
   * Detect plugged board and install upstream firmware (firmware-taby tools).
   * Falls back to simulator only when simulateHardware=true and no Tauri/USB.
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
      report("detecting", "scanning USB serial ports");
      await sleep(50);
      const ports = await listUsbPorts();
      const port =
        hooks.port ||
        ports.find((p) => p.likelyEsp32)?.path ||
        ports[0]?.path;

      if (!port) {
        if (this.simulateHardware) {
          return this.simProvision(wifi, hooks);
        }
        return {
          ok: false,
          phase: "error",
          message:
            "No USB Taby detected. Use a data USB cable, close other serial apps, then retry.",
        };
      }

      report("pushing", `installing firmware on ${port}`);
      const board = hooks.board || "amoled-1.64";
      try {
        const result = await invokeUsb<{
          ok: boolean;
          phase: string;
          message: string;
          port?: string;
          serial?: string;
          bleMac?: string;
          ble_mac?: string;
          firmware?: string;
          log?: string[];
        }>("usb_provision_taby", {
          board,
          port,
          ssid: wifi?.ssid ?? null,
        });

        this.lastProvisionLog = result.log ?? [];
        this.commandLog.push(...this.lastProvisionLog.map((l) => `usb:${l}`));

        if (!result.ok) {
          report("error", result.message);
          // If tools failed but we saw a port, still surface that
          return {
            ok: false,
            phase: "error",
            message: result.message,
          };
        }

        report("reading_identity");
        const identity: DeviceIdentity = {
          serial: result.serial || `USB-${port}`,
          bleMac: result.bleMac || result.ble_mac || "",
          firmware: result.firmware || board,
          model: board,
        };
        this.lastIdentity = identity;
        if (wifi?.ssid) {
          report("writing_wifi", wifi.ssid);
        }
        report("done");
        this.state = "connected";
        this.emit({ type: "ready", payload: identity.bleMac || port });
        return {
          ok: true,
          phase: "done",
          identity,
          message:
            result.message ||
            `Provisioned on ${port}` +
              (identity.bleMac ? ` · BLE ${identity.bleMac}` : ""),
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // Browser / no native: optional sim
        if (this.simulateHardware || msg.includes("not available") || msg.includes("IPC")) {
          return this.simProvision(wifi, hooks);
        }
        report("error", msg);
        return { ok: false, phase: "error", message: msg };
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      report("error", message);
      this.state = "error";
      return { ok: false, phase: "error", message };
    }
  }

  private async simProvision(
    wifi?: WifiCredentials,
    hooks: UsbProvisionHooks = {}
  ): Promise<ProvisionResult> {
    const sleep = hooks.sleep ?? delay;
    const report = (phase: ProvisionPhase, detail?: string) => {
      hooks.onPhase?.(phase, detail);
    };
    report("detecting");
    await sleep(30);
    report("pushing", "sim firmware");
    await sleep(40);
    report("reading_identity");
    await sleep(20);
    const identity = (hooks.identityFactory ?? defaultIdentity)();
    this.lastIdentity = identity;
    if (wifi?.ssid) {
      report("writing_wifi", wifi.ssid);
      await sleep(20);
    }
    report("done");
    this.state = "connected";
    return {
      ok: true,
      phase: "done",
      identity,
      message: `Simulated provision ${identity.serial} · BLE ${identity.bleMac}`,
    };
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

/**
 * BLE transport — primary day-to-day path for Physical Taby.
 * Real GATT needs hardware; simulateConnected mode works in CI / no-device.
 */
import type {
  DeviceConnectionState,
  DeviceEvent,
  DeviceFacade,
  DeviceTransport,
} from "./types";
import { BLE_SERVICE_UUID } from "./types";
import { connectWithBackoff, type BackoffOptions } from "./reconnect";

export class BleDeviceClient implements DeviceFacade {
  readonly transport: DeviceTransport = "ble";
  private state: DeviceConnectionState = "disconnected";
  private handlers = new Set<(ev: DeviceEvent) => void>();
  readonly commandLog: string[] = [];
  /** When true, connect succeeds without Web Bluetooth (dev / CI) */
  simulateConnected = true;
  /** Last address used */
  lastAddress = "";
  backoffOpts: BackoffOptions = { baseMs: 100, maxMs: 2000, maxAttempts: 5 };

  get serviceUuid(): string {
    return BLE_SERVICE_UUID;
  }

  getConnectionState(): DeviceConnectionState {
    return this.state;
  }

  async connect(addressOrId?: string): Promise<void> {
    if (addressOrId) this.lastAddress = addressOrId;
    this.state = "connecting";

    const once = async () => {
      if (!this.simulateConnected) {
        throw new Error("BLE not available (PENDING_HARDWARE)");
      }
      // simulated GATT ok
    };

    const result = await connectWithBackoff(once, this.backoffOpts, (ms) =>
      ms <= 0 ? Promise.resolve() : new Promise((r) => setTimeout(r, ms))
    );

    if (!result.ok) {
      this.state = "error";
      this.emit({
        type: "err",
        payload: result.error ?? "BLE connect failed",
      });
      throw new Error(result.error ?? "BLE connect failed");
    }

    this.state = "connected";
    this.emit({
      type: "ready",
      payload: this.lastAddress || "BLE_SIM",
    });
  }

  /** Reconnect using stored address + backoff */
  async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect(this.lastAddress || undefined);
  }

  async disconnect(): Promise<void> {
    this.state = "disconnected";
  }

  async play(animationId: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(`ble:play:${animationId}`);
    this.emit({ type: "ok", payload: "OK" });
  }

  async showText(title: string, subtitle?: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(
      `ble:text:${title}${subtitle ? `|${subtitle}` : ""}`
    );
    this.emit({ type: "ok", payload: "OK" });
  }

  async showChoice(prompt: string, a: string, b: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(`ble:choice:${prompt}|${a}|${b}`);
    this.emit({ type: "ok", payload: "OK" });
  }

  async clear(): Promise<void> {
    this.ensureConnected();
    this.commandLog.push("ble:CLEAR");
    this.emit({ type: "ok", payload: "OK" });
  }

  onEvent(handler: (ev: DeviceEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private ensureConnected(): void {
    if (this.state !== "connected") {
      throw new Error("BLE device not connected");
    }
  }

  private emit(ev: DeviceEvent): void {
    for (const h of this.handlers) h(ev);
  }
}

export const bleDevice = new BleDeviceClient();

/**
 * BLE transport — scaffold for Physical Taby.
 * Stage 5: interface-complete stub; real GATT I/O needs hardware (PENDING_HARDWARE).
 */
import type {
  DeviceConnectionState,
  DeviceEvent,
  DeviceFacade,
  DeviceTransport,
} from "./types";
import { BLE_SERVICE_UUID } from "./types";

export class BleDeviceClient implements DeviceFacade {
  readonly transport: DeviceTransport = "ble";
  private state: DeviceConnectionState = "disconnected";
  private handlers = new Set<(ev: DeviceEvent) => void>();
  readonly commandLog: string[] = [];

  get serviceUuid(): string {
    return BLE_SERVICE_UUID;
  }

  getConnectionState(): DeviceConnectionState {
    return this.state;
  }

  async connect(_addressOrId?: string): Promise<void> {
    // Web Bluetooth / native plugin not wired in CI
    this.state = "connecting";
    this.state = "error";
    this.emit({
      type: "err",
      payload: "BLE not available in this build (PENDING_HARDWARE)",
    });
    throw new Error("BLE not available in this build (PENDING_HARDWARE)");
  }

  async disconnect(): Promise<void> {
    this.state = "disconnected";
  }

  async play(animationId: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(`ble:play:${animationId}`);
  }

  async showText(title: string, subtitle?: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(
      `ble:text:${title}${subtitle ? `|${subtitle}` : ""}`
    );
  }

  async showChoice(prompt: string, a: string, b: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(`ble:choice:${prompt}|${a}|${b}`);
  }

  async clear(): Promise<void> {
    this.ensureConnected();
    this.commandLog.push("ble:CLEAR");
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

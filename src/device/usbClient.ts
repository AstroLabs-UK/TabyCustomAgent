/**
 * USB transport stub (Stage 5). Full implementation later.
 */
import type {
  DeviceConnectionState,
  DeviceEvent,
  DeviceFacade,
  DeviceTransport,
} from "./types";

export class UsbDeviceClient implements DeviceFacade {
  readonly transport: DeviceTransport = "usb";
  private state: DeviceConnectionState = "disconnected";
  private handlers = new Set<(ev: DeviceEvent) => void>();
  readonly commandLog: string[] = [];

  getConnectionState(): DeviceConnectionState {
    return this.state;
  }

  async connect(_addressOrId?: string): Promise<void> {
    this.state = "error";
    this.emit({ type: "err", payload: "USB not implemented (stub)" });
    throw new Error("USB not implemented (stub)");
  }

  async disconnect(): Promise<void> {
    this.state = "disconnected";
  }

  async play(animationId: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(`usb:play:${animationId}`);
  }

  async showText(title: string, subtitle?: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(`usb:text:${title}${subtitle ? `|${subtitle}` : ""}`);
  }

  async showChoice(prompt: string, a: string, b: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(`usb:choice:${prompt}|${a}|${b}`);
  }

  async clear(): Promise<void> {
    this.ensureConnected();
    this.commandLog.push("usb:CLEAR");
  }

  onEvent(handler: (ev: DeviceEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
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

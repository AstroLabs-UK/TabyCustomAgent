/**
 * Device facade — BLE primary, USB / Wi-Fi later.
 * Stage 0: interface + MockDevice. Real BLE in Stage 5+.
 */

export type DeviceTransport = "ble" | "usb" | "wifi" | "mock";

export type DeviceConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface DeviceEvent {
  type: "ready" | "ok" | "err" | "choice" | "state" | "power";
  payload?: string;
  choiceIndex?: number;
}

export interface DeviceFacade {
  readonly transport: DeviceTransport;
  getConnectionState(): DeviceConnectionState;
  connect(addressOrId?: string): Promise<void>;
  disconnect(): Promise<void>;
  play(animationId: string): Promise<void>;
  showText(title: string, subtitle?: string): Promise<void>;
  showChoice(prompt: string, a: string, b: string): Promise<void>;
  clear(): Promise<void>;
  onEvent(handler: (ev: DeviceEvent) => void): () => void;
}

export const BLE_SERVICE_UUID = "54414259-0000-4000-a000-000000000001";

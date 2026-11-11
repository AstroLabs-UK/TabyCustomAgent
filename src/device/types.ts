/**
 * Device facade — BLE primary, USB provision, Wi‑Fi fallback.
 */

export type DeviceTransport = "ble" | "usb" | "wifi" | "mock";

export type DeviceConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface DeviceEvent {
  type: "ready" | "ok" | "err" | "choice" | "state" | "power" | "provision";
  payload?: string;
  choiceIndex?: number;
}

/** Identity read from device during USB provision */
export type DeviceIdentity = {
  serial: string;
  bleMac: string;
  firmware?: string;
  model?: string;
};

export type WifiCredentials = {
  ssid: string;
  /** Never log; stored in settings only on user machine */
  password: string;
};

export type ProvisionPhase =
  | "idle"
  | "detecting"
  | "pushing"
  | "reading_identity"
  | "writing_wifi"
  | "done"
  | "error";

export type ProvisionResult = {
  ok: boolean;
  phase: ProvisionPhase;
  identity?: DeviceIdentity;
  message: string;
};

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

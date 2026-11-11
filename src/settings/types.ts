import type { AiProviderConfig } from "../ai/types";
import type { DeviceTransport } from "../device/types";

/** Top-edge activation zone (logical / CSS px relative to primary monitor). */
export type EdgeZone = {
  /** Center X as fraction of primary screen width (0–1). Default 0.5 */
  centerFrac: number;
  /** Zone width as fraction of screen width (0.05–1). Default ~0.36 */
  widthFrac: number;
  /** Depth from top in physical-ish px. Default 8 */
  depthPx: number;
};

export interface AppSettings {
  ai: AiProviderConfig;
  hud: {
    dwellMs: number;
    dwellBrowserMs: number;
    dwellGameMs: number;
    leaveHideMs: number;
    alwaysOnTop: boolean;
    faceReactionsEnabled: boolean;
    localFaceEnabled: boolean;
    diagnosticsEnabled: boolean;
    /** Prefer reduced motion (fewer face loops / transitions) */
    reducedMotion?: boolean;
    /** Optional global hotkey enabled */
    globalHotkeyEnabled?: boolean;
    globalHotkey?: string;
    edgeZone: EdgeZone;
    hoverActivationArea?: "center" | "full" | "left" | "right";
  };
  device: {
    transport: DeviceTransport;
    /** BLE MAC or preferred id */
    preferredId: string;
    /** Wi‑Fi device base URL or IP */
    wifiAddress?: string;
    /** Last known serial from provision */
    serial?: string;
    /** SSID only (password separate / not in plain logs) */
    wifiSsid?: string;
  };
  onboardingCompleted: boolean;
  /** User said they own Physical Taby */
  hasPhysicalTaby?: boolean;
}

export const DEFAULT_EDGE_ZONE: EdgeZone = {
  centerFrac: 0.5,
  widthFrac: 0.36,
  depthPx: 10,
};

export const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    provider: "mock",
    apiKey: "",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
  },
  hud: {
    dwellMs: 500,
    dwellBrowserMs: 700,
    dwellGameMs: 1000,
    leaveHideMs: 3000,
    alwaysOnTop: true,
    faceReactionsEnabled: true,
    localFaceEnabled: true,
    diagnosticsEnabled: false,
    reducedMotion: false,
    globalHotkeyEnabled: false,
    globalHotkey: "CommandOrControl+Shift+Space",
    edgeZone: { ...DEFAULT_EDGE_ZONE },
    hoverActivationArea: "center",
  },
  device: {
    transport: "mock",
    preferredId: "",
    wifiAddress: "",
    serial: "",
    wifiSsid: "",
  },
  onboardingCompleted: false,
  hasPhysicalTaby: false,
};

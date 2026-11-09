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
    /** Fallback / productivity dwell (ms) */
    dwellMs: number;
    dwellBrowserMs: number;
    dwellGameMs: number;
    alwaysOnTop: boolean;
    faceReactionsEnabled: boolean;
    /** Show face GIFs on-screen (no physical Taby required). */
    localFaceEnabled: boolean;
    edgeZone: EdgeZone;
  };
  device: {
    transport: DeviceTransport;
    preferredId: string;
  };
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
    alwaysOnTop: true,
    faceReactionsEnabled: true,
    localFaceEnabled: true,
    edgeZone: { ...DEFAULT_EDGE_ZONE },
  },
  device: {
    transport: "mock",
    preferredId: "",
  },
};

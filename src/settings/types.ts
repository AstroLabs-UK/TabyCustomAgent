import type { AiProviderConfig } from "../ai/types";
import type { DeviceTransport } from "../device/types";

/** Where the top-edge hover opens the HUD when the window is hidden. */
export type HoverActivationArea = "center" | "wide" | "full";

export interface AppSettings {
  ai: AiProviderConfig;
  hud: {
    dwellMs: number;
    alwaysOnTop: boolean;
    faceReactionsEnabled: boolean;
    /** Horizontal band used for top-edge hover activation. Default: center-only. */
    hoverActivationArea: HoverActivationArea;
  };
  device: {
    transport: DeviceTransport;
    preferredId: string;
  };
}

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
    alwaysOnTop: true,
    faceReactionsEnabled: true,
    hoverActivationArea: "center",
  },
  device: {
    transport: "mock",
    preferredId: "",
  },
};

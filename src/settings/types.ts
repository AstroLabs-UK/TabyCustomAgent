import type { AiProviderConfig } from "../ai/types";
import type { DeviceTransport } from "../device/types";

export interface AppSettings {
  ai: AiProviderConfig;
  hud: {
    dwellMs: number;
    alwaysOnTop: boolean;
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
  },
  device: {
    transport: "mock",
    preferredId: "",
  },
};

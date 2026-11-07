import { describe, it, expect } from "vitest";
import { mockAi, DEFAULT_AI_CONFIG } from "../ai";
import { mockDevice, BLE_SERVICE_UUID } from "../device";

describe("interfaces importable", () => {
  it("exports mock AI and default config", () => {
    expect(mockAi.id).toBe("mock");
    expect(DEFAULT_AI_CONFIG.model).toBeTruthy();
  });

  it("exports mock device and BLE UUID", () => {
    expect(mockDevice.transport).toBe("mock");
    expect(BLE_SERVICE_UUID).toMatch(/^54414259/);
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { MockDevice } from "../device/mockDevice";

describe("MockDevice", () => {
  let device: MockDevice;

  beforeEach(() => {
    device = new MockDevice();
  });

  it("starts disconnected", () => {
    expect(device.getConnectionState()).toBe("disconnected");
  });

  it("connects and records play", async () => {
    await device.connect();
    expect(device.getConnectionState()).toBe("connected");
    await device.play("confirmation");
    expect(device.commandLog).toContain("play:confirmation");
  });

  it("throws when playing offline", async () => {
    await expect(device.play("confirmation")).rejects.toThrow(/not connected/);
  });

  it("emits choice events", async () => {
    await device.connect();
    const events: unknown[] = [];
    device.onEvent((e) => events.push(e));
    device.simulateChoice(1);
    expect(events).toEqual([
      expect.objectContaining({ type: "choice", choiceIndex: 1 }),
    ]);
  });
});

import type {
  DeviceConnectionState,
  DeviceEvent,
  DeviceFacade,
  DeviceTransport,
} from "./types";

export class MockDevice implements DeviceFacade {
  readonly transport: DeviceTransport = "mock";
  private state: DeviceConnectionState = "disconnected";
  private handlers = new Set<(ev: DeviceEvent) => void>();
  readonly commandLog: string[] = [];

  getConnectionState(): DeviceConnectionState {
    return this.state;
  }

  async connect(_addressOrId?: string): Promise<void> {
    this.state = "connecting";
    await delay(10);
    this.state = "connected";
    this.emit({ type: "ready", payload: "READY" });
  }

  async disconnect(): Promise<void> {
    this.state = "disconnected";
    this.commandLog.length = 0;
  }

  async play(animationId: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(`play:${animationId}`);
    this.emit({ type: "ok", payload: "OK" });
  }

  async showText(title: string, subtitle?: string): Promise<void> {
    this.ensureConnected();
    const cmd = subtitle
      ? `UI/title_subtitle?demo:${title}|${subtitle}`
      : `UI/title_subtitle?demo:${title}`;
    this.commandLog.push(cmd);
    this.emit({ type: "ok", payload: "OK" });
  }

  async showChoice(prompt: string, a: string, b: string): Promise<void> {
    this.ensureConnected();
    this.commandLog.push(`UI/choice_2?demo:${prompt}|${a}|${b}`);
    this.emit({ type: "ok", payload: "OK" });
  }

  async clear(): Promise<void> {
    this.ensureConnected();
    this.commandLog.push("CLEAR");
    this.emit({ type: "ok", payload: "OK" });
  }

  onEvent(handler: (ev: DeviceEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  simulateChoice(index: 0 | 1): void {
    this.emit({ type: "choice", choiceIndex: index, payload: String(index) });
  }

  private ensureConnected(): void {
    if (this.state !== "connected") {
      throw new Error("MockDevice: not connected");
    }
  }

  private emit(ev: DeviceEvent): void {
    for (const h of this.handlers) h(ev);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const mockDevice = new MockDevice();

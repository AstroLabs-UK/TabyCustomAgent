import type {
  DeviceConnectionState,
  DeviceEvent,
  DeviceFacade,
  DeviceTransport,
} from "./types";
import {
  DEFAULT_ANIMATION_MAP,
  validateAnimationId,
  type AnimationMap,
} from "./animationMap";
import { FACE_LABELS, publishFaceState } from "./faceBus";

export class MockDevice implements DeviceFacade {
  readonly transport: DeviceTransport = "mock";
  private state: DeviceConnectionState = "disconnected";
  private handlers = new Set<(ev: DeviceEvent) => void>();
  readonly commandLog: string[] = [];
  readonly warnings: string[] = [];
  private animationMap: AnimationMap = DEFAULT_ANIMATION_MAP;

  setAnimationMap(map: AnimationMap): void {
    this.animationMap = map;
  }

  getConnectionState(): DeviceConnectionState {
    return this.state;
  }

  async connect(_addressOrId?: string): Promise<void> {
    this.state = "connecting";
    await delay(10);
    this.state = "connected";
    this.emit({ type: "ready", payload: "READY" });
    this.publish("idle");
  }

  async disconnect(): Promise<void> {
    this.state = "disconnected";
    this.commandLog.length = 0;
    this.warnings.length = 0;
    publishFaceState({
      animationId: "idle",
      label: "Offline",
      at: Date.now(),
      connected: false,
    });
  }

  async play(animationId: string): Promise<void> {
    this.ensureConnected();
    const check = validateAnimationId(this.animationMap, animationId);
    if (!check.ok) {
      this.warnings.push(check.reason);
      this.commandLog.push(`play:UNSUPPORTED:${animationId}`);
      this.emit({ type: "err", payload: check.reason });
      this.publish("error");
      return;
    }
    this.commandLog.push(`play:${animationId}`);
    this.emit({ type: "ok", payload: "OK" });
    this.publish(animationId);
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
    this.publish("idle");
  }

  onEvent(handler: (ev: DeviceEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  simulateChoice(index: number): void {
    this.emit({ type: "choice", choiceIndex: index });
  }

  private publish(animationId: string): void {
    publishFaceState({
      animationId,
      label: FACE_LABELS[animationId] ?? animationId,
      at: Date.now(),
      connected: this.state === "connected",
    });
  }

  private ensureConnected(): void {
    if (this.state !== "connected") {
      throw new Error("device not connected");
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

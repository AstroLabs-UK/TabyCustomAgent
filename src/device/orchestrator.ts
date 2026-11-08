/**
 * Chat ↔ face orchestrator (Stage 5–6).
 * Sequence: listening → busy → done (or error).
 * Offline / disabled: no throw — status only.
 */
import type { DeviceFacade } from "./types";
import {
  DEFAULT_ANIMATION_MAP,
  resolveAnimation,
  type AnimationMap,
  type FaceState,
} from "./animationMap";

export type OrchestratorLogEntry = {
  at: number;
  state: FaceState;
  animationId: string;
  ok: boolean;
  detail?: string;
};

export class ChatDeviceOrchestrator {
  private map: AnimationMap;
  private enabled = true;
  readonly log: OrchestratorLogEntry[] = [];

  constructor(
    private device: DeviceFacade,
    map: AnimationMap = DEFAULT_ANIMATION_MAP
  ) {
    this.map = map;
  }

  setDevice(device: DeviceFacade): void {
    this.device = device;
  }

  setAnimationMap(map: AnimationMap): void {
    this.map = map;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async onUserListening(): Promise<void> {
    await this.playState("listening");
  }

  async onAssistantBusy(): Promise<void> {
    await this.playState("busy");
  }

  async onTurnDone(): Promise<void> {
    await this.playState("done");
  }

  async onTurnError(detail?: string): Promise<void> {
    await this.playState("error", detail);
  }

  async runTurnSequence(
    runAi: () => Promise<void>
  ): Promise<{ ok: boolean; error?: string }> {
    await this.onUserListening();
    await this.onAssistantBusy();
    try {
      await runAi();
      await this.onTurnDone();
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.onTurnError(msg);
      return { ok: false, error: msg };
    }
  }

  private async playState(state: FaceState, detail?: string): Promise<void> {
    const { id } = resolveAnimation(this.map, state);
    const entry: OrchestratorLogEntry = {
      at: Date.now(),
      state,
      animationId: id,
      ok: false,
    };
    if (!this.enabled) {
      entry.detail = detail ?? "face reactions disabled";
      this.log.push(entry);
      return;
    }
    try {
      if (this.device.getConnectionState() !== "connected") {
        entry.detail = detail ?? "device offline — skipped play";
        this.log.push(entry);
        return;
      }
      await this.device.play(id);
      entry.ok = true;
      entry.detail = detail;
    } catch (e) {
      entry.detail =
        detail ?? (e instanceof Error ? e.message : String(e));
    }
    this.log.push(entry);
  }
}

/**
 * Wi‑Fi HTTP client for Physical Taby `/cmd` endpoint.
 * Testable against any HTTP server (mock in CI).
 */
import type {
  DeviceConnectionState,
  DeviceEvent,
  DeviceFacade,
  DeviceTransport,
} from "./types";

export type WifiClientOptions = {
  /** Base URL e.g. http://192.168.1.50 */
  baseUrl: string;
  /** Fetch impl (inject in tests) */
  fetchFn?: typeof fetch;
  timeoutMs?: number;
};

export class WifiDeviceClient implements DeviceFacade {
  readonly transport: DeviceTransport = "wifi";
  private state: DeviceConnectionState = "disconnected";
  private handlers = new Set<(ev: DeviceEvent) => void>();
  readonly commandLog: string[] = [];
  private baseUrl = "";
  private fetchFn: typeof fetch = globalThis.fetch.bind(globalThis);
  private timeoutMs = 5000;

  configure(opts: WifiClientOptions): void {
    this.baseUrl = (opts.baseUrl || "").replace(/\/$/, "");
    if (opts.fetchFn) this.fetchFn = opts.fetchFn;
    if (opts.timeoutMs) this.timeoutMs = opts.timeoutMs;
  }

  getConnectionState(): DeviceConnectionState {
    return this.state;
  }

  async connect(addressOrId?: string): Promise<void> {
    if (addressOrId) {
      const url = addressOrId.startsWith("http")
        ? addressOrId
        : `http://${addressOrId}`;
      this.baseUrl = url.replace(/\/$/, "");
    }
    if (!this.baseUrl) {
      this.state = "error";
      this.emit({ type: "err", payload: "Wi‑Fi device IP / URL required" });
      throw new Error("Wi‑Fi device IP / URL required");
    }
    this.state = "connecting";
    try {
      await this.cmd("ping");
      this.state = "connected";
      this.emit({ type: "ready", payload: "READY" });
    } catch (e) {
      this.state = "error";
      const msg = e instanceof Error ? e.message : String(e);
      this.emit({ type: "err", payload: msg });
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    this.state = "disconnected";
  }

  async play(animationId: string): Promise<void> {
    this.ensureConnected();
    await this.cmd(`play:${animationId}`);
    this.commandLog.push(`wifi:play:${animationId}`);
  }

  async showText(title: string, subtitle?: string): Promise<void> {
    this.ensureConnected();
    const body = subtitle ? `${title}|${subtitle}` : title;
    await this.cmd(`text:${body}`);
    this.commandLog.push(`wifi:text:${body}`);
  }

  async showChoice(prompt: string, a: string, b: string): Promise<void> {
    this.ensureConnected();
    await this.cmd(`choice:${prompt}|${a}|${b}`);
    this.commandLog.push(`wifi:choice:${prompt}|${a}|${b}`);
  }

  async clear(): Promise<void> {
    this.ensureConnected();
    await this.cmd("CLEAR");
    this.commandLog.push("wifi:CLEAR");
  }

  onEvent(handler: (ev: DeviceEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /** POST /cmd?q=... or body — flexible for firmware variants */
  async cmd(command: string): Promise<string> {
    if (!this.baseUrl) throw new Error("Wi‑Fi not configured");
    const url = `${this.baseUrl}/cmd`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await this.fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd: command }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        throw new Error(`Wi‑Fi HTTP ${res.status}`);
      }
      const text = await res.text();
      this.emit({ type: "ok", payload: text.slice(0, 120) });
      return text;
    } finally {
      clearTimeout(t);
    }
  }

  private ensureConnected(): void {
    if (this.state !== "connected") {
      throw new Error("Wi‑Fi device not connected");
    }
  }

  private emit(ev: DeviceEvent): void {
    for (const h of this.handlers) h(ev);
  }
}

export const wifiDevice = new WifiDeviceClient();

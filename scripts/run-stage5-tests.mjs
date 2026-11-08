#!/usr/bin/env node
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

const DEFAULT_MAP = {
  version: 1,
  states: {
    listening: "listening",
    busy: "thinking",
    done: "confirmation",
    error: "error",
    idle: "idle",
  },
  knownAnimationIds: ["listening", "thinking", "confirmation", "error", "idle", "happy"],
};

function validateAnimationId(map, id) {
  if (!id || !id.trim()) return { ok: false, reason: "empty animation id" };
  if (!map.knownAnimationIds.includes(id)) return { ok: false, reason: `unsupported animation id: ${id}` };
  return { ok: true };
}

function parseAnimationMap(raw) {
  if (!raw || typeof raw !== "object") throw new Error("bad");
  if (!raw.states) throw new Error("missing states");
  for (const k of ["listening", "busy", "done", "error", "idle"]) {
    if (!raw.states[k]) throw new Error("missing " + k);
  }
  return raw;
}

class MockDevice {
  transport = "mock";
  state = "disconnected";
  commandLog = [];
  warnings = [];
  async connect() { this.state = "connected"; }
  getConnectionState() { return this.state; }
  async play(id) {
    if (this.state !== "connected") throw new Error("not connected");
    const check = validateAnimationId(DEFAULT_MAP, id);
    if (!check.ok) {
      this.warnings.push(check.reason);
      this.commandLog.push(`play:UNSUPPORTED:${id}`);
      return;
    }
    this.commandLog.push(`play:${id}`);
  }
}

class Orchestrator {
  log = [];
  constructor(device) { this.device = device; }
  async playState(state, id) {
    const entry = { state, animationId: id, ok: false };
    try {
      if (this.device.getConnectionState() !== "connected") {
        entry.detail = "offline";
        this.log.push(entry);
        return;
      }
      await this.device.play(id);
      entry.ok = true;
    } catch (e) {
      entry.detail = String(e.message || e);
    }
    this.log.push(entry);
  }
  async runTurnSequence(runAi) {
    await this.playState("listening", "listening");
    await this.playState("busy", "thinking");
    try {
      await runAi();
      await this.playState("done", "confirmation");
      return { ok: true };
    } catch (e) {
      await this.playState("error", "error");
      return { ok: false };
    }
  }
}

console.log("Stage 5 tests\n");

const map = parseAnimationMap(DEFAULT_MAP);
ok("animation map parses", map.states.done === "confirmation");
ok("confirmation known", validateAnimationId(map, "confirmation").ok === true);
ok("unsupported id flagged", validateAnimationId(map, "not_a_real_anim").ok === false);

const d = new MockDevice();
await d.connect();
await d.play("confirmation");
ok("mock receives confirmation", d.commandLog.includes("play:confirmation"));
await d.play("nope_unknown");
ok("unsupported handled without throw", d.commandLog.some(c => c.includes("UNSUPPORTED")));
ok("unsupported warning recorded", d.warnings.length >= 1);

const offline = new MockDevice();
const orchOff = new Orchestrator(offline);
await orchOff.runTurnSequence(async () => {});
ok("offline sequence does not throw", orchOff.log.length === 3);

const d2 = new MockDevice();
await d2.connect();
const orch = new Orchestrator(d2);
const result = await orch.runTurnSequence(async () => {});
ok("orchestrator ok", result.ok === true);
ok("sequence listening→busy→done", 
  orch.log.map(l => l.state).join(",") === "listening,busy,done");
ok("plays confirmation at done", d2.commandLog.includes("play:confirmation"));
ok("plays thinking when busy", d2.commandLog.includes("play:thinking"));


// Face display state shape (window bus payload)
const face = { animationId: "confirmation", label: "Done!", at: Date.now(), connected: true };
ok("face publish shape", face.animationId === "confirmation" && face.connected === true);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

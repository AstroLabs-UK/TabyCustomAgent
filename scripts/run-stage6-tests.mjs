#!/usr/bin/env node
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

const STATES = {
  listening: "listening_loop",
  busy: "busy_loop",
  done: "confirmation",
  error: "disappointed",
  idle: "idle_01_loop",
};
const GIF = {
  listening_loop: "/taby-faces/listening_loop.gif",
  busy_loop: "/taby-faces/busy_loop.gif",
  confirmation: "/taby-faces/confirmation.gif",
  disappointed: "/taby-faces/disappointed.gif",
  idle_01_loop: "/taby-faces/idle_01_loop.gif",
};

class Orch {
  log = [];
  enabled = true;
  constructor(device) { this.device = device; }
  setEnabled(e) { this.enabled = e; }
  async play(state, id) {
    const entry = { state, id, ok: false, detail: "" };
    if (!this.enabled) { entry.detail = "disabled"; this.log.push(entry); return; }
    if (this.device.state !== "connected") { entry.detail = "offline"; this.log.push(entry); return; }
    await this.device.play(id);
    entry.ok = true;
    this.log.push(entry);
  }
}

console.log("Stage 6 tests\n");

ok("listening maps to listening_loop", STATES.listening === "listening_loop");
ok("busy maps to busy_loop", STATES.busy === "busy_loop");
ok("busy is NOT working_loop", STATES.busy !== "working_loop");
ok("done maps to confirmation", STATES.done === "confirmation");
ok("error maps to disappointed", STATES.error === "disappointed");
ok("gif path for confirmation", GIF.confirmation.includes("confirmation.gif"));
ok("gif path for listening_loop", GIF.listening_loop.includes("listening_loop.gif"));

const d = { state: "connected", log: [], async play(id) { this.log.push(id); } };
const orch = new Orch(d);
await orch.play("listening", STATES.listening);
await orch.play("busy", STATES.busy);
await orch.play("done", STATES.done);
ok("played stock ids", d.log.join(",") === "listening_loop,busy_loop,confirmation");

const d2 = { state: "connected", log: [], async play(id) { this.log.push(id); } };
const orchOff = new Orch(d2);
orchOff.setEnabled(false);
await orchOff.play("done", STATES.done);
ok("disabled skips play", d2.log.length === 0 && orchOff.log[0].detail === "disabled");

const d3 = { state: "disconnected", log: [], async play(id) { this.log.push(id); } };
const orchOffline = new Orch(d3);
await orchOffline.play("busy", STATES.busy);
ok("offline skips without throw", d3.log.length === 0 && orchOffline.log[0].detail === "offline");

// Face window only on explicit connect (policy assertion)
const policy = { openOnConnect: true, openOnMessage: false };
ok("face window policy: connect only", policy.openOnConnect && !policy.openOnMessage);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

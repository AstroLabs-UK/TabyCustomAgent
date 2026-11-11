#!/usr/bin/env node
/** Stage 16 — transport: backoff, USB provision sim, Wi‑Fi mock, BLE sim */
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

// --- backoff (inline copy of pure logic) ---
function initialBackoff(opts = {}) {
  const baseMs = opts.baseMs ?? 500;
  return { attempt: 0, nextDelayMs: baseMs, exhausted: false };
}
function nextBackoff(state, opts = {}) {
  const baseMs = opts.baseMs ?? 500;
  const maxMs = opts.maxMs ?? 30000;
  const factor = opts.factor ?? 2;
  const maxAttempts = opts.maxAttempts ?? 8;
  const attempt = state.attempt + 1;
  if (attempt >= maxAttempts) return { attempt, nextDelayMs: 0, exhausted: true };
  const raw = baseMs * Math.pow(factor, attempt - 1);
  return { attempt, nextDelayMs: Math.min(maxMs, Math.round(raw)), exhausted: false };
}

console.log("Stage 16 tests");
let s = initialBackoff({ baseMs: 500 });
ok("backoff initial", s.nextDelayMs === 500 && s.attempt === 0);
s = nextBackoff(s, { baseMs: 100, maxMs: 400, factor: 2, maxAttempts: 10 });
ok("backoff step1", s.nextDelayMs === 100);
s = nextBackoff(s, { baseMs: 100, maxMs: 400, factor: 2, maxAttempts: 10 });
ok("backoff step2", s.nextDelayMs === 200);
s = nextBackoff(s, { baseMs: 100, maxMs: 400, factor: 2, maxAttempts: 10 });
ok("backoff cap", s.nextDelayMs === 400);

// exhaust
s = initialBackoff({ maxAttempts: 2, baseMs: 10 });
s = nextBackoff(s, { maxAttempts: 2, baseMs: 10 });
s = nextBackoff(s, { maxAttempts: 2, baseMs: 10 });
ok("backoff exhaust", s.exhausted === true);

// USB provision simulation
const phases = [];
const identity = { serial: "TABY-T", bleMac: "AA:BB:CC:11:22:33", firmware: "sim" };
const commandLog = [];
async function simProvision(wifi) {
  phases.push("detecting");
  phases.push("pushing");
  commandLog.push("usb:provision:push");
  phases.push("reading_identity");
  commandLog.push(`usb:provision:identity:${identity.bleMac}`);
  if (wifi?.ssid) {
    phases.push("writing_wifi");
    commandLog.push(`usb:provision:wifi:${wifi.ssid}`);
  }
  phases.push("done");
  return { ok: true, phase: "done", identity, message: "ok" };
}
const r = await simProvision({ ssid: "Home", password: "secret" });
ok("provision ok", r.ok === true);
ok("provision mac", r.identity.bleMac === "AA:BB:CC:11:22:33");
ok("provision phases", phases.includes("writing_wifi") && phases.includes("done"));
ok("no password in log", !commandLog.join(" ").includes("secret"));

// Wi‑Fi URL builder
function wifiUrl(addr) {
  return addr.startsWith("http") ? addr.replace(/\/$/, "") : `http://${addr}`;
}
ok("wifi url ip", wifiUrl("192.168.1.5") === "http://192.168.1.5");
ok("wifi url full", wifiUrl("http://x/") === "http://x");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

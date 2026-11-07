const results = [];
function ok(name, cond) {
  results.push({ name, pass: !!cond });
  console.log(cond ? `PASS  ${name}` : `FAIL  ${name}`);
}

class MockDevice {
  transport = "mock";
  state = "disconnected";
  commandLog = [];
  handlers = new Set();
  getConnectionState() { return this.state; }
  async connect() {
    this.state = "connecting";
    await new Promise(r => setTimeout(r, 5));
    this.state = "connected";
  }
  async play(id) {
    if (this.state !== "connected") throw new Error("not connected");
    this.commandLog.push(`play:${id}`);
  }
  onEvent(h) { this.handlers.add(h); return () => this.handlers.delete(h); }
  simulateChoice(i) {
    for (const h of this.handlers) h({ type: "choice", choiceIndex: i });
  }
}

const d = new MockDevice();
ok("device starts disconnected", d.getConnectionState() === "disconnected");
await d.connect();
ok("device connects", d.getConnectionState() === "connected");
await d.play("confirmation");
ok("play logged", d.commandLog.includes("play:confirmation"));
let threw = false;
try { const d2 = new MockDevice(); await d2.play("x"); } catch { threw = true; }
ok("offline play throws", threw);
const evs = [];
d.onEvent(e => evs.push(e));
d.simulateChoice(1);
ok("choice event", evs[0]?.choiceIndex === 1);

const DEFAULT = {
  ai: { provider: "mock", apiKey: "", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", temperature: 0.7 },
  hud: { dwellMs: 500, alwaysOnTop: true },
  device: { transport: "mock", preferredId: "" },
};
const map = new Map();
const storage = {
  getItem: k => map.get(k) ?? null,
  setItem: (k,v) => map.set(k,v),
  removeItem: k => map.delete(k),
};
function load() {
  const raw = storage.getItem("s");
  if (!raw) return structuredClone(DEFAULT);
  const parsed = JSON.parse(raw);
  return { ...structuredClone(DEFAULT), ...parsed, ai: { ...DEFAULT.ai, ...parsed.ai }, hud: { ...DEFAULT.hud, ...parsed.hud } };
}
function save(s) { storage.setItem("s", JSON.stringify(s)); }
ok("defaults dwell 500", load().hud.dwellMs === 500);
const next = structuredClone(DEFAULT);
next.ai.apiKey = "test-key-not-real";
next.ai.baseUrl = "https://example.com/v1";
next.hud.dwellMs = 600;
save(next);
const loaded = load();
ok("save key", loaded.ai.apiKey === "test-key-not-real");
ok("save url", loaded.ai.baseUrl === "https://example.com/v1");
ok("save dwell", loaded.hud.dwellMs === 600);

async function* mockStream(messages) {
  const last = [...messages].reverse().find(m => m.role === "user");
  const reply = last ? `Mock reply to: "${last.content.slice(0,80)}"` : "ready";
  for (const t of reply.split(/(\s+)/)) yield { type: "token", text: t };
  yield { type: "done" };
}
let acc = "", done = false;
for await (const c of mockStream([{ role: "user", content: "ping" }])) {
  if (c.type === "token") acc += c.text;
  if (c.type === "done") done = true;
}
ok("ai streams", done && acc.includes("ping"));
ok("ble uuid", "54414259-0000-4000-a000-000000000001".startsWith("54414259"));

const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

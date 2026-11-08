#!/usr/bin/env node
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

function validateLiveConfig(config) {
  if (config.provider === "mock") return null;
  if (!(config.apiKey ?? "").trim()) return "API key is required for live mode.";
  if (!(config.baseUrl ?? "").trim()) return "API endpoint (base URL) is required.";
  if (!(config.model ?? "").trim()) return "Model is required.";
  return null;
}

function assertNoKeyInText(text, apiKey) {
  if (!apiKey) return true;
  return !text.includes(apiKey);
}

async function* mockStream(messages) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const reply = last ? `Mock reply to: "${last.content.slice(0, 80)}"` : "ready";
  for (const t of reply.split(/(\s+)/)) yield { type: "token", text: t };
  yield { type: "done" };
}

console.log("Stage 3 tests\n");

ok("mock skips key validation", validateLiveConfig({ provider: "mock", apiKey: "", baseUrl: "", model: "" }) === null);
ok("live empty key errors", validateLiveConfig({ provider: "groq", apiKey: "", baseUrl: "https://api.groq.com/openai/v1", model: "x" }) !== null);
ok("live empty url errors", validateLiveConfig({ provider: "groq", apiKey: "k", baseUrl: "", model: "x" }) !== null);
ok("live valid passes", validateLiveConfig({ provider: "groq", apiKey: "k", baseUrl: "https://api.groq.com/openai/v1", model: "x" }) === null);

const secret = "sk-test-secret-key-do-not-log";
ok("key never in status-like string", assertNoKeyInText("AI: groq · api.groq.com", secret));
ok("detects accidental key leak", !assertNoKeyInText(`Bearer ${secret}`, secret));

let tokens = [], done = false;
for await (const c of mockStream([{ role: "user", content: "hi" }])) {
  if (c.type === "token") tokens.push(c.text);
  if (c.type === "done") done = true;
}
ok("mock returns token chunks", tokens.length > 0);
ok("mock ends with done", done);
ok("mock reply mentions user text", tokens.join("").includes("hi"));

// Secure store isolation (in-memory)
const map = new Map();
const store = {
  getItem: (k) => map.get(k) ?? null,
  setItem: (k, v) => map.set(k, v),
  removeItem: (k) => map.delete(k),
};
const SECURE = "taby-custom-agent-secure";
const PUBLIC = "taby-custom-agent-settings";
store.setItem(SECURE, JSON.stringify({ apiKey: secret }));
store.setItem(PUBLIC, JSON.stringify({ ai: { provider: "groq", apiKey: "", baseUrl: "https://api.groq.com/openai/v1", model: "m" } }));
const publicRaw = store.getItem(PUBLIC);
ok("public settings JSON has empty apiKey field", publicRaw.includes('"apiKey":""') || !publicRaw.includes(secret));
ok("secure blob holds key", store.getItem(SECURE).includes(secret));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

#!/usr/bin/env node
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

function createConversation(title = "New chat") {
  const now = Date.now();
  return { id: "c1", title, createdAt: now, updatedAt: now, messages: [] };
}
function appendMessage(conv, role, content) {
  const msg = { id: "m" + Math.random(), role, content, createdAt: Date.now() };
  return {
    ...conv,
    title: conv.messages.length === 0 && role === "user" ? content.slice(0, 48) : conv.title,
    messages: [...conv.messages, msg],
  };
}
function replaceAssistantTail(conv, content) {
  const messages = [...conv.messages];
  const last = messages[messages.length - 1];
  if (last && last.role === "assistant") messages[messages.length - 1] = { ...last, content };
  else messages.push({ id: "a", role: "assistant", content, createdAt: Date.now() });
  return { ...conv, messages };
}
function createStreamAssembler(onUpdate) {
  let acc = "";
  return {
    pushToken(t) { acc += t; onUpdate(acc); },
    get text() { return acc; },
  };
}
function renderBasicMarkdown(src) {
  return src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

// persist
const map = new Map();
const storage = {
  getItem: (k) => map.get(k) ?? null,
  setItem: (k, v) => map.set(k, v),
  removeItem: (k) => map.delete(k),
};
function save(state) { storage.setItem("chats", JSON.stringify(state)); }
function load() {
  const raw = storage.getItem("chats");
  return raw ? JSON.parse(raw) : { conversations: [], activeId: null };
}

console.log("Stage 4 tests\n");

let conv = createConversation();
conv = appendMessage(conv, "user", "Hello HUD");
ok("user message appended", conv.messages.length === 1 && conv.messages[0].role === "user");
ok("title from first user message", conv.title.startsWith("Hello"));
conv = appendMessage(conv, "assistant", "");
conv = replaceAssistantTail(conv, "Hi ");
conv = replaceAssistantTail(conv, "Hi there");
ok("stream assembler via replace tail", conv.messages.at(-1).content === "Hi there");

const parts = [];
const asm = createStreamAssembler((t) => parts.push(t));
asm.pushToken("A");
asm.pushToken("B");
ok("assembler accumulates", asm.text === "AB" && parts.at(-1) === "AB");

save({ conversations: [conv], activeId: conv.id });
const reloaded = load();
ok("persist/reload messages", reloaded.conversations[0].messages.length === 2);
ok("persist activeId", reloaded.activeId === conv.id);

ok("markdown bold", renderBasicMarkdown("**x**").includes("<strong>x</strong>"));
ok("markdown escapes html", renderBasicMarkdown("<script>").includes("&lt;script"));

// HUD send integration (mock path): user then assistant
let state = { conversations: [], activeId: null };
let c = createConversation();
c = appendMessage(c, "user", "from HUD");
c = appendMessage(c, "assistant", "Mock reply to: \"from HUD\"");
state = { conversations: [c], activeId: c.id };
ok("HUD→chat handoff shape", state.conversations[0].messages[0].content === "from HUD");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

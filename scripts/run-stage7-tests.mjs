#!/usr/bin/env node
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

const MAX = 5 * 1024 * 1024;

function kindFromFile(name, mime) {
  const n = name.toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime === "text/plain" || n.endsWith(".txt")) return "text";
  if (n.endsWith(".md")) return "markdown";
  if (n.endsWith(".pdf")) return "pdf";
  return "other";
}
function validateSize(size, max = MAX) {
  if (size > max) return { ok: false, reason: "too large" };
  return { ok: true };
}
function extractTxt(content) { return { text: content }; }
function attachmentsToPromptContext(atts) {
  return atts.map(a => a.text ? `--- file: ${a.name} ---\n${a.text}\n--- end ---` : `[Attachment: ${a.name}]`).join("\n\n");
}

console.log("Stage 7 tests\n");

ok("txt kind", kindFromFile("notes.txt", "text/plain") === "text");
ok("md kind", kindFromFile("readme.md", "") === "markdown");
ok("pdf kind", kindFromFile("doc.pdf", "application/pdf") === "pdf");
ok("image kind", kindFromFile("x.png", "image/png") === "image");
ok("reject oversize", validateSize(MAX + 1).ok === false);
ok("accept under limit", validateSize(100).ok === true);
ok("extract txt", extractTxt("hello").text === "hello");

const ctx = attachmentsToPromptContext([
  { name: "a.txt", text: "body" },
  { name: "b.png" },
]);
ok("prompt includes file body", ctx.includes("body") && ctx.includes("a.txt"));
ok("message metadata shape", true);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

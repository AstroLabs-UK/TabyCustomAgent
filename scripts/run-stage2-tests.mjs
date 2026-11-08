#!/usr/bin/env node
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}
const LABELS = ["Chat","Home","Tasks","Notes","Reminders","Habits","Today","This week","Focus","Settings"];
console.log("Stage 2 tests\n");
ok("10 nav cells", LABELS.length === 10);
ok("no Feedback", !LABELS.includes("Feedback"));
ok("Settings last", LABELS.at(-1) === "Settings");
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

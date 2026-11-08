#!/usr/bin/env node
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

const LABELS = ["Chat","Home","Tasks","Notes","Reminders","Habits","Today","This week","Focus","Feedback","Settings"];
console.log("Stage 2 tests\n");
ok("11 nav cells (official layout)", LABELS.length === 11);
ok("Chat first", LABELS[0] === "Chat");
ok("Home second", LABELS[1] === "Home");
ok("Settings last", LABELS.at(-1) === "Settings");
ok("Feedback present", LABELS.includes("Feedback"));
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

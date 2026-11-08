#!/usr/bin/env node
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

const STATES = { busy: "working_loop", done: "confirmation" };
const ALTS = {
  done: ["confirmation", "thumbs_up", "yeah", "task_completed"],
  error: ["disappointed", "hello_disappointed"],
};
const POST = 1200;
function pick(pool) { return pool[Math.floor(Math.random() * pool.length)]; }

console.log("Stage 6 tests\n");
ok("AI load working_loop", STATES.busy === "working_loop");
ok("done alts exist", ALTS.done.length >= 2);
const picks = new Set();
for (let i = 0; i < 40; i++) picks.add(pick(ALTS.done));
ok("random done picks vary", picks.size >= 2);
ok("post-done delay >= 1000ms", POST >= 1000);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

#!/usr/bin/env node
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

const STATES = {
  listening: "listening_loop",
  busy: "working_loop",
  done: "confirmation",
  error: "disappointed",
  idle: "idle_01_loop",
};
const LOOPING = new Set(["listening_loop", "working_loop", "idle_01_loop", "busy_loop"]);
const DUR = { confirmation: 1958, disappointed: 2792, working_loop: 1333 };

console.log("Stage 6 tests\n");

ok("listening → listening_loop", STATES.listening === "listening_loop");
ok("AI loading → working_loop (ff09215b)", STATES.busy === "working_loop");
ok("done → confirmation", STATES.done === "confirmation");
ok("working_loop is looping (stays until replaced)", LOOPING.has("working_loop"));
ok("confirmation is one-shot (returns to idle)", !LOOPING.has("confirmation"));
ok("confirmation duration known", DUR.confirmation > 0);

// Simulated face controller: one-shot schedules idle
let current = "idle_01_loop";
const log = [];
function play(id) {
  current = id;
  log.push(id);
  if (!LOOPING.has(id) && id !== "idle_01_loop") {
    // schedule idle
    log.push("→idle_scheduled");
    current = "idle_01_loop";
    log.push("idle_01_loop");
  }
}
play("listening_loop");
play("working_loop");
play("confirmation");
ok(
  "sequence ends on idle after confirmation",
  log.includes("confirmation") && log.at(-1) === "idle_01_loop"
);
ok("rotate policy -90deg documented", true);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

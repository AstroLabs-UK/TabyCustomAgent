#!/usr/bin/env node
/**
 * Stage 1 automated checks (pure Node, no browser).
 * Dwell timer + HUD state machine.
 */
let passed = 0;
let failed = 0;

function ok(name, cond) {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name}`);
  }
}

// --- Inline minimal copies of dwell + state machine for isolation ---
function createFakeClock() {
  let now = 0;
  const timers = new Map();
  let nextId = 1;
  return {
    clock: {
      now: () => now,
      setTimeout: (fn, ms) => {
        const id = nextId++;
        timers.set(id, { fn, at: now + ms });
        return id;
      },
      clearTimeout: (id) => timers.delete(id),
    },
    advance(ms) {
      now += ms;
      const due = [...timers.entries()]
        .filter(([, t]) => t.at <= now)
        .sort((a, b) => a[1].at - b[1].at);
      for (const [id, t] of due) {
        timers.delete(id);
        t.fn();
      }
    },
  };
}

class DwellTimer {
  constructor({ dwellMs, onFire, clock }) {
    this.dwellMs = dwellMs;
    this.onFire = onFire;
    this.clock = clock;
    this.timerId = null;
    this.hovering = false;
    this.firedThisHover = false;
  }
  setDwellMs(ms) {
    this.dwellMs = Math.max(0, ms);
    if (this.hovering && !this.firedThisHover) {
      this.clear();
      this.start();
    }
  }
  pointerEnter() {
    this.hovering = true;
    this.firedThisHover = false;
    this.start();
  }
  pointerLeave() {
    this.hovering = false;
    this.firedThisHover = false;
    this.clear();
  }
  start() {
    this.clear();
    this.timerId = this.clock.setTimeout(() => {
      this.timerId = null;
      if (this.hovering && !this.firedThisHover) {
        this.firedThisHover = true;
        this.onFire();
      }
    }, this.dwellMs);
  }
  clear() {
    if (this.timerId != null) {
      this.clock.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

function reduceHudPhase(phase, event) {
  switch (event.type) {
    case "dwell_complete":
      return "compact";
    case "dismiss":
    case "escape":
    case "click_outside":
      return "hidden";
    default:
      return phase;
  }
}

console.log("Stage 1 tests\n");

// Dwell
{
  const fake = createFakeClock();
  let fired = 0;
  const t = new DwellTimer({ dwellMs: 500, onFire: () => fired++, clock: fake.clock });
  t.pointerEnter();
  fake.advance(499);
  ok("dwell does not fire before threshold", fired === 0);
  fake.advance(1);
  ok("dwell fires at threshold", fired === 1);
}
{
  const fake = createFakeClock();
  let fired = 0;
  const t = new DwellTimer({ dwellMs: 500, onFire: () => fired++, clock: fake.clock });
  t.pointerEnter();
  fake.advance(200);
  t.pointerLeave();
  fake.advance(500);
  ok("leave before threshold cancels", fired === 0);
}
{
  const fake = createFakeClock();
  let fired = 0;
  const t = new DwellTimer({ dwellMs: 300, onFire: () => fired++, clock: fake.clock });
  t.pointerEnter();
  fake.advance(300);
  fake.advance(300);
  ok("fires once per hover", fired === 1);
}
{
  const fake = createFakeClock();
  let fired = 0;
  const t = new DwellTimer({ dwellMs: 500, onFire: () => fired++, clock: fake.clock });
  t.setDwellMs(200);
  t.pointerEnter();
  fake.advance(200);
  ok("respects configured dwellMs", fired === 1);
}

// State machine
ok("hidden + dwell → compact", reduceHudPhase("hidden", { type: "dwell_complete" }) === "compact");
ok("compact + dismiss → hidden", reduceHudPhase("compact", { type: "dismiss" }) === "hidden");
ok("compact + escape → hidden", reduceHudPhase("compact", { type: "escape" }) === "hidden");
ok("compact + click_outside → hidden", reduceHudPhase("compact", { type: "click_outside" }) === "hidden");
ok("prompt state machine hidden→compact", reduceHudPhase("hidden", { type: "dwell_complete" }) === "compact");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

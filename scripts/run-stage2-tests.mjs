#!/usr/bin/env node
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

const PASTELS = ["#DCE6F5", "#FCE4EC", "#FFE9DB", "#E8F2EC", "#EDE7F6"];
const LABELS = ["Chat","Home","Tasks","Reminders","Today","Focus","Settings","Notes","Habits","This week"];
const NAV_GRID = LABELS.map((label, index) => ({
  label,
  row: Math.floor(index / 2),
  col: index % 2,
  index,
  hex: PASTELS[index % 5],
}));

function reduce(phase, event) {
  switch (event) {
    case "dwell_complete": return phase === "hidden" ? "compact" : phase;
    case "toggle_nav":
      if (phase === "compact") return "expanded";
      if (phase === "expanded") return "compact";
      return phase;
    case "activate_route": return phase === "expanded" ? "compact" : phase;
    case "escape": return phase === "expanded" ? "compact" : "hidden";
    case "dismiss":
    case "click_outside": return "hidden";
    default: return phase;
  }
}

console.log("Stage 2 tests\n");
ok("10 cells", NAV_GRID.length === 10);
ok("labels order", NAV_GRID.map(c => c.label).join("|") === LABELS.join("|"));
// First 5 colours in order, next 5 repeat — not column-paired
for (let i = 0; i < 10; i++) {
  ok(`cell ${i} pastel ${PASTELS[i % 5]}`, NAV_GRID[i].hex.toUpperCase() === PASTELS[i % 5]);
}
ok("Chat≠Home colour (not column/row-pair)", NAV_GRID[0].hex !== NAV_GRID[1].hex);
ok("row0 left/right different", NAV_GRID[0].hex !== NAV_GRID[1].hex);
ok("index5 repeats pastel0", NAV_GRID[5].hex === NAV_GRID[0].hex);

ok("compact+toggle→expanded", reduce("compact", "toggle_nav") === "expanded");
ok("expanded+escape→compact", reduce("expanded", "escape") === "compact");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

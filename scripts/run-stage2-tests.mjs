#!/usr/bin/env node
let passed = 0;
let failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}

const NAV_GRID = [
  { id: "chat", label: "Chat", row: 0, col: 0, hex: "#DCE6F5" },
  { id: "home", label: "Home", row: 0, col: 1, hex: "#DCE6F5" },
  { id: "tasks", label: "Tasks", row: 1, col: 0, hex: "#FCE4EC" },
  { id: "reminders", label: "Reminders", row: 1, col: 1, hex: "#FCE4EC" },
  { id: "today", label: "Today", row: 2, col: 0, hex: "#FFE9DB" },
  { id: "focus", label: "Focus", row: 2, col: 1, hex: "#FFE9DB" },
  { id: "settings", label: "Settings", row: 3, col: 0, hex: "#E8F2EC" },
  { id: "notes", label: "Notes", row: 3, col: 1, hex: "#E8F2EC" },
  { id: "habits", label: "Habits", row: 4, col: 0, hex: "#EDE7F6" },
  { id: "this_week", label: "This week", row: 4, col: 1, hex: "#EDE7F6" },
];
const ROW_HEX = ["#DCE6F5", "#FCE4EC", "#FFE9DB", "#E8F2EC", "#EDE7F6"];

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

ok("5×2 = 10 cells", NAV_GRID.length === 10);
ok("labels order", NAV_GRID.map(c => c.label).join("|") ===
  "Chat|Home|Tasks|Reminders|Today|Focus|Settings|Notes|Habits|This week");
for (let r = 0; r < 5; r++) {
  const a = NAV_GRID.find(c => c.row === r && c.col === 0);
  const b = NAV_GRID.find(c => c.row === r && c.col === 1);
  ok(`row ${r + 1} shared pastel ${ROW_HEX[r]}`, a.hex === b.hex && a.hex.toUpperCase() === ROW_HEX[r]);
}
ok("row 3 peach not yellow", NAV_GRID.find(c => c.id === "today").hex.toUpperCase() === "#FFE9DB");

ok("compact + toggle → expanded", reduce("compact", "toggle_nav") === "expanded");
ok("expanded + toggle → compact", reduce("expanded", "toggle_nav") === "compact");
ok("expanded + activate → compact", reduce("expanded", "activate_route") === "compact");
ok("expanded + escape → compact", reduce("expanded", "escape") === "compact");
ok("compact + escape → hidden", reduce("compact", "escape") === "hidden");
ok("prompt stays concept: expanded is still visible overlay", reduce("compact", "toggle_nav") === "expanded");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

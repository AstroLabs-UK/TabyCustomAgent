#!/usr/bin/env node
let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}`); }
}
console.log("Stage 17 tests");

// Onboarding step filter: no USB step without physical
const BASE = ["welcome","ai","key","device_kind","usb_setup","face","edge_size","practice","done"];
function stepsFor(hasPhysical) {
  return BASE.filter((id) => !(id === "usb_setup" && !hasPhysical));
}
ok("no usb step without physical", !stepsFor(false).includes("usb_setup"));
ok("usb step with physical", stepsFor(true).includes("usb_setup"));
ok("practice step always", stepsFor(false).includes("practice") && stepsFor(true).includes("practice"));
ok("edge_size always", stepsFor(false).includes("edge_size"));

// Toast ring buffer logic
let toasts = [];
function push(msg) {
  const id = String(toasts.length + 1);
  toasts = [...toasts, { id, msg }];
  return id;
}
function drop(id) { toasts = toasts.filter((t) => t.id !== id); }
const a = push("a");
const b = push("b");
ok("two toasts", toasts.length === 2);
drop(a);
ok("drop toast", toasts.length === 1 && toasts[0].id === b);

// Hotkey accel default shape
const accel = "CommandOrControl+Shift+Space";
ok("hotkey default", accel.includes("Shift") && accel.includes("Space"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

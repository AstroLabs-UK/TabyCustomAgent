#!/usr/bin/env node
/**
 * Fails the build if main window is configured to launch invisible / zero-size
 * or if Rust setup still unwraps tray icons (crash-on-start risk).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let failed = 0;
function ok(name, cond, detail = "") {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failed++;
    console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`);
  }
}

console.log("Startup config checks\n");

const confPath = join(root, "src-tauri/tauri.conf.json");
ok("tauri.conf.json exists", existsSync(confPath));
const conf = JSON.parse(readFileSync(confPath, "utf8"));
const win = (conf.app?.windows || []).find((w) => w.label === "main") || conf.app?.windows?.[0];
ok("main window defined", Boolean(win));
ok("visible !== false", win && win.visible !== false, JSON.stringify(win?.visible));
ok("height >= 200", win && Number(win.height) >= 200, String(win?.height));
ok("width >= 200", win && Number(win.width) >= 200, String(win?.width));
ok("skipTaskbar is not true", win && win.skipTaskbar !== true);

const lib = readFileSync(join(root, "src-tauri/src/lib.rs"), "utf8");
ok(
  "tray does not unwrap default_window_icon",
  !lib.includes("default_window_icon().unwrap()"),
  "found unwrap on tray icon"
);
ok("startup_log helper present", lib.includes("fn startup_log"));
ok("setup forces window show", lib.includes("main window forced visible") || lib.includes("win.show()"));

console.log(`\n${failed ? failed + " failed" : "all passed"}`);
process.exit(failed ? 1 : 0);

#!/usr/bin/env node
/**
 * Windows .exe build path (Stage 0 stub).
 * On a Windows host (or CI with Windows runners):
 *   npm install
 *   npm run tauri build
 * Output typically under:
 *   src-tauri/target/release/taby-custom-agent.exe
 *   and/or NSIS/MSI under src-tauri/target/release/bundle/
 *
 * This script validates the documented path and prints next steps.
 * Full cross-compile from Linux requires additional Tauri Windows toolchain setup.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const conf = join(root, "src-tauri", "tauri.conf.json");
const cargo = join(root, "src-tauri", "Cargo.toml");

console.log("=== package-windows (Stage 0 stub) ===");
console.log("tauri.conf.json present:", existsSync(conf));
console.log("Cargo.toml present:", existsSync(cargo));
console.log("");
console.log("To produce a Windows .exe on Windows:");
console.log("  1. npm install");
console.log("  2. npm run tauri build");
console.log("  3. Find .exe under src-tauri/target/release/");
console.log("");
console.log("See BUILD_WINDOWS.md for full instructions.");
process.exit(0);

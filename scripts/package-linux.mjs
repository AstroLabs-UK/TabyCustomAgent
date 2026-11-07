#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
console.log("=== package-linux (Stage 0 stub) ===");
console.log("src-tauri present:", existsSync(join(root, "src-tauri")));
console.log("On Linux with webkit2gtk deps:");
console.log("  npm install && npm run tauri build");
console.log("See BUILD_LINUX.md");
process.exit(0);

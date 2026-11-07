#!/usr/bin/env node
/**
 * Create a zip of the full git repo (or project tree) for GitHub upload.
 * Excludes secrets, node_modules, target/, dist, .env*
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "artifacts");
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const outZip = join(outDir, `taby-custom-agent-stage0-${stamp}.zip`);

const excludes = [
  "node_modules/*",
  "src-tauri/target/*",
  "dist/*",
  ".env",
  ".env.*",
  "*.local",
  ".DS_Store",
  "artifacts/*.zip",
].map((e) => `-x "${e}"`).join(" ");

process.chdir(root);
try {
  if (existsSync(join(root, ".git"))) {
    execSync(`git archive -o "${outZip}" HEAD`, { stdio: "inherit" });
  } else {
    execSync(
      `zip -r "${outZip}" . ${excludes} -x "./.git/*"`,
      { stdio: "inherit" }
    );
  }
  console.log("Wrote", outZip);
} catch (e) {
  console.error("Zip failed:", e.message);
  process.exit(1);
}

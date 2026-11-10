#!/usr/bin/env node
/**
 * Resilient Tauri CLI launcher for local + CI (Windows/Linux).
 * Tries several known locations, then falls back to `npm exec @tauri-apps/cli`.
 *
 * Windows note: never use shell:true with absolute paths that contain spaces
 * (e.g. C:\Program Files\nodejs\node.exe) — cmd.exe splits on the space and
 * fails with: 'C:\Program' is not recognized as an internal or external command.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const require = createRequire(import.meta.url);
const isWin = process.platform === "win32";

/**
 * @param {string} command
 * @param {string[]} commandArgs
 * @param {{ cwd?: string, shell?: boolean, env?: NodeJS.ProcessEnv }} [opts]
 */
function trySpawn(command, commandArgs, opts = {}) {
  // Only use a shell for .cmd/.bat shims. Never shell-out absolute paths
  // like "C:\Program Files\nodejs\node.exe" — spaces break cmd.exe parsing.
  const looksLikeBatch = /\.(cmd|bat)$/i.test(String(command));
  const useShell =
    opts.shell === true || (isWin && looksLikeBatch && opts.shell !== false);

  let cmd = command;
  if (useShell && isWin && /\s/.test(cmd) && !/^".*"$/.test(cmd)) {
    cmd = `"${cmd}"`;
  }

  const r = spawnSync(cmd, commandArgs, {
    stdio: "inherit",
    cwd: opts.cwd ?? root,
    shell: useShell,
    env: opts.env,
  });
  if (r.error) return { ok: false, status: 1, error: r.error };
  return { ok: r.status === 0, status: r.status ?? 1 };
}

// 1) Prefer resolved package entry (works even if bin shim is broken)
const candidates = [];
try {
  const pkgJson = require.resolve("@tauri-apps/cli/package.json");
  const pkgDir = dirname(pkgJson);
  candidates.push(join(pkgDir, "tauri.js"));
  candidates.push(join(pkgDir, "main.js"));
} catch {
  // not resolvable from this cwd
}

// 2) Common relative paths
candidates.push(
  join(root, "node_modules", "@tauri-apps", "cli", "tauri.js"),
  join(root, "node_modules", "@tauri-apps", "cli", "main.js"),
);

for (const entry of candidates) {
  if (entry && existsSync(entry)) {
    // shell: false — spawn node.exe directly so "Program Files" is fine
    const r = trySpawn(process.execPath, [entry, ...args], {
      cwd: root,
      shell: false,
    });
    process.exit(r.status);
  }
}

// 3) Windows npm bin shim (.cmd needs shell)
const winShim = join(root, "node_modules", ".bin", "tauri.cmd");
if (existsSync(winShim)) {
  const r = trySpawn(winShim, args, { cwd: root, shell: true });
  process.exit(r.status);
}

// 4) Last resort: npm exec (downloads if needed — needs network)
console.error(
  "[run-tauri] Could not find local @tauri-apps/cli entry; falling back to npm exec",
);
const r = trySpawn(
  "npm",
  ["exec", "--yes", "--", "@tauri-apps/cli", ...args],
  { cwd: root, shell: true },
);
process.exit(r.status);

import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

// run from repo root after copy to /tmp
console.log("Use shell zip with excludes");

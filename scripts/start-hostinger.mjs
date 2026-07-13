#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDir = path.join(root, "apps", "web");
const webNext = path.join(webDir, ".next");

if (!existsSync(webNext)) {
  console.error("Missing apps/web/.next. Run npm run build first.");
  process.exit(1);
}

const port = process.env.PORT ?? "3000";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(
  npmCmd,
  ["run", "start", "--", "-H", hostname, "-p", port],
  {
    cwd: webDir,
    stdio: "inherit",
    env: process.env,
  },
);

child.on("exit", (code) => process.exit(code ?? 1));

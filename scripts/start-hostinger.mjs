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

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const nextBinFallback = path.join(webDir, "node_modules", "next", "dist", "bin", "next");
const bin = existsSync(nextBin) ? nextBin : nextBinFallback;

if (!existsSync(bin)) {
  console.error("Missing next binary. Run npm install from the repo root.");
  process.exit(1);
}

console.log(
  `[hostinger] starting Next from ${webDir} (release build) on ${hostname}:${port}`,
);

const child = spawn(process.execPath, [bin, "start", "-H", hostname, "-p", port], {
  cwd: webDir,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 1));

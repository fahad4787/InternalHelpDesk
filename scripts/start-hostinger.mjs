#!/usr/bin/env node
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDir = path.join(root, "apps", "web");
const webNext = path.join(webDir, ".next");

function readBuildId(dir) {
  try {
    return readFileSync(path.join(dir, "BUILD_ID"), "utf8").trim();
  } catch {
    return null;
  }
}

if (!existsSync(webNext)) {
  console.error("Missing apps/web/.next. Run npm run build first.");
  process.exit(1);
}

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const buildId = readBuildId(webNext) ?? "unknown";

// Hostinger requires the entry process itself to call listen() within ~3s.
// Spawning `next start` as a child fails that check and causes 503.
const require = createRequire(path.join(webDir, "package.json"));
const next = require("next");

const app = next({
  dev: false,
  dir: webDir,
  hostname,
  port,
});
const handle = app.getRequestHandler();

console.log(
  `[hostinger] preparing Next dir=${webDir} BUILD_ID=${buildId} on ${hostname}:${port}`,
);

try {
  await app.prepare();
} catch (error) {
  console.error("[hostinger] Next prepare failed:", error);
  process.exit(1);
}

createServer((req, res) => {
  handle(req, res, parse(req.url ?? "/", true));
}).listen(port, hostname, () => {
  console.log(
    `[hostinger] listening BUILD_ID=${buildId} http://${hostname}:${port}`,
  );
});

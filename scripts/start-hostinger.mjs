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

console.log(
  `[hostinger] boot PORT=${process.env.PORT ?? "(unset→3000)"} HOSTNAME=${hostname} BUILD_ID=${buildId}`,
);

const require = createRequire(path.join(webDir, "package.json"));
const next = require("next");

const app = next({
  dev: false,
  dir: webDir,
  hostname,
  port,
});
const handle = app.getRequestHandler();

let ready = false;
let prepareError = null;
const preparePromise = app
  .prepare()
  .then(() => {
    ready = true;
    console.log(`[hostinger] Next prepared BUILD_ID=${buildId}`);
  })
  .catch((error) => {
    prepareError = error;
    console.error("[hostinger] Next prepare failed:", error);
  });

const server = createServer((req, res) => {
  if (prepareError) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Application failed to start");
    return;
  }

  // Hostinger probes the process right after listen(). Returning 503 here
  // causes hCDN to mark the app unavailable permanently.
  if (!ready) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      "<!doctype html><html><body style=\"font-family:sans-serif;padding:2rem\">Starting Workhub…</body></html>",
    );
    return;
  }

  handle(req, res, parse(req.url ?? "/", true));
});

server.listen(port, hostname, () => {
  console.log(
    `[hostinger] listening BUILD_ID=${buildId} http://${hostname}:${port}`,
  );
});

await preparePromise;
if (prepareError) {
  process.exit(1);
}

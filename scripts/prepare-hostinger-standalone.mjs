import {
  cpSync,
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webNext = path.join(root, "apps", "web", ".next");
const rootNext = path.join(root, ".next");

function isNextBuildDir(dir) {
  if (!existsSync(dir)) return false;
  try {
    const stat = lstatSync(dir);
    if (!stat.isDirectory() && !stat.isSymbolicLink()) return false;
  } catch {
    return false;
  }
  return (
    existsSync(path.join(dir, "BUILD_ID")) ||
    existsSync(path.join(dir, "build-manifest.json")) ||
    existsSync(path.join(dir, "server"))
  );
}

function describe(dir) {
  if (!existsSync(dir)) return "missing";
  try {
    const names = readdirSync(dir).slice(0, 8).join(", ");
    return `exists (${names}${names ? ", ..." : ""})`;
  } catch (error) {
    return `unreadable: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function readBuildId(dir) {
  try {
    return readFileSync(path.join(dir, "BUILD_ID"), "utf8").trim();
  } catch {
    return null;
  }
}

function detectPublicHtml(repoRoot) {
  const marker = `${path.sep}.builds${path.sep}source${path.sep}repository`;
  const idx = repoRoot.lastIndexOf(marker);
  if (idx === -1) return null;
  return repoRoot.slice(0, idx);
}

function replaceDir(source, dest) {
  rmSync(dest, { recursive: true, force: true });
  cpSync(source, dest, { recursive: true });
}

console.log(`[prepare] repo root: ${root}`);
console.log(`[prepare] apps/web/.next: ${describe(webNext)}`);
console.log(`[prepare] root .next: ${describe(rootNext)}`);

const sourceNext = isNextBuildDir(webNext)
  ? webNext
  : isNextBuildDir(rootNext)
    ? rootNext
    : null;

if (!sourceNext) {
  console.error(
    "Missing Next.js build output. Expected apps/web/.next after `next build`.",
  );
  process.exit(1);
}

const buildId = readBuildId(sourceNext);
console.log(`[prepare] BUILD_ID=${buildId ?? "unknown"}`);

if (sourceNext !== rootNext) {
  try {
    replaceDir(sourceNext, rootNext);
    console.log("[prepare] Copied apps/web/.next -> .next");
  } catch (error) {
    console.error(
      `[prepare] failed copying to root .next: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

const publicHtml = detectPublicHtml(root);
if (publicHtml) {
  const publicNext = path.join(publicHtml, ".next");
  const startJs = path.join(publicHtml, "start-hostinger-bridge.cjs");
  const packageJson = path.join(publicHtml, "package.json");
  const relRepo = path.relative(publicHtml, root).split(path.sep).join("/");

  console.log(`[prepare] Hostinger public_html: ${publicHtml}`);
  try {
    replaceDir(sourceNext, publicNext);
    console.log(`[prepare] Copied build -> ${publicNext}`);
    console.log(
      `[prepare] public_html BUILD_ID=${readBuildId(publicNext) ?? "unknown"}`,
    );
  } catch (error) {
    console.error(
      `[prepare] failed publishing to public_html/.next: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }

  // Hostinger often runs npm start from public_html. The old 20-byte package.json
  // there cannot start the monorepo app and causes 503 after deploy.
  writeFileSync(
    startJs,
    `#!/usr/bin/env node
const { spawn } = require("node:child_process");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, ${JSON.stringify(relRepo)});
const script = path.join(repoRoot, "scripts", "start-hostinger.mjs");

console.log("[bridge] launching", script);
const child = spawn(process.execPath, [script], {
  cwd: repoRoot,
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 1));
`,
  );

  writeFileSync(
    packageJson,
    `${JSON.stringify(
      {
        name: "internalhelpdesk-hostinger",
        private: true,
        scripts: {
          start: "node ./start-hostinger-bridge.cjs",
        },
      },
      null,
      2,
    )}\n`,
  );

  console.log(`[prepare] Wrote public_html bridge -> ${relRepo}/scripts/start-hostinger.mjs`);
} else {
  console.log("[prepare] Not a Hostinger .builds path; skipped public_html publish");
}

console.log("[prepare] Done");

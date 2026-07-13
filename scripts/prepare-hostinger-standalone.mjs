import { cpSync, existsSync, lstatSync, readdirSync, rmSync, symlinkSync } from "node:fs";
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
    const names = readdirSync(dir).slice(0, 12).join(", ");
    return `exists (${names}${names ? ", ..." : ""})`;
  } catch (error) {
    return `unreadable: ${error instanceof Error ? error.message : String(error)}`;
  }
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
    "Missing Next.js build output. Expected apps/web/.next (or root .next) after `next build`.",
  );
  console.error(
    "If the build log says Compiled successfully, Hostinger may be out of inodes and could not finish writing .next.",
  );
  process.exit(1);
}

if (sourceNext === rootNext) {
  console.log("[prepare] Using existing root .next");
  process.exit(0);
}

// Hostinger often checks for repo-root .next. Prefer a symlink so we do not
// double inode usage under the account file limit.
try {
  rmSync(rootNext, { recursive: true, force: true });
} catch (error) {
  console.warn(
    `[prepare] could not clear root .next: ${error instanceof Error ? error.message : String(error)}`,
  );
}

try {
  symlinkSync(sourceNext, rootNext, "dir");
  console.log("[prepare] Linked .next -> apps/web/.next");
  process.exit(0);
} catch (symlinkError) {
  console.warn(
    `[prepare] symlink failed (${symlinkError instanceof Error ? symlinkError.message : String(symlinkError)}); copying instead`,
  );
}

try {
  cpSync(sourceNext, rootNext, { recursive: true });
  console.log("[prepare] Copied apps/web/.next -> .next");
} catch (copyError) {
  console.error(
    `[prepare] copy failed: ${copyError instanceof Error ? copyError.message : String(copyError)}`,
  );
  console.error(
    "Build output exists at apps/web/.next; start script can still use that path.",
  );
  // Do not fail the deploy solely because the Hostinger root mirror failed.
  // start-hostinger.mjs serves apps/web/.next directly.
  process.exit(0);
}

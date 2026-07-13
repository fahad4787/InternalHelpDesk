import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webNext = path.join(root, "apps", "web", ".next");
const rootNext = path.join(root, ".next");

if (!existsSync(webNext)) {
  console.error("Missing build output at apps/web/.next");
  process.exit(1);
}

// Avoid a second full .next tree — Hostinger inode limits are tight.
rmSync(rootNext, { recursive: true, force: true });

console.log("Hostinger will serve apps/web/.next (removed duplicate root .next)");

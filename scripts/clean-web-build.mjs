import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const target of [
  path.join(root, "apps", "web", ".next"),
  path.join(root, ".next"),
]) {
  rmSync(target, { recursive: true, force: true });
}

console.log("Cleared previous Next.js build output");

import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = path.join(root, "apps", "web");
const standaloneRoot = path.join(webRoot, ".next", "standalone");
const staticRoot = path.join(webRoot, ".next", "static");
const publicRoot = path.join(webRoot, "public");

if (!existsSync(standaloneRoot)) {
  console.error("Missing standalone build output at apps/web/.next/standalone");
  process.exit(1);
}

const nestedAppRoot = path.join(standaloneRoot, "apps", "web");
const standaloneNextDir = path.join(nestedAppRoot, ".next");
mkdirSync(standaloneNextDir, { recursive: true });

if (existsSync(staticRoot)) {
  cpSync(staticRoot, path.join(standaloneNextDir, "static"), { recursive: true });
}

if (existsSync(publicRoot)) {
  cpSync(publicRoot, path.join(nestedAppRoot, "public"), { recursive: true });
}

console.log("Prepared Hostinger standalone output");

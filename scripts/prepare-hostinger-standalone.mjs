import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = path.join(root, "apps", "web");
const webNext = path.join(webRoot, ".next");
const standaloneRoot = path.join(webNext, "standalone");
const staticRoot = path.join(webNext, "static");
const publicRoot = path.join(webRoot, "public");
const rootNext = path.join(root, ".next");
const deployRoot = path.join(root, "deploy");

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

rmSync(rootNext, { recursive: true, force: true });
cpSync(webNext, rootNext, { recursive: true });

rmSync(deployRoot, { recursive: true, force: true });
cpSync(standaloneRoot, deployRoot, { recursive: true });

console.log("Prepared Hostinger output at .next and deploy/");

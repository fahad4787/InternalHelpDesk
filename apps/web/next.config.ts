import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const apiOrigin =
  process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://127.0.0.1:3002";

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  // Keep the terminal clean — don't forward browser/HMR console noise.
  logging: {
    browserToTerminal: false,
  },
  turbopack: {
    root: monorepoRoot,
  },
  async headers() {
    const noStore = [
      {
        key: "Cache-Control",
        value: "private, no-cache, no-store, max-age=0, must-revalidate",
      },
      { key: "CDN-Cache-Control", value: "no-store" },
      { key: "Cloudflare-CDN-Cache-Control", value: "no-store" },
    ];

    // Document routes only — never put no-store on /_next/static (that made every nav re-download JS).
    const documentRoutes = [
      "/",
      "/dashboard",
      "/dashboard/:path*",
      "/my-tasks",
      "/integrations",
      "/integrations/:path*",
      "/settings",
      "/chat",
      "/knowledge-base",
      "/knowledge-base/:path*",
      "/users",
      "/users/:path*",
      "/login",
      "/register",
    ];

    return documentRoutes.map((source) => ({ source, headers: noStore }));
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/integrations/zoom/callback",
        destination: `${apiOrigin}/api/integrations/zoom/callback`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

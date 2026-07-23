import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const apiOrigin =
  process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://127.0.0.1:3002";

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
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

    return [
      { source: "/:path*", headers: noStore },
      { source: "/", headers: noStore },
    ];
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

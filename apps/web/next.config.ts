import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const apiOrigin =
  process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://127.0.0.1:3001";

const oauthCallbackRewrites = [
  "slack",
  "zoom",
  "jira",
  "outlook",
  "google-calendar",
].map((provider) => ({
  source: `/api/integrations/${provider}/callback`,
  destination: `${apiOrigin}/api/integrations/${provider}/callback`,
}));

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  async headers() {
    return [
      {
        source: "/integrations/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/integrations",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return oauthCallbackRewrites;
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

import type { NextConfig } from "next";

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
  output: "standalone",
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
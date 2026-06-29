import type { NextConfig } from "next";

const apiOrigin =
  process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
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
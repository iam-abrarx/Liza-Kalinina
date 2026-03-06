import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: (process.env.NODE_ENV === 'production' || process.env.GITHUB_ACTIONS === 'true') ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

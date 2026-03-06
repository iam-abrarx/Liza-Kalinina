import type { NextConfig } from "next";

console.log('Build Mode:', process.env.EXPORT === 'true' ? 'export' : 'default');

const nextConfig: NextConfig = {
  output: process.env.EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

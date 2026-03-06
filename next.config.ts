import type { NextConfig } from "next";

const isExport = process.env.EXPORT === 'true';
console.log('Build Mode:', isExport ? 'export' : 'default');

const nextConfig: NextConfig = {
  output: isExport ? 'export' : undefined,
  basePath: isExport ? '/Liza-Kalinina' : undefined,
  assetPrefix: isExport ? '/Liza-Kalinina/' : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

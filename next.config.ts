const nextConfig: any = {
  output: process.env.EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  // No-op for eslint as it's handled by Turbopack/Next.js CLI now
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin",
  },
};

export default nextConfig;

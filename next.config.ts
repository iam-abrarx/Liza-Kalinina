const nextConfig: any = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // No-op for eslint as it's handled by Turbopack/Next.js CLI now
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin",
  },
};

export default nextConfig;

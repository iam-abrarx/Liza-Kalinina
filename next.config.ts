const nextConfig: any = {
  images: {
    unoptimized: true,
  },
  // No-op for eslint as it's handled by Turbopack/Next.js CLI now
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    DATABASE_URL: "postgresql://neondb_owner:npg_A3ziIBODrZQ7@ep-winter-sea-adiipfo7-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
    BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_tcQdtZgwrA1uLnvR_KxtF0PrqtQE2045EOxjLj3u81oRKoY",
    ADMIN_PASSWORD: "admin",
  },
};

export default nextConfig;

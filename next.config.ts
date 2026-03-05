import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Required for GitHub Pages static hosting
  images: {
    unoptimized: true, // GitHub Pages doesn't support Next.js Image Optimization
  },
  /* Note: 'export' mode disables some dynamic server-side features like API routes and the Admin Dashboard DB interactions. 
     For a full-stack experience (CMS + DB), hosting on Vercel is recommended. */
};

export default nextConfig;

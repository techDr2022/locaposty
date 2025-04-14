import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /* experimental config options here */
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: "tailwind.config.mjs",
    };
    return config;
  },
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optionally, also ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Set environment to edge runtime to avoid node-specific dependencies
  output: "standalone",
};

export default nextConfig;

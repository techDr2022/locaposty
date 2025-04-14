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
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration
  turbopack: {
    // Turbopack runs in Node.js, so it has access to 'fs' module natively
    // No special configuration needed for pdf-parse
  },

  // Webpack configuration (fallback for when not using Turbopack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;

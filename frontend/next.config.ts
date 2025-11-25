import type { NextConfig } from "next";

/**
 * Next.js 15 Configuration
 * - Using Webpack (not Turbopack) for better Tailwind CSS v3 compatibility
 * - React 18 for stability
 */
const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable to prevent double socket connections
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

/**
 * Next.js 16 Configuration
 * - Using Turbopack for faster builds
 * - React 19 + Tailwind CSS v4
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

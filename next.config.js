/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow build to proceed with ESLint warnings for deployment
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Use only for deployment.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors. Use only for deployment.
    ignoreBuildErrors: false, // Keep this false, only ignore ESLint
  },
  // Output configuration for Vercel
  // Removed 'standalone' to avoid potential Vercel issues
  // output: 'standalone',
  // Disable static optimization for dynamic routes
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;


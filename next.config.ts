import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'export',
  basePath: '/ai-playgrounds',
  assetPrefix: '/ai-playgrounds',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

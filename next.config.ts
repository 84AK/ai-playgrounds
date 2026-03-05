import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "export",
  basePath: isProd ? "/ai-playgrounds" : undefined,
  assetPrefix: isProd ? "/ai-playgrounds" : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

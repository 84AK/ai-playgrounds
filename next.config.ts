import type { NextConfig } from "next";

const enableStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  reactCompiler: false,
  // Static export and server features (cookies, route handlers) cannot coexist.
  output: enableStaticExport ? "export" : undefined,
  basePath: enableStaticExport ? "/ai-playgrounds" : undefined,
  assetPrefix: enableStaticExport ? "/ai-playgrounds" : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

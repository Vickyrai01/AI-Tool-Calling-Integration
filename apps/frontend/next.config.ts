import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
  transpilePackages: ["@pkg/shared"],
};

export default nextConfig;

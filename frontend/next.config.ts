import type { NextConfig } from "next";
import path from "path";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../"),
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

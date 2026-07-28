import type { NextConfig } from "next";
import path from "path";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../"),
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
  async rewrites() {
    // Only rewrite to external backend if NEXT_PUBLIC_BACKEND_URL is explicitly set.
    // On Vercel, if NEXT_PUBLIC_BACKEND_URL is unset, Next.js internal API routes (/api/*) will be used directly.
    if (!backendUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // Only use standalone output when not building on Vercel
  ...(isVercel ? {} : { output: "standalone" }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bc.imgix.net",
      },
    ],
  },
};

export default nextConfig;

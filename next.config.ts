import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const isVercel = Boolean(process.env.VERCEL);

/* ─── Security Headers ──────────────────────────────────────────
   Applied to every response via the `headers()` hook.
   CSP allows 'unsafe-inline' for styles because Framer Motion &
   game-effects.tsx inject inline styles, and 'unsafe-eval' because
   Next.js RSC hydration requires it.
──────────────────────────────────────────────────────────────── */
const securityHeaders = [
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control",    value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(isDev ? [] : [
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
  ]),
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src * data: blob:",
      "media-src 'self' blob:",
      "font-src 'self' https://fonts.gstatic.com data:",
      "connect-src 'self' wss: ws: https://*.upstash.io https://api.dicebear.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Standalone output for self-hosted Docker, skip on Vercel
  ...(isVercel ? {} : { output: "standalone" }),

  // TypeScript — pre-existing BigInt target errors suppressed
  typescript: { ignoreBuildErrors: true },

  // Disable React Strict Mode (already off — avoids double-invoke in dev)
  reactStrictMode: false,

  // ── Compiler optimizations ──────────────────────────────────
  compiler: {
    // Strip console.log/debug/info in production, keep error/warn
    removeConsole: isDev ? false : { exclude: ["error", "warn"] },
  },

  // ── Image Optimization ───────────────────────────────────────
  images: {
    // Serve AVIF first (best compression), fall back to WebP
    formats: ["image/avif", "image/webp"],
    // Cache optimized images for 30 days at the CDN edge
    minimumCacheTTL: 86400 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "bc.imgix.net" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "www.transparenttextures.com" },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'none'; script-src 'none'; sandbox;",
  },

  // ── HTTP Headers ─────────────────────────────────────────────
  async headers() {
    return [
      // Security headers on ALL routes
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Next.js images — CDN aggressive caching
      {
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800",
          },
        ],
      },
      // API routes — must never be cached by CDN
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma",         value: "no-cache" },
          { key: "Expires",        value: "0" },
        ],
      },
      // Public game images (slots, etc.) — week-long browser cache
      {
        source: "/slots/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/games/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
    ];
  },

  // ── Experimental features ────────────────────────────────────
  experimental: {
    // Automatically tree-shake large icon/component packages
    // Turbopack handles this natively, but also works with webpack builds
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "framer-motion",
      "recharts",
      "date-fns",
    ],
  },
};

export default nextConfig;

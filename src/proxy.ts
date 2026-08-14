import { NextRequest, NextResponse } from "next/server";

/* ─── In-memory rate limiter (works per-instance; use Redis for multi-instance) ─
   For Vercel's serverless: each function instance has its own memory, so this
   provides per-instance throttling. Good enough to slow brute-force attacks.
   For production at scale, replace with @upstash/ratelimit + Redis.
──────────────────────────────────────────────────────────────────────────────── */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = limitMap.get(key);

  if (!entry || now > entry.resetAt) {
    limitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  entry.count++;
  if (entry.count > maxRequests) return false; // blocked
  return true;
}

// Clean up expired entries periodically (every 1000 requests) to prevent memory leak
let cleanupCounter = 0;
function maybeCleanup() {
  if (++cleanupCounter % 1000 !== 0) return;
  const now = Date.now();
  for (const [key, entry] of limitMap) {
    if (now > entry.resetAt) limitMap.delete(key);
  }
}

/* ─── Route-specific rate limits ─────────────────────────────── */
const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  // Auth — aggressive limiting to prevent brute force
  "/api/auth/login":    { max: 10,  windowMs: 60_000 },   // 10 per minute
  "/api/auth/register": { max: 5,   windowMs: 60_000 },   // 5 per minute
  // Game API — loose limit to prevent abuse while allowing rapid play
  "/api/games":         { max: 120, windowMs: 60_000 },   // 120/min per IP
  // Wallet & tip — prevent spam
  "/api/wallet":        { max: 60,  windowMs: 60_000 },
  "/api/tip":           { max: 10,  windowMs: 60_000 },
  "/api/rain/claim":    { max: 3,   windowMs: 60_000 },
  // Sportsbook — prevent automated scraping
  "/api/sportsbook":    { max: 60,  windowMs: 60_000 },
};

function getRateLimit(pathname: string) {
  // Exact match first
  if (RATE_LIMITS[pathname]) return RATE_LIMITS[pathname];
  // Prefix match
  for (const [prefix, limit] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(prefix)) return limit;
  }
  return null;
}

/* ─── Main Proxy (Next.js 16 renamed from middleware) ─────────── */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Rate Limiting (API routes only) ────────────────────────
  if (pathname.startsWith("/api/")) {
    const limit = getRateLimit(pathname);
    if (limit) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        ?? req.headers.get("x-real-ip")
        ?? "unknown";
      const key = `${ip}:${pathname}`;

      maybeCleanup();

      if (!checkRateLimit(key, limit.max, limit.windowMs)) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down." },
          {
            status: 429,
            headers: {
              "Retry-After": "60",
              "X-RateLimit-Limit": String(limit.max),
              "X-RateLimit-Window": String(limit.windowMs / 1000),
            },
          }
        );
      }
    }
  }

  // ── Method validation for sensitive mutation endpoints ─────
  const POST_ONLY = [
    "/api/auth/login", "/api/auth/register", "/api/auth/logout",
    "/api/tip", "/api/rain/claim",
  ];
  if (POST_ONLY.includes(pathname) && req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all API routes except internal Next.js ones
    "/api/((?!_next).*)",
  ],
};

import { PrismaClient } from "@prisma/client";

/* ─── Prisma Singleton Pattern ──────────────────────────────────
   Prevents multiple PrismaClient instances in development (Next.js
   hot-reload creates a new module each time).
   In production (Vercel serverless) each function instance gets one
   client; globalForPrisma caching is still safe because there's no
   hot-reload there.
──────────────────────────────────────────────────────────────── */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // In production: only log errors to avoid verbose noise in Vercel logs.
    // In development: log queries and warnings too for debugging.
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["error", "warn"],
    errorFormat: "pretty",
  });

// Cache the singleton in development (and serverless warm containers)
// to prevent "Too many clients" connection pool exhaustion.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
} else {
  // In production, also cache to reuse across invocations in a warm container.
  globalForPrisma.prisma = db;
}
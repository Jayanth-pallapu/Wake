// Shared API helpers for Next.js route handlers.

import { NextResponse } from "next/server";
import { getCurrentUser, requireUser } from "./auth";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Wrap an authenticated route handler; throws ApiError if not logged in. */
export function withUser<T>(
  handler: (userId: string) => Promise<T>
): Promise<T> {
  return (async () => {
    const user = await getCurrentUser();
    if (!user) throw new ApiError("UNAUTHORIZED", 401);
    return handler(user.id);
  })();
}

export async function getUserId(): Promise<string | null> {
  const u = await getCurrentUser();
  return u?.id ?? null;
}

export { getCurrentUser, requireUser };

/** Serialize BigInt for JSON (Prisma returns BigInt). */
export function serialize(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

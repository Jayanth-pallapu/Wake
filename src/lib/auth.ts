// Auth: session-cookie based, password hashing via Node crypto scrypt.
// Cookie = base64url(JSON {uid, exp}).signature — HMAC-SHA256 signed with AUTH_SECRET.

import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import type { User } from "@prisma/client";

const AUTH_SECRET =
  process.env.AUTH_SECRET || "dev-secret-change-me-in-production-0xDEADBEEF";
const COOKIE_NAME = "zc_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const testHash = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(testHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(payload: string): string {
  const sig = createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  try {
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return payload;
  } catch {
    return null;
  }
}

interface SessionPayload {
  uid: string;
  exp: number;
}

export async function createSession(userId: string): Promise<void> {
  const payload: SessionPayload = { uid: userId, exp: Date.now() + SESSION_TTL_MS };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = sign(payloadStr);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payloadStr = verify(token);
    if (!payloadStr) return null;
    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8")) as SessionPayload;
    if (Date.now() > payload.exp) return null;
    const user = await db.user.findUnique({
      where: { id: payload.uid },
      include: { vipTier: true },
    });
    if (!user) return null;
    // touch lastSeen occasionally (fire and forget)
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

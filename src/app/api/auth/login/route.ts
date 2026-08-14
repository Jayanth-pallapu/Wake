import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSession } from "@/lib/auth";
import { initDemoWallets } from "@/lib/wallet";
import { generateServerSeed, generateClientSeed, hashServerSeed } from "@/lib/provably-fair";
import { recomputeVip } from "@/lib/vip";
import { json, err } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const identifier = String(body.identifier || body.email || body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!identifier || !password) return err("Missing credentials");
    // Length caps: prevent DoS via scrypt on arbitrarily large strings
    if (identifier.length > 254 || password.length > 1024) return err("Invalid credentials", 401);


    const user = await db.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });
    if (!user) return err("Invalid credentials", 401);
    if (!verifyPassword(password, user.passwordHash)) return err("Invalid credentials", 401);

    // Ensure seeds exist (legacy accounts)
    if (!user.serverSeed) {
      const serverSeed = generateServerSeed();
      await db.user.update({
        where: { id: user.id },
        data: {
          serverSeed,
          serverSeedHash: hashServerSeed(serverSeed),
          clientSeed: user.clientSeed || generateClientSeed(),
        },
      });
    }
    await initDemoWallets(user.id);
    await recomputeVip(user.id);
    await createSession(user.id);
    return json({
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
      ok: true,
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Login failed", 500);
  }
}

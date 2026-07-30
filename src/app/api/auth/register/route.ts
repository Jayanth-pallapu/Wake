import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { initDemoWallets } from "@/lib/wallet";
import { generateServerSeed, generateClientSeed, hashServerSeed } from "@/lib/provably-fair";
import { recomputeVip } from "@/lib/vip";
import { json, err } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!username || username.length < 3) return err("Username must be at least 3 characters");
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return err("Username can only contain letters, numbers, underscores");
    if (!email || !/.+@.+\..+/.test(email)) return err("Invalid email");
    if (password.length < 6) return err("Password must be at least 6 characters");

    const exists = await db.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (exists) {
      if (exists.username === username) return err("Username already taken", 409);
      return err("Email already registered", 409);
    }

    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = generateClientSeed();

    const user = await db.user.create({
      data: {
        username,
        email,
        passwordHash: hashPassword(password),
        serverSeed,
        serverSeedHash,
        clientSeed,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      },
    });
    await initDemoWallets(user.id);
    await recomputeVip(user.id);
    await createSession(user.id);
    return json({
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
      ok: true,
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Registration failed", 500);
  }
}

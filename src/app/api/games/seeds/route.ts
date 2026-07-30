import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { db } from "@/lib/db";
import { rotateServerSeed, updateClientSeed, ensureSeeds } from "@/lib/seed";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  await ensureSeeds(user.id);
  const u = await db.user.findUnique({ where: { id: user.id } });
  if (!u) return err("USER_NOT_FOUND", 404);
  return json({
    active: {
      serverSeedHash: u.serverSeedHash,
      clientSeed: u.clientSeed,
      nonce: u.nonce,
    },
    previous: u.prevServerSeed
      ? {
          serverSeed: u.prevServerSeed,
          serverSeedHash: u.prevServerSeedHash,
          clientSeed: u.prevClientSeed,
          nonce: u.prevNonce,
        }
      : null,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const action = body.action || "rotate";
  if (action === "rotate") {
    const result = await rotateServerSeed(user.id);
    return json({ ok: true, ...result });
  }
  if (action === "clientSeed") {
    const seed = String(body.clientSeed || "").trim();
    if (!seed) return err("Invalid client seed");
    await updateClientSeed(user.id, seed);
    return json({ ok: true, clientSeed: seed });
  }
  return err("Unknown action");
}

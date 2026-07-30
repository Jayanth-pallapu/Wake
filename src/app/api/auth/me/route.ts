import { destroySession, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { json } from "@/lib/api";

export async function POST() {
  await destroySession();
  return json({ ok: true });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ user: null });
  // attach VIP tier
  const u = await db.user.findUnique({
    where: { id: user.id },
    include: { vipTier: true },
  });
  return json({
    user: u
      ? {
          id: u.id,
          username: u.username,
          email: u.email,
          avatar: u.avatar,
          role: u.role,
          isAdmin: u.isAdmin,
          clientSeed: u.clientSeed,
          serverSeedHash: u.serverSeedHash,
          nonce: u.nonce,
          gamesPlayed: u.gamesPlayed,
          vipTier: u.vipTier
            ? { name: u.vipTier.name, level: u.vipTier.level, rakebackPct: u.vipTier.rakebackPct }
            : null,
        }
      : null,
  });
}

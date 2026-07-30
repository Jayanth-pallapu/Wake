import { db } from "@/lib/db";
import { json } from "@/lib/api";

export async function GET() {
  const top = await db.user.findMany({
    orderBy: { lifetimeWagerRaw: "desc" },
    take: 100,
    select: {
      id: true,
      username: true,
      avatar: true,
      lifetimeWagerRaw: true,
      gamesPlayed: true,
      vipTierId: true,
    },
  });
  const tiers = await db.vipTier.findMany();
  const tierMap = new Map(tiers.map((t) => [t.id, t]));
  return json({
    leaderboard: top.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      avatar: u.avatar,
      lifetimeWagerRaw: u.lifetimeWagerRaw.toString(),
      lifetimeWagerUsd: Number(u.lifetimeWagerRaw) / 1e8,
      gamesPlayed: u.gamesPlayed,
      tier: u.vipTierId ? tierMap.get(u.vipTierId)?.name || "Bronze" : "Bronze",
    })),
  });
}

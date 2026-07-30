import { db } from "@/lib/db";
import { json } from "@/lib/api";

/** Combined leaderboard: top wagerers + recent big wins. */
export async function GET() {
  const [topWagerers, recentWins] = await Promise.all([
    db.user.findMany({
      orderBy: { lifetimeWagerRaw: "desc" },
      take: 20,
      select: { id: true, username: true, avatar: true, lifetimeWagerRaw: true, gamesPlayed: true },
    }),
    db.gameBet.findMany({
      where: { win: true, multiplier: { gte: 2 } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { username: true, avatar: true } } },
    }),
  ]);
  return json({
    wagerers: topWagerers.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      avatar: u.avatar,
      lifetimeWagerUsd: Number(u.lifetimeWagerRaw) / 1e8,
      gamesPlayed: u.gamesPlayed,
    })),
    recentWins: recentWins.map((b) => ({
      id: b.id,
      username: b.user.username,
      avatar: b.user.avatar,
      game: b.game,
      asset: b.asset,
      bet: Number(b.betAmountRaw) / 1e8,
      multiplier: b.multiplier,
      payout: Number(b.payoutRaw) / 1e8,
      createdAt: b.createdAt.toISOString(),
    })),
  });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game");
  const limit = Math.min(Number(searchParams.get("limit") || 25), 100);
  const bets = await db.gameBet.findMany({
    where: { userId: user.id, ...(game ? { game } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return json({
    bets: bets.map((b) => ({
      id: b.id,
      game: b.game,
      asset: b.asset,
      betRaw: b.betAmountRaw.toString(),
      bet: Number(b.betAmountRaw) / 1e8,
      payoutRaw: b.payoutRaw.toString(),
      payout: Number(b.payoutRaw) / 1e8,
      multiplier: b.multiplier,
      win: b.win,
      outcome: JSON.parse(b.outcome),
      nonce: b.nonce,
      clientSeed: b.clientSeed,
      createdAt: b.createdAt.toISOString(),
    })),
  });
}

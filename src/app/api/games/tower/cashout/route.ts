import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { getGame, deleteGame } from "@/lib/active-games";
import { towerMultiplier, type TowerDifficulty } from "@/lib/provably-fair";
import { applyLedger } from "@/lib/wallet";
import { pushChatNotify } from "@/lib/chat-push";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const gameId = String(body.gameId || "");
  const game = getGame(gameId);
  if (!game) return err("Game not found or expired", 404);
  if (game.userId !== user.id) return err("Not your game", 403);
  if (game.status !== "active") return err("Game already ended", 400);
  if (game.picks.length < 1) return err("Climb at least one row before cashing out");

  const difficulty = game.difficulty as TowerDifficulty;
  const multiplier = towerMultiplier(difficulty, game.picks.length);
  const payoutRaw = (game.betRaw * BigInt(Math.round(multiplier * 100))) / 100n;
  const grid = game.grid as number[][];

  // Credit payout
  const { balanceAfterRaw } = await applyLedger({
    userId: user.id, asset: game.asset, amountRaw: payoutRaw, type: "WIN",
    note: `Tower cashout (${multiplier}×, ${game.picks.length} rows)`,
  });

  await db.gameBet.create({
    data: {
      userId: user.id, game: "tower", asset: game.asset, betAmountRaw: game.betRaw,
      payoutRaw, multiplier,
      outcome: JSON.stringify({ difficulty, picks: game.picks, failAt: -1, grid, climbed: game.picks.length }),
      win: true, serverSeed: game.serverSeed, clientSeed: game.clientSeed, nonce: game.nonce,
    },
  });
  deleteGame(gameId);

  // mega win notify
  if (multiplier >= 10) {
    pushChatNotify("mega", {
      username: user.username, game: "Tower", bet: Number(game.betRaw) / 1e8,
      multiplier, payout: Number(payoutRaw) / 1e8, asset: game.asset,
    }).catch(() => {});
  }

  return json({
    ok: true,
    cashedOut: true,
    multiplier,
    payoutRaw: payoutRaw.toString(),
    payout: Number(payoutRaw) / 1e8,
    grid,
    picks: game.picks,
    balanceAfterRaw: balanceAfterRaw.toString(),
    balanceAfter: Number(balanceAfterRaw) / 1e8,
  });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { getGame, deleteGame } from "@/lib/active-games";
import { minesMultiplier } from "@/lib/provably-fair";
import { applyLedger } from "@/lib/wallet";
import { pushChatNotify } from "@/lib/chat-push";
import { ASSET_MAP } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const gameId = String(body.gameId || "");
  const game = await getGame(gameId);
  if (!game) return err("Game not found or expired", 404);
  if (game.userId !== user.id) return err("Not your game", 403);
  if (game.status !== "active") return err("Game already ended", 400);
  if (game.picks.length < 1) return err("Reveal at least one tile before cashing out");

  const multiplier = minesMultiplier(game.mineCount, game.picks.length);
  const payoutRaw = (game.betRaw * BigInt(Math.round(multiplier * 100))) / 100n;
  const grid = game.grid as boolean[];

  // Credit payout
  const { balanceAfterRaw } = await applyLedger({
    userId: user.id, asset: game.asset, amountRaw: payoutRaw, type: "WIN",
    note: `Mines cashout (${multiplier}×, ${game.picks.length} safe)`,
  });

  await db.gameBet.create({
    data: {
      userId: user.id, game: "mines", asset: game.asset, betAmountRaw: game.betRaw,
      payoutRaw, multiplier,
      outcome: JSON.stringify({ mineCount: game.mineCount, picks: game.picks, hitMineAt: -1, grid, safePicks: game.picks.length }),
      win: true, serverSeed: game.serverSeed, clientSeed: game.clientSeed, nonce: game.nonce,
    },
  });
  await deleteGame(gameId, user.id, "mines");

  // mega win notify
  if (multiplier >= 10) {
    pushChatNotify("mega", {
      username: user.username, game: "Mines", bet: Number(game.betRaw) / 1e8,
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

export const _unused = { ASSET_MAP };

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { getGame, updateGame, deleteGame } from "@/lib/active-games";
import { minesMultiplier } from "@/lib/provably-fair";
import { pushChatNotify } from "@/lib/chat-push";
import { ASSET_MAP } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const gameId = String(body.gameId || "");
  const tile = Number(body.tile);
  const game = await getGame(gameId);
  if (!game) return err("Game not found or expired", 404);
  if (game.userId !== user.id) return err("Not your game", 403);
  if (game.status !== "active") return err("Game already ended", 400);
  if (game.game !== "mines") return err("Not a mines game", 400);
  if (!Number.isInteger(tile) || tile < 0 || tile > 24) return err("Invalid tile");
  if (game.picks.includes(tile)) return err("Tile already revealed", 400);

  const grid = game.grid as boolean[];
  const isMine = grid[tile];

  if (isMine) {
    // Bust: settle as loss (already debited). Record the bet for history.
    game.picks.push(tile);
    await updateGame(gameId, { status: "busted", picks: game.picks });
    await db.gameBet.create({
      data: {
        userId: user.id, game: "mines", asset: game.asset, betAmountRaw: game.betRaw,
        payoutRaw: 0n, multiplier: 0,
        outcome: JSON.stringify({ mineCount: game.mineCount, picks: game.picks, hitMineAt: game.picks.length - 1, grid, safePicks: game.picks.length - 1 }),
        win: false, serverSeed: game.serverSeed, clientSeed: game.clientSeed, nonce: game.nonce,
      },
    });
    await deleteGame(gameId, user.id, "mines");
    return json({
      ok: true,
      busted: true,
      tile,
      grid,
      picks: game.picks,
      multiplier: 0,
      payout: 0,
    });
  }

  // Safe: add to picks, return new multiplier
  game.picks.push(tile);
  const picks = game.picks.length;
  const currentMultiplier = minesMultiplier(game.mineCount, picks);
  const nextMultiplier = picks < 25 - game.mineCount ? minesMultiplier(game.mineCount, picks + 1) : currentMultiplier;
  await updateGame(gameId, { picks: game.picks });
  return json({
    ok: true,
    busted: false,
    tile,
    safe: true,
    picks: game.picks,
    picksCount: picks,
    multiplier: currentMultiplier,
    nextMultiplier,
  });
}

// silence unused import warnings in some bundlers
export const _unused = { pushChatNotify, ASSET_MAP };

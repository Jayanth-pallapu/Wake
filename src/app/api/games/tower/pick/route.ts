import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { getGame, updateGame, deleteGame } from "@/lib/active-games";
import { towerMultiplier, type TowerDifficulty } from "@/lib/provably-fair";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const gameId = String(body.gameId || "");
  const col = Number(body.col);
  const game = await getGame(gameId);
  if (!game) return err("Game not found or expired", 404);
  if (game.userId !== user.id) return err("Not your game", 403);
  if (game.status !== "active") return err("Game already ended", 400);
  if (game.game !== "tower") return err("Not a tower game", 400);
  if (!Number.isInteger(col) || col < 0 || col > 8) return err("Invalid column (0-8)");

  const difficulty = game.difficulty as TowerDifficulty;
  const grid = game.grid as number[][];
  const row = game.picks.length; // current row to climb (0-indexed)
  if (row >= grid.length) return err("Tower already fully climbed", 400);

  const safeCols = grid[row];
  const isSafe = safeCols.includes(col);

  if (!isSafe) {
    // Bust: record the bet as a loss.
    game.picks.push(col);
    await updateGame(gameId, { status: "busted", picks: game.picks });
    await db.gameBet.create({
      data: {
        userId: user.id, game: "tower", asset: game.asset, betAmountRaw: game.betRaw,
        payoutRaw: 0n, multiplier: 0,
        outcome: JSON.stringify({ difficulty, picks: game.picks, failAt: row, grid, climbed: row }),
        win: false, serverSeed: game.serverSeed, clientSeed: game.clientSeed, nonce: game.nonce,
      },
    });
    await deleteGame(gameId, user.id, "tower");
    return json({
      ok: true,
      busted: true,
      row,
      col,
      grid,
      picks: game.picks,
      multiplier: 0,
      payout: 0,
    });
  }

  // Safe: add to picks, return new multiplier
  game.picks.push(col);
  const climbed = game.picks.length;
  const currentMultiplier = towerMultiplier(difficulty, climbed);
  const rows = grid.length;
  const nextMultiplier = climbed < rows ? towerMultiplier(difficulty, climbed + 1) : currentMultiplier;
  await updateGame(gameId, { picks: game.picks });
  return json({
    ok: true,
    busted: false,
    row,
    col,
    safe: true,
    picks: game.picks,
    climbed,
    multiplier: currentMultiplier,
    nextMultiplier,
    reachedTop: climbed >= rows,
  });
}

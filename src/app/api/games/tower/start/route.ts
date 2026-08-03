import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { recordWager, recomputeVip, wagerRawToUsd } from "@/lib/vip";
import { usdToRaw } from "@/lib/constants";
import { towerGrid, towerMultiplier, TOWER_CONFIG, type TowerDifficulty } from "@/lib/provably-fair";
import { createGame, userActiveGame } from "@/lib/active-games";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const difficulty = String(body.difficulty || "easy") as TowerDifficulty;
  const asset = String(body.asset || "USDT").toUpperCase();
  let betRaw: bigint;
  try { betRaw = BigInt(body.betRaw || "0"); } catch { return err("Invalid bet"); }
  if (!["easy", "medium", "hard"].includes(difficulty)) return err("Invalid difficulty");
  if (betRaw <= 0n) return err("Bet must be > 0");

  // Forbid multiple active tower games per user
  const existing = await userActiveGame(user.id, "tower");
  if (existing) return err("You already have an active Tower game — finish it first", 409);

  // Capture current seed triple inside a transaction; bump nonce; debit bet.
  let result;
  try {
    result = await db.$transaction(async (tx) => {
      const fresh = await tx.user.findUnique({ where: { id: user.id } });
      if (!fresh) throw new Error("USER_NOT_FOUND");
      const serverSeed = fresh.serverSeed;
      const clientSeed = fresh.clientSeed;
      const nonce = fresh.nonce;
      if (!serverSeed) throw new Error("SEEDS_NOT_INITIALIZED");

      // debit bet
      let wallet = await tx.wallet.findUnique({ where: { userId_asset: { userId: user.id, asset } } });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId: user.id, asset, balance: 0n } });
      if (wallet.balance < betRaw) throw new Error("INSUFFICIENT_BALANCE");
      const afterDebit = wallet.balance - betRaw;
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: afterDebit } });
      await tx.walletLedger.create({
        data: {
          userId: user.id, asset, amountRaw: -betRaw, balanceAfterRaw: afterDebit,
          transactionType: "BET", note: `Tower bet (${difficulty})`,
        },
      });
      // bump nonce + wager stats
      await tx.user.update({
        where: { id: user.id },
        data: {
          nonce: { increment: 1 },
          lifetimeWagerRaw: { increment: usdToRaw(wagerRawToUsd(betRaw, asset)) },
          gamesPlayed: { increment: 1 },
          lastSeenAt: new Date(),
        },
      });
      return { serverSeed, clientSeed, nonce, balanceAfterRaw: afterDebit };
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Start failed";
    return err(msg === "INSUFFICIENT_BALANCE" ? "Insufficient balance" : msg);
  }

  // generate grid (deterministic from captured triple)
  const grid = towerGrid(result.serverSeed, result.clientSeed, result.nonce, difficulty);
  const gameId = randomUUID();
  await createGame({
    gameId, userId: user.id, game: "tower", mineCount: 0, difficulty, betRaw, asset,
    serverSeed: result.serverSeed, clientSeed: result.clientSeed, nonce: result.nonce,
    picks: [], status: "active", startedAt: Date.now(), grid,
  });

  // post-tx side effects
  recomputeVip(user.id).catch(() => {});

  return json({
    ok: true,
    gameId,
    difficulty,
    betRaw: betRaw.toString(),
    asset,
    balanceAfterRaw: result.balanceAfterRaw.toString(),
    balanceAfter: Number(result.balanceAfterRaw) / 1e8,
    picks: [],
    climbed: 0,
    rows: TOWER_CONFIG[difficulty].rows,
    safePerRow: TOWER_CONFIG[difficulty].safePerRow,
    currentMultiplier: 1,
    nextMultiplier: towerMultiplier(difficulty, 1),
  });
}

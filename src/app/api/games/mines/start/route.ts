import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { settleBet } from "@/lib/wallet";
import { recordWager, recomputeVip, wagerRawToUsd } from "@/lib/vip";
import { usdToRaw } from "@/lib/constants";
import { minesGrid, minesMultiplier } from "@/lib/provably-fair";
import { createGame, userActiveGame } from "@/lib/active-games";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const mineCount = Number(body.mineCount);
  const asset = String(body.asset || "USDT").toUpperCase();
  let betRaw: bigint;
  try { betRaw = BigInt(body.betRaw || "0"); } catch { return err("Invalid bet"); }
  if (!mineCount || mineCount < 1 || mineCount > 24) return err("Invalid mine count (1-24)");
  if (betRaw <= 0n) return err("Bet must be > 0");

  // Forbid multiple active mines games per user (cleaner UX)
  const existing = await userActiveGame(user.id, "mines");
  if (existing) return err("You already have an active Mines game — finish it first", 409);

  // Capture current seed triple inside a transaction; bump nonce; debit bet.
  const result = await db.$transaction(async (tx) => {
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
        transactionType: "BET", note: `Mines bet (${mineCount} mines)`,
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
  }).catch((e) => {
    throw e;
  });

  if (result instanceof Error) {
    return err(result.message === "INSUFFICIENT_BALANCE" ? "Insufficient balance" : result.message);
  }

  // generate grid (deterministic from captured triple)
  const grid = minesGrid(result.serverSeed, result.clientSeed, result.nonce, mineCount);
  const gameId = randomUUID();
  await createGame({
    gameId, userId: user.id, game: "mines", mineCount, difficulty: "", betRaw, asset,
    serverSeed: result.serverSeed, clientSeed: result.clientSeed, nonce: result.nonce,
    picks: [], status: "active", startedAt: Date.now(), grid,
  });

  // post-tx side effects
  recomputeVip(user.id).catch(() => {});

  return json({
    ok: true,
    gameId,
    mineCount,
    betRaw: betRaw.toString(),
    asset,
    balanceAfterRaw: result.balanceAfterRaw.toString(),
    balanceAfter: Number(result.balanceAfterRaw) / 1e8,
    picks: [],
    currentMultiplier: 1,
    nextMultiplier: minesMultiplier(mineCount, 1),
  });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { recordWager, recomputeVip, wagerRawToUsd } from "@/lib/vip";
import { usdToRaw } from "@/lib/constants";
import { hiloCard } from "@/lib/provably-fair";
import { createGame, userActiveGame } from "@/lib/active-games";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const asset = String(body.asset || "USDT").toUpperCase();
  let betRaw: bigint;
  try { betRaw = BigInt(body.betRaw || "0"); } catch { return err("Invalid bet"); }
  if (betRaw <= 0n) return err("Bet must be > 0");

  const existing = await userActiveGame(user.id, "hilo");
  if (existing) return err("You already have an active HiLo game — finish it first", 409);

  try {
    const result = await db.$transaction(async (tx) => {
      const fresh = await tx.user.findUnique({ where: { id: user.id } });
      if (!fresh) throw new Error("USER_NOT_FOUND");
      const serverSeed = fresh.serverSeed;
      const clientSeed = fresh.clientSeed;
      const nonce = fresh.nonce;
      if (!serverSeed) throw new Error("SEEDS_NOT_INITIALIZED");

      let wallet = await tx.wallet.findUnique({ where: { userId_asset: { userId: user.id, asset } } });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId: user.id, asset, balance: 0n } });
      if (wallet.balance < betRaw) throw new Error("INSUFFICIENT_BALANCE");
      const afterDebit = wallet.balance - betRaw;
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: afterDebit } });
      await tx.walletLedger.create({
        data: {
          userId: user.id, asset, amountRaw: -betRaw, balanceAfterRaw: afterDebit,
          transactionType: "BET", note: `HiLo bet`,
        },
      });
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

    const card = hiloCard(result.serverSeed, result.clientSeed, result.nonce);
    const gameId = randomUUID();
    await createGame({
      gameId, userId: user.id, game: "hilo", mineCount: 0, difficulty: "", betRaw, asset,
      serverSeed: result.serverSeed, clientSeed: result.clientSeed, nonce: result.nonce,
      picks: [], status: "active", startedAt: Date.now(), grid: [],
      hiloCurrentCard: card, hiloChainMultiplier: 1.0, hiloDrawPos: 1,
    });

    recomputeVip(user.id).catch(() => {});

    return json({
      ok: true,
      gameId,
      card,
      chainMultiplier: 1.0,
      balanceAfterRaw: result.balanceAfterRaw.toString(),
      balanceAfter: Number(result.balanceAfterRaw) / 1e8,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Start failed";
    return err(msg === "INSUFFICIENT_BALANCE" ? "Insufficient balance" : msg);
  }
}

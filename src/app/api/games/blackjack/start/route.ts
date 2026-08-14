import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { recordWager, recomputeVip, wagerRawToUsd } from "@/lib/vip";
import { usdToRaw } from "@/lib/constants";
import { blackjackDeal } from "@/lib/provably-fair";
import { createGame, userActiveGame, deleteGame } from "@/lib/active-games";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const asset = String(body.asset || "USDT").toUpperCase();
  let betRaw: bigint;
  try { betRaw = BigInt(body.betRaw || "0"); } catch { return err("Invalid bet"); }
  if (betRaw <= 0n) return err("Bet must be > 0");

  const existing = await userActiveGame(user.id, "blackjack");
  if (existing) return err("You already have an active Blackjack game", 409);

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
          transactionType: "BET", note: `Blackjack bet`,
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

    const deal = blackjackDeal(result.serverSeed, result.clientSeed, result.nonce);
    const natural = deal.playerTotal === 21;
    let balanceAfterRaw = result.balanceAfterRaw;

    // Build proper hand shapes: [{rank, suit}]
    const playerHand = deal.playerCards.map((c: any) => ({ rank: c.rank, suit: c.suit }));
    const dealerHand = deal.dealerCards.map((c: any) => ({ rank: c.rank, suit: c.suit }));
    const dealerVisibleTotal = deal.dealerVisible ?? (dealerHand.length > 0 ? 0 : 0);

    if (natural) {
      // Natural blackjack: 3:2 payout — total return is 2.5× bet
      const payoutRaw = (betRaw * 25n) / 10n;
      const txResult = await db.$transaction(async (tx) => {
        let wallet = await tx.wallet.findUnique({ where: { userId_asset: { userId: user.id, asset } } });
        if (!wallet) return { balanceAfterRaw };
        const b = wallet.balance + payoutRaw;
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: b } });
        await tx.walletLedger.create({
          data: {
            userId: user.id, asset, amountRaw: payoutRaw, balanceAfterRaw: b,
            transactionType: "WIN", note: `Blackjack natural`,
          },
        });
        await tx.gameBet.create({
          data: {
            userId: user.id, game: "blackjack", asset, betAmountRaw: betRaw,
            payoutRaw, multiplier: 2.5,
            outcome: JSON.stringify({ deal, natural: true }),
            win: true, serverSeed: result.serverSeed, clientSeed: result.clientSeed, nonce: result.nonce,
          },
        });
        return { balanceAfterRaw: b };
      });
      balanceAfterRaw = txResult.balanceAfterRaw;

      recomputeVip(user.id).catch(() => {});

      return json({
        ok: true,
        gameId: null,
        playerHand,
        dealerHand,
        playerTotal: deal.playerTotal,
        dealerTotal: dealerVisibleTotal,
        result: "BLACKJACK WIN",
        status: "ended",
        win: true,
        payout: (Number(payoutRaw) / 1e8).toFixed(6),
        balanceAfterRaw: balanceAfterRaw.toString(),
        balanceAfter: Number(balanceAfterRaw) / 1e8,
      });
    }

    const gameId = randomUUID();
    await createGame({
      gameId, userId: user.id, game: "blackjack", mineCount: 0, difficulty: "", betRaw, asset,
      serverSeed: result.serverSeed, clientSeed: result.clientSeed, nonce: result.nonce,
      picks: [], status: "active", startedAt: Date.now(), grid: [],
      bjPlayerCards: deal.playerCards, bjDealerCards: deal.dealerCards,
      bjDrawPos: 4, bjStatus: "playing",
    });

    recomputeVip(user.id).catch(() => {});

    return json({
      ok: true,
      gameId,
      playerHand,
      dealerHand,
      playerTotal: deal.playerTotal,
      dealerTotal: dealerVisibleTotal,
      result: null,
      status: "playing",
      win: false,
      payout: null,
      balanceAfterRaw: balanceAfterRaw.toString(),
      balanceAfter: Number(balanceAfterRaw) / 1e8,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Start failed";
    return err(msg === "INSUFFICIENT_BALANCE" ? "Insufficient balance" : msg);
  }
}

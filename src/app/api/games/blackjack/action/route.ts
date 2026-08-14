import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { getGame, deleteGame, updateGame } from "@/lib/active-games";
import { blackjackDraw, bjHandTotal } from "@/lib/provably-fair";
import { recomputeVip } from "@/lib/vip";
import { pushChatNotify } from "@/lib/chat-push";
import { ASSET_MAP } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const { gameId, action } = body;

  if (!gameId || typeof gameId !== "string") return err("Invalid gameId");
  if (!["hit", "stand", "double"].includes(action)) return err("Invalid action");

  const game = await getGame(gameId);
  if (!game || game.game !== "blackjack" || game.status !== "active" || game.userId !== user.id) {
    return err("Game not found or already finished");
  }

  const { serverSeed, clientSeed, nonce, asset, bjPlayerCards, bjDealerCards, bjDrawPos, bjStatus } = game;
  let betRaw = game.betRaw;
  if (!bjPlayerCards || !bjDealerCards || bjDrawPos === undefined || bjStatus !== "playing") {
    return err("Invalid game state");
  }

  // Helper to normalize a card array to {rank, suit} shape
  const toHand = (cards: any[]) => cards.map((c: any) => ({ rank: c.rank, suit: c.suit }));

  try {
    let playerCards = [...bjPlayerCards];
    let drawPos = bjDrawPos;
    let autoStand = false;
    let isBust = false;

    if (action === "hit" || action === "double") {
      if (action === "double") betRaw = betRaw * 2n;

      const drawn = blackjackDraw(serverSeed, clientSeed, nonce, 1, drawPos);
      playerCards.push(drawn[0]);
      drawPos++;

      const pTotal = bjHandTotal(playerCards);
      if (pTotal > 21) isBust = true;
      if (action === "double" && !isBust) autoStand = true;
    }

    if (isBust) {
      const pTotal = bjHandTotal(playerCards);
      const dTotal = bjHandTotal(bjDealerCards);
      const result = await db.$transaction(async (tx) => {
        let wallet = await tx.wallet.findUnique({ where: { userId_asset: { userId: user.id, asset } } });
        if (!wallet) wallet = await tx.wallet.create({ data: { userId: user.id, asset, balance: 0n } });
        await tx.gameBet.create({
          data: {
            userId: user.id, game: "blackjack", asset, betAmountRaw: game.betRaw,
            payoutRaw: 0n, multiplier: 0,
            outcome: JSON.stringify({ action, playerCards, pTotal, bust: true }),
            win: false, serverSeed, clientSeed, nonce,
          },
        });
        return { balanceAfterRaw: wallet.balance };
      });
      await deleteGame(gameId, user.id, "blackjack");
      recomputeVip(user.id).catch(() => {});
      return json({
        ok: true,
        status: "ended",
        result: "PLAYER BUST",
        win: false,
        payout: null,
        playerHand: toHand(playerCards),
        dealerHand: toHand(bjDealerCards),
        playerTotal: pTotal,
        dealerTotal: dTotal,
        balanceAfterRaw: result.balanceAfterRaw.toString(),
        balanceAfter: Number(result.balanceAfterRaw) / 1e8,
      });
    }

    // Hit (not bust, not auto-stand) — return playing state
    if (action === "hit" && !autoStand) {
      await updateGame(gameId, { bjPlayerCards: playerCards, bjDrawPos: drawPos });
      return json({
        ok: true,
        status: "playing",
        result: null,
        win: false,
        payout: null,
        playerHand: toHand(playerCards),
        dealerHand: toHand(bjDealerCards), // still hidden second card on client
        playerTotal: bjHandTotal(playerCards),
        dealerTotal: bjHandTotal([bjDealerCards[0]]), // only first card visible
      });
    }

    // Stand or auto-stand after double — dealer plays
    let dealerCards = [...bjDealerCards];
    let dTotal = bjHandTotal(dealerCards);
    while (dTotal < 17) {
      const drawn = blackjackDraw(serverSeed, clientSeed, nonce, 1, drawPos);
      dealerCards.push(drawn[0]);
      drawPos++;
      dTotal = bjHandTotal(dealerCards);
    }

    const pTotal = bjHandTotal(playerCards);
    let gameResult: "win" | "lose" | "push" = "lose";
    const dealerBust = dTotal > 21;
    if (pTotal > dTotal || dealerBust) gameResult = "win";
    else if (pTotal === dTotal) gameResult = "push";

    let payoutRaw = 0n;
    if (gameResult === "win") payoutRaw = betRaw * 2n;
    else if (gameResult === "push") payoutRaw = betRaw;

    // For double the effective betRaw was doubled but original bet was already deducted.
    // If double and win, credit the extra win (betRaw is already 2x here, so payoutRaw = 2*2x = 4x original,
    // but we should only return betRaw*2 based on the doubled bet, which is correct since betRaw was doubled).

    const txResult = await db.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId_asset: { userId: user.id, asset } } });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId: user.id, asset, balance: 0n } });
      let balanceAfterRaw = wallet.balance;

      if (payoutRaw > 0n) {
        balanceAfterRaw += payoutRaw;
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfterRaw } });
        await tx.walletLedger.create({
          data: {
            userId: user.id, asset, amountRaw: payoutRaw, balanceAfterRaw,
            transactionType: gameResult === "win" ? "WIN" : "REFUND",
            note: `Blackjack ${gameResult}`,
          },
        });
      }

      await tx.gameBet.create({
        data: {
          userId: user.id, game: "blackjack", asset, betAmountRaw: game.betRaw,
          payoutRaw, multiplier: gameResult === "win" ? 2 : (gameResult === "push" ? 1 : 0),
          outcome: JSON.stringify({ action, playerCards, dealerCards, pTotal, dTotal, result: gameResult }),
          win: gameResult === "win", serverSeed, clientSeed, nonce,
        },
      });
      return { balanceAfterRaw };
    });

    await deleteGame(gameId, user.id, "blackjack");
    recomputeVip(user.id).catch(() => {});

    // Build result string for frontend
    let resultStr: string;
    if (gameResult === "win") resultStr = dealerBust ? "DEALER BUST WIN" : "WIN";
    else if (gameResult === "push") resultStr = "PUSH";
    else resultStr = "LOSE";

    if (gameResult === "win") {
      pushChatNotify("win", {
        username: user.username,
        game: "Blackjack",
        bet: Number(game.betRaw) / 1e8,
        multiplier: 2,
        payout: Number(payoutRaw) / 1e8,
        asset,
      }).catch(() => {});
    }

    return json({
      ok: true,
      status: "ended",
      result: resultStr,
      win: gameResult === "win",
      payout: (Number(payoutRaw) / 1e8).toFixed(6),
      playerHand: toHand(playerCards),
      dealerHand: toHand(dealerCards),
      playerTotal: pTotal,
      dealerTotal: dTotal,
      balanceAfterRaw: txResult.balanceAfterRaw.toString(),
      balanceAfter: Number(txResult.balanceAfterRaw) / 1e8,
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Action failed";
    return err(msg);
  }
}

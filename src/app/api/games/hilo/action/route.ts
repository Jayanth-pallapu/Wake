import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { getGame, deleteGame, updateGame } from "@/lib/active-games";
import { hiloCard, hiloMultiplier } from "@/lib/provably-fair";
import { recomputeVip } from "@/lib/vip";
import { pushChatNotify } from "@/lib/chat-push";
import { ASSET_MAP } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const { gameId, action } = body;
  if (!gameId || typeof gameId !== "string") return err("Invalid gameId");

  const game = await getGame(gameId);
  if (!game || game.game !== "hilo" || game.status !== "active" || game.userId !== user.id) {
    return err("Game not found or already finished");
  }

  const { serverSeed, clientSeed, nonce, betRaw, asset, hiloCurrentCard, hiloChainMultiplier, hiloDrawPos } = game;
  if (!hiloCurrentCard || hiloChainMultiplier === undefined || hiloDrawPos === undefined) return err("Invalid game state");

  try {
    if (action === "cashout") {
      const payoutRaw = (betRaw * BigInt(Math.round(hiloChainMultiplier * 100))) / 100n;
      
      const result = await db.$transaction(async (tx) => {
        let wallet = await tx.wallet.findUnique({ where: { userId_asset: { userId: user.id, asset } } });
        if (!wallet) wallet = await tx.wallet.create({ data: { userId: user.id, asset, balance: 0n } });
        const balanceAfterRaw = wallet.balance + payoutRaw;
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfterRaw } });
        await tx.walletLedger.create({
          data: {
            userId: user.id, asset, amountRaw: payoutRaw, balanceAfterRaw,
            transactionType: "WIN", note: `HiLo win (${hiloChainMultiplier}x)`,
          },
        });
        
        await tx.gameBet.create({
          data: {
            userId: user.id, game: "hilo", asset, betAmountRaw: betRaw,
            payoutRaw, multiplier: hiloChainMultiplier,
            outcome: JSON.stringify({ action: "cashout", chainMultiplier: hiloChainMultiplier, cashedAt: hiloChainMultiplier }),
            win: true, serverSeed, clientSeed, nonce,
          },
        });
        return { balanceAfterRaw };
      });
      
      await deleteGame(gameId, user.id, "hilo");
      recomputeVip(user.id).catch(() => {});
      
      const cfg = ASSET_MAP[asset];
      if (cfg && hiloChainMultiplier >= 1) {
        pushChatNotify(hiloChainMultiplier >= 10 ? "mega" : "win", {
          username: user.username,
          game: "Hilo",
          bet: Number(betRaw) / 1e8,
          multiplier: hiloChainMultiplier,
          payout: Number(payoutRaw) / 1e8,
          asset,
        }).catch(() => {});
      }
      
      return json({
        ok: true,
        action: "cashout",
        payoutRaw: payoutRaw.toString(),
        balanceAfterRaw: result.balanceAfterRaw.toString(),
        balanceAfter: Number(result.balanceAfterRaw) / 1e8,
      });
    } else if (action === "higher" || action === "lower") {
      // Draw next card using nonce + drawPos for determinism
      const nextCard = hiloCard(serverSeed, clientSeed, nonce + hiloDrawPos);
      
      let win = false;
      if (action === "higher" && nextCard.value > hiloCurrentCard.value) win = true;
      if (action === "lower" && nextCard.value < hiloCurrentCard.value) win = true;
      
      if (win) {
        const mult = hiloMultiplier(action, hiloCurrentCard.value);
        const newChain = Math.floor(hiloChainMultiplier * mult * 100) / 100;
        
        await updateGame(gameId, {
          hiloCurrentCard: nextCard,
          hiloChainMultiplier: newChain,
          hiloDrawPos: hiloDrawPos + 1
        });
        
        return json({
          ok: true,
          action,
          card: nextCard,
          chainMultiplier: newChain,
          win: true
        });
      } else {
        // Bust
        const result = await db.$transaction(async (tx) => {
          let wallet = await tx.wallet.findUnique({ where: { userId_asset: { userId: user.id, asset } } });
          if (!wallet) wallet = await tx.wallet.create({ data: { userId: user.id, asset, balance: 0n } });
          
          await tx.gameBet.create({
            data: {
              userId: user.id, game: "hilo", asset, betAmountRaw: betRaw,
              payoutRaw: 0n, multiplier: 0,
              outcome: JSON.stringify({ action, currentCard: hiloCurrentCard, nextCard, chainMultiplier: hiloChainMultiplier, bust: true }),
              win: false, serverSeed, clientSeed, nonce,
            },
          });
          return { balanceAfterRaw: wallet.balance };
        });
        
        await deleteGame(gameId, user.id, "hilo");
        recomputeVip(user.id).catch(() => {});
        
        return json({
          ok: true,
          action,
          card: nextCard,
          win: false,
          balanceAfterRaw: result.balanceAfterRaw.toString(),
          balanceAfter: Number(result.balanceAfterRaw) / 1e8,
        });
      }
    } else {
      return err("Invalid action");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Action failed";
    return err(msg);
  }
}

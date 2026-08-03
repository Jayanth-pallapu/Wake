import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { getGame, deleteGame } from "@/lib/active-games";
import { videoPokerDraw, evaluatePokerHand } from "@/lib/provably-fair";
import { recomputeVip } from "@/lib/vip";
import { pushChatNotify } from "@/lib/chat-push";
import { ASSET_MAP } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const { gameId, hold } = body;
  
  if (!gameId || typeof gameId !== "string") return err("Invalid gameId");
  if (!Array.isArray(hold) || hold.length !== 5) return err("Invalid hold array");

  const game = await getGame(gameId);
  if (!game || game.game !== "videopoker" || game.status !== "active" || game.userId !== user.id) {
    return err("Game not found or already finished");
  }

  const { serverSeed, clientSeed, nonce, betRaw, asset, vpPhase } = game;
  if (vpPhase !== "deal") return err("Invalid game phase");

  try {
    const finalHand = videoPokerDraw(serverSeed, clientSeed, nonce, hold);
    const { rank, multiplier } = evaluatePokerHand(finalHand);
    
    const payoutRaw = betRaw * BigInt(multiplier);
    const win = multiplier > 0;
    
    const result = await db.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId_asset: { userId: user.id, asset } } });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId: user.id, asset, balance: 0n } });
      
      let balanceAfterRaw = wallet.balance;
      if (win) {
        balanceAfterRaw += payoutRaw;
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfterRaw } });
        await tx.walletLedger.create({
          data: {
            userId: user.id, asset, amountRaw: payoutRaw, balanceAfterRaw,
            transactionType: "WIN", note: `Video Poker win (${rank})`,
          },
        });
      }
      
      await tx.gameBet.create({
        data: {
          userId: user.id, game: "videopoker", asset, betAmountRaw: betRaw,
          payoutRaw, multiplier,
          outcome: JSON.stringify({ hold, finalHand, rank }),
          win, serverSeed, clientSeed, nonce,
        },
      });
      return { balanceAfterRaw };
    });
    
    await deleteGame(gameId, user.id, "videopoker");
    recomputeVip(user.id).catch(() => {});
    
    const cfg = ASSET_MAP[asset];
    if (cfg && win && multiplier > 1) {
      pushChatNotify(multiplier >= 10 ? "mega" : "win", {
        username: user.username,
        game: "Video Poker",
        bet: Number(betRaw) / 1e8,
        multiplier,
        payout: Number(payoutRaw) / 1e8,
        asset,
      }).catch(() => {});
    }
    
    return json({
      ok: true,
      hand: finalHand,
      rank,
      multiplier,
      payout: Number(payoutRaw) / 1e8,
      win,
      balanceAfterRaw: result.balanceAfterRaw.toString(),
      balanceAfter: Number(result.balanceAfterRaw) / 1e8,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Draw failed";
    return err(msg);
  }
}

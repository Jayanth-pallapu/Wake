import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { getGame, deleteGame, updateGame } from "@/lib/active-games";
import { cavePlunderDraw, cavePayout, type CaveColumn } from "@/lib/provably-fair";
import { recomputeVip } from "@/lib/vip";
import { pushChatNotify } from "@/lib/chat-push";
import { ASSET_MAP } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const { gameId, action } = body;
  
  if (!gameId || typeof gameId !== "string") return err("Invalid gameId");
  if (!["spin", "cashout"].includes(action)) return err("Invalid action");

  const game = await getGame(gameId);
  if (!game || game.game !== "cave" || game.status !== "active" || game.userId !== user.id) {
    return err("Game not found or already finished");
  }

  const { serverSeed, clientSeed, nonce, betRaw, asset, caveLevels, caveSpins } = game;
  if (!caveLevels || caveSpins === undefined) return err("Invalid game state");

  try {
    if (action === "cashout") {
      const mult = cavePayout(caveLevels);
      const payoutRaw = (betRaw * BigInt(Math.round(mult * 100))) / 100n;
      const win = payoutRaw > 0n;

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
              transactionType: "WIN", note: `Cave win (${mult}x)`,
            },
          });
        }
        
        await tx.gameBet.create({
          data: {
            userId: user.id, game: "cave", asset, betAmountRaw: betRaw,
            payoutRaw, multiplier: mult,
            outcome: JSON.stringify({ action, caveLevels, mult }),
            win, serverSeed, clientSeed, nonce,
          },
        });
        return { balanceAfterRaw };
      });

      await deleteGame(gameId, user.id, "cave");
      recomputeVip(user.id).catch(() => {});
      
      const cfg = ASSET_MAP[asset];
      if (cfg && win && mult >= 1) {
        pushChatNotify(mult >= 10 ? "mega" : "win", {
          username: user.username,
          game: "Cave of Plunder",
          bet: Number(betRaw) / 1e8,
          multiplier: mult,
          payout: Number(payoutRaw) / 1e8,
          asset,
        }).catch(() => {});
      }

      return json({
        ok: true, action,
        levels: caveLevels, payout: mult, cashedOut: true,
        balanceAfterRaw: result.balanceAfterRaw.toString(),
        balanceAfter: Number(result.balanceAfterRaw) / 1e8,
      });
    }

    // Spin
    let newLevels: [number, number, number] = [...caveLevels];
    let symbols: {col: number, symbol: string}[] = [];
    
    for (let colIdx = 0; colIdx < 3; colIdx++) {
      const draw = cavePlunderDraw(serverSeed, clientSeed, nonce + caveSpins * 3 + colIdx, colIdx as CaveColumn);
      symbols.push({ col: colIdx, symbol: draw.symbol });
      
      if (draw.symbol === "advance") {
        newLevels[colIdx] = Math.min(newLevels[colIdx] + 1, 7);
      } else if (draw.symbol === "reset") {
        newLevels[colIdx] = 0;
      }
      // "hold" means stay, do nothing
    }

    const mult = cavePayout(newLevels);
    let cashedOut = false;
    let balanceAfterRaw: bigint | null = null;
    let payoutRaw = 0n;

    // Auto cashout if any level hits 7
    if (newLevels.some(l => l >= 7)) {
      cashedOut = true;
      payoutRaw = (betRaw * BigInt(Math.round(mult * 100))) / 100n;
      const win = payoutRaw > 0n;

      const txResult = await db.$transaction(async (tx) => {
        let wallet = await tx.wallet.findUnique({ where: { userId_asset: { userId: user.id, asset } } });
        if (!wallet) wallet = await tx.wallet.create({ data: { userId: user.id, asset, balance: 0n } });
        let bal = wallet.balance;
        
        if (win) {
          bal += payoutRaw;
          await tx.wallet.update({ where: { id: wallet.id }, data: { balance: bal } });
          await tx.walletLedger.create({
            data: {
              userId: user.id, asset, amountRaw: payoutRaw, balanceAfterRaw: bal,
              transactionType: "WIN", note: `Cave win (${mult}x)`,
            },
          });
        }
        
        await tx.gameBet.create({
          data: {
            userId: user.id, game: "cave", asset, betAmountRaw: betRaw,
            payoutRaw, multiplier: mult,
            outcome: JSON.stringify({ action: "spin", symbols, newLevels, mult, autoCashout: true }),
            win, serverSeed, clientSeed, nonce,
          },
        });
        return { balanceAfterRaw: bal };
      });
      balanceAfterRaw = txResult.balanceAfterRaw;
      await deleteGame(gameId, user.id, "cave");
    } else {
      await updateGame(gameId, { caveLevels: newLevels, caveSpins: caveSpins + 1 });
    }

    recomputeVip(user.id).catch(() => {});

    // For non-cashed out spins, we return the user's current wallet balance, 
    // but without modifying it. To avoid making a DB call just for the balance, 
    // we can just return what we have (though typically we need to fetch it).
    // The user's balance is not strictly required if not modified, but let's fetch it if needed.
    if (balanceAfterRaw === null) {
      const w = await db.wallet.findUnique({ where: { userId_asset: { userId: user.id, asset } } });
      balanceAfterRaw = w ? w.balance : 0n;
    }

    return json({
      ok: true, action,
      levels: newLevels,
      symbols,
      payout: mult,
      cashedOut,
      balanceAfterRaw: balanceAfterRaw.toString(),
      balanceAfter: Number(balanceAfterRaw) / 1e8,
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Action failed";
    return err(msg);
  }
}

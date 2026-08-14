import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { ASSET_MAP, SLOT_GAME_MAP } from "@/lib/constants";
import { recomputeVip, wagerRawToUsd } from "@/lib/vip";
import { usdToRaw } from "@/lib/constants";

interface PlayBody {
  slotId: string;
  asset: string;
  betRaw: string;
}

const SYMBOL_SETS: Record<string, string[]> = {
  "sweet-bonanza": ['🍬','🍭','🍇','🍋','🍑','🍎','💎','♥'],
  "gates-of-olympus": ['⚡','💎','💍','🏺','🔮','🦉','♦','⚜'],
  "big-bass-bonanza": ['🎣','🐟','🦈','🎖','💰','🪙','🃏','⚡'],
  "book-of-dead": ['📖','🦅','🐺','🐞','⚡','💎','🃏','🎭'],
  "wanted-dead": ['🤠','🌵','💀','🔫','🎯','💰','⭐','🃏'],
  "sugar-rush": ['🧁','🍰','🍩','🍫','🍬','🍭','⭐','💎'],
  "dog-house": ['🐶','🐾','🦴','🏠','🎾','🌟','💎','⭐'],
  "money-train": ['🚂','💰','🎯','💣','⚡','🔒','💎','⭐'],
  "fruit-party": ['🍓','🍇','🍋','🍊','🍑','🍎','⭐','💎'],
  "wild-west-gold": ['🌵','💰','⭐','🐎','🔫','🎯','💎','🃏'],
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = (await req.json().catch(() => ({}))) as PlayBody;
  const slotId = String(body.slotId || "");
  const asset = String(body.asset || "USDT").toUpperCase();
  const cfg = ASSET_MAP[asset];
  if (!cfg) return err("Unsupported asset");
  let betRaw: bigint;
  try { betRaw = BigInt(body.betRaw || "0"); } catch { return err("Invalid bet amount"); }
  if (betRaw <= 0n) return err("Bet must be greater than zero");
  if (betRaw > 10_000n * 100_000_000n) return err("Bet too large");
  
  const slotMeta = SLOT_GAME_MAP[slotId];
  if (!slotMeta) return err("Invalid slot game");

  try {
    const result = await db.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({
        where: { userId_asset: { userId: user.id, asset } },
      });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId: user.id, asset, balance: 0n } });
      if (wallet.balance < betRaw) throw new Error("INSUFFICIENT_BALANCE");
      
      const afterDebit = wallet.balance - betRaw;
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: afterDebit } });
      await tx.walletLedger.create({
        data: { userId: user.id, asset, amountRaw: -betRaw, balanceAfterRaw: afterDebit, transactionType: "BET", note: `Bet on ${slotId}` },
      });

      let symbols: string[][] = [];
      let mult = 0;
      let winLines: number[] = [];
      
      if (!slotMeta.live) {
        const syms = SYMBOL_SETS[slotId] || SYMBOL_SETS["sweet-bonanza"];
        for (let r = 0; r < slotMeta.rows; r++) {
          const row: string[] = [];
          for (let c = 0; c < slotMeta.cols; c++) {
            row.push(syms[Math.floor(Math.random() * syms.length)]);
          }
          symbols.push(row);
        }
        
        if (slotMeta.rows === 3 && slotMeta.cols === 5) {
          for (let r = 0; r < 3; r++) {
            const sym = symbols[r][0];
            let matches = 1;
            for (let c = 1; c < 5; c++) {
              if (symbols[r][c] === sym) matches++;
              else break;
            }
            if (matches >= 3) {
              winLines.push(r);
              mult += matches * 0.5;
            }
          }
        } else {
          const counts: Record<string, number> = {};
          for (let r = 0; r < slotMeta.rows; r++) {
            for (let c = 0; c < slotMeta.cols; c++) {
              counts[symbols[r][c]] = (counts[symbols[r][c]] || 0) + 1;
            }
          }
          for (const sym in counts) {
            if (counts[sym] >= 5) {
              mult += (counts[sym] - 4) * 0.5;
            }
          }
        }
      }

      const payoutRaw = betRaw * BigInt(Math.round(mult * 100)) / 100n;
      let balanceAfterRaw = afterDebit;
      if (payoutRaw > 0n) {
        const afterCredit = afterDebit + payoutRaw;
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: afterCredit } });
        await tx.walletLedger.create({
          data: { userId: user.id, asset, amountRaw: payoutRaw, balanceAfterRaw: afterCredit, transactionType: "WIN", note: `Win on ${slotId} (${mult}x)` },
        });
        balanceAfterRaw = afterCredit;
      }
      
      await tx.gameBet.create({
        data: {
          userId: user.id, game: slotId, asset, betAmountRaw: betRaw,
          payoutRaw, multiplier: mult, outcome: JSON.stringify({ symbols, winLines }), win: mult > 0,
          serverSeed: "slots", clientSeed: "slots", nonce: 0,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { lifetimeWagerRaw: { increment: usdToRaw(wagerRawToUsd(betRaw, asset)) }, gamesPlayed: { increment: 1 } },
      });

      return { mult, symbols, winLines, payoutRaw, balanceAfterRaw, win: mult > 0 };
    });

    recomputeVip(user.id).catch(() => {});

    return json({
      ok: true,
      win: result.win,
      multiplier: result.mult,
      symbols: result.symbols,
      winLines: result.winLines,
      payout: Number(result.payoutRaw) / 1e8,
      balanceAfterRaw: result.balanceAfterRaw.toString()
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Play failed";
    if (msg === "INSUFFICIENT_BALANCE") return err("Insufficient balance", 400);
    return err(msg);
  }
}

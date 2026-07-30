import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { ASSET_MAP } from "@/lib/constants";
import {
  crashMultiplier,
  diceRoll,
  limboMultiplier,
  plinkoPath,
  plinkoMultiplier,
  PLINKO_ROWS,
  type PlinkoRisk,
  minesGrid,
  minesMultiplier,
  wheelSpin,
  WHEEL_CONFIG,
  type WheelRisk,
  towerGrid,
  towerMultiplier,
  type TowerDifficulty,
  kenoDraw,
  kenoMultiplier,
  hashServerSeed,
} from "@/lib/provably-fair";
import { recordWager, recomputeVip, wagerRawToUsd } from "@/lib/vip";
import { usdToRaw } from "@/lib/constants";
import { pushChatNotify } from "@/lib/chat-push";

interface PlayBody {
  game: string;
  asset: string;
  betRaw: string; // serialized bigint
  params: Record<string, unknown>;
}

interface ResolvedBet {
  win: boolean;
  multiplier: number;
  payoutRaw: bigint;
  outcome: Record<string, unknown>;
}

function resolveGame(game: string, params: Record<string, unknown>, serverSeed: string, clientSeed: string, nonce: number, betRaw: bigint): ResolvedBet {
  switch (game) {
    case "crash": {
      const target = Number(params.target);
      if (!target || target < 1.01 || target > 1_000_000) throw new Error("Invalid crash target");
      const crash = crashMultiplier(serverSeed, clientSeed, nonce);
      const win = crash >= target;
      const mult = win ? target : 0;
      return {
        win,
        multiplier: mult,
        payoutRaw: win ? (betRaw * BigInt(Math.round(mult * 100))) / 100n : 0n,
        outcome: { crashPoint: crash, target, cashedAt: win ? target : null },
      };
    }
    case "limbo": {
      const target = Number(params.target);
      if (!target || target < 1.01 || target > 1_000_000) throw new Error("Invalid limbo target");
      const rolled = limboMultiplier(serverSeed, clientSeed, nonce);
      const win = rolled >= target;
      const mult = win ? target : 0;
      return {
        win,
        multiplier: mult,
        payoutRaw: win ? (betRaw * BigInt(Math.round(mult * 100))) / 100n : 0n,
        outcome: { rolled, target },
      };
    }
    case "dice": {
      const target = Number(params.target);
      const direction = String(params.direction || "under") as "over" | "under";
      if (!target || target < 2 || target > 98) throw new Error("Invalid dice target (2-98)");
      if (direction !== "over" && direction !== "under") throw new Error("Invalid direction");
      const roll = diceRoll(serverSeed, clientSeed, nonce);
      const win = direction === "under" ? roll < target : roll > target;
      // 1% house edge: payout = 99 / winProb where winProb = (target-1)/100 for under, (100-target)/100 for over
      const winProb = direction === "under" ? target / 100 : (100 - target) / 100;
      const mult = win ? Math.floor((0.99 / winProb) * 100) / 100 : 0;
      return {
        win,
        multiplier: mult,
        payoutRaw: win ? (betRaw * BigInt(Math.round(mult * 100))) / 100n : 0n,
        outcome: { roll, target, direction },
      };
    }
    case "plinko": {
      const risk = (String(params.risk || "low") as PlinkoRisk);
      if (!["low", "medium", "high"].includes(risk)) throw new Error("Invalid risk");
      const rows = Number(params.rows) || PLINKO_ROWS;
      const path = plinkoPath(serverSeed, clientSeed, nonce, rows);
      const mult = plinkoMultiplier(risk, path.bucket);
      const win = mult > 0;
      return {
        win,
        multiplier: mult,
        payoutRaw: win ? (betRaw * BigInt(Math.round(mult * 100))) / 100n : 0n,
        outcome: { directions: path.directions, bucket: path.bucket, multiplier: mult, risk },
      };
    }
    case "mines": {
      const mineCount = Number(params.mineCount);
      const picks = (params.picks as number[]) || [];
      if (!mineCount || mineCount < 1 || mineCount > 24) throw new Error("Invalid mine count (1-24)");
      if (!Array.isArray(picks) || picks.length < 1) throw new Error("Must reveal at least one tile");
      if (picks.length > 25 - mineCount) throw new Error("Too many picks");
      const grid = minesGrid(serverSeed, clientSeed, nonce, mineCount);
      // walk picks, find first mine
      let hitMineAt = -1;
      const revealed: number[] = [];
      for (let i = 0; i < picks.length; i++) {
        const idx = picks[i];
        if (typeof idx !== "number" || idx < 0 || idx > 24) throw new Error("Invalid tile index");
        if (revealed.includes(idx)) throw new Error("Duplicate pick");
        revealed.push(idx);
        if (grid[idx]) { hitMineAt = i; break; }
      }
      if (hitMineAt >= 0) {
        return {
          win: false, multiplier: 0, payoutRaw: 0n,
          outcome: { mineCount, picks: revealed, hitMineAt, grid, safePicks: hitMineAt },
        };
      }
      const mult = minesMultiplier(mineCount, picks.length);
      return {
        win: true, multiplier: mult,
        payoutRaw: (betRaw * BigInt(Math.round(mult * 100))) / 100n,
        outcome: { mineCount, picks: revealed, hitMineAt: -1, grid, safePicks: picks.length },
      };
    }
    case "wheel": {
      const risk = (String(params.risk || "low") as WheelRisk);
      if (!["low", "medium", "high"].includes(risk)) throw new Error("Invalid risk");
      const cfg = WHEEL_CONFIG[risk];
      const seg = wheelSpin(serverSeed, clientSeed, nonce, cfg.segments);
      const mult = cfg.multipliers[seg];
      const win = mult > 0;
      return {
        win, multiplier: mult,
        payoutRaw: win ? (betRaw * BigInt(Math.round(mult * 100))) / 100n : 0n,
        outcome: { segment: seg, multiplier: mult, risk, segments: cfg.segments },
      };
    }
    case "tower": {
      const difficulty = (String(params.difficulty || "easy") as TowerDifficulty);
      if (!["easy", "medium", "hard"].includes(difficulty)) throw new Error("Invalid difficulty");
      const picks = (params.picks as number[]) || [];
      if (!Array.isArray(picks) || picks.length < 1) throw new Error("Must pick at least one row");
      if (picks.length > 9) throw new Error("Too many picks");
      const grid = towerGrid(serverSeed, clientSeed, nonce, difficulty);
      let failAt = -1;
      for (let i = 0; i < picks.length; i++) {
        const col = picks[i];
        if (typeof col !== "number" || col < 0 || col > 8) throw new Error("Invalid column");
        if (!grid[i].includes(col)) { failAt = i; break; }
      }
      if (failAt >= 0) {
        return {
          win: false, multiplier: 0, payoutRaw: 0n,
          outcome: { difficulty, picks, failAt, grid, climbed: failAt },
        };
      }
      const mult = towerMultiplier(difficulty, picks.length);
      return {
        win: true, multiplier: mult,
        payoutRaw: (betRaw * BigInt(Math.round(mult * 100))) / 100n,
        outcome: { difficulty, picks, failAt: -1, grid, climbed: picks.length },
      };
    }
    case "keno": {
      const numbers = (params.numbers as number[]) || [];
      if (!Array.isArray(numbers) || numbers.length < 1 || numbers.length > 10) throw new Error("Pick 1-10 numbers");
      const valid = numbers.every((n) => n >= 1 && n <= 40 && Number.isInteger(n));
      if (!valid) throw new Error("Numbers must be 1-40");
      if (new Set(numbers).size !== numbers.length) throw new Error("Duplicate numbers");
      const draw = kenoDraw(serverSeed, clientSeed, nonce);
      const matches = numbers.filter((n) => draw.includes(n)).length;
      const mult = kenoMultiplier(numbers.length, matches);
      const win = mult > 0;
      return {
        win, multiplier: mult,
        payoutRaw: win ? (betRaw * BigInt(Math.round(mult * 100))) / 100n : 0n,
        outcome: { picks: numbers, draw, matches, multiplier: mult },
      };
    }
    default:
      throw new Error("Unknown game");
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = (await req.json().catch(() => ({}))) as PlayBody;
  const game = String(body.game || "");
  const asset = String(body.asset || "USDT").toUpperCase();
  const cfg = ASSET_MAP[asset];
  if (!cfg) return err("Unsupported asset");
  let betRaw: bigint;
  try { betRaw = BigInt(body.betRaw || "0"); } catch { return err("Invalid bet amount"); }
  if (betRaw <= 0n) return err("Bet must be greater than zero");
  // safety cap
  if (betRaw > 10_000n * 100_000_000n) return err("Bet too large");

  try {
    // Ensure seeds
    if (!user.serverSeed) {
      return err("Seeds not initialized — refresh", 500);
    }

    // Single atomic transaction: settle bet, create bet record, bump nonce, update stats
    const result = await db.$transaction(async (tx) => {
      // Re-read user inside tx for fresh nonce
      const fresh = await tx.user.findUnique({ where: { id: user.id } });
      if (!fresh) throw new Error("USER_NOT_FOUND");
      const serverSeed = fresh.serverSeed;
      const clientSeed = fresh.clientSeed;
      const nonce = fresh.nonce;

      // Resolve outcome
      const resolved = resolveGame(game, body.params || {}, serverSeed, clientSeed, nonce, betRaw);

      // Settle wallet
      let wallet = await tx.wallet.findUnique({
        where: { userId_asset: { userId: user.id, asset } },
      });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId: user.id, asset, balance: 0n } });
      }
      if (wallet.balance < betRaw) throw new Error("INSUFFICIENT_BALANCE");
      const afterDebit = wallet.balance - betRaw;
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: afterDebit } });
      await tx.walletLedger.create({
        data: {
          userId: user.id, asset, amountRaw: -betRaw, balanceAfterRaw: afterDebit,
          transactionType: "BET", note: `Bet on ${game}`,
        },
      });
      let balanceAfterRaw = afterDebit;
      if (resolved.payoutRaw > 0n) {
        const afterCredit = afterDebit + resolved.payoutRaw;
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: afterCredit } });
        await tx.walletLedger.create({
          data: {
            userId: user.id, asset, amountRaw: resolved.payoutRaw, balanceAfterRaw: afterCredit,
            transactionType: "WIN", note: `Win on ${game} (${resolved.multiplier}x)`,
          },
        });
        balanceAfterRaw = afterCredit;
      }

      // Create bet record
      const bet = await tx.gameBet.create({
        data: {
          userId: user.id, game, asset, betAmountRaw: betRaw,
          payoutRaw: resolved.payoutRaw, multiplier: resolved.multiplier,
          outcome: JSON.stringify(resolved.outcome), win: resolved.win,
          serverSeed, clientSeed, nonce,
        },
      });

      // Bump nonce
      await tx.user.update({
        where: { id: user.id },
        data: {
          nonce: { increment: 1 },
          lifetimeWagerRaw: { increment: usdToRaw(wagerRawToUsd(betRaw, asset)) },
          gamesPlayed: { increment: 1 },
          lastSeenAt: new Date(),
        },
      });

      return { bet, resolved, balanceAfterRaw, serverSeedHash: hashServerSeed(serverSeed), nonce };
    });

    // Post-tx: VIP recompute + chat notify (non-blocking)
    recomputeVip(user.id).catch(() => {});
    if (result.resolved.win && result.resolved.multiplier >= 1) {
      const payoutUsd = (Number(result.resolved.payoutRaw) / 1e8) * cfg.usdPerUnit;
      pushChatNotify(result.resolved.multiplier >= 10 ? "mega" : "win", {
        username: user.username,
        game: game.charAt(0).toUpperCase() + game.slice(1),
        bet: Number(betRaw) / 1e8,
        multiplier: result.resolved.multiplier,
        payout: Number(result.resolved.payoutRaw) / 1e8,
        asset,
      }).catch(() => {});
    }

    return json({
      ok: true,
      bet: {
        id: result.bet.id,
        game: result.bet.game,
        asset: result.bet.asset,
        betRaw: result.bet.betAmountRaw.toString(),
        bet: Number(result.bet.betAmountRaw) / 1e8,
        payoutRaw: result.bet.payoutRaw.toString(),
        payout: Number(result.bet.payoutRaw) / 1e8,
        multiplier: result.bet.multiplier,
        win: result.bet.win,
        outcome: JSON.parse(result.bet.outcome),
        serverSeed: result.bet.serverSeed,
        clientSeed: result.bet.clientSeed,
        nonce: result.bet.nonce,
        serverSeedHash: result.serverSeedHash,
        createdAt: result.bet.createdAt.toISOString(),
      },
      balanceAfterRaw: result.balanceAfterRaw.toString(),
      balanceAfter: Number(result.balanceAfterRaw) / 1e8,
      nonce: result.nonce + 1,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Play failed";
    if (msg === "INSUFFICIENT_BALANCE") return err("Insufficient balance", 400);
    return err(msg);
  }
}

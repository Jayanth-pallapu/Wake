// VIP engine — tier computation, rakeback accrual, tier-up bonus.

import { db } from "./db";
import { VIP_TIERS, UNIT, tierForWagerUsd, ASSET_MAP, usdToRaw } from "./constants";
import { applyLedger } from "./wallet";

/** Convert a raw 1e8 wager amount in a given asset to USD-equivalent number. */
export function wagerRawToUsd(raw: bigint, asset: string): number {
  const cfg = ASSET_MAP[asset];
  if (!cfg) return 0;
  const wholeUnits = Number(raw) / Number(UNIT);
  return wholeUnits * cfg.usdPerUnit;
}

/** Total USD-equivalent lifetime wager for a user (across all assets). */
export async function lifetimeWagerUsd(userId: string): Promise<number> {
  const rows = await db.walletLedger.findMany({
    where: { userId, transactionType: "BET" },
    select: { asset: true, amountRaw: true },
  });
  // amountRaw for BET is negative; sum absolute per asset
  const perAsset: Record<string, bigint> = {};
  for (const r of rows) {
    perAsset[r.asset] = (perAsset[r.asset] || 0n) + (r.amountRaw < 0n ? -r.amountRaw : r.amountRaw);
  }
  let total = 0;
  for (const asset of Object.keys(perAsset)) {
    total += wagerRawToUsd(perAsset[asset], asset);
  }
  return total;
}

/** Determine & assign the correct VIP tier for a user based on lifetime wager. Returns tier if changed. */
export async function recomputeVip(userId: string): Promise<{
  tierName: string;
  tierLevel: number;
  tieredUp: boolean;
}> {
  const wager = await lifetimeWagerUsd(userId);
  const target = tierForWagerUsd(wager);
  const user = await db.user.findUnique({ where: { id: userId }, include: { vipTier: true } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const currentLevel = user.vipTier?.level ?? 0;
  if (target.level > currentLevel) {
    // Tier up!
    let tier = await db.vipTier.findUnique({ where: { name: target.name } });
    if (!tier) {
      tier = await db.vipTier.create({
        data: {
          name: target.name,
          level: target.level,
          requiredWagerRaw: usdToRaw(target.requiredWagerUsd),
          rakebackPct: target.rakebackPct,
          levelUpBonusRaw: usdToRaw(target.levelUpBonusUsd),
          dedicatedHost: target.dedicatedHost,
        },
      });
    }
    await db.user.update({ where: { id: userId }, data: { vipTierId: tier.id } });
    // Credit tier-up bonus in USDT
    if (tier.levelUpBonusRaw > 0n) {
      await applyLedger({
        userId, asset: "USDT", amountRaw: tier.levelUpBonusRaw, type: "BONUS",
        note: `VIP tier-up bonus: ${tier.name}`,
      });
    }
    return { tierName: tier.name, tierLevel: tier.level, tieredUp: true };
  }
  return { tierName: user.vipTier?.name ?? "Bronze", tierLevel: currentLevel || 1, tieredUp: false };
}

/**
 * Rakeback: percentage of every bet returned as bonus. We accrue per-bet by
 * computing rakebackRaw = betRaw * rakebackPct (per-asset) and crediting on claim.
 * For simplicity we store accrual as a computed-on-demand figure from BET ledger entries
 * vs already-claimed RAKEBACK ledger entries.
 */
export async function pendingRakeback(userId: string, asset: string): Promise<{
  pendingRaw: bigint;
  rakebackPct: number;
}> {
  const user = await db.user.findUnique({ where: { id: userId }, include: { vipTier: true } });
  if (!user) return { pendingRaw: 0n, rakebackPct: 0 };
  const pct = user.vipTier?.rakebackPct ?? VIP_TIERS[0].rakebackPct;
  // sum of bets in this asset (absolute)
  const bets = await db.walletLedger.aggregate({
    where: { userId, asset, transactionType: "BET" },
    _sum: { amountRaw: true },
  });
  const totalBet = bets._sum.amountRaw ? -bets._sum.amountRaw : 0n;
  // sum of claimed rakeback
  const claimed = await db.walletLedger.aggregate({
    where: { userId, asset, transactionType: "RAKEBACK" },
    _sum: { amountRaw: true },
  });
  const claimedTotal = claimed._sum.amountRaw ?? 0n;
  const accruedRaw = (totalBet * BigInt(Math.round(pct * 1e6))) / 1_000_000n;
  const pending = accruedRaw - claimedTotal;
  return { pendingRaw: pending > 0n ? pending : 0n, rakebackPct: pct };
}

/** Claim all pending rakeback across all assets. */
export async function claimRakeback(userId: string): Promise<{ claimed: { asset: string; amountRaw: bigint }[] }> {
  const assets = Object.keys(ASSET_MAP);
  const claimed: { asset: string; amountRaw: bigint }[] = [];
  for (const asset of assets) {
    const { pendingRaw } = await pendingRakeback(userId, asset);
    if (pendingRaw > 0n) {
      await applyLedger({
        userId, asset, amountRaw: pendingRaw, type: "RAKEBACK",
        note: "Rakeback claim",
      });
      claimed.push({ asset, amountRaw: pendingRaw });
    }
  }
  return { claimed };
}

/** Update lifetime wager stats after a bet (for fast leaderboard queries). */
export async function recordWager(userId: string, asset: string, betRaw: bigint): Promise<void> {
  const usd = wagerRawToUsd(betRaw, asset);
  const usdRaw = usdToRaw(usd);
  await db.user.update({
    where: { id: userId },
    data: {
      lifetimeWagerRaw: { increment: usdRaw },
      gamesPlayed: { increment: 1 },
      lastSeenAt: new Date(),
    },
  });
}

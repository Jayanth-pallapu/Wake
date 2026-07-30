import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { VIP_TIERS, ASSETS } from "@/lib/constants";
import { lifetimeWagerUsd, pendingRakeback } from "@/lib/vip";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const u = await db.user.findUnique({ where: { id: user.id }, include: { vipTier: true } });
  if (!u) return err("USER_NOT_FOUND", 404);
  const wager = await lifetimeWagerUsd(user.id);
  const currentLevel = u.vipTier?.level ?? 1;
  const currentTier = VIP_TIERS.find((t) => t.level === currentLevel) || VIP_TIERS[0];
  const nextTier = VIP_TIERS.find((t) => t.level === currentLevel + 1) || null;
  const progressPct = nextTier
    ? Math.min(100, Math.round(((wager - currentTier.requiredWagerUsd) / (nextTier.requiredWagerUsd - currentTier.requiredWagerUsd)) * 100))
    : 100;
  // pending rakeback per asset
  const rakebacks = await Promise.all(
    ASSETS.map(async (a) => {
      const { pendingRaw, rakebackPct } = await pendingRakeback(user.id, a.symbol);
      return {
        asset: a.symbol,
        pendingRaw: pendingRaw.toString(),
        pending: Number(pendingRaw) / 1e8,
        rakebackPct,
      };
    })
  );
  return json({
    currentTier: {
      name: currentTier.name,
      level: currentTier.level,
      rakebackPct: currentTier.rakebackPct,
      color: currentTier.color,
      dedicatedHost: currentTier.dedicatedHost,
    },
    nextTier: nextTier
      ? {
          name: nextTier.name,
          level: nextTier.level,
          requiredWagerUsd: nextTier.requiredWagerUsd,
          rakebackPct: nextTier.rakebackPct,
          levelUpBonusUsd: nextTier.levelUpBonusUsd,
        }
      : null,
    lifetimeWagerUsd: Math.round(wager * 100) / 100,
    progressPct,
    rakebacks,
    allTiers: VIP_TIERS.map((t) => ({
      name: t.name,
      level: t.level,
      requiredWagerUsd: t.requiredWagerUsd,
      rakebackPct: t.rakebackPct,
      levelUpBonusUsd: t.levelUpBonusUsd,
      dedicatedHost: t.dedicatedHost,
      color: t.color,
      reached: wager >= t.requiredWagerUsd,
    })),
  });
}

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { ASSETS, ASSET_MAP } from "@/lib/constants";
import { lifetimeWagerUsd } from "@/lib/vip";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const wallets = await db.wallet.findMany({ where: { userId: user.id } });
  const walletMap = new Map(wallets.map((w) => [w.asset, w.balance]));
  const wager = await lifetimeWagerUsd(user.id);
  const totalUsd = ASSETS.reduce((sum, a) => {
    const raw = walletMap.get(a.symbol) ?? 0n;
    return sum + (Number(raw) / 1e8) * a.usdPerUnit;
  }, 0);
  return json({
    wallets: ASSETS.map((a) => ({
      asset: a.symbol,
      name: a.name,
      icon: a.icon,
      color: a.color,
      balanceRaw: (walletMap.get(a.symbol) ?? 0n).toString(),
      balance: Number(walletMap.get(a.symbol) ?? 0n) / 1e8,
      usdValue: (Number(walletMap.get(a.symbol) ?? 0n) / 1e8) * a.usdPerUnit,
      decimals: a.decimals,
    })),
    totalUsdValue: Math.round(totalUsd * 100) / 100,
    lifetimeWagerUsd: Math.round(wager * 100) / 100,
  });
}

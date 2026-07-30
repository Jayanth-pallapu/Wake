import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { claimRakeback } from "@/lib/vip";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const { claimed } = await claimRakeback(user.id);
  const total = claimed.reduce((s, c) => s + c.amountRaw, 0n);
  return json({
    ok: true,
    claimed: claimed.map((c) => ({
      asset: c.asset,
      amountRaw: c.amountRaw.toString(),
      amount: Number(c.amountRaw) / 1e8,
    })),
    totalClaimedRaw: total.toString(),
  });
}

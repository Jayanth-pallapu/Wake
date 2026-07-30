import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { applyLedger, numberToRaw } from "@/lib/wallet";

// Per-user rain cooldown (in-memory, single dev process)
const lastRainClaim = new Map<string, number>();
const RAIN_COOLDOWN_MS = 60_000; // 1 min between claims (demo)

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const rainId = String(body.rainId || "default");

  const last = lastRainClaim.get(user.id) || 0;
  if (Date.now() - last < RAIN_COOLDOWN_MS) {
    const wait = Math.ceil((RAIN_COOLDOWN_MS - (Date.now() - last)) / 1000);
    return err(`Rain cooldown — wait ${wait}s`, 429);
  }
  // credit a small random bonus in USDT
  const amount = Math.round((5 + Math.random() * 45) * 100) / 100;
  const amountRaw = numberToRaw(amount);
  const { balanceAfterRaw } = await applyLedger({
    userId: user.id,
    asset: "USDT",
    amountRaw,
    type: "RAIN",
    reference: rainId,
    note: `Rain claim (${rainId})`,
  });
  lastRainClaim.set(user.id, Date.now());
  return json({
    ok: true,
    amount,
    asset: "USDT",
    balanceAfterRaw: balanceAfterRaw.toString(),
    balanceAfter: Number(balanceAfterRaw) / 1e8,
  });
}

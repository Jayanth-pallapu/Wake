import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { applyLedger, numberToRaw } from "@/lib/wallet";
import { ASSET_MAP } from "@/lib/constants";

/** Demo deposit — instantly credits the wallet (simulating blockchain confirmation). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const asset = String(body.asset || "USDT").toUpperCase();
  const amount = Number(body.amount);
  const cfg = ASSET_MAP[asset];
  if (!cfg) return err("Unsupported asset");
  if (!amount || amount <= 0) return err("Invalid amount");
  if (amount > 100000) return err("Amount too large (demo limit)");
  const amountRaw = numberToRaw(amount);
  const { balanceAfterRaw } = await applyLedger({
    userId: user.id,
    asset,
    amountRaw,
    type: "DEPOSIT",
    note: "Demo deposit (instant)",
  });
  return json({
    ok: true,
    asset,
    balanceRaw: balanceAfterRaw.toString(),
    balance: Number(balanceAfterRaw) / 1e8,
  });
}

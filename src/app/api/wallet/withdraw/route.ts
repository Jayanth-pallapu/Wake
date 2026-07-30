import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { applyLedger, numberToRaw } from "@/lib/wallet";
import { ASSET_MAP } from "@/lib/constants";

/** Demo withdrawal — creates a withdrawal record. Large amounts go to manual queue. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const asset = String(body.asset || "USDT").toUpperCase();
  const amount = Number(body.amount);
  const address = String(body.address || "").trim();
  const cfg = ASSET_MAP[asset];
  if (!cfg) return err("Unsupported asset");
  if (!amount || amount <= 0) return err("Invalid amount");
  if (!address || address.length < 10) return err("Invalid withdrawal address");

  const amountRaw = numberToRaw(amount);
  const usdValue = amount * cfg.usdPerUnit;
  const autoApprove = usdValue <= 2000;

  try {
    const { balanceAfterRaw } = await applyLedger({
      userId: user.id,
      asset,
      amountRaw: -amountRaw,
      type: "WITHDRAWAL",
      note: autoApprove ? "Auto-approved withdrawal" : "Manual review required",
    });
    const withdrawal = await db.withdrawal.create({
      data: {
        userId: user.id,
        asset,
        amountRaw,
        address,
        status: autoApprove ? "approved" : "pending",
      },
    });
    return json({
      ok: true,
      withdrawal: {
        id: withdrawal.id,
        asset,
        amount,
        address,
        status: withdrawal.status,
        autoApproved: autoApprove,
      },
      balanceRaw: balanceAfterRaw.toString(),
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Withdrawal failed");
  }
}

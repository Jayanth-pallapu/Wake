import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err, serialize } from "@/lib/api";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const { searchParams } = new URL(req.url);
  const asset = searchParams.get("asset");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
  const entries = await db.walletLedger.findMany({
    where: { userId: user.id, ...(asset ? { asset } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return json({
    entries: entries.map((e) => ({
      id: e.id,
      asset: e.asset,
      amountRaw: e.amountRaw.toString(),
      amount: Number(e.amountRaw) / 1e8,
      balanceAfterRaw: e.balanceAfterRaw.toString(),
      balanceAfter: Number(e.balanceAfterRaw) / 1e8,
      type: e.transactionType,
      reference: e.reference,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}

// silence unused
export const _serialize = serialize;

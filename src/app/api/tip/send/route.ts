import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { transferTip } from "@/lib/wallet";
import { pushChatNotify } from "@/lib/chat-push";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err("UNAUTHORIZED", 401);
  const body = await req.json().catch(() => ({}));
  const toUsername = String(body.toUsername || body.to || "").trim();
  const asset = String(body.asset || "USDT").toUpperCase();
  const amount = Number(body.amount);
  const message = body.message ? String(body.message).slice(0, 140) : undefined;
  if (!toUsername) return err("Recipient required");
  if (!amount || amount <= 0) return err("Invalid amount");
  if (amount > 100000) return err("Amount too large");

  const recipient = await db.user.findUnique({ where: { username: toUsername } });
  if (!recipient) return err("Recipient not found", 404);
  if (recipient.id === user.id) return err("Cannot tip yourself");

  const amountRaw = BigInt(Math.round(amount * 1e8));
  try {
    await transferTip({
      fromUserId: user.id,
      toUserId: recipient.id,
      asset,
      amountRaw,
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Tip failed");
  }

  // Push tip notification into chat (best-effort)
  pushChatNotify("tip", {
    from: user.username,
    to: recipient.username,
    amount,
    asset,
    message,
  }).catch(() => {});

  return json({
    ok: true,
    to: { username: recipient.username, avatar: recipient.avatar },
    amount,
    asset,
    message,
  });
}

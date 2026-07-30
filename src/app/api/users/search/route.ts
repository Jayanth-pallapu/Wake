import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { json } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 1) return json({ users: [] });
  const users = await db.user.findMany({
    where: { username: { contains: q } },
    take: 10,
    select: { id: true, username: true, avatar: true },
  });
  return json({
    users: users.map((u) => ({ id: u.id, username: u.username, avatar: u.avatar })),
  });
}

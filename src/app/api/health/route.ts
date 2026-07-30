import { json } from "@/lib/api";

export async function GET() {
  return json({ ok: true, ts: Date.now() });
}

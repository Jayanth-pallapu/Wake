import { NextRequest } from "next/server";
import { json, err } from "@/lib/api";
import { verifyBet } from "@/lib/provably-fair";

/** Public verification — anyone can re-derive an outcome from revealed seeds. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { serverSeed, clientSeed, nonce, game, params } = body;
  if (!serverSeed || !clientSeed || typeof nonce !== "number" || !game) {
    return err("Missing serverSeed, clientSeed, nonce, or game");
  }
  try {
    const result = verifyBet({ serverSeed, clientSeed, nonce, game, params });
    return json(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Verification failed");
  }
}

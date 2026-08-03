// Active Games State Manager — Hybrid Redis & In-Memory Store
// Supports both Vercel Serverless (via Upstash Redis) and Local Dev (via in-memory Map).
// Automatically picks Upstash Redis if UPSTASH_REDIS_REST_URL is configured.

import { Redis } from "@upstash/redis";
import type { Card } from "./provably-fair";

export type ActiveGameType = "mines" | "tower" | "hilo" | "videopoker" | "blackjack" | "cave";

export interface ActiveGame {
  gameId: string;
  userId: string;
  game: ActiveGameType;
  mineCount: number;
  difficulty: string;
  betRaw: bigint;
  asset: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  picks: number[];
  status: "active" | "busted" | "cashed" | "stood" | "finished";
  startedAt: number;
  grid: boolean[] | number[][];
  hiloCurrentCard?: Card;
  hiloChainMultiplier?: number;
  hiloDrawPos?: number;
  vpHand?: Card[];
  vpPhase?: "deal" | "draw";
  bjPlayerCards?: Card[];
  bjDealerCards?: Card[];
  bjDrawPos?: number;
  bjStatus?: "playing" | "stood" | "bust" | "done";
  caveLevels?: [number, number, number];
  caveSpins?: number;
}

// Check if Upstash Redis is configured
const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Local In-Memory Fallback
const memoryStore = new Map<string, ActiveGame>();
const TTL_MS = 10 * 60 * 1000;
const TTL_SECONDS = 600;

// Helper to serialize BigInt for JSON/Redis storage
function serializeGame(g: ActiveGame): Record<string, unknown> {
  return {
    ...g,
    betRaw: g.betRaw.toString(),
  };
}

// Helper to deserialize BigInt from stored JSON
function deserializeGame(raw: unknown): ActiveGame | undefined {
  if (!raw) return undefined;
  const obj = typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown>);
  if (!obj || !obj.gameId) return undefined;
  return {
    ...(obj as unknown as ActiveGame),
    betRaw: BigInt((obj.betRaw as string) || "0"),
  };
}

export async function createGame(g: ActiveGame): Promise<void> {
  if (redis) {
    const key = `active_game:${g.gameId}`;
    const userKey = `user_active_game:${g.userId}:${g.game}`;
    const serialized = JSON.stringify(serializeGame(g));
    await redis.set(key, serialized, { ex: TTL_SECONDS });
    await redis.set(userKey, g.gameId, { ex: TTL_SECONDS });
  } else {
    // In-Memory fallback
    for (const [id, game] of memoryStore) {
      if (game.userId === g.userId && Date.now() - game.startedAt > TTL_MS) {
        memoryStore.delete(id);
      }
    }
    memoryStore.set(g.gameId, g);
  }
}

export async function getGame(gameId: string): Promise<ActiveGame | undefined> {
  if (redis) {
    const raw = await redis.get<unknown>(`active_game:${gameId}`);
    return deserializeGame(raw);
  } else {
    const g = memoryStore.get(gameId);
    if (!g) return undefined;
    if (Date.now() - g.startedAt > TTL_MS) {
      memoryStore.delete(gameId);
      return undefined;
    }
    return g;
  }
}

export async function updateGame(gameId: string, patch: Partial<ActiveGame>): Promise<ActiveGame | undefined> {
  const g = await getGame(gameId);
  if (!g) return undefined;
  const updated: ActiveGame = { ...g, ...patch };
  if (redis) {
    const key = `active_game:${gameId}`;
    await redis.set(key, JSON.stringify(serializeGame(updated)), { ex: TTL_SECONDS });
  } else {
    memoryStore.set(gameId, updated);
  }
  return updated;
}

export async function deleteGame(gameId: string, userId?: string, gameType?: ActiveGameType): Promise<void> {
  if (redis) {
    await redis.del(`active_game:${gameId}`);
    if (userId && gameType) {
      await redis.del(`user_active_game:${userId}:${gameType}`);
    }
  } else {
    memoryStore.delete(gameId);
  }
}

export async function userActiveGame(userId: string, game: ActiveGameType): Promise<ActiveGame | undefined> {
  if (redis) {
    const activeId = await redis.get<string>(`user_active_game:${userId}:${game}`);
    if (!activeId) return undefined;
    return await getGame(activeId);
  } else {
    for (const g of memoryStore.values()) {
      if (g.userId === userId && g.game === game && g.status === "active") return g;
    }
    return undefined;
  }
}

// In-memory store for active stateful games (Mines, Tower).
// Single dev process — acceptable for demo. Each game captures the seed/nonce
// triple at creation so reveals are deterministic without re-reading the user row.

export interface ActiveGame {
  gameId: string;
  userId: string;
  game: "mines" | "tower";
  mineCount: number; // for mines
  difficulty: string; // for tower
  betRaw: bigint;
  asset: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  picks: number[];
  status: "active" | "busted" | "cashed";
  startedAt: number;
  // cached grid for fast reveal
  grid: boolean[] | number[][];
}

const store = new Map<string, ActiveGame>();

// Auto-expire games older than 10 minutes (cleanup)
const TTL_MS = 10 * 60 * 1000;

export function createGame(g: ActiveGame): void {
  // expire old games for this user
  for (const [id, game] of store) {
    if (game.userId === g.userId && Date.now() - game.startedAt > TTL_MS) {
      store.delete(id);
    }
  }
  store.set(g.gameId, g);
}

export function getGame(gameId: string): ActiveGame | undefined {
  const g = store.get(gameId);
  if (!g) return undefined;
  if (Date.now() - g.startedAt > TTL_MS) {
    store.delete(gameId);
    return undefined;
  }
  return g;
}

export function updateGame(gameId: string, patch: Partial<ActiveGame>): ActiveGame | undefined {
  const g = store.get(gameId);
  if (!g) return undefined;
  Object.assign(g, patch);
  return g;
}

export function deleteGame(gameId: string): void {
  store.delete(gameId);
}

export function userActiveGame(userId: string, game: "mines" | "tower"): ActiveGame | undefined {
  for (const g of store.values()) {
    if (g.userId === userId && g.game === game && g.status === "active") return g;
  }
  return undefined;
}

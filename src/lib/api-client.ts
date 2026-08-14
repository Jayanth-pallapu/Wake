// Frontend API client — typed fetch wrappers with BigInt-safe JSON parsing.
// All monetary values are sent/received as strings (raw 1e8 units) to preserve precision.

const BASE = "";

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const errBody = (body && typeof body === "object" && "error" in body)
      ? String((body as Record<string, unknown>).error)
      : undefined;
    const msg = errBody || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, body);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
};

// --- Typed response shapes ---

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  role: string;
  isAdmin: boolean;
  clientSeed: string;
  serverSeedHash: string;
  nonce: number;
  gamesPlayed: number;
  vipTier: { name: string; level: number; rakebackPct: number } | null;
}

export interface WalletEntry {
  asset: string;
  name: string;
  icon: string;
  color: string;
  balanceRaw: string;
  balance: number;
  usdValue: number;
  decimals: number;
}
export interface WalletResponse {
  wallets: WalletEntry[];
  totalUsdValue: number;
  lifetimeWagerUsd: number;
}

export interface PlayResponse {
  ok: boolean;
  bet: {
    id: string;
    game: string;
    asset: string;
    betRaw: string;
    bet: number;
    payoutRaw: string;
    payout: number;
    multiplier: number;
    win: boolean;
    outcome: Record<string, unknown>;
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    serverSeedHash: string;
    createdAt: string;
  };
  balanceAfterRaw: string;
  balanceAfter: number;
  nonce: number;
}

export interface SeedInfo {
  active: { serverSeedHash: string; clientSeed: string; nonce: number };
  previous: {
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  } | null;
}

export interface VipStatus {
  currentTier: { name: string; level: number; rakebackPct: number; color: string; dedicatedHost: boolean };
  nextTier: {
    name: string; level: number; requiredWagerUsd: number; rakebackPct: number; levelUpBonusUsd: number;
  } | null;
  lifetimeWagerUsd: number;
  progressPct: number;
  rakebacks: { asset: string; pendingRaw: string; pending: number; rakebackPct: number }[];
  allTiers: {
    name: string; level: number; requiredWagerUsd: number; rakebackPct: number;
    levelUpBonusUsd: number; dedicatedHost: boolean; color: string; reached: boolean;
  }[];
}

export interface LeaderboardResponse {
  wagerers: { rank: number; username: string; avatar: string | null; lifetimeWagerUsd: number; gamesPlayed: number }[];
  recentWins: {
    id: string; username: string; avatar: string | null; game: string; asset: string;
    bet: number; multiplier: number; payout: number; createdAt: string;
  }[];
}

export interface SportsMatch {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league: string;
  startTime: string;
  status: "upcoming" | "live" | "ended";
  liveMinute?: number;
  scoreHome?: number;
  scoreAway?: number;
  odds: {
    home: number;
    draw: number | null;
    away: number;
    overUnder?: { line: number; over: number; under: number };
    btts?: { yes: number; no: number };
  };
}

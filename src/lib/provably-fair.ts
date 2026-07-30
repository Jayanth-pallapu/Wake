// Provably Fair Engine — HMAC-SHA256 based deterministic outcome generators.
// Implements standard Stake/Hash.game-style provably fair mechanics.
//
// Flow:
//   1. Server generates 64-char hex serverSeed (secret). serverSeedHash = SHA256(serverSeed) is shown pre-bet.
//   2. User provides clientSeed (or browser auto-generates).
//   3. nonce increments per bet for each (serverSeed, clientSeed) pair.
//   4. outcome = HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}`) → hex bytes → game-specific mapping.
//
// All functions are PURE & DETERMINISTIC given the same seeds + nonce.
// Unit tests (mental): same inputs → same output, always.

import { createHmac, createHash, randomBytes } from "crypto";

const HASH_ENCODING = "hex" as const;

/** Generate a fresh 64-char hex server seed. */
export function generateServerSeed(): string {
  return randomBytes(32).toString(HASH_ENCODING); // 64 hex chars
}

/** SHA-256 hash of the server seed — revealed to user before betting so they can verify post-rotation. */
export function hashServerSeed(serverSeed: string): string {
  return createHash("sha256").update(serverSeed).digest(HASH_ENCODING);
}

/** Generate a random client seed (browser-side can also do this). */
export function generateClientSeed(): string {
  return randomBytes(8).toString(HASH_ENCODING);
}

/**
 * Core HMAC-SHA256. Returns the full 64-char hex digest.
 * message = `${clientSeed}:${nonce}`
 */
export function hmacSha256(serverSeed: string, clientSeed: string, nonce: number): string {
  const message = `${clientSeed}:${nonce}`;
  return createHmac("sha256", serverSeed).update(message).digest(HASH_ENCODING);
}

/**
 * Convert a slice of the HMAC hex digest into a float in [0, 1).
 * Takes `bytes` worth of hex chars (2 chars per byte) from `offset`.
 */
function hexSliceToFloat(hex: string, offset: number, bytes: number): number {
  const slice = hex.slice(offset, offset + bytes * 2);
  const int = parseInt(slice, 16);
  const divisor = 16 ** (bytes * 2); // 2^... 
  return int / divisor;
}

/**
 * Generic "result float" in [0, 1) — used by most games as the raw entropy.
 * Takes first 8 bytes (16 hex chars) of the HMAC.
 */
export function resultFloat(serverSeed: string, clientSeed: string, nonce: number): number {
  const hmac = hmacSha256(serverSeed, clientSeed, nonce);
  return hexSliceToFloat(hmac, 0, 8);
}

/**
 * Generate `count` distinct floats by taking successive 8-byte windows of the HMAC,
 * extending with additional HMAC rounds (nonce+n) when needed. Used for Plinko/Mines/Keno.
 */
export function resultFloats(serverSeed: string, clientSeed: string, nonce: number, count: number): number[] {
  const out: number[] = [];
  let round = 0;
  while (out.length < count) {
    const hmac = hmacSha256(serverSeed, clientSeed, nonce + round);
    // 4 floats per HMAC (each uses 8 hex chars = 4 bytes... actually 16 hex chars = 8 bytes each → 4 floats per 64-char hmac)
    for (let i = 0; i < 4 && out.length < count; i++) {
      out.push(hexSliceToFloat(hmac, i * 16, 8));
    }
    round++;
  }
  return out;
}

// =====================================================================
// GAME-SPECIFIC OUTCOME MAPPINGS
// =====================================================================

/** 1% house edge (configurable). maxWin = 1e6x cap. */
const HOUSE_EDGE = 0.01;
const MAX_MULTIPLIER = 1_000_000;

/**
 * CRASH — multiplier at which the round crashes.
 * With house edge h, P(crash >= x) = (1 - h) / x  →  x = (1 - h) / float
 * Special instant-bust when float maps below h: crash = 1.00
 */
export function crashMultiplier(serverSeed: string, clientSeed: string, nonce: number): number {
  const f = resultFloat(serverSeed, clientSeed, nonce);
  // f in [0,1). If f == 0 → instant bust at 1.00
  if (f === 0) return 1.0;
  // 1% house edge: crash = (1 - h) / (1 - f)  → guarantees P(crash >= x) = (1-h)/x
  const h = HOUSE_EDGE;
  let m = (1 - h) / (1 - f);
  // Clamp
  m = Math.min(m, MAX_MULTIPLIER);
  return Math.max(1.0, Math.floor(m * 100) / 100); // 2 decimals
}

/**
 * DICE — roll in [0, 100) with 4-decimal precision (0.00–99.99).
 * rollUnder target wins if roll < target. House edge 1% baked into payout calc (done in API).
 */
export function diceRoll(serverSeed: string, clientSeed: string, nonce: number): number {
  const f = resultFloat(serverSeed, clientSeed, nonce);
  return Math.floor(f * 10000) / 100; // 0.00 → 99.99
}

/**
 * LIMBO — target a multiplier; win if rolled multiplier >= target.
 * Same formula as crash but called per-bet (not a shared round).
 */
export function limboMultiplier(serverSeed: string, clientSeed: string, nonce: number): number {
  const f = resultFloat(serverSeed, clientSeed, nonce);
  if (f === 0) return 1.0;
  const h = HOUSE_EDGE;
  let m = (1 - h) / (1 - f);
  m = Math.min(m, MAX_MULTIPLIER);
  return Math.floor(m * 100) / 100;
}

/**
 * PLINKO — drop a ball through 16 rows of pegs (8.5 → 0.5 risk levels supported via multiplier tables).
 * Returns array of 0/1 directions (0 = left, 1 = right) for 16 rows → final bucket index 0..16.
 * Default risk = "low"; multiplier tables defined here.
 */
export const PLINKO_ROWS = 16;
export type PlinkoRisk = "low" | "medium" | "high";

// 17 buckets (index 0..16). Symmetric.
export const PLINKO_MULTIPLIERS: Record<PlinkoRisk, number[]> = {
  low: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  medium: [110, 13, 4, 2, 0.7, 0.5, 0.3, 0.2, 0.2, 0.2, 0.3, 0.5, 0.7, 2, 4, 13, 110],
  high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
};

export function plinkoPath(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  rows: number = PLINKO_ROWS
): { directions: number[]; bucket: number; multiplier: number; risk?: PlinkoRisk } {
  const floats = resultFloats(serverSeed, clientSeed, nonce, rows);
  const directions = floats.map((f) => (f < 0.5 ? 0 : 1));
  const bucket = directions.reduce((sum, d) => sum + d, 0); // 0..rows
  return { directions, bucket, multiplier: 0, risk: undefined };
}

/** Resolve plinko multiplier given risk + path. */
export function plinkoMultiplier(risk: PlinkoRisk, bucket: number): number {
  const table = PLINKO_MULTIPLIERS[risk];
  return table[bucket] ?? 0;
}

/**
 * MINES — given a 5x5 grid (25 tiles) with `mineCount` mines,
 * returns array of 25 booleans (true = mine) using successive floats.
 * First `mineCount` positions in a Fisher-Yates-style shuffle indicate mines.
 */
export function minesGrid(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  mineCount: number
): boolean[] {
  const tiles = 25;
  if (mineCount < 1 || mineCount > 24) throw new Error("mineCount must be 1..24");
  const floats = resultFloats(serverSeed, clientSeed, nonce, tiles);
  // Fisher-Yates: index array 0..24, shuffle using floats, mark first mineCount as mines
  const arr = Array.from({ length: tiles }, (_, i) => i);
  for (let i = tiles - 1; i > 0; i--) {
    const j = Math.floor(floats[i] * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const mineSet = new Set(arr.slice(0, mineCount));
  const grid: boolean[] = [];
  for (let i = 0; i < tiles; i++) grid.push(mineSet.has(i));
  return grid;
}

/** Mines fair payout multiplier for picking `picks` safe tiles with `mineCount` mines (1% edge). */
export function minesMultiplier(mineCount: number, picks: number): number {
  if (picks < 1) return 0;
  const tiles = 25;
  // fair multiplier product: prod_{i=0}^{picks-1} (tiles - mineCount - i) / (tiles - i)
  let fair = 1;
  for (let i = 0; i < picks; i++) {
    fair *= (tiles - mineCount - i) / (tiles - i);
  }
  // apply 1% house edge
  const m = (1 - HOUSE_EDGE) / fair;
  return Math.floor(m * 100) / 100;
}

/**
 * WHEEL — pick a segment on a wheel of `segments` count with given multiplier table.
 * Returns segment index.
 */
export function wheelSpin(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  segments: number
): number {
  const f = resultFloat(serverSeed, clientSeed, nonce);
  return Math.floor(f * segments);
}

export type WheelRisk = "low" | "medium" | "high";
export const WHEEL_CONFIG: Record<WheelRisk, { segments: number; multipliers: number[] }> = {
  low: { segments: 20, multipliers: [0, 0, 1.5, 0, 1.2, 0, 1.2, 0, 1.2, 0, 1.2, 0, 1.5, 0, 1.2, 0, 1.2, 0, 1.2, 0] },
  medium: { segments: 20, multipliers: [0, 0, 0, 2, 0, 0, 1.5, 0, 0, 2, 0, 0, 1.5, 0, 0, 2, 0, 0, 1.5, 0] },
  high: { segments: 20, multipliers: [0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0] },
};

/**
 * TOWER — rows of tiles, one safe per row. Returns array of safe-tile-index per row.
 * 9 columns wide, configurable difficulty.
 */
export type TowerDifficulty = "easy" | "medium" | "hard";
export const TOWER_CONFIG: Record<TowerDifficulty, { safePerRow: number; rows: number }> = {
  easy: { safePerRow: 4, rows: 9 },
  medium: { safePerRow: 3, rows: 9 },
  hard: { safePerRow: 2, rows: 9 },
};

export function towerGrid(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  difficulty: TowerDifficulty
): number[][] {
  const { safePerRow, rows } = TOWER_CONFIG[difficulty];
  const cols = 9;
  const safeCount = safePerRow;
  const floats = resultFloats(serverSeed, clientSeed, nonce, rows);
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    // pick `safeCount` distinct safe columns using float r
    const idx = Array.from({ length: cols }, (_, i) => i);
    for (let i = cols - 1; i > 0; i--) {
      const j = Math.floor(floats[r] * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    grid.push(idx.slice(0, safeCount).sort((a, b) => a - b));
  }
  return grid;
}

export function towerMultiplier(difficulty: TowerDifficulty, climbedRows: number): number {
  if (climbedRows < 1) return 0;
  const { safePerRow, rows } = TOWER_CONFIG[difficulty];
  const p = safePerRow / 9;
  let fair = 1;
  for (let i = 0; i < climbedRows; i++) fair *= p;
  const m = (1 - HOUSE_EDGE) / fair;
  return Math.floor(m * 100) / 100;
}

/**
 * KENO — pick up to 10 numbers out of 40. Returns the 10 "drawn" numbers (1..40).
 */
export function kenoDraw(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number[] {
  const floats = resultFloats(serverSeed, clientSeed, nonce, 40);
  const idx = Array.from({ length: 40 }, (_, i) => i + 1);
  for (let i = 39; i > 0; i--) {
    const j = Math.floor(floats[i] * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, 10).sort((a, b) => a - b);
}

// Keno payout table (multiplier per number of matches), keyed by picks.
// Simplified: payout = matches-based, 1% edge approximated.
export function kenoMultiplier(picks: number, matches: number): number {
  // payout table [picks][matches]
  const table: Record<number, number[]> = {
    1: [0, 3.96],
    2: [0, 0, 12],
    3: [0, 0, 2, 42],
    4: [0, 0, 1, 5, 110],
    5: [0, 0, 0, 2, 15, 420],
    6: [0, 0, 0, 1, 5, 60, 1100],
    7: [0, 0, 0, 0, 2, 10, 100, 2000],
    8: [0, 0, 0, 0, 1, 5, 25, 250, 5000],
    9: [0, 0, 0, 0, 0, 2, 10, 50, 500, 10000],
    10: [0, 0, 0, 0, 0, 1, 5, 20, 100, 1000, 50000],
  };
  const row = table[picks] || table[10];
  return row[matches] || 0;
}

// =====================================================================
// VERIFICATION (public, client-reproducible)
// =====================================================================

export interface VerificationInput {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  game: string;
  params?: Record<string, unknown>;
}

export interface VerificationResult {
  ok: boolean;
  serverSeedHash: string;
  hmac: string;
  outcome: Record<string, unknown>;
}

/** Re-derive an outcome from revealed seeds — used by the /api/games/verify endpoint & client. */
export function verifyBet(input: VerificationInput): VerificationResult {
  const { serverSeed, clientSeed, nonce, game, params } = input;
  const serverSeedHash = hashServerSeed(serverSeed);
  const hmac = hmacSha256(serverSeed, clientSeed, nonce);
  let outcome: Record<string, unknown> = {};
  switch (game) {
    case "crash":
      outcome = { multiplier: crashMultiplier(serverSeed, clientSeed, nonce) };
      break;
    case "dice":
      outcome = { roll: diceRoll(serverSeed, clientSeed, nonce) };
      break;
    case "limbo":
      outcome = { multiplier: limboMultiplier(serverSeed, clientSeed, nonce) };
      break;
    case "plinko": {
      const path = plinkoPath(serverSeed, clientSeed, nonce, PLINKO_ROWS);
      const risk = (params?.risk as PlinkoRisk) || "low";
      outcome = { ...path, multiplier: plinkoMultiplier(risk, path.bucket), risk };
      break;
    }
    case "mines": {
      const mineCount = (params?.mineCount as number) || 1;
      outcome = { grid: minesGrid(serverSeed, clientSeed, nonce, mineCount), mineCount };
      break;
    }
    case "wheel": {
      const risk = (params?.risk as WheelRisk) || "low";
      const cfg = WHEEL_CONFIG[risk];
      const seg = wheelSpin(serverSeed, clientSeed, nonce, cfg.segments);
      outcome = { segment: seg, multiplier: cfg.multipliers[seg], risk };
      break;
    }
    case "tower": {
      const difficulty = (params?.difficulty as TowerDifficulty) || "easy";
      outcome = { grid: towerGrid(serverSeed, clientSeed, nonce, difficulty), difficulty };
      break;
    }
    case "keno": {
      outcome = { draw: kenoDraw(serverSeed, clientSeed, nonce) };
      break;
    }
    default:
      outcome = { float: resultFloat(serverSeed, clientSeed, nonce) };
  }
  return { ok: true, serverSeedHash, hmac, outcome };
}

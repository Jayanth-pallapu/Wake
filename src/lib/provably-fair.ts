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
  let bucket = 0;
  for (const d of directions) { if (d) bucket++; } // count right-turns: 0..rows
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
    case "hilo":
      outcome = { card: hiloCard(serverSeed, clientSeed, nonce) };
      break;
    case "coinflip":
      outcome = { result: coinFlip(serverSeed, clientSeed, nonce) };
      break;
    case "dragontiger": {
      const deal = dragonTigerDeal(serverSeed, clientSeed, nonce);
      outcome = { ...deal };
      break;
    }
    case "baccarat": {
      const deal = baccaratDeal(serverSeed, clientSeed, nonce);
      outcome = { ...deal };
      break;
    }
    case "blackjack": {
      const deal = blackjackDeal(serverSeed, clientSeed, nonce);
      outcome = { ...deal };
      break;
    }
    case "videopoker": {
      const hand = videoPokerDeal(serverSeed, clientSeed, nonce);
      outcome = { hand };
      break;
    }
    case "roulette":
      outcome = { number: rouletteRoll(serverSeed, clientSeed, nonce) };
      break;
    case "fastcrash":
      outcome = { multiplier: crashMultiplier(serverSeed, clientSeed, nonce) };
      break;
    case "twist": {
      const spin = twistSpin(serverSeed, clientSeed, nonce);
      outcome = spin;
      break;
    }
    case "cave": {
      const col = ((params?.column as number) || 0) as Parameters<typeof cavePlunderDraw>[3];
      outcome = cavePlunderDraw(serverSeed, clientSeed, nonce, col);
      break;
    }
    default:
      outcome = { float: resultFloat(serverSeed, clientSeed, nonce) };
  }
  return { ok: true, serverSeedHash, hmac, outcome };
}

// =====================================================================
// CARD TYPES & DECK UTILITIES
// =====================================================================

export type Suit = "♠" | "♥" | "♦" | "♣";
export type SuitName = "spades" | "hearts" | "diamonds" | "clubs";

export interface Card {
  index: number;    // 0-51
  value: number;    // 1-13 (Ace=1, 2-9=pip, 10=Ten, 11=Jack, 12=Queen, 13=King)
  rank: string;     // 'A','2',…,'10','J','Q','K'
  suit: Suit;
  suitName: SuitName;
  color: "red" | "black";
}

export type PokerHandRank =
  | "royal-flush" | "straight-flush" | "four-of-a-kind" | "full-house"
  | "flush" | "straight" | "three-of-a-kind" | "two-pair" | "jacks-or-better"
  | "high-card";

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const SUIT_NAMES: SuitName[] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function indexToCard(index: number): Card {
  const suitIdx = Math.floor(index / 13);
  const valIdx = index % 13;
  const value = valIdx + 1; // 1–13
  return {
    index,
    value,
    rank: RANKS[valIdx],
    suit: SUITS[suitIdx],
    suitName: SUIT_NAMES[suitIdx],
    color: suitIdx === 1 || suitIdx === 2 ? "red" : "black",
  };
}

/**
 * Fisher-Yates shuffle a 52-card deck using HMAC floats.
 * Returns card indices 0–51.
 */
function shuffleDeck(serverSeed: string, clientSeed: string, nonce: number): number[] {
  const floats = resultFloats(serverSeed, clientSeed, nonce, 52);
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 51; i > 0; i--) {
    const j = Math.floor(floats[i] * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// =====================================================================
// HILO
// =====================================================================

/** HiLo — deal one card by position in a shuffled deck. */
export function hiloCard(serverSeed: string, clientSeed: string, nonce: number): Card {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce);
  return indexToCard(deck[0]);
}

/**
 * HiLo multiplier for guessing correctly given the current card.
 * higher: wins if next card value > current; lower: wins if < current.
 * Equal cards are a loss. House edge 1%.
 */
export function hiloMultiplier(
  direction: "higher" | "lower",
  currentValue: number
): number {
  const total = 52;
  let winCards: number;
  if (direction === "higher") {
    // cards with value > currentValue: (13 - currentValue) suits × 4
    winCards = (13 - currentValue) * 4;
  } else {
    // cards with value < currentValue: (currentValue - 1) suits × 4
    winCards = (currentValue - 1) * 4;
  }
  if (winCards <= 0) return 0;
  const prob = winCards / (total - 1); // exclude current card
  const m = (1 - HOUSE_EDGE) / prob;
  return Math.floor(m * 100) / 100;
}

// =====================================================================
// COIN FLIP
// =====================================================================

/** Coin Flip — returns "heads" or "tails". */
export function coinFlip(serverSeed: string, clientSeed: string, nonce: number): "heads" | "tails" {
  const f = resultFloat(serverSeed, clientSeed, nonce);
  return f < 0.5 ? "heads" : "tails";
}

// =====================================================================
// DRAGON TIGER
// =====================================================================

export interface DragonTigerResult {
  dragon: Card;
  tiger: Card;
  winner: "dragon" | "tiger" | "tie";
}

/** Dragon Tiger — one card each to Dragon and Tiger. Higher value wins. */
export function dragonTigerDeal(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): DragonTigerResult {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce);
  const dragon = indexToCard(deck[0]);
  const tiger = indexToCard(deck[1]);
  let winner: "dragon" | "tiger" | "tie";
  if (dragon.value > tiger.value) winner = "dragon";
  else if (tiger.value > dragon.value) winner = "tiger";
  else winner = "tie";
  return { dragon, tiger, winner };
}

// =====================================================================
// BACCARAT
// =====================================================================

/** Baccarat card point value: A=1, 2-9=pip, 10/J/Q/K=0 */
function baccaratValue(card: Card): number {
  return card.value >= 10 ? 0 : card.value;
}

/** Baccarat total — sum mod 10. */
function baccaratTotal(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + baccaratValue(c), 0) % 10;
}

export interface BaccaratResult {
  playerCards: Card[];
  bankerCards: Card[];
  playerTotal: number;
  bankerTotal: number;
  winner: "player" | "banker" | "tie";
}

/**
 * Baccarat — standard third-card rules.
 * Player draws on 0-5; banker draws based on standard rule table.
 */
export function baccaratDeal(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): BaccaratResult {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce);
  let pos = 0;
  const draw = () => indexToCard(deck[pos++]);

  const playerCards: Card[] = [draw(), draw()];
  const bankerCards: Card[] = [draw(), draw()];

  let playerTotal = baccaratTotal(playerCards);
  let bankerTotal = baccaratTotal(bankerCards);

  // Natural — no more cards
  if (playerTotal < 8 && bankerTotal < 8) {
    let playerDrewThird = false;
    let playerThird: Card | undefined;

    // Player draws on 0-5
    if (playerTotal <= 5) {
      playerThird = draw();
      playerCards.push(playerThird);
      playerTotal = baccaratTotal(playerCards);
      playerDrewThird = true;
    }

    // Banker draw rules
    let bankerDraws = false;
    if (!playerDrewThird) {
      bankerDraws = bankerTotal <= 5;
    } else {
      const pt = playerThird!.value >= 10 ? 0 : playerThird!.value;
      if (bankerTotal <= 2) bankerDraws = true;
      else if (bankerTotal === 3) bankerDraws = pt !== 8;
      else if (bankerTotal === 4) bankerDraws = pt >= 2 && pt <= 7;
      else if (bankerTotal === 5) bankerDraws = pt >= 4 && pt <= 7;
      else if (bankerTotal === 6) bankerDraws = pt === 6 || pt === 7;
    }
    if (bankerDraws) {
      bankerCards.push(draw());
      bankerTotal = baccaratTotal(bankerCards);
    }
  }

  let winner: "player" | "banker" | "tie";
  if (playerTotal > bankerTotal) winner = "player";
  else if (bankerTotal > playerTotal) winner = "banker";
  else winner = "tie";

  return { playerCards, bankerCards, playerTotal, bankerTotal, winner };
}

// =====================================================================
// BLACKJACK
// =====================================================================

/** Blackjack card value — Ace=11 (or 1 via hand evaluation), J/Q/K=10 */
export function bjCardValue(card: Card): number {
  if (card.value === 1) return 11; // Ace initially 11
  if (card.value >= 10) return 10; // 10, J, Q, K
  return card.value;
}

/** Calculate blackjack hand total, adjusting aces down as needed. */
export function bjHandTotal(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    const v = bjCardValue(c);
    total += v;
    if (c.value === 1) aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

/** Returns true if hand is a natural blackjack (2 cards totalling 21). */
export function isNaturalBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && bjHandTotal(cards) === 21;
}

export interface BlackjackDeal {
  playerCards: Card[];
  dealerCards: Card[];    // second dealer card is face-down (not revealed until stand)
  playerTotal: number;
  dealerVisible: number;  // total of only the face-up dealer card
}

/**
 * Blackjack initial deal — 2 cards to player, 2 to dealer (one face-down).
 * Uses shuffled deck, positions 0/2 to player, 1/3 to dealer.
 */
export function blackjackDeal(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): BlackjackDeal {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce);
  const playerCards = [indexToCard(deck[0]), indexToCard(deck[2])];
  const dealerCards = [indexToCard(deck[1]), indexToCard(deck[3])];
  return {
    playerCards,
    dealerCards,
    playerTotal: bjHandTotal(playerCards),
    dealerVisible: bjCardValue(dealerCards[0]),
  };
}

/**
 * Draw additional cards for blackjack hit/double from the same deck,
 * starting at position `startPos` (4 cards already dealt at 0-3).
 */
export function blackjackDraw(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number,
  startPos: number = 4
): Card[] {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce);
  return Array.from({ length: count }, (_, i) => indexToCard(deck[startPos + i]));
}

// =====================================================================
// VIDEO POKER (Jacks or Better)
// =====================================================================

/** Deal initial 5-card hand from shuffled deck (positions 0-4). */
export function videoPokerDeal(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Card[] {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce);
  return [0, 1, 2, 3, 4].map((i) => indexToCard(deck[i]));
}

/**
 * Draw replacement cards.
 * `hold` = boolean[5] — true = keep, false = replace.
 * Replacement cards come from positions 5-9 of the same deck.
 */
export function videoPokerDraw(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  hold: boolean[]
): Card[] {
  const deck = shuffleDeck(serverSeed, clientSeed, nonce);
  const initial = [0, 1, 2, 3, 4].map((i) => indexToCard(deck[i]));
  let replaceIdx = 5;
  return initial.map((card, i) => (hold[i] ? card : indexToCard(deck[replaceIdx++])));
}

/** Evaluate a 5-card Jacks-or-Better hand. Returns rank + payout multiplier (1 unit bet). */
export function evaluatePokerHand(hand: Card[]): { rank: PokerHandRank; multiplier: number } {
  const values = hand.map((c) => c.value).sort((a, b) => a - b);
  const suits = hand.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);
  const isStraight = (() => {
    // Special case: A-2-3-4-5 (wheel) — already sorted with Ace=1
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1] + 1) return false;
    }
    return true;
  })();
  // Royal check: 10, J, Q, K, A — values would be [1,10,11,12,13] sorted
  const isRoyal =
    isFlush &&
    values[0] === 1 && values[1] === 10 && values[2] === 11 && values[3] === 12 && values[4] === 13;

  const counts: Record<number, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const groups = Object.values(counts).sort((a, b) => b - a);

  if (isRoyal) return { rank: "royal-flush", multiplier: 800 };
  if (isFlush && isStraight) return { rank: "straight-flush", multiplier: 50 };
  if (groups[0] === 4) return { rank: "four-of-a-kind", multiplier: 25 };
  if (groups[0] === 3 && groups[1] === 2) return { rank: "full-house", multiplier: 9 };
  if (isFlush) return { rank: "flush", multiplier: 6 };
  if (isStraight) return { rank: "straight", multiplier: 4 };
  if (groups[0] === 3) return { rank: "three-of-a-kind", multiplier: 3 };
  if (groups[0] === 2 && groups[1] === 2) return { rank: "two-pair", multiplier: 2 };
  // Jacks or better: a pair of J, Q, K, or A (value 1/11/12/13)
  if (groups[0] === 2) {
    const pairValue = Number(
      Object.entries(counts).find(([, c]) => c === 2)?.[0] ?? 0
    );
    if (pairValue >= 11 || pairValue === 1) return { rank: "jacks-or-better", multiplier: 1 };
  }
  return { rank: "high-card", multiplier: 0 };
}

// =====================================================================
// ROULETTE (European — 0-36)
// =====================================================================

const ROULETTE_RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

/** Roulette — returns winning number 0-36. */
export function rouletteRoll(serverSeed: string, clientSeed: string, nonce: number): number {
  const f = resultFloat(serverSeed, clientSeed, nonce);
  return Math.floor(f * 37); // 0-36
}

/** Calculate roulette payout multiplier for a given bet type and winning number. */
export function rouletteMultiplier(
  betType: string,
  betValue: string | number,
  winNumber: number
): number {
  switch (betType) {
    case "straight":  return Number(betValue) === winNumber ? 35 : 0;
    case "red":       return winNumber > 0 && ROULETTE_RED.has(winNumber) ? 1.96 : 0;
    case "black":     return winNumber > 0 && !ROULETTE_RED.has(winNumber) ? 1.96 : 0;
    case "even":      return winNumber > 0 && winNumber % 2 === 0 ? 1.96 : 0;
    case "odd":       return winNumber > 0 && winNumber % 2 !== 0 ? 1.96 : 0;
    case "low":       return winNumber >= 1 && winNumber <= 18 ? 1.96 : 0;
    case "high":      return winNumber >= 19 && winNumber <= 36 ? 1.96 : 0;
    case "dozen1":    return winNumber >= 1 && winNumber <= 12 ? 2.88 : 0;
    case "dozen2":    return winNumber >= 13 && winNumber <= 24 ? 2.88 : 0;
    case "dozen3":    return winNumber >= 25 && winNumber <= 36 ? 2.88 : 0;
    case "col1":      return winNumber % 3 === 1 ? 2.88 : 0;
    case "col2":      return winNumber % 3 === 2 ? 2.88 : 0;
    case "col3":      return winNumber % 3 === 0 && winNumber !== 0 ? 2.88 : 0;
    default:          return 0;
  }
}

// =====================================================================
// FAST CRASH
// =====================================================================

/** Fast Crash — identical math to Crash, just resolved instantly (no UI countdown). */
export const fastCrashMultiplier = crashMultiplier;

// =====================================================================
// TWIST (High-Volatility Wheel, 20 segments)
// =====================================================================

// Distribution: 10 × 0 | 4 × 1.2 | 3 × 2 | 1 × 5 | 1 × 10 | 0.5 × 50 | 0.3 × 200 | 0.1 × 1000 | 0.1 × 1000000
// Represented as a 20-slot table. Rare slots weighted fractionally via float thresholds.
const TWIST_THRESHOLDS: { threshold: number; multiplier: number }[] = [
  { threshold: 0.50, multiplier: 0 },      // 50% = 0x
  { threshold: 0.70, multiplier: 1.2 },    // 20% = 1.2x
  { threshold: 0.85, multiplier: 2 },      // 15% = 2x
  { threshold: 0.92, multiplier: 5 },      // 7%  = 5x
  { threshold: 0.96, multiplier: 10 },     // 4%  = 10x
  { threshold: 0.98, multiplier: 50 },     // 2%  = 50x
  { threshold: 0.992, multiplier: 200 },   // 1.2% = 200x
  { threshold: 0.998, multiplier: 1000 },  // 0.6% = 1000x
  { threshold: 1.00, multiplier: 1000000 },// 0.2% = 1,000,000x
];

export function twistSpin(serverSeed: string, clientSeed: string, nonce: number): {
  multiplier: number;
  segment: number;
  segmentLabel: string;
} {
  const f = resultFloat(serverSeed, clientSeed, nonce);
  for (const { threshold, multiplier } of TWIST_THRESHOLDS) {
    if (f < threshold) {
      const label = multiplier === 0 ? "0×" : `${multiplier.toLocaleString()}×`;
      return { multiplier, segment: TWIST_THRESHOLDS.indexOf({ threshold, multiplier }), segmentLabel: label };
    }
  }
  return { multiplier: 0, segment: 0, segmentLabel: "0×" };
}

// =====================================================================
// CAVE OF PLUNDER (3-column climber)
// =====================================================================

export type CaveColumn = 0 | 1 | 2; // Book | Amulet | Cross

// Multiplier at each level (8 levels per column)
export const CAVE_MULTIPLIERS: Record<CaveColumn, number[]> = {
  0: [0, 1.2, 2, 3.5, 6, 12, 30, 100],    // Book
  1: [0, 1.5, 2.5, 4, 8, 20, 60, 200],    // Amulet
  2: [0, 2, 4, 8, 20, 60, 200, 1000],     // Cross (jackpot)
};

// Symbol probabilities per level: advance (progress), hold (stay), reset (back to 0)
// Returns "advance" | "hold" | "reset"
export function cavePlunderDraw(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  column: CaveColumn,
): { symbol: "advance" | "hold" | "reset"; level: number } {
  const f = resultFloat(serverSeed, clientSeed, nonce);
  // Difficulty increases with column index
  const advanceProb = column === 0 ? 0.45 : column === 1 ? 0.38 : 0.30;
  const holdProb = 0.25;
  // rest = reset
  let symbol: "advance" | "hold" | "reset";
  if (f < advanceProb) symbol = "advance";
  else if (f < advanceProb + holdProb) symbol = "hold";
  else symbol = "reset";
  // level returned is new level after applying symbol (caller manages state)
  return { symbol, level: 0 };
}

/** Cave of Plunder payout multiplier given column levels. */
export function cavePayout(levels: [number, number, number]): number {
  let total = 0;
  for (let col = 0; col < 3; col++) {
    const lvl = Math.min(levels[col], 7);
    if (lvl > 0) total += CAVE_MULTIPLIERS[col as CaveColumn][lvl];
  }
  return Math.max(total, 0);
}

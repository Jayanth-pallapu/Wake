import { seededUsername } from './indian-names';

// ─── Tier Configuration ───────────────────────────────────────────────────────
export interface ContestTierConfig {
  tier: number;          // entry fee in USD
  periods: ContestPeriod[];
  topPoolCount: number;  // number of users in 60% pool
  topRankCount: number;  // number of users in 20% top-rank pool
  topRankPcts: number[]; // must sum to 1.0, length = topRankCount
}

export type ContestPeriod = 'daily' | 'weekly' | 'monthly';

export const CONTEST_TIERS: ContestTierConfig[] = [
  {
    tier: 10,
    periods: ['daily', 'weekly', 'monthly'],
    topPoolCount: 2000,
    topRankCount: 20,
    topRankPcts: [
      0.35, 0.18, 0.12,           // rank 1-3
      0.07, 0.07,                 // rank 4-5
      0.025, 0.025, 0.025, 0.025, 0.025, // rank 6-10
      0.005, 0.005, 0.005, 0.005, 0.005, // rank 11-15
      0.005, 0.005, 0.005, 0.005, 0.005, // rank 16-20
    ],
  },
  {
    tier: 50,
    periods: ['daily', 'weekly', 'monthly'],
    topPoolCount: 2000,
    topRankCount: 20,
    topRankPcts: [
      0.35, 0.18, 0.12,
      0.07, 0.07,
      0.025, 0.025, 0.025, 0.025, 0.025,
      0.005, 0.005, 0.005, 0.005, 0.005,
      0.005, 0.005, 0.005, 0.005, 0.005,
    ],
  },
  {
    tier: 100,
    periods: ['weekly', 'monthly'],
    topPoolCount: 1000,
    topRankCount: 15,
    topRankPcts: [
      0.35, 0.20, 0.13,
      0.08, 0.06,
      0.03, 0.03, 0.03, 0.03, 0.03,
      0.012, 0.012, 0.012, 0.012, 0.012,
    ],
  },
  {
    tier: 1000,
    periods: ['monthly'],
    topPoolCount: 500,
    topRankCount: 10,
    topRankPcts: [
      0.35, 0.20, 0.15,
      0.10, 0.08,
      0.04, 0.03, 0.02, 0.015, 0.005,
    ],
  },
];

// Simulated participant counts per tier+period for display
export const PARTICIPANT_COUNTS: Record<number, Record<ContestPeriod, number>> = {
  10:   { daily: 1_000_000, weekly: 1_500_000, monthly: 2_000_000 },
  50:   { daily: 250_000,   weekly: 500_000,   monthly: 1_000_000 },
  100:  { daily: 0,         weekly: 100_000,   monthly: 200_000 },
  1000: { daily: 0,         weekly: 0,         monthly: 100_000 },
};

// ─── PST Time Helpers ─────────────────────────────────────────────────────────
const PST_TZ = 'America/Los_Angeles';

function toPST(date: Date): Date {
  const str = date.toLocaleString('en-US', { timeZone: PST_TZ });
  return new Date(str);
}

/** Returns the next results time for a given period in UTC */
export function getNextResultsTime(period: ContestPeriod): Date {
  const now = new Date();
  const pst = toPST(now);

  if (period === 'daily') {
    // Next midnight PST
    const next = new Date(pst);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    // Convert back: find UTC offset for PST
    const utcStr = next.toLocaleString('en-US', { timeZone: 'UTC' });
    const pstStr = next.toLocaleString('en-US', { timeZone: PST_TZ });
    const offset = new Date(utcStr).getTime() - new Date(pstStr).getTime();
    return new Date(next.getTime() + offset);
  }

  if (period === 'weekly') {
    // Next Saturday midnight PST
    const dayOfWeek = pst.getDay(); // 0=Sun, 6=Sat
    const daysUntilSat = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
    const next = new Date(pst);
    next.setDate(next.getDate() + daysUntilSat);
    next.setHours(0, 0, 0, 0);
    const utcStr = next.toLocaleString('en-US', { timeZone: 'UTC' });
    const pstStr = next.toLocaleString('en-US', { timeZone: PST_TZ });
    const offset = new Date(utcStr).getTime() - new Date(pstStr).getTime();
    return new Date(next.getTime() + offset);
  }

  // monthly: 1st of next month midnight PST
  const next = new Date(pst);
  next.setMonth(next.getMonth() + 1, 1);
  next.setHours(0, 0, 0, 0);
  const utcStr = next.toLocaleString('en-US', { timeZone: 'UTC' });
  const pstStr = next.toLocaleString('en-US', { timeZone: PST_TZ });
  const offset = new Date(utcStr).getTime() - new Date(pstStr).getTime();
  return new Date(next.getTime() + offset);
}

/** Returns the closing time given results time and period */
export function getClosingTime(resultsAt: Date, period: ContestPeriod): Date {
  const cutoffHrs = period === 'daily' ? 2 : period === 'weekly' ? 12 : 24;
  return new Date(resultsAt.getTime() - cutoffHrs * 60 * 60 * 1000);
}

// ─── Prize Distribution ───────────────────────────────────────────────────────
export interface PrizeEntry {
  rank: number;
  prizeRaw: bigint;
}

/**
 * Compute prize distribution for a settled contest.
 * totalPoolRaw = total USDT collected (1e8 units)
 * Returns array of { rank, prizeRaw } for all winners.
 */
export function computePrizes(
  totalPoolRaw: bigint,
  cfg: ContestTierConfig
): PrizeEntry[] {
  const prizes: PrizeEntry[] = [];

  // 20% goes to top ranks (geometrically distributed)
  const topRankPool = (totalPoolRaw * 20n) / 100n;
  for (let i = 0; i < cfg.topRankCount; i++) {
    const pct = cfg.topRankPcts[i] ?? 0;
    const prize = BigInt(Math.round(Number(topRankPool) * pct));
    prizes.push({ rank: i + 1, prizeRaw: prize });
  }

  // 60% goes to top pool (split in 3 bands)
  const broadPool = (totalPoolRaw * 60n) / 100n;
  const band1Count = Math.min(79, cfg.topPoolCount - cfg.topRankCount);  // ranks 21-100
  const band2Count = Math.min(400, cfg.topPoolCount - cfg.topRankCount - band1Count); // 101-500
  const band3Count = cfg.topPoolCount - cfg.topRankCount - band1Count - band2Count;   // 501+

  const band1Prize = band1Count > 0 ? (broadPool * 30n) / 100n / BigInt(band1Count) : 0n;
  const band2Prize = band2Count > 0 ? (broadPool * 35n) / 100n / BigInt(Math.max(1, band2Count)) : 0n;
  const band3Prize = band3Count > 0 ? (broadPool * 35n) / 100n / BigInt(Math.max(1, band3Count)) : 0n;

  for (let r = cfg.topRankCount + 1; r <= cfg.topRankCount + band1Count; r++) {
    prizes.push({ rank: r, prizeRaw: band1Prize });
  }
  for (let r = cfg.topRankCount + band1Count + 1; r <= cfg.topRankCount + band1Count + band2Count; r++) {
    prizes.push({ rank: r, prizeRaw: band2Prize });
  }
  for (let r = cfg.topRankCount + band1Count + band2Count + 1; r <= cfg.topPoolCount; r++) {
    prizes.push({ rank: r, prizeRaw: band3Prize });
  }

  return prizes;
}

// ─── Bot Entry Generator ──────────────────────────────────────────────────────
export interface BotEntry {
  username: string;
  wagerRaw: bigint;
  avatarSeed: string;
}

/** Generate deterministic bot entries for a contest leaderboard */
export function generateBotEntries(count: number, tier: number, contestSeed: string): BotEntry[] {
  const bots: BotEntry[] = [];
  const baseWager = BigInt(tier) * 100_000_000n; // tier * 1e8 minimum
  for (let i = 0; i < count; i++) {
    // deterministic wager: decreasing with rank, with some variance
    const rankFactor = Math.pow(0.998, i); // slow decay
    const variance = ((i * 7919 + 13337) % 100) / 100; // pseudo-random 0-1
    const wagerMultiplier = rankFactor * (1 + variance * 2);
    const wagerRaw = BigInt(Math.round(Number(baseWager) * wagerMultiplier * (100 + i * 0.5)));
    bots.push({
      username: seededUsername(i + parseInt(contestSeed.slice(0, 6), 36) % 1000),
      wagerRaw,
      avatarSeed: `bot-${i}-${tier}`,
    });
  }
  // Sort descending by wager
  bots.sort((a, b) => (a.wagerRaw > b.wagerRaw ? -1 : 1));
  return bots;
}

/** Format prize for display */
export function formatPrize(raw: bigint): string {
  const usd = Number(raw) / 1e8;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}K`;
  return `$${usd.toFixed(2)}`;
}

/** Get display prize pool for a tier+period */
export function getDisplayPrizePool(tier: number, period: ContestPeriod): string {
  const pools: Record<number, Record<string, string>> = {
    10:   { daily: '$10M', weekly: '$15M', monthly: '$20M' },
    50:   { daily: '$12.5M', weekly: '$25M', monthly: '$50M' },
    100:  { daily: '-', weekly: '$10M', monthly: '$20M' },
    1000: { daily: '-', weekly: '-', monthly: '$100M' },
  };
  return pools[tier]?.[period] ?? '-';
}

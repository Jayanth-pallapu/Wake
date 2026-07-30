// Platform-wide constants: supported assets, VIP tiers, game configs.

export const UNIT = 100_000_000n; // 1e8 — smallest unit precision (satoshis-like)

export interface AssetConfig {
  symbol: string;
  name: string;
  icon: string; // emoji or short
  color: string; // tailwind text color class
  decimals: number;
  baseAmountRaw: bigint; // demo starting balance
  // approx USD value per 1 whole unit (for VIP wager conversion) — demo only
  usdPerUnit: number;
}

export const ASSETS: AssetConfig[] = [
  { symbol: "BTC", name: "Bitcoin", icon: "₿", color: "text-orange-400", decimals: 8, baseAmountRaw: 5_000n * UNIT / 100n, usdPerUnit: 62000 },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ", color: "text-indigo-300", decimals: 8, baseAmountRaw: 20_000n * UNIT / 100n, usdPerUnit: 3200 },
  { symbol: "USDT", name: "Tether", icon: "$", color: "text-green-400", decimals: 8, baseAmountRaw: 100n * UNIT, usdPerUnit: 1 },
  { symbol: "SOL", name: "Solana", icon: "◎", color: "text-purple-400", decimals: 8, baseAmountRaw: 50_000n * UNIT / 100n, usdPerUnit: 150 },
  { symbol: "LTC", name: "Litecoin", icon: "Ł", color: "text-slate-300", decimals: 8, baseAmountRaw: 100n * UNIT, usdPerUnit: 80 },
  { symbol: "XRP", name: "Ripple", icon: "✕", color: "text-sky-400", decimals: 8, baseAmountRaw: 500n * UNIT, usdPerUnit: 0.6 },
  { symbol: "DOGE", name: "Dogecoin", icon: "Ð", color: "text-yellow-400", decimals: 8, baseAmountRaw: 5000n * UNIT, usdPerUnit: 0.13 },
  { symbol: "BCH", name: "Bitcoin Cash", icon: "₿", color: "text-green-300", decimals: 8, baseAmountRaw: 50n * UNIT, usdPerUnit: 400 },
];

export const ASSET_MAP: Record<string, AssetConfig> = Object.fromEntries(
  ASSETS.map((a) => [a.symbol, a])
);

export const DEFAULT_ASSET = "USDT";

// --- VIP tiers (wager thresholds in USDT, converted to raw 1e8 at runtime) ---
export interface VipTierConfig {
  name: string;
  level: number;
  requiredWagerUsd: number;
  rakebackPct: number;
  levelUpBonusUsd: number;
  dedicatedHost: boolean;
  color: string; // tailwind gradient/text
}

export const VIP_TIERS: VipTierConfig[] = [
  { name: "Bronze", level: 1, requiredWagerUsd: 0, rakebackPct: 0.03, levelUpBonusUsd: 0, dedicatedHost: false, color: "from-amber-700 to-amber-900" },
  { name: "Silver", level: 2, requiredWagerUsd: 10_000, rakebackPct: 0.05, levelUpBonusUsd: 15, dedicatedHost: false, color: "from-slate-300 to-slate-500" },
  { name: "Gold", level: 3, requiredWagerUsd: 50_000, rakebackPct: 0.07, levelUpBonusUsd: 50, dedicatedHost: false, color: "from-yellow-400 to-amber-600" },
  { name: "Platinum I", level: 4, requiredWagerUsd: 100_000, rakebackPct: 0.09, levelUpBonusUsd: 110, dedicatedHost: false, color: "from-cyan-300 to-teal-500" },
  { name: "Platinum II", level: 5, requiredWagerUsd: 250_000, rakebackPct: 0.11, levelUpBonusUsd: 220, dedicatedHost: false, color: "from-cyan-200 to-teal-400" },
  { name: "Platinum III", level: 6, requiredWagerUsd: 500_000, rakebackPct: 0.125, levelUpBonusUsd: 500, dedicatedHost: false, color: "from-cyan-100 to-teal-300" },
  { name: "Platinum IV", level: 7, requiredWagerUsd: 1_000_000, rakebackPct: 0.14, levelUpBonusUsd: 1000, dedicatedHost: false, color: "from-fuchsia-300 to-purple-500" },
  { name: "Diamond", level: 8, requiredWagerUsd: 2_500_000, rakebackPct: 0.15, levelUpBonusUsd: 2500, dedicatedHost: true, color: "from-sky-200 to-indigo-400" },
];

/** Safe USD → raw (1e8) conversion that avoids float precision loss for large values. */
export function usdToRaw(usd: number): bigint {
  return BigInt(Math.round(usd * 1e6)) * 100n; // 1e6 * 100 = 1e8
}

export function rawToUsd(raw: bigint): number {
  return Number(raw) / Number(UNIT);
}

export function tierForWagerUsd(usdWager: number): VipTierConfig {
  let result = VIP_TIERS[0];
  for (const t of VIP_TIERS) {
    if (usdWager >= t.requiredWagerUsd) result = t;
  }
  return result;
}

// --- Game catalogue (for lobby) ---
export interface GameMeta {
  id: string; // matches game string in GameBet
  name: string;
  category: "originals" | "slots" | "live" | "sports";
  tag?: string;
  houseEdgePct: number;
  emoji: string;
  gradient: string; // tailwind gradient for lobby card
  description: string;
}

export const GAMES: GameMeta[] = [
  { id: "crash", name: "Crash", category: "originals", tag: "Popular", houseEdgePct: 1, emoji: "🚀", gradient: "from-rose-500/20 to-red-700/20", description: "Watch the multiplier rise and cash out before it crashes." },
  { id: "dice", name: "Dice", category: "originals", tag: "Classic", houseEdgePct: 1, emoji: "🎲", gradient: "from-emerald-500/20 to-teal-700/20", description: "Roll under your target to win. Adjustable risk." },
  { id: "plinko", name: "Plinko", category: "originals", tag: "Popular", houseEdgePct: 1, emoji: "🔻", gradient: "from-violet-500/20 to-purple-700/20", description: "Drop the ball, win the multiplier it lands on." },
  { id: "mines", name: "Mines", category: "originals", tag: "Skill", houseEdgePct: 1, emoji: "💣", gradient: "from-orange-500/20 to-amber-700/20", description: "Reveal gems, avoid mines. Cash out anytime." },
  { id: "limbo", name: "Limbo", category: "originals", houseEdgePct: 1, emoji: "📈", gradient: "from-sky-500/20 to-blue-700/20", description: "Set a target multiplier, roll to beat it." },
  { id: "wheel", name: "Wheel", category: "originals", tag: "New", houseEdgePct: 1, emoji: "🎡", gradient: "from-pink-500/20 to-rose-700/20", description: "Spin the wheel of multipliers." },
  { id: "tower", name: "Tower", category: "originals", houseEdgePct: 1, emoji: "🗼", gradient: "from-lime-500/20 to-green-700/20", description: "Climb the tower by picking safe tiles." },
  { id: "keno", name: "Keno", category: "originals", houseEdgePct: 4, emoji: "🔢", gradient: "from-cyan-500/20 to-teal-700/20", description: "Pick numbers, match to win big." },
];

export const GAME_MAP: Record<string, GameMeta> = Object.fromEntries(
  GAMES.map((g) => [g.id, g])
);

// Sportsbook leagues for seeding
export const SPORTS = [
  { sport: "football", leagues: ["UEFA Champions League", "English Premier League", "La Liga", "Serie A", "Bundesliga"] },
  { sport: "basketball", leagues: ["NBA", "EuroLeague", "CBA"] },
  { sport: "tennis", leagues: ["ATP Masters", "WTA Tour", "Grand Slam"] },
  { sport: "esports", leagues: ["CS2 Major", "Dota 2 The International", "League of Legends LCK"] },
  { sport: "mma", leagues: ["UFC", "ONE Championship"] },
];

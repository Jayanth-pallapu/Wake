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
  { symbol: "USDT", name: "Tether", icon: "$", color: "text-[#00c2ff]", decimals: 8, baseAmountRaw: 100n * UNIT, usdPerUnit: 1 },
  { symbol: "SOL", name: "Solana", icon: "◎", color: "text-purple-400", decimals: 8, baseAmountRaw: 50_000n * UNIT / 100n, usdPerUnit: 150 },
  { symbol: "LTC", name: "Litecoin", icon: "Ł", color: "text-slate-300", decimals: 8, baseAmountRaw: 100n * UNIT, usdPerUnit: 80 },
  { symbol: "XRP", name: "Ripple", icon: "✕", color: "text-sky-400", decimals: 8, baseAmountRaw: 500n * UNIT, usdPerUnit: 0.6 },
  { symbol: "DOGE", name: "Dogecoin", icon: "Ð", color: "text-yellow-400", decimals: 8, baseAmountRaw: 5000n * UNIT, usdPerUnit: 0.13 },
  { symbol: "BCH", name: "Bitcoin Cash", icon: "₿", color: "text-cyan-300", decimals: 8, baseAmountRaw: 50n * UNIT, usdPerUnit: 400 },
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
  imageUrl?: string; // path to thumbnail image
}

export const GAMES: GameMeta[] = [
  { id: "crash",       name: "Crash",          category: "originals", tag: "Popular",  houseEdgePct: 1,    emoji: "🚀", gradient: "from-rose-500/20 to-red-700/20",     imageUrl: "/games/crash.png",       description: "Watch the multiplier rise and cash out before it crashes." },
  { id: "dice",        name: "Dice",           category: "originals", tag: "Classic",  houseEdgePct: 1,    emoji: "🎲", gradient: "from-emerald-500/20 to-teal-700/20",imageUrl: "/games/dice.png",        description: "Roll under your target to win. Adjustable risk." },
  { id: "plinko",      name: "Plinko",         category: "originals", tag: "Popular",  houseEdgePct: 1,    emoji: "🔻", gradient: "from-violet-500/20 to-purple-700/20",imageUrl: "/games/plinko.png",      description: "Drop the ball, win the multiplier it lands on." },
  { id: "mines",       name: "Mines",          category: "originals", tag: "Skill",    houseEdgePct: 1,    emoji: "💣", gradient: "from-orange-500/20 to-amber-700/20", imageUrl: "/games/mines.png",       description: "Reveal gems, avoid mines. Cash out anytime." },
  { id: "limbo",       name: "Limbo",          category: "originals",                  houseEdgePct: 1,    emoji: "📈", gradient: "from-sky-500/20 to-blue-700/20",     imageUrl: "/games/limbo.png",       description: "Set a target multiplier, roll to beat it." },
  { id: "wheel",       name: "Wheel",          category: "originals", tag: "Classic",  houseEdgePct: 1,    emoji: "🎡", gradient: "from-pink-500/20 to-rose-700/20",    imageUrl: "/games/wheel.png",       description: "Spin the wheel of multipliers." },
  { id: "tower",       name: "Tower",          category: "originals",                  houseEdgePct: 1,    emoji: "🗼", gradient: "from-lime-500/20 to-green-700/20",   imageUrl: "/games/tower.png",       description: "Climb the tower by picking safe tiles." },
  { id: "keno",        name: "Keno",           category: "originals",                  houseEdgePct: 4,    emoji: "🔢", gradient: "from-cyan-500/20 to-teal-700/20",    imageUrl: "/games/keno.png",        description: "Pick numbers, match to win big." },
  { id: "hilo",        name: "HiLo",           category: "originals", tag: "Popular",  houseEdgePct: 1,    emoji: "🃏", gradient: "from-red-500/20 to-rose-900/20",     imageUrl: "/games/hilo.png",        description: "Guess higher or lower. Chain correct guesses for bigger wins." },
  { id: "coinflip",    name: "Coin Flip",      category: "originals", tag: "Fast",     houseEdgePct: 2,    emoji: "🪙", gradient: "from-yellow-400/20 to-amber-700/20", imageUrl: "/games/coinflip.png",    description: "50/50 call it: heads or tails." },
  { id: "videopoker",  name: "Video Poker",    category: "originals", tag: "Skill",    houseEdgePct: 2.7,  emoji: "🎴", gradient: "from-green-500/20 to-emerald-900/20",imageUrl: "/games/videopoker.png",  description: "Jacks or Better draw poker. Up to 800× on Royal Flush." },
  { id: "dragontiger", name: "Dragon Tiger",   category: "originals", tag: "New",      houseEdgePct: 3.73, emoji: "🐉", gradient: "from-orange-500/20 to-red-900/20",   imageUrl: "/games/dragontiger.png", description: "Two cards — Dragon or Tiger? Pick the highest." },
  { id: "blackjack",   name: "Blackjack",      category: "originals", tag: "Classic",  houseEdgePct: 0.5,  emoji: "🂡", gradient: "from-emerald-600/20 to-green-900/20",imageUrl: "/games/blackjack.png",   description: "Beat the dealer to 21. Hit, Stand, or Double Down." },
  { id: "baccarat",    name: "Baccarat",       category: "originals", tag: "Classic",  houseEdgePct: 1.06, emoji: "🎰", gradient: "from-purple-500/20 to-violet-900/20", imageUrl: "/games/baccarat.png",    description: "Player or Banker — who gets closest to 9?" },
  { id: "roulette",    name: "Roulette",       category: "originals", tag: "Classic",  houseEdgePct: 2.7,  emoji: "🔴", gradient: "from-red-600/20 to-rose-900/20",     imageUrl: "/games/roulette.png",    description: "Spin the European wheel. 37 numbers, infinite bets." },
  { id: "fastcrash",   name: "Fast Crash",     category: "originals", tag: "Turbo",    houseEdgePct: 1,    emoji: "⚡", gradient: "from-lime-400/20 to-green-800/20",   imageUrl: "/games/fastcrash.png",   description: "Instant-resolve Crash with quick-preset cashouts." },
  { id: "twist",       name: "Twist",          category: "originals", tag: "New",      houseEdgePct: 1,    emoji: "🌀", gradient: "from-fuchsia-500/20 to-purple-900/20",imageUrl: "/games/twist.png",       description: "High-volatility wheel. Up to 1,000,000× jackpot." },
  { id: "cave",        name: "Cave of Plunder",category: "originals", tag: "New",      houseEdgePct: 1,    emoji: "💎", gradient: "from-amber-500/20 to-yellow-900/20", imageUrl: "/games/cave.png",        description: "Climb three columns. Hold your progress, cash out anytime." },
];

export const GAME_MAP: Record<string, GameMeta> = Object.fromEntries(
  GAMES.map((g) => [g.id, g])
);

export interface SlotGameMeta {
  id: string;
  name: string;
  provider: string;
  category: "slots" | "live";
  emoji: string;
  color: string; // tailwind gradient classes
  description: string;
  rows: number;
  cols: number;
  live?: boolean;
  imageUrl?: string;
}

export const SLOT_GAMES: SlotGameMeta[] = [
  { id: "sweet-bonanza",      name: "Sweet Bonanza",      provider: "Pragmatic", category: "slots", emoji: "🍬", color: "from-pink-500/30 to-rose-700/20",     description: "6×5 cluster pays with tumbling reels and free spins.", rows: 5, cols: 6, imageUrl: "/slots/sweet-bonanza.jpg" },
  { id: "gates-of-olympus",   name: "Gates of Olympus",   provider: "Pragmatic", category: "slots", emoji: "⚡", color: "from-blue-500/30 to-indigo-700/20",   description: "6×5 cascading reels with Zeus lightning multipliers.", rows: 5, cols: 6, imageUrl: "/slots/gates-of-olympus.jpg" },
  { id: "big-bass-bonanza",   name: "Big Bass Bonanza",   provider: "Pragmatic", category: "slots", emoji: "🎣", color: "from-cyan-500/30 to-teal-700/20",     description: "5×3 fishing slot with fisherman wilds and free spins.", rows: 3, cols: 5, imageUrl: "/slots/big-bass-bonanza.jpg" },
  { id: "book-of-dead",       name: "Book of Dead",       provider: "Play'n GO", category: "slots", emoji: "📖", color: "from-amber-500/30 to-orange-700/20",  description: "5×3 Egyptian slot with expanding symbol bonus.", rows: 3, cols: 5, imageUrl: "/slots/book-of-dead.jpg" },
  { id: "wanted-dead",        name: "Wanted Dead",        provider: "Hacksaw",   category: "slots", emoji: "🤠", color: "from-orange-500/30 to-red-700/20",     description: "5×3 Western slot with sticky wilds and free spins.", rows: 3, cols: 5, imageUrl: "/slots/wanted-dead.jpg" },
  { id: "sugar-rush",         name: "Sugar Rush",         provider: "Pragmatic", category: "slots", emoji: "🧁", color: "from-pink-400/30 to-fuchsia-700/20",  description: "7×7 candy cluster pays with multiplier bombs.", rows: 7, cols: 7, imageUrl: "/slots/sugar-rush.jpg" },
  { id: "crazy-time",         name: "Crazy Time",         provider: "Evolution", category: "live",  emoji: "🎡", color: "from-fuchsia-500/30 to-purple-700/20", description: "Live money wheel with 4 epic bonus games.", rows: 1, cols: 1, live: true, imageUrl: "/slots/crazy-time.jpg" },
  { id: "lightning-roulette", name: "Lightning Roulette", provider: "Evolution", category: "live",  emoji: "⚡", color: "from-yellow-500/30 to-amber-700/20",  description: "European roulette with random lightning multipliers up to 500×.", rows: 1, cols: 1, live: true, imageUrl: "/slots/lightning-roulette.jpg" },
  { id: "dog-house",          name: "Dog House",          provider: "Pragmatic", category: "slots", emoji: "🐶", color: "from-emerald-500/30 to-green-700/20",  description: "5×3 dog-themed slot with paw print wilds and free spins.", rows: 3, cols: 5, imageUrl: "/slots/dog-house.jpg" },
  { id: "money-train",        name: "Money Train",        provider: "Relax",     category: "slots", emoji: "🚂", color: "from-slate-400/30 to-slate-700/20",   description: "5×4 train slot with Collector, Payer and Sniper symbols.", rows: 4, cols: 5, imageUrl: "/slots/money-train.jpg" },
  { id: "fruit-party",        name: "Fruit Party",        provider: "Pragmatic", category: "slots", emoji: "🍓", color: "from-red-500/30 to-rose-700/20",       description: "7×7 fruit cluster pays with tumbling reels.", rows: 7, cols: 7, imageUrl: "/slots/fruit-party.jpg" },
  { id: "wild-west-gold",     name: "Wild West Gold",     provider: "Pragmatic", category: "slots", emoji: "🌵", color: "from-lime-500/30 to-green-700/20",    description: "5×4 western tumbling reels with collector wilds.", rows: 4, cols: 5, imageUrl: "/slots/wild-west-gold.jpg" },
];

export const SLOT_GAME_MAP: Record<string, SlotGameMeta> = Object.fromEntries(
  SLOT_GAMES.map((g) => [g.id, g])
);

// Sportsbook leagues for seeding
export const SPORTS = [
  { sport: "football", leagues: ["UEFA Champions League", "English Premier League", "La Liga", "Serie A", "Bundesliga"] },
  { sport: "basketball", leagues: ["NBA", "EuroLeague", "CBA"] },
  { sport: "tennis", leagues: ["ATP Masters", "WTA Tour", "Grand Slam"] },
  { sport: "esports", leagues: ["CS2 Major", "Dota 2 The International", "League of Legends LCK"] },
  { sport: "mma", leagues: ["UFC", "ONE Championship"] },
];

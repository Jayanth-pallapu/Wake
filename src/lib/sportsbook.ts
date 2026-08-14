// Sportsbook helpers: odds generation, payout calc for single/parlay/system bets.
// Odds are decimal (European) format. Payout = stake * odds.

export interface MarketOdds {
  home: number;
  draw: number | null; // null for sports without draws
  away: number;
  // optional over/under lines
  overUnder?: { line: number; over: number; under: number };
  // both teams to score
  btts?: { yes: number; no: number };
}

export interface MatchOdds {
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
  odds: MarketOdds;
}

/** Compute decimal odds payout. */
export function decimalPayout(stake: number, odds: number): number {
  return Math.round(stake * odds * 100) / 100;
}

/** Parlay (accumulator) payout: product of all odds. */
export function parlayOdds(odds: number[]): number {
  return odds.reduce((acc, o) => acc * o, 1);
}

/** Apply a small live drift to an odds set so the UI feels alive. */
export function driftOdds(o: MarketOdds, magnitude = 0.01): MarketOdds {
  const drift = (v: number) =>
    Math.max(1.01, Math.round((v + (Math.random() - 0.5) * 2 * magnitude * v) * 100) / 100);
  return {
    ...o,
    home: drift(o.home),
    draw: o.draw ? drift(o.draw) : null,
    away: drift(o.away),
    overUnder: o.overUnder
      ? { ...o.overUnder, over: drift(o.overUnder.over), under: drift(o.overUnder.under) }
      : undefined,
    btts: o.btts ? { yes: drift(o.btts.yes), no: drift(o.btts.no) } : undefined,
  };
}

/** Generate a fake but plausible match. */
export function genMatch(sport: string, league: string, home: string, away: string): MatchOdds {
  const hasDraw = ["football"].includes(sport);
  const baseHome = 1.5 + Math.random() * 2.5;
  const baseAway = 1.5 + Math.random() * 2.5;
  const draw = hasDraw ? Math.max(2.8, 6 - Math.abs(baseHome - baseAway)) : null;
  // Include league slug + random suffix to guarantee uniqueness across leagues
  const leagueSlug = league.replace(/\s+/g, "-").toLowerCase().slice(0, 12);
  const suffix = Math.random().toString(36).slice(2, 6);
  return {
    matchId: `${sport}-${home}-${away}-${leagueSlug}-${suffix}`
      .replace(/\s+/g, "-")
      .toLowerCase(),
    homeTeam: home,
    awayTeam: away,
    sport,
    league,
    startTime: new Date(Date.now() + Math.random() * 48 * 3600 * 1000).toISOString(),
    status: Math.random() > 0.5 ? "live" : "upcoming",
    liveMinute: Math.random() > 0.5 ? Math.floor(Math.random() * 90) : undefined,
    scoreHome: 0,
    scoreAway: 0,
    odds: {
      home: Math.round(baseHome * 100) / 100,
      draw: draw ? Math.round(draw * 100) / 100 : null,
      away: Math.round(baseAway * 100) / 100,
      overUnder: { line: 2.5, over: 1.85, under: 1.95 },
      btts: { yes: 1.75, no: 2.05 },
    },
  };
}

export const TEAMS: Record<string, string[]> = {
  football: ["Man City", "Real Madrid", "Barcelona", "Bayern Munich", "PSG", "Liverpool", "Inter", "Borussia Dortmund", "Atletico Madrid", "Napoli", "Arsenal", "AC Milan"],
  basketball: ["LA Lakers", "Boston Celtics", "Golden State", "Milwaukee Bucks", "Denver Nuggets", "Miami Heat", "Phoenix Suns", "Dallas Mavericks"],
  tennis: ["Alcaraz", "Djokovic", "Sinner", "Medvedev", "Rublev", "Zverev", "Tsitsipas", "Ruud"],
  esports: ["Team Spirit", "G2 Esports", "Fnatic", "NaVi", "T1", "EG", "Vitality", "Cloud9"],
  mma: ["Jones", "Makhachev", "Adesanya", "Pereira", "Volkanovski", "O'Malley", "Holloway", "Usman"],
};

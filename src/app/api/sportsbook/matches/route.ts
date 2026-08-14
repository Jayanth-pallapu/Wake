import { NextRequest } from "next/server";
import { json } from "@/lib/api";
import { SPORTS } from "@/lib/constants";
import { genMatch, driftOdds, TEAMS, type MatchOdds } from "@/lib/sportsbook";

// In-memory match store (regenerated per server start; drifts over time)
let matchStore: MatchOdds[] | null = null;
let lastDrift = 0;

function ensureMatches(): MatchOdds[] {
  if (matchStore && matchStore.length > 0) return matchStore!;
  matchStore = [];
  const seen = new Set<string>();
  for (const s of SPORTS) {
    for (const league of s.leagues) {
      const teams = TEAMS[s.sport] || ["Team A", "Team B"];
      // generate 2-3 matches per league
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const home = teams[Math.floor(Math.random() * teams.length)];
        let away = teams[Math.floor(Math.random() * teams.length)];
        while (away === home) away = teams[Math.floor(Math.random() * teams.length)];
        if (home === away) continue;
        const match = genMatch(s.sport, league, home, away);
        // Extra dedup safety net — skip if matchId already exists
        if (seen.has(match.matchId)) continue;
        seen.add(match.matchId);
        matchStore.push(match);
      }
    }
  }
  return matchStore!;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport");
  const status = searchParams.get("status");
  let matches = ensureMatches();
  // Drift live odds every few seconds
  const now = Date.now();
  if (now - lastDrift > 3000) {
    lastDrift = now;
    matches = matches.map((m) => ({
      ...m,
      odds: m.status === "live" ? driftOdds(m.odds) : m.odds,
    }));
    matchStore = matches;
  }
  let filtered = matches;
  if (sport && sport !== "all") filtered = filtered.filter((m) => m.sport === sport);
  if (status && status !== "all") filtered = filtered.filter((m) => m.status === status);
  return json({ matches: filtered });
}

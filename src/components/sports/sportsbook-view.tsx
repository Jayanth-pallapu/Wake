"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api, type SportsMatch } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { SPORTS } from "@/lib/constants";
import { Activity, Trash2, X, Check } from "lucide-react";

const SPORT_ICONS: Record<string, string> = {
  football: "⚽", basketball: "🏀", tennis: "🎾", esports: "🎮", mma: "🥊",
};

export function SportsbookView() {
  const [matches, setMatches] = useState<SportsMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("all");
  const [status, setStatus] = useState("all");
  const betSlip = useUiStore((s) => s.betSlip);
  const addBetSlip = useUiStore((s) => s.addBetSlip);
  const removeBetSlip = useUiStore((s) => s.removeBetSlip);
  const clearBetSlip = useUiStore((s) => s.clearBetSlip);
  const user = useAuthStore((s) => s.user);
  const [stake, setStake] = useState(10);
  const [placing, setPlacing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sport !== "all") params.set("sport", sport);
      if (status !== "all") params.set("status", status);
      const data = await api.get<{ matches: SportsMatch[] }>(`/api/sportsbook/matches?${params}`);
      setMatches(data.matches);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [sport, status]);

  const odds = betSlip.reduce((acc, b) => acc * b.odds, 1);
  const payout = stake * odds;

  const placeBet = async () => {
    if (!user) {
      useUiStore.getState().setAuthModal(true, "login");
      return;
    }
    if (betSlip.length === 0) return;
    setPlacing(true);
    // Demo: simulate bet placement (no real sportsbook settlement)
    await new Promise((r) => setTimeout(r, 800));
    toast.success(`Bet placed: ${stake} USDT @ ${odds.toFixed(2)} → potential ${payout.toFixed(2)} USDT`);
    clearBetSlip();
    setPlacing(false);
  };

  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-[#00e701]" />
        <h1 className="text-xl font-bold text-white">Sportsbook</h1>
        <span className="text-xs text-[#b1bad3]">Live odds · updates every 5s</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterChip active={sport === "all"} onClick={() => setSport("all")}>All Sports</FilterChip>
        {SPORTS.map((s) => (
          <FilterChip key={s.sport} active={sport === s.sport} onClick={() => setSport(s.sport)}>
            {SPORT_ICONS[s.sport]} {s.sport}
          </FilterChip>
        ))}
        <div className="w-px bg-[#2f4553] mx-1" />
        <FilterChip active={status === "all"} onClick={() => setStatus("all")}>All</FilterChip>
        <FilterChip active={status === "live"} onClick={() => setStatus("live")}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff3b3b] animate-pulse inline-block mr-1" />Live
        </FilterChip>
        <FilterChip active={status === "upcoming"} onClick={() => setStatus("upcoming")}>Upcoming</FilterChip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Matches */}
        <div className="space-y-2">
          {loading && matches.length === 0 && (
            <div className="text-center text-[#b1bad3] py-12">Loading matches…</div>
          )}
          {!loading && matches.length === 0 && (
            <div className="text-center text-[#b1bad3] py-12">No matches found.</div>
          )}
          {matches.map((m, i) => (
            <motion.div
              key={m.matchId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Card className="bg-[#1a2c38] border-[#2f4553] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[10px] text-[#b1bad3]">
                    <span>{SPORT_ICONS[m.sport]}</span>
                    <span>{m.league}</span>
                    {m.status === "live" && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#ff3b3b]/20 text-[#ff3b3b] font-bold">
                        <span className="w-1 h-1 rounded-full bg-[#ff3b3b] animate-pulse" /> LIVE {m.liveMinute ? `${m.liveMinute}'` : ""}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#b1bad3]">
                    {m.status === "upcoming" ? new Date(m.startTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "In play"}
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{m.homeTeam}</span>
                      {m.status === "live" && <span className="text-xs font-bold text-[#00e701] tabular-nums">{m.scoreHome}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{m.awayTeam}</span>
                      {m.status === "live" && <span className="text-xs font-bold text-[#00e701] tabular-nums">{m.scoreAway}</span>}
                    </div>
                  </div>
                  <OddsBtn label="1" odds={m.odds.home} active={betSlip.some((b) => b.id === m.matchId + "-home")} onClick={() => addBetSlip({ id: m.matchId + "-home", matchId: m.matchId, label: `${m.homeTeam} to win`, odds: m.odds.home, market: "home" })} />
                  {m.odds.draw !== null ? (
                    <OddsBtn label="X" odds={m.odds.draw} active={betSlip.some((b) => b.id === m.matchId + "-draw")} onClick={() => addBetSlip({ id: m.matchId + "-draw", matchId: m.matchId, label: `${m.homeTeam} vs ${m.awayTeam} — Draw`, odds: m.odds.draw, market: "draw" })} />
                  ) : (
                    <div className="w-16" />
                  )}
                  <OddsBtn label="2" odds={m.odds.away} active={betSlip.some((b) => b.id === m.matchId + "-away")} onClick={() => addBetSlip({ id: m.matchId + "-away", matchId: m.matchId, label: `${m.awayTeam} to win`, odds: m.odds.away, market: "away" })} />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bet slip */}
        <div className="lg:sticky lg:top-16 h-fit">
          <Card className="bg-[#1a2c38] border-[#2f4553]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f4553]">
              <h2 className="font-bold text-white text-sm">Bet Slip</h2>
              {betSlip.length > 0 && (
                <button onClick={clearBetSlip} className="text-[10px] text-[#b1bad3] hover:text-[#ff5c5c] flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
              {betSlip.length === 0 ? (
                <div className="text-center text-[#b1bad3] text-xs py-8">
                  Click odds to add selections to your bet slip.
                </div>
              ) : (
                betSlip.map((b) => (
                  <div key={b.id} className="bg-[#0f212e] rounded-md p-2 flex items-start gap-2">
                    <Check className="w-3 h-3 text-[#00e701] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate">{b.label}</div>
                      <div className="text-[10px] text-[#b1bad3]">@ {b.odds.toFixed(2)}</div>
                    </div>
                    <button onClick={() => removeBetSlip(b.id)} className="text-[#b1bad3] hover:text-[#ff5c5c]">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {betSlip.length > 0 && (
              <div className="p-3 border-t border-[#2f4553] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#b1bad3]">Type</span>
                  <span className="text-white font-semibold">{betSlip.length === 1 ? "Single" : `Parlay (${betSlip.length})`}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#b1bad3]">Total odds</span>
                  <span className="text-[#00e701] font-bold tabular-nums">{odds.toFixed(2)}×</span>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Stake (USDT)</label>
                  <Input type="number" value={stake} onChange={(e) => setStake(Math.max(0, parseFloat(e.target.value) || 0))} className="bg-[#0f212e] border-[#2f4553] text-white h-9 mt-1" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#b1bad3]">Potential payout</span>
                  <span className="text-[#00e701] font-bold tabular-nums">{payout.toFixed(2)} USDT</span>
                </div>
                <Button onClick={placeBet} disabled={placing || stake <= 0} className="w-full bg-[#00e701] hover:bg-[#00c701] text-[#0a1f12] font-bold h-10">
                  {placing ? "Placing…" : `Place Bet · ${stake} USDT`}
                </Button>
                <p className="text-[9px] text-center text-[#55657a]">Demo bet — no real settlement</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
        active ? "bg-[#00e701] text-[#0a1f12]" : "bg-[#1a2c38] text-[#b1bad3] hover:bg-[#213743] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function OddsBtn({ label, odds, active, onClick }: { label: string; odds: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-16 py-2 rounded-md text-center transition-all ${
        active ? "bg-[#00e701] text-[#0a1f12]" : "bg-[#0f212e] hover:bg-[#213743] text-white border border-[#2f4553]"
      }`}
    >
      <div className="text-[9px] text-[#b1bad3] uppercase">{label}</div>
      <div className="text-xs font-bold tabular-nums">{odds.toFixed(2)}</div>
    </button>
  );
}

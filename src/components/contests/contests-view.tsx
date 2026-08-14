"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
import { CONTEST_TIERS, PARTICIPANT_COUNTS } from "@/lib/contest";
import type { ContestPeriod } from "@/lib/contest";
import { CountdownTimer } from "./countdown-timer";
import { ContestLeaderboard } from "./contest-leaderboard";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";
import { useWalletStore } from "@/store/wallet";
import { toast } from "sonner";
import { Users, Trophy, Zap, Clock, ChevronRight, Star, TrendingUp } from "lucide-react";

interface ContestData {
  id: string;
  tier: number;
  period: string;
  status: string;
  entryFeeRaw: string;
  prizePoolRaw: string;
  prizePoolDisplay: string;
  participantCount: number;
  entryCount: number;
  closesAt: string;
  resultsAt: string;
  msToClose: number;
  msToResults: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  wagerRaw: string;
  prizeRaw: string;
  isReal?: boolean;
}

const TIER_COLORS: Record<number, { from: string; to: string; accent: string; label: string }> = {
  10:   { from: "#1a3a2a", to: "#0f212e", accent: "#00c2ff", label: "Starter" },
  50:   { from: "#1a2a3a", to: "#0f212e", accent: "#1475e1", label: "Pro" },
  100:  { from: "#2a1a3a", to: "#0f212e", accent: "#a855f7", label: "Elite" },
  1000: { from: "#3a2a0a", to: "#0f212e", accent: "#ffd23f", label: "VIP" },
};

const PERIOD_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function ContestsView() {
  const [contests, setContests] = useState<ContestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTier, setActiveTier] = useState(10);
  const [activePeriod, setActivePeriod] = useState<ContestPeriod>("daily");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [entering, setEntering] = useState(false);
  const [entered, setEntered] = useState<Set<string>>(new Set());

  const user = useAuthStore((s) => s.user);
  const setAuthModal = useUiStore((s) => s.setAuthModal);
  const { refresh: refreshWallet } = useWalletStore();

  const loadContests = useCallback(async () => {
    try {
      const data = await api.get<{ contests: ContestData[] }>("/api/contests");
      setContests(data.contests);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadContests();
    const id = setInterval(loadContests, 15000);
    return () => clearInterval(id);
  }, [loadContests]);

  const activeContest = contests.find((c) => c.tier === activeTier && c.period === activePeriod);
  const tierCfg = CONTEST_TIERS.find((t) => t.tier === activeTier)!;
  const colors = TIER_COLORS[activeTier] ?? TIER_COLORS[10];

  // Load leaderboard when active contest changes
  useEffect(() => {
    if (!activeContest) return;
    setLbLoading(true);
    api.get<{ leaderboard: LeaderboardEntry[] }>(`/api/contests/${activeContest.id}/leaderboard`)
      .then((d) => setLeaderboard(d.leaderboard))
      .catch(() => {})
      .finally(() => setLbLoading(false));
    const id = setInterval(() => {
      api.get<{ leaderboard: LeaderboardEntry[] }>(`/api/contests/${activeContest.id}/leaderboard`)
        .then((d) => setLeaderboard(d.leaderboard))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, [activeContest?.id]);

  const handleEnter = async () => {
    if (!user) { setAuthModal(true, "login"); return; }
    if (!activeContest) return;
    setEntering(true);
    try {
      const res = await api.post<{ ok: boolean; error?: string }>(`/api/contests/${activeContest.id}/enter`);
      if (res.ok) {
        setEntered((prev) => new Set([...prev, activeContest.id]));
        toast.success(`🏆 Entered $${activeTier} ${PERIOD_LABELS[activePeriod]} contest!`);
        refreshWallet();
        loadContests();
      } else {
        toast.error(res.error ?? "Failed to enter");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Entry failed");
    }
    setEntering(false);
  };

  const availablePeriods = tierCfg?.periods ?? [];

  // Auto-switch period if not available for tier
  useEffect(() => {
    if (availablePeriods.length > 0 && !availablePeriods.includes(activePeriod)) {
      setActivePeriod(availablePeriods[0] as ContestPeriod);
    }
  }, [activeTier, availablePeriods, activePeriod]);

  const isEntered = activeContest ? entered.has(activeContest.id) : false;

  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden mb-6" style={{
        background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
        border: `1px solid ${colors.accent}30`,
      }}>
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: `${20 + (i * 13) % 60}px`,
              height: `${20 + (i * 13) % 60}px`,
              background: colors.accent,
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              opacity: 0.3,
              filter: 'blur(20px)',
            }} />
          ))}
        </div>
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-6 h-6" style={{ color: colors.accent }} />
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: colors.accent }}>Prize Contests</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-1">Win Big. Play More.</h1>
              <p className="text-[#b1bad3] text-sm">Join daily, weekly & monthly prize pools. Top players share millions.</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black" style={{ color: colors.accent, textShadow: `0 0 30px ${colors.accent}60` }}>
                {activeContest?.prizePoolDisplay ?? '...'}
              </div>
              <div className="text-[#b1bad3] text-xs">Prize Pool</div>
            </div>
          </div>
          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
              <Users className="w-4 h-4 text-[#b1bad3]" />
              <div>
                <div className="text-white font-bold text-sm">
                  {activeContest ? formatCount(activeContest.participantCount) : '...'}
                </div>
                <div className="text-[#b1bad3] text-[10px]">Participants</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
              <Zap className="w-4 h-4 text-[#b1bad3]" />
              <div>
                <div className="text-white font-bold text-sm">{tierCfg ? `Top ${tierCfg.topPoolCount.toLocaleString()}` : '...'}</div>
                <div className="text-[#b1bad3] text-[10px]">Winners paid</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
              <Star className="w-4 h-4 text-[#b1bad3]" />
              <div>
                <div className="text-white font-bold text-sm">{tierCfg ? `Top ${tierCfg.topRankCount}` : '...'}</div>
                <div className="text-[#b1bad3] text-[10px]">VIP prizes (20%)</div>
              </div>
            </div>
            {activeContest && (
              <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                <Clock className="w-4 h-4 text-[#b1bad3]" />
                <div>
                  <CountdownTimer
                    targetDate={activeContest.msToClose > 0 ? activeContest.closesAt : activeContest.resultsAt}
                    label={activeContest.msToClose > 0 ? "Closes" : "Results"}
                    size="sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <div>
          {/* Tier Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
            {[10, 50, 100, 1000].map((tier) => {
              const c = TIER_COLORS[tier];
              const isActive = activeTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    isActive ? 'text-white shadow-lg' : 'text-[#b1bad3] hover:text-white'
                  }`}
                  style={isActive ? {
                    background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                    border: `1px solid ${c.accent}40`,
                    boxShadow: `0 4px 20px ${c.accent}20`,
                  } : {
                    background: '#1a2c38',
                    border: '1px solid #2f4553',
                  }}
                >
                  <span style={{ color: isActive ? c.accent : undefined }}>${tier}</span>
                  <span className="text-[10px] font-normal opacity-70">{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Period Tabs */}
          <div className="flex gap-1.5 mb-5">
            {(["daily", "weekly", "monthly"] as ContestPeriod[]).map((p) => {
              const avail = availablePeriods.includes(p);
              const isActive = activePeriod === p;
              return (
                <button
                  key={p}
                  onClick={() => avail && setActivePeriod(p)}
                  disabled={!avail}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                    !avail ? 'opacity-30 cursor-not-allowed text-[#b1bad3] bg-[#1a2c38] border border-[#2f4553]' :
                    isActive ? 'bg-[#00c2ff] text-[#001a2e] shadow-md' :
                    'text-[#b1bad3] bg-[#1a2c38] border border-[#2f4553] hover:text-white'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                  {avail && (
                    <span className="ml-1 text-[9px] opacity-60">
                      {activeContest?.prizePoolDisplay && isActive ? activeContest.prizePoolDisplay : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div className="bg-[#1a2c38] rounded-xl border border-[#2f4553] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00c2ff]" />
                <span className="font-bold text-white text-sm">Live Leaderboard</span>
                <span className="text-[10px] text-[#b1bad3] bg-[#0f212e] px-2 py-0.5 rounded-full">Updates every 10s</span>
              </div>
              <span className="text-[10px] text-[#b1bad3]">
                {activeContest ? `${formatCount(activeContest.participantCount)} competing` : ''}
              </span>
            </div>
            {activeContest ? (
              <ContestLeaderboard
                entries={leaderboard}
                topRankCount={tierCfg?.topRankCount ?? 20}
                loading={lbLoading}
              />
            ) : (
              <div className="text-center text-[#b1bad3] py-16">
                {loading ? 'Loading...' : 'No active contest for this tier/period.'}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Entry Card */}
          <div className="bg-[#1a2c38] rounded-xl border border-[#2f4553] p-5">
            <div className="text-center mb-5">
              <div className="text-4xl font-black mb-1" style={{ color: colors.accent }}>
                ${activeTier}
              </div>
              <div className="text-[#b1bad3] text-xs">Entry Fee (USDT)</div>
              <div className="mt-2 text-xl font-bold text-white">{activeContest?.prizePoolDisplay ?? '...'}</div>
              <div className="text-[#b1bad3] text-[10px]">Total Prize Pool</div>
            </div>

            {activeContest && (
              <div className="mb-4">
                <CountdownTimer
                  targetDate={activeContest.msToClose > 0 ? activeContest.closesAt : activeContest.resultsAt}
                  label={activeContest.msToClose > 0 ? 'Closes in' : 'Results in'}
                  size="md"
                />
              </div>
            )}

            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-xs">
                <span className="text-[#b1bad3]">Your ranking metric</span>
                <span className="text-white font-medium">Total Wagered</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#b1bad3]">Top {tierCfg?.topPoolCount?.toLocaleString()} share</span>
                <span className="font-bold" style={{ color: colors.accent }}>60% of pool</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#b1bad3]">Top {tierCfg?.topRankCount} VIP share</span>
                <span className="font-bold text-[#ffd23f]">20% of pool</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#b1bad3]">Results at</span>
                <span className="text-white font-medium">
                  {activeContest ? new Date(activeContest.resultsAt).toLocaleDateString('en-US', {
                    timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  }) + ' PST' : '...'}
                </span>
              </div>
            </div>

            <button
              onClick={handleEnter}
              disabled={entering || isEntered || !activeContest || activeContest.msToClose <= 0}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                isEntered
                  ? 'bg-[#213743] text-[#00c2ff] border border-[#00c2ff]/30 cursor-default'
                  : !activeContest || activeContest.msToClose <= 0
                  ? 'bg-[#213743] text-[#b1bad3] cursor-not-allowed'
                  : 'text-[#001a2e] hover:opacity-90 active:scale-95 shadow-lg'
              }`}
              style={!isEntered && activeContest && activeContest.msToClose > 0 ? {
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}cc)`,
                boxShadow: `0 4px 20px ${colors.accent}40`,
              } : {}}
            >
              {entering ? 'Entering...' :
               isEntered ? '✓ Entered' :
               (activeContest?.msToClose ?? 0) <= 0 ? 'Entry Closed' :
               `Enter for $${activeTier} USDT`}
              {!isEntered && activeContest && activeContest.msToClose > 0 && (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            {!isEntered && activeContest && activeContest.msToClose > 0 && (
              <p className="text-[10px] text-center text-[#b1bad3] mt-2">
                Entry fee deducted from USDT wallet
              </p>
            )}
          </div>

          {/* Prize Breakdown Card */}
          <div className="bg-[#1a2c38] rounded-xl border border-[#2f4553] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4" style={{ color: colors.accent }} />
              <span className="text-sm font-bold text-white">Prize Breakdown</span>
            </div>
            <div className="space-y-2">
              {[
                { rank: "🥇 1st", pct: tierCfg?.topRankPcts?.[0] ? `${(tierCfg.topRankPcts[0] * 20).toFixed(1)}%` : '7%', color: '#ffd23f' },
                { rank: "🥈 2nd", pct: tierCfg?.topRankPcts?.[1] ? `${(tierCfg.topRankPcts[1] * 20).toFixed(1)}%` : '3.6%', color: '#c0c0c0' },
                { rank: "🥉 3rd", pct: tierCfg?.topRankPcts?.[2] ? `${(tierCfg.topRankPcts[2] * 20).toFixed(1)}%` : '2.4%', color: '#cd7f32' },
                { rank: `Top ${tierCfg?.topRankCount}`, pct: "20% pool", color: colors.accent },
                { rank: `Top ${tierCfg?.topPoolCount?.toLocaleString()}`, pct: "60% pool", color: '#b1bad3' },
              ].map((row) => (
                <div key={row.rank} className="flex items-center justify-between text-xs">
                  <span className="text-[#b1bad3]">{row.rank}</span>
                  <span className="font-bold" style={{ color: row.color }}>{row.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

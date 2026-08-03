"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUiStore } from "@/store/ui";
import { useWalletStore } from "@/store/wallet";
import { GAMES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Sparkles, Search, X, ChevronRight, TrendingUp } from "lucide-react";
import Image from "next/image";

const TABS = [
  { id: "all",     label: "All" },
  { id: "Popular", label: "Popular" },
  { id: "Classic", label: "Classic" },
  { id: "New",     label: "New" },
  { id: "Fast",    label: "Fast" },
  { id: "Turbo",   label: "Turbo" },
  { id: "Skill",   label: "Skill" },
] as const;

export function CasinoLobby() {
  const setView = useUiStore((s) => s.setView);
  const totalUsd = useWalletStore((s) => s.totalUsdValue);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let games = GAMES;
    if (activeTab !== "all") {
      games = games.filter((g) => g.tag === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      games = games.filter((g) => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    }
    return games;
  }, [activeTab, search]);

  return (
    <div className="p-3 sm:p-5 max-w-[1600px] mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl mb-5 bg-gradient-to-r from-[#0f212e] via-[#1475e1]/20 to-[#00e701]/10 border border-[#2f4553] p-6 sm:p-8"
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 50%, #00e701 0, transparent 50%), radial-gradient(circle at 20% 50%, #1475e1 0, transparent 50%)",
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#00e701]/20 border border-[#00e701]/40 mb-3">
              <Sparkles className="w-3 h-3 text-[#00e701]" />
              <span className="text-[10px] font-bold text-[#00e701] uppercase tracking-wider">18 BC Originals — Provably Fair</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 leading-tight">
              The Ultimate <span className="text-[#00e701]">Crypto Casino</span>
            </h1>
            <p className="text-sm text-[#b1bad3] max-w-xl">
              HMAC-SHA256 provably fair · Instant crypto payouts · Live chat &amp; rain
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              onClick={() => setView({ kind: "game", gameId: "crash" })}
              className="bg-[#00e701] hover:bg-[#00c701] text-[#0a1f12] font-bold"
            >
              <Flame className="w-4 h-4 mr-1" /> Play Crash
            </Button>
            <Button
              onClick={() => setView({ kind: "sports" })}
              variant="outline"
              className="bg-transparent border-[#2f4553] text-white hover:bg-[#213743] hover:text-white"
            >
              <Trophy className="w-4 h-4 mr-1" /> Sportsbook
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        <StatCard label="Your Balance"  value={`$${totalUsd.toFixed(2)}`} color="text-[#00e701]" />
        <StatCard label="BC Originals"  value={`${GAMES.length} Games`}    color="text-[#ff5cb1]" />
        <StatCard label="House Edge"    value="from 0.5%"                  color="text-[#ffd23f]" />
        <StatCard label="Assets"        value="8 Crypto"                   color="text-[#1475e1]" />
      </div>

      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">BC Originals</h2>
          <p className="text-xs text-[#b1bad3]">All games are provably fair · HMAC-SHA256</p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#b1bad3] pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games…"
            className="w-full pl-8 pr-7 py-2 text-xs bg-[#1a2c38] border border-[#2f4553] rounded-lg text-white placeholder:text-[#b1bad3] focus:outline-none focus:border-[#00e701]/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-[#b1bad3]" />
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "text-[#00e701] bg-[#00e701]/10"
                : "text-[#b1bad3] hover:text-white hover:bg-[#1a2c38]"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-lg bg-[#00e701]/10 border border-[#00e701]/30"
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Game grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-[#b1bad3] py-16 text-sm"
          >
            No games match &ldquo;{search}&rdquo;
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-8"
          >
            {filtered.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.93 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                layout
              >
                <GameCard game={g} onClick={() => setView({ kind: "game", gameId: g.id })} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slots preview (3rd-party) */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Slots &amp; Live Dealers</h2>
          <p className="text-xs text-[#b1bad3]">Thousands of slots from top providers</p>
        </div>
        <button
          onClick={() => setView({ kind: "casino" })}
          className="text-xs text-[#b1bad3] hover:text-[#00e701] flex items-center gap-1"
        >
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
        {MOCK_SLOTS.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
          >
            <SlotCard slot={s} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---- StatCard ----
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#1a2c38] border border-[#2f4553] rounded-xl p-3">
      <div className={`text-[10px] uppercase tracking-wider mb-1 ${color} opacity-70`}>{label}</div>
      <div className="text-sm sm:text-base font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

// ---- GameCard ----
function GameCard({ game, onClick }: { game: (typeof GAMES)[number]; onClick: () => void }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <button
      onClick={onClick}
      id={`game-card-${game.id}`}
      className="group relative w-full text-left rounded-xl overflow-hidden border border-[#2f4553] hover:border-[#00e701]/50 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:shadow-[#00e701]/10 bg-[#1a2c38]"
    >
      {/* Thumbnail */}
      <div className={`relative aspect-[4/3] bg-gradient-to-br ${game.gradient}`}>
        {!imgErr && game.imageUrl ? (
          <Image
            src={game.imageUrl}
            alt={game.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgErr(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{game.emoji}</span>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-[#0f212e]/0 group-hover:bg-[#0f212e]/60 transition-all duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#00e701] text-[#0a1f12] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Flame className="w-3 h-3" /> Play Now
          </span>
        </div>
        {/* Tag badge */}
        {game.tag && (
          <span className={`absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
            game.tag === "New"     ? "bg-[#1475e1]/90 text-white" :
            game.tag === "Popular" ? "bg-[#00e701]/90 text-[#0a1f12]" :
            game.tag === "Turbo"   ? "bg-[#ff5cb1]/90 text-white" :
            game.tag === "Fast"    ? "bg-[#ffd23f]/90 text-[#0a1f12]" :
                                    "bg-[#0f212e]/80 text-[#b1bad3]"
          }`}>
            {game.tag}
          </span>
        )}
      </div>
      {/* Info bar */}
      <div className="px-2.5 py-2">
        <div className="font-semibold text-white text-xs leading-tight truncate">{game.name}</div>
        <div className="text-[10px] text-[#b1bad3] mt-0.5">Edge {game.houseEdgePct}%</div>
      </div>
    </button>
  );
}

// ---- SlotCard ----
const MOCK_SLOTS = [
  { name: "Sweet Bonanza",     provider: "Pragmatic", emoji: "🍬", color: "from-pink-500/30 to-rose-700/20" },
  { name: "Gates of Olympus",  provider: "Pragmatic", emoji: "⚡", color: "from-blue-500/30 to-indigo-700/20" },
  { name: "Big Bass Bonanza",  provider: "Pragmatic", emoji: "🎣", color: "from-cyan-500/30 to-teal-700/20" },
  { name: "Book of Dead",      provider: "Play'n GO", emoji: "📖", color: "from-amber-500/30 to-orange-700/20" },
  { name: "Crazy Time",        provider: "Evolution", emoji: "🎡", color: "from-fuchsia-500/30 to-purple-700/20", live: true },
  { name: "Lightning Roulette",provider: "Evolution", emoji: "⚡", color: "from-yellow-500/30 to-amber-700/20", live: true },
  { name: "Wanted Dead",       provider: "Hacksaw",   emoji: "🤠", color: "from-orange-500/30 to-red-700/20" },
  { name: "Sugar Rush",        provider: "Pragmatic", emoji: "🧁", color: "from-pink-400/30 to-fuchsia-700/20" },
  { name: "Fruit Party",       provider: "Pragmatic", emoji: "🍓", color: "from-red-500/30 to-rose-700/20" },
  { name: "Dog House",         provider: "Pragmatic", emoji: "🐶", color: "from-emerald-500/30 to-green-700/20" },
  { name: "Money Train",       provider: "Relax",     emoji: "🚂", color: "from-slate-400/30 to-slate-700/20" },
  { name: "Wild West Gold",    provider: "Pragmatic", emoji: "🌵", color: "from-lime-500/30 to-green-700/20" },
];

function SlotCard({ slot }: { slot: (typeof MOCK_SLOTS)[number] }) {
  return (
    <div className="bg-gradient-to-br from-[#1a2c38] to-[#213743] border border-[#2f4553] rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] hover:border-[#2f4553]/80 transition-all">
      <div className={`aspect-square flex flex-col items-center justify-center p-2 relative bg-gradient-to-br ${slot.color}`}>
        {slot.live && (
          <span className="absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded bg-[#ff3b3b] text-white uppercase font-bold flex items-center gap-0.5">
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" /> Live
          </span>
        )}
        <div className="text-3xl mb-1">{slot.emoji}</div>
        <div className="text-[10px] font-semibold text-white text-center leading-tight">{slot.name}</div>
        <div className="text-[8px] text-[#b1bad3]">{slot.provider}</div>
      </div>
    </div>
  );
}

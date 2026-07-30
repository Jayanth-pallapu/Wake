"use client";

import { motion } from "framer-motion";
import { useUiStore } from "@/store/ui";
import { useWalletStore } from "@/store/wallet";
import { GAMES } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Flame, Trophy, Sparkles, ArrowRight } from "lucide-react";

export function CasinoLobby() {
  const setView = useUiStore((s) => s.setView);
  const totalUsd = useWalletStore((s) => s.totalUsdValue);

  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl mb-5 bg-gradient-to-r from-[#0f212e] via-[#1475e1]/30 to-[#00e701]/20 border border-[#2f4553] p-6 sm:p-8"
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #00e701 0, transparent 40%), radial-gradient(circle at 20% 80%, #1475e1 0, transparent 40%)" }} />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#00e701]/20 border border-[#00e701]/40 mb-3">
            <Sparkles className="w-3 h-3 text-[#00e701]" />
            <span className="text-[10px] font-bold text-[#00e701] uppercase tracking-wider">Provably Fair</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 leading-tight">
            The Ultimate <span className="text-[#00e701]">Crypto Casino</span>
          </h1>
          <p className="text-sm sm:text-base text-[#b1bad3] mb-4 max-w-xl">
            Crash, Dice, Plinko, Mines & more. Verifiable HMAC-SHA256 outcomes, instant payouts, live chat & rain.
          </p>
          <div className="flex flex-wrap gap-2">
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

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        <StatCard label="Your Balance" value={`$${totalUsd.toFixed(2)}`} icon={<TrendingUp className="w-4 h-4 text-[#00e701]" />} />
        <StatCard label="Games" value={String(GAMES.length)} icon={<Flame className="w-4 h-4 text-[#ff5cb1]" />} />
        <StatCard label="House Edge" value="1%" icon={<Sparkles className="w-4 h-4 text-[#ffd23f]" />} />
        <StatCard label="Crypto" value="8 assets" icon={<TrendingUp className="w-4 h-4 text-[#1475e1]" />} />
      </div>

      {/* Originals */}
      <SectionHeader title="StakeForge Originals" subtitle="Provably fair · 1% house edge" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        {GAMES.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <GameCard game={g} onClick={() => setView({ kind: "game", gameId: g.id })} />
          </motion.div>
        ))}
      </div>

      {/* Featured slots (mock) */}
      <SectionHeader title="Slots & Live Dealers" subtitle="Aggregator integration preview" action={{ label: "View all", onClick: () => setView({ kind: "casino" }) }} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
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

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-[#b1bad3]">{subtitle}</p>}
      </div>
      {action && (
        <button onClick={action.onClick} className="text-xs text-[#b1bad3] hover:text-[#00e701] flex items-center gap-1">
          {action.label} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="bg-[#1a2c38] border-[#2f4553] p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-[#b1bad3]">{label}</span>
      </div>
      <div className="text-base sm:text-lg font-bold text-white tabular-nums">{value}</div>
    </Card>
  );
}

function GameCard({ game, onClick }: { game: typeof GAMES[number]; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group relative w-full text-left">
      <Card className={`bg-gradient-to-br ${game.gradient} border-[#2f4553] overflow-hidden transition-all group-hover:scale-[1.02] group-hover:border-[#00e701]/50`}>
        <div className="aspect-[4/5] flex flex-col items-center justify-center p-4 relative">
          {game.tag && (
            <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-[#0f212e]/80 text-[#00e701] uppercase tracking-wider font-bold">
              {game.tag}
            </span>
          )}
          <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{game.emoji}</div>
          <div className="text-center">
            <div className="font-bold text-white text-sm">{game.name}</div>
            <div className="text-[10px] text-[#b1bad3] mt-0.5 line-clamp-2">{game.description}</div>
          </div>
        </div>
        <div className="bg-[#0f212e]/60 px-3 py-1.5 text-center">
          <span className="text-[10px] text-[#b1bad3]">House edge {game.houseEdgePct}%</span>
        </div>
      </Card>
    </button>
  );
}

const MOCK_SLOTS = [
  { name: "Sweet Bonanza", provider: "Pragmatic", emoji: "🍬", color: "from-pink-500/30 to-rose-700/20" },
  { name: "Gates of Olympus", provider: "Pragmatic", emoji: "⚡", color: "from-blue-500/30 to-indigo-700/20" },
  { name: "Big Bass Bonanza", provider: "Pragmatic", emoji: "🎣", color: "from-cyan-500/30 to-teal-700/20" },
  { name: "Book of Dead", provider: "Play'n GO", emoji: "📖", color: "from-amber-500/30 to-orange-700/20" },
  { name: "Crazy Time", provider: "Evolution", emoji: "🎡", color: "from-fuchsia-500/30 to-purple-700/20", live: true },
  { name: "Lightning Roulette", provider: "Evolution", emoji: "⚡", color: "from-yellow-500/30 to-amber-700/20", live: true },
  { name: "Wanted Dead", provider: "Hacksaw", emoji: "🤠", color: "from-orange-500/30 to-red-700/20" },
  { name: "Sugar Rush", provider: "Pragmatic", emoji: "🧁", color: "from-pink-400/30 to-fuchsia-700/20" },
  { name: "Fruit Party", provider: "Pragmatic", emoji: "🍓", color: "from-red-500/30 to-rose-700/20" },
  { name: "Dog House", provider: "Pragmatic", emoji: "🐶", color: "from-emerald-500/30 to-green-700/20" },
  { name: "Money Train", provider: "Relax", emoji: "🚂", color: "from-slate-400/30 to-slate-700/20" },
  { name: "Wild West Gold", provider: "Pragmatic", emoji: "🌵", color: "from-lime-500/30 to-green-700/20" },
];

function SlotCard({ slot }: { slot: typeof MOCK_SLOTS[number] }) {
  return (
    <Card className={`bg-gradient-to-br ${slot.color} border-[#2f4553] overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform`}>
      <div className="aspect-square flex flex-col items-center justify-center p-3 relative">
        {slot.live && (
          <span className="absolute top-1.5 right-1.5 text-[8px] px-1 py-0.5 rounded bg-[#ff3b3b] text-white uppercase font-bold flex items-center gap-0.5">
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" /> Live
          </span>
        )}
        <div className="text-4xl mb-1">{slot.emoji}</div>
        <div className="text-xs font-semibold text-white text-center leading-tight">{slot.name}</div>
        <div className="text-[9px] text-[#b1bad3]">{slot.provider}</div>
      </div>
    </Card>
  );
}

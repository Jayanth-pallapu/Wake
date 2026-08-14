"use client";

import { useUiStore } from "@/store/ui";
import { SLOT_GAMES } from "@/lib/constants";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { SweetBonanzaGame } from "./sweet-bonanza-game";
import { GatesOfOlympusGame } from "./gates-of-olympus-game";
import { BigBassBonanzaGame } from "./big-bass-bonanza-game";
import { BookOfDeadGame } from "./book-of-dead-game";
import { WantedDeadGame } from "./wanted-dead-game";
import { SugarRushGame } from "./sugar-rush-game";
import { CrazyTimeGame } from "./crazy-time-game";
import { LightningRouletteGame } from "./lightning-roulette-game";
import { DogHouseSlotGame } from "./dog-house-game";
import { MoneyTrainGame } from "./money-train-game";
import { FruitPartyGame } from "./fruit-party-game";
import { WildWestGoldGame } from "./wild-west-gold-game";

export function SlotsView({ slotId }: { slotId: string | null }) {
  const setView = useUiStore((s) => s.setView);

  if (!slotId) {
    return <SlotsLobby />;
  }

  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto">
      <button
        onClick={() => setView({ kind: "slots-lobby" })}
        className="flex items-center gap-1 text-xs text-[#b1bad3] hover:text-white mb-4 transition-colors"
      >
        <ChevronLeft className="w-3 h-3" />
        Back to Slots & Live Dealers
      </button>
      {renderSlotGame(slotId)}
    </div>
  );
}

function renderSlotGame(slotId: string) {
  switch (slotId) {
    case "sweet-bonanza":      return <SweetBonanzaGame />;
    case "gates-of-olympus":   return <GatesOfOlympusGame />;
    case "big-bass-bonanza":   return <BigBassBonanzaGame />;
    case "book-of-dead":       return <BookOfDeadGame />;
    case "wanted-dead":        return <WantedDeadGame />;
    case "sugar-rush":         return <SugarRushGame />;
    case "crazy-time":         return <CrazyTimeGame />;
    case "lightning-roulette": return <LightningRouletteGame />;
    case "dog-house":          return <DogHouseSlotGame />;
    case "money-train":        return <MoneyTrainGame />;
    case "fruit-party":        return <FruitPartyGame />;
    case "wild-west-gold":     return <WildWestGoldGame />;
    default:
      return (
        <div className="text-center text-[#b1bad3] py-20 bg-[#1a2c38] rounded-xl border border-[#2f4553]">
          Game coming soon.
        </div>
      );
  }
}

function SlotsLobby() {
  const setView = useUiStore((s) => s.setView);

  return (
    <div className="p-3 sm:p-5 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-r from-[#0f212e] via-[#1475e1]/15 to-purple-900/20 border border-[#2f4553] p-6"
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 80% 50%, #ec4899 0, transparent 50%), radial-gradient(circle at 20% 50%, #1475e1 0, transparent 50%)",
        }} />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#ff3b3b]/20 border border-[#ff3b3b]/40 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#ff3b3b] animate-pulse" />
            <span className="text-[10px] font-bold text-[#ff3b3b] uppercase tracking-wider">Live Dealers Online</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
            Slots & <span className="text-[#ec4899]">Live Dealers</span>
          </h1>
          <p className="text-sm text-[#b1bad3]">12 games · Provably fair · Instant payouts</p>
        </div>
      </motion.div>

      {/* Live Dealer Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#ff3b3b] animate-pulse" />
          <h2 className="text-base font-bold text-white">Live Dealers</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {SLOT_GAMES.filter(g => g.live).map((game, i) => (
            <SlotLobbyCard key={game.id} game={game} index={i} />
          ))}
        </div>
      </div>

      {/* Slots Section */}
      <div>
        <h2 className="text-base font-bold text-white mb-3">Slot Games</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {SLOT_GAMES.filter(g => !g.live).map((game, i) => (
            <SlotLobbyCard key={game.id} game={game} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SlotLobbyCard({ game, index }: { game: typeof SLOT_GAMES[number]; index: number }) {
  const setView = useUiStore((s) => s.setView);
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => setView({ kind: "slots", slotId: game.id })}
      className="group w-full text-left bg-[#1a2c38] border border-[#2f4553] rounded-xl overflow-hidden hover:border-[#00c2ff]/40 hover:scale-[1.03] transition-all duration-200 hover:shadow-xl hover:shadow-[#00c2ff]/10"
    >
      <div className={`relative aspect-[3/4] bg-gradient-to-br ${game.color} overflow-hidden`}>
        {/* Thumbnail image */}
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
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[#0f212e]/0 group-hover:bg-[#0f212e]/60 transition-all duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#00c2ff] text-[#001a2e] text-xs font-black px-4 py-2 rounded-lg">
            Play Now
          </span>
        </div>
        {/* LIVE badge */}
        {game.live && (
          <span className="absolute top-2 left-2 text-[8px] px-1.5 py-0.5 rounded bg-[#ff3b3b] text-white uppercase font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Live
          </span>
        )}
        {/* Name & provider gradient overlay at bottom */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2.5 pt-6 pb-2">
          <div className="text-[11px] font-bold text-white leading-tight truncate">{game.name}</div>
          <div className="text-[9px] text-[#b1bad3] mt-0.5">{game.provider}</div>
        </div>
      </div>
    </motion.button>
  );
}

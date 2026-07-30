"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Trophy, Gift, Wallet, Users, Flame, Dice5, Rocket, Bomb, TrendingUp,
  CircleDollarSign, Headphones, ChevronLeft, Bot
} from "lucide-react";
import { useUiStore } from "@/store/ui";
import { GAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV = [
  { kind: "casino" as const, label: "Casino Home", icon: Home },
  { kind: "sports" as const, label: "Sportsbook", icon: Trophy },
  { kind: "vip" as const, label: "VIP Club", icon: Gift },
  { kind: "wallet" as const, label: "Wallet", icon: Wallet },
  { kind: "leaderboard" as const, label: "Leaderboard", icon: Users },
  { kind: "affiliate" as const, label: "Affiliate", icon: CircleDollarSign },
];

const GAME_ICONS: Record<string, React.ElementType> = {
  crash: Rocket,
  dice: Dice5,
  plinko: Flame,
  mines: Bomb,
  limbo: TrendingUp,
  wheel: Trophy,
  tower: Trophy,
  keno: Dice5,
};

export function LeftSidebar() {
  const { view, setView, leftSidebarOpen, toggleLeftSidebar } = useUiStore();
  const viewKind = view.kind;

  return (
    <AnimatePresence>
      {leftSidebarOpen && (
        <motion.aside
          initial={{ x: -260, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -260, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="fixed lg:sticky top-14 left-0 z-30 w-60 h-[calc(100vh-3.5rem)] bg-[#0f212e] border-r border-[#2f4553] overflow-y-auto no-scrollbar shrink-0"
        >
          <div className="p-3 space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = viewKind === item.kind;
              return (
                <button
                  key={item.kind}
                  onClick={() => setView({ kind: item.kind })}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-[#213743] text-white"
                      : "text-[#b1bad3] hover:bg-[#1a2c38] hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00e701]" />}
                </button>
              );
            })}
          </div>

          <div className="px-3 pt-2 pb-1">
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[11px] uppercase tracking-wider text-[#b1bad3] font-semibold">
                Originals
              </span>
            </div>
            <div className="space-y-0.5">
              {GAMES.map((g) => {
                const Icon = GAME_ICONS[g.id] || Bot;
                const active = view.kind === "game" && view.gameId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setView({ kind: "game", gameId: g.id })}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      active
                        ? "bg-[#213743] text-white"
                        : "text-[#b1bad3] hover:bg-[#1a2c38] hover:text-white"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{g.name}</span>
                    {g.tag && (
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#213743] text-[#b1bad3] uppercase tracking-wide">
                        {g.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 mt-2">
            <div className="rounded-lg bg-gradient-to-br from-[#1475e1]/20 to-[#00e701]/10 border border-[#2f4553] p-3">
              <div className="flex items-center gap-2 mb-1">
                <Headphones className="w-4 h-4 text-[#00e701]" />
                <span className="text-sm font-semibold text-white">24/7 Support</span>
              </div>
              <p className="text-[11px] text-[#b1bad3] leading-relaxed">
                Live chat & VIP host available around the clock.
              </p>
            </div>
          </div>

          <button
            onClick={toggleLeftSidebar}
            className="hidden lg:flex items-center justify-center gap-2 w-[calc(100%-1.5rem)] mx-3 mb-3 py-2 rounded-md bg-[#1a2c38] hover:bg-[#213743] text-[#b1bad3] text-xs"
          >
            <ChevronLeft className="w-3 h-3" /> Collapse
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export function LeftSidebarCollapsed() {
  const toggleLeftSidebar = useUiStore((s) => s.toggleLeftSidebar);
  if (useUiStore.getState().leftSidebarOpen) return null;
  return (
    <button
      onClick={toggleLeftSidebar}
      className="hidden lg:flex sticky top-14 h-10 w-10 mt-2 ml-2 items-center justify-center rounded-md bg-[#1a2c38] hover:bg-[#213743] text-[#b1bad3] border border-[#2f4553]"
      aria-label="Expand sidebar"
    >
      <ChevronLeft className="w-4 h-4 rotate-180" />
    </button>
  );
}

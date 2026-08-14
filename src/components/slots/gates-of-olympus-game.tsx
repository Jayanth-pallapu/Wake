"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlotReel } from "./slot-reel";
import { BetPanel, useBetAmount, toRaw } from "@/components/games/bet-panel";
import { useGame } from "@/hooks/use-slot-game";
import { useUiStore } from "@/store/ui";

const SYMBOLS = ["⚡", "💎", "💍", "🏺", "🔮", "🦉", "♦", "⚜"];
const COLS = 6;
const ROWS = 5;

function randGrid(winner: boolean): string[][] {
  const g: string[][] = [];
  const winSym = SYMBOLS[Math.floor(Math.random() * 3)];
  for (let r = 0; r < ROWS; r++) {
    const row: string[] = [];
    for (let c = 0; c < COLS; c++) {
      if (winner && Math.random() < 0.35) row.push(winSym);
      else row.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    }
    g.push(row);
  }
  return g;
}

export function GatesOfOlympusGame() {
  const [bet, setBet] = useBetAmount(1, "gates-bet");
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState<string[][]>(() => randGrid(false));
  const [lightningMults, setLightningMults] = useState<Record<number, number>>({});
  const [lastWin, setLastWin] = useState<number | null>(null);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const handleSpin = useCallback(async () => {
    if (spinning || playing) return;
    setSpinning(true);
    setLightningMults({});
    setLastWin(null);

    const result = await play("gates-of-olympus", {}, toRaw(bet));
    const won = result?.bet?.win ?? false;
    const mult = result?.bet?.multiplier ?? 0;

    // Lightning flash: random column multipliers
    const lMults: Record<number, number> = {};
    const numLightning = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numLightning; i++) {
      const col = Math.floor(Math.random() * COLS);
      lMults[col] = [2, 3, 5, 8][Math.floor(Math.random() * 4)];
    }
    setLightningMults(lMults);

    await new Promise<void>((res) => setTimeout(res, 700));
    const newGrid = randGrid(won);
    setGrid(newGrid);
    await new Promise<void>((res) => setTimeout(res, 600));
    setSpinning(false);
    if (won) setLastWin(mult);
    else setLightningMults({});
  }, [spinning, playing, play, bet]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-gradient-to-br from-blue-900/30 via-[#0f212e] to-indigo-900/20 rounded-xl p-4 border border-[#2f4553] relative overflow-hidden min-h-[420px]">
        <style>{`
          @keyframes lightningFlash { 0%,100%{opacity:0.4;transform:scale(0.9)} 50%{opacity:1;transform:scale(1.15)} }
          @keyframes cascade { from{transform:translateY(-30px);opacity:0} to{transform:translateY(0);opacity:1} }
        `}</style>

        <div className="text-center mb-3">
          <span className="text-xs font-bold text-[#b1bad3] uppercase tracking-wider">Gates of Olympus</span>
          <span className="ml-2 text-[10px] text-yellow-400">Cascading · 6×5</span>
        </div>

        <div className="flex gap-1.5 justify-center mb-3" style={{ perspective: 800 }}>
          {Array.from({ length: COLS }).map((_, c) => (
            <div key={c} style={{ position: "relative" }}>
              <SlotReel
                symbols={SYMBOLS}
                finalSymbol={grid[2]?.[c] ?? SYMBOLS[0]}
                spinning={spinning}
                delay={c * 100}
                size={28}
                highlight={!spinning && c in lightningMults}
              />
              {/* Lightning multiplier badge */}
              {!spinning && c in lightningMults && (
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  background: "rgba(255,215,0,0.92)", color: "#0f212e",
                  borderRadius: 6, fontWeight: 900, fontSize: 13,
                  padding: "2px 7px", zIndex: 10,
                  animation: "lightningFlash 0.7s ease-in-out infinite",
                  boxShadow: "0 0 12px rgba(255,215,0,0.6)",
                }}>
                  ×{lightningMults[c]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Lightning bolt decorations */}
        {Object.keys(lightningMults).length > 0 && !spinning && (
          <div className="flex justify-center mb-2">
            <span style={{ fontSize: 28, animation: "lightningFlash 0.5s ease-in-out infinite" }}>⚡</span>
            <span className="text-xs text-yellow-400 font-bold self-center ml-2">Lightning Multiplier Active!</span>
            <span style={{ fontSize: 28, animation: "lightningFlash 0.5s ease-in-out infinite 0.25s" }}>⚡</span>
          </div>
        )}

        <AnimatePresence>
          {lastWin !== null && (
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-x-4 bottom-4 text-center">
              <div className="bg-gradient-to-r from-yellow-500/20 via-[#00c2ff]/20 to-blue-500/20 border border-yellow-400/40 rounded-xl py-3">
                <div className="text-2xl font-black text-yellow-400">⚡ {lastWin.toFixed(2)}× WIN!</div>
                <div className="text-xs text-[#b1bad3]">+{(bet * lastWin).toFixed(4)} {activeAsset}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BetPanel bet={bet} setBet={setBet} onBet={handleSpin} playing={playing || spinning} betLabel={spinning ? "Spinning…" : "⚡ Spin!"}>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs bg-[#0f212e] rounded-md p-2">
            <span className="text-[#b1bad3]">Feature</span>
            <span className="font-bold text-yellow-400">Lightning Mults</span>
          </div>
          <div className="flex items-center justify-between text-xs bg-[#0f212e] rounded-md p-2">
            <span className="text-[#b1bad3]">Grid</span>
            <span className="font-bold text-white">6 × 5</span>
          </div>
          <div className="flex items-center justify-between text-xs bg-[#0f212e] rounded-md p-2">
            <span className="text-[#b1bad3]">Mechanic</span>
            <span className="font-bold text-blue-400">Cascading Reels</span>
          </div>
        </div>
      </BetPanel>
    </div>
  );
}

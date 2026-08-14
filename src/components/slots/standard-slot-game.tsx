"use client";

/**
 * Shared factory for standard 5x3 payline slot games.
 * Used by: Big Bass Bonanza, Book of Dead, Wanted Dead, Dog House, Money Train, Wild West Gold
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlotReel } from "./slot-reel";
import { BetPanel, useBetAmount, toRaw } from "@/components/games/bet-panel";
import { useGame } from "@/hooks/use-slot-game";
import { useUiStore } from "@/store/ui";

interface StandardSlotProps {
  gameId: string;
  storageKey: string;
  title: string;
  subtitle: string;
  symbols: string[];
  theme: {
    bg: string; // tailwind gradient classes
    accent: string; // hex color
    icon: string;
  };
  featureLabel?: string;
  featureDesc?: string;
  winMessage?: (mult: number) => string;
}

function randRow(symbols: string[], winner: boolean, winIdx: number): string[] {
  const row: string[] = [];
  const winSym = symbols[winIdx % symbols.length];
  for (let c = 0; c < 5; c++) {
    if (winner && c < 4 && Math.random() < 0.6) row.push(winSym);
    else row.push(symbols[Math.floor(Math.random() * symbols.length)]);
  }
  return row;
}

function randGrid(symbols: string[], winner: boolean): string[][] {
  const winSymIdx = Math.floor(Math.random() * Math.min(3, symbols.length));
  return [
    randRow(symbols, winner && Math.random() > 0.3, winSymIdx),
    randRow(symbols, winner && Math.random() > 0.5, winSymIdx),
    randRow(symbols, winner, winSymIdx),
  ];
}

function getWinLines(grid: string[][]): number[] {
  const lines: number[] = [];
  for (let r = 0; r < 3; r++) {
    const sym = grid[r][0];
    let matches = 1;
    for (let c = 1; c < 5; c++) {
      if (grid[r][c] === sym) matches++;
      else break;
    }
    if (matches >= 3) lines.push(r);
  }
  return lines;
}

export function StandardSlotGame({
  gameId, storageKey, title, subtitle, symbols, theme,
  featureLabel, featureDesc, winMessage,
}: StandardSlotProps) {
  const [bet, setBet] = useBetAmount(1, storageKey);
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState<string[][]>(() => randGrid(symbols, false));
  const [winLines, setWinLines] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const handleSpin = useCallback(async () => {
    if (spinning || playing) return;
    setSpinning(true);
    setWinLines([]);
    setLastWin(null);

    const result = await play(gameId, {}, toRaw(bet));
    const won = result?.bet?.win ?? false;
    const mult = result?.bet?.multiplier ?? 0;

    await new Promise<void>((res) => setTimeout(res, 400));
    const newGrid = randGrid(symbols, won);
    setGrid(newGrid);
    await new Promise<void>((res) => setTimeout(res, 700));
    setSpinning(false);

    if (won) {
      setWinLines(getWinLines(newGrid));
      setLastWin(mult);
    }
  }, [spinning, playing, play, bet, gameId, symbols]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className={`bg-gradient-to-br ${theme.bg} rounded-xl p-4 border border-[#2f4553] relative overflow-hidden min-h-[360px]`}>
        <style>{`
          @keyframes winPulse { 0%,100%{box-shadow:0 0 0 rgba(0,194,255,0)} 50%{box-shadow:0 0 20px rgba(0,194,255,0.5)} }
          @keyframes reelIn { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        `}</style>

        <div className="text-center mb-3">
          <span className="text-xs font-bold text-[#b1bad3] uppercase tracking-wider">{title}</span>
          <span className="ml-2 text-[10px]" style={{ color: theme.accent }}>{subtitle}</span>
        </div>

        {/* Paylines indicator */}
        <div className="flex justify-center gap-1 mb-2">
          {[0,1,2].map(r => (
            <div key={r} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: winLines.includes(r) ? "#00c2ff" : "#2f4553",
              transition: "background 0.3s",
              boxShadow: winLines.includes(r) ? "0 0 8px #00c2ff" : "none",
            }} />
          ))}
          <span className="text-[9px] text-[#b1bad3] ml-1">paylines</span>
        </div>

        {/* 5-reel display */}
        <div className="flex gap-2 justify-center mb-3" style={{ perspective: 600 }}>
          {Array.from({ length: 5 }).map((_, c) => (
            <SlotReel
              key={c}
              symbols={symbols}
              finalSymbol={grid[1]?.[c] ?? symbols[0]}
              spinning={spinning}
              delay={c * 150}
              size={30}
              highlight={!spinning && winLines.length > 0 && (() => {
                const winSym = grid[winLines[0]]?.[0];
                return winSym !== undefined && grid[1]?.[c] === winSym && c < 3;
              })()}
            />
          ))}
        </div>

        {/* Win lines visual */}
        {!spinning && winLines.map(r => (
          <div key={r} style={{
            position: "absolute", left: 16, right: 16,
            top: `${30 + r * 25}%`,
            height: 2, background: "#00c2ff",
            opacity: 0.4, borderRadius: 2,
            animation: "winPulse 1s ease-in-out infinite",
          }} />
        ))}

        <AnimatePresence>
          {lastWin !== null && (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-x-4 bottom-4 text-center">
              <div className="border border-[#00c2ff]/40 rounded-xl py-3" style={{
                background: `linear-gradient(135deg, ${theme.accent}22, rgba(0,194,255,0.1))`,
              }}>
                <div className="text-2xl font-black text-[#00c2ff]">
                  {winMessage ? winMessage(lastWin) : `🎉 ${lastWin.toFixed(2)}× WIN!`}
                </div>
                <div className="text-xs text-[#b1bad3]">+{(bet * lastWin).toFixed(4)} {activeAsset}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BetPanel bet={bet} setBet={setBet} onBet={handleSpin} playing={playing || spinning}
        betLabel={spinning ? "Spinning…" : `${theme.icon} Spin!`}>
        <div className="space-y-1">
          {featureLabel && (
            <div className="flex items-center justify-between text-xs bg-[#0f212e] rounded-md p-2">
              <span className="text-[#b1bad3]">Feature</span>
              <span className="font-bold" style={{ color: theme.accent }}>{featureLabel}</span>
            </div>
          )}
          {featureDesc && (
            <div className="text-[10px] text-[#b1bad3] bg-[#0f212e] rounded-md p-2">{featureDesc}</div>
          )}
          <div className="flex items-center justify-between text-xs bg-[#0f212e] rounded-md p-2">
            <span className="text-[#b1bad3]">Grid</span>
            <span className="font-bold text-white">5 × 3</span>
          </div>
          <div className="flex items-center justify-between text-xs bg-[#0f212e] rounded-md p-2">
            <span className="text-[#b1bad3]">Paylines</span>
            <span className="font-bold text-white">10</span>
          </div>
        </div>
      </BetPanel>
    </div>
  );
}

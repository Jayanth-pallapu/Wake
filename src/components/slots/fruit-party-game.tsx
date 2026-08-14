"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, useBetAmount, toRaw } from "@/components/games/bet-panel";
import { useGame } from "@/hooks/use-slot-game";
import { useUiStore } from "@/store/ui";

const SYMS = ["🍓","🍇","🍋","🍊","🍑","🍎","⭐","💎"];
const COLS = 7;
const ROWS = 7;

function randGrid(winner: boolean): string[][] {
  const g: string[][] = [];
  const winSym = SYMS[Math.floor(Math.random() * 4)];
  for (let r = 0; r < ROWS; r++) {
    const row: string[] = [];
    for (let c = 0; c < COLS; c++) {
      if (winner && Math.random() < 0.3) row.push(winSym);
      else row.push(SYMS[Math.floor(Math.random() * SYMS.length)]);
    }
    g.push(row);
  }
  return g;
}

function findClusters(grid: string[][]): Set<string> {
  const winning = new Set<string>();
  const counts: Record<string, number> = {};
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      counts[grid[r][c]] = (counts[grid[r][c]] || 0) + 1;
  for (const [sym, cnt] of Object.entries(counts))
    if (cnt >= 5)
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (grid[r][c] === sym) winning.add(`${r}-${c}`);
  return winning;
}

export function FruitPartyGame() {
  const [bet, setBet] = useBetAmount(1, "fruit-party-bet");
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState<string[][]>(() => randGrid(false));
  const [winCells, setWinCells] = useState<Set<string>>(new Set());
  const [lastWin, setLastWin] = useState<number | null>(null);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const handleSpin = useCallback(async () => {
    if (spinning || playing) return;
    setSpinning(true);
    setWinCells(new Set());
    setLastWin(null);

    const result = await play("fruit-party", {}, toRaw(bet));
    const won = result?.bet?.win ?? false;
    const mult = result?.bet?.multiplier ?? 0;

    await new Promise<void>((res) => setTimeout(res, 800));
    const newGrid = randGrid(won);
    setGrid(newGrid);
    setSpinning(false);

    if (won) {
      setWinCells(findClusters(newGrid));
      setLastWin(mult);
    }
  }, [spinning, playing, play, bet]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-gradient-to-br from-red-900/30 via-[#0f212e] to-rose-900/20 rounded-xl p-4 border border-[#2f4553] relative min-h-[420px]">
        <div className="text-center mb-3">
          <span className="text-xs font-bold text-[#b1bad3] uppercase tracking-wider">Fruit Party</span>
          <span className="ml-2 text-[10px] text-red-400">7×7 Cluster Pays</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 4 }}>
          {grid.map((row, r) =>
            row.map((sym, c) => {
              const isWin = winCells.has(`${r}-${c}`);
              return (
                <motion.div
                  key={`${r}-${c}`}
                  animate={spinning
                    ? { y: [0, -8, 0], opacity: [1, 0.4, 1] }
                    : isWin ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: spinning ? Infinity : 0, duration: 0.5, delay: c * 0.05 }}
                  style={{
                    background: isWin ? "rgba(239,68,68,0.15)" : "#0f212e",
                    border: `1px solid ${isWin ? "#ef4444" : "#2f4553"}`,
                    borderRadius: 6, aspectRatio: "1",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                    boxShadow: isWin ? "0 0 12px rgba(239,68,68,0.4)" : "none",
                    transition: "all 0.3s",
                  }}
                >{sym}</motion.div>
              );
            })
          )}
        </div>

        <AnimatePresence>
          {lastWin !== null && (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-x-4 bottom-4 text-center">
              <div className="bg-gradient-to-r from-red-500/20 via-[#00c2ff]/20 to-rose-500/20 border border-[#00c2ff]/40 rounded-xl py-3">
                <div className="text-2xl font-black text-[#00c2ff]">🍓 {lastWin.toFixed(2)}× Fruit Win!</div>
                <div className="text-xs text-[#b1bad3]">+{(bet * lastWin).toFixed(4)} {activeAsset}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BetPanel bet={bet} setBet={setBet} onBet={handleSpin} playing={playing || spinning} betLabel={spinning ? "Spinning…" : "🍓 Spin!"}>
        <div className="flex items-center justify-between text-xs bg-[#0f212e] rounded-md p-2">
          <span className="text-[#b1bad3]">Type</span>
          <span className="font-bold text-red-400">7×7 Tumble</span>
        </div>
      </BetPanel>
    </div>
  );
}

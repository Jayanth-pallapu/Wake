"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";

export function FastcrashGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "fastcrash-bet");
  const [target, setTarget] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [displayMult, setDisplayMult] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [win, setWin] = useState<boolean | null>(null);
  const [history, setHistory] = useState<{ cp: number; won: boolean }[]>([]);
  const { play } = useGame();

  const handleBet = async () => {
    if (playing || target < 1.01) return;
    setPlaying(true);
    setCrashPoint(null);
    setWin(null);
    setDisplayMult(1.00);

    const res = await play("fastcrash", { target }, toRaw(bet));
    if (!res) {
      setPlaying(false);
      return;
    }

    const cp = res.bet.outcome.crashPoint as number;
    const isWin = res.bet.win;
    const endVal = isWin ? target : cp;

    // Fast animation
    const duration = 500;
    const start = performance.now();
    
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      setDisplayMult(1 + (endVal - 1) * t);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setCrashPoint(cp);
        setWin(isWin);
        setHistory((h) => [{ cp, won: isWin }, ...h].slice(0, 15));
        setPlaying(false);
        onPlayed?.();
      }
    };
    requestAnimationFrame(animate);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-6 min-h-[350px] flex flex-col items-center justify-center relative">
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap w-full pr-4">
          {history.map((h, i) => (
            <div key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${h.won ? "bg-[#00e701]/20 text-[#00e701]" : "bg-[#ff5c5c]/20 text-[#ff5c5c]"}`}>
              {h.cp.toFixed(2)}×
            </div>
          ))}
        </div>

        <motion.div
          key={win === null ? 'playing' : 'ended'}
          initial={{ scale: 0.8 }}
          animate={{ scale: win !== null ? 1.1 : 1 }}
          className={`text-7xl font-black tabular-nums ${win === true ? "text-[#00e701]" : win === false ? "text-[#ff5c5c]" : "text-white"}`}
        >
          {displayMult.toFixed(2)}×
        </motion.div>

        {win !== null && (
          <div className={`mt-4 text-xl font-bold ${win ? "text-[#00e701]" : "text-[#ff5c5c]"}`}>
            {win ? `CASHED OUT AT ${target.toFixed(2)}×` : `CRASHED AT ${crashPoint?.toFixed(2)}×`}
          </div>
        )}
      </div>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={playing} betLabel="Play" disabled={target < 1.01}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#b1bad3]">
              <span>Auto Cashout</span>
              <span className="text-[#00e701] font-bold">{target.toFixed(2)}×</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[1.5, 2, 3, 5, 10, 100].map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  disabled={playing}
                  className={`py-2 text-xs font-bold rounded ${target === t ? "bg-[#00e701] text-black" : "bg-[#213743] text-[#b1bad3] hover:bg-[#2f4553]"}`}
                >
                  {t}×
                </button>
              ))}
            </div>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

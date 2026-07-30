"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { useUiStore } from "@/store/ui";
import { kenoMultiplier } from "@/lib/provably-fair";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

const POOL = 40; // numbers 1..40
const MAX_PICKS = 10;

interface KenoResult {
  draw: number[];
  picks: number[];
  matches: number[];
  multiplier: number;
  payout: number;
  win: boolean;
}

export function KenoGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "keno-bet");
  const [picks, setPicks] = useState<number[]>([]);
  const [result, setResult] = useState<KenoResult | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [revealedDraw, setRevealedDraw] = useState<number[]>([]);
  const drawTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const togglePick = (n: number) => {
    if (drawing || playing) return;
    setResult(null);
    setRevealedDraw([]);
    setPicks((prev) => {
      if (prev.includes(n)) return prev.filter((p) => p !== n);
      if (prev.length >= MAX_PICKS) {
        toast.warning("Max 10 numbers");
        return prev;
      }
      return [...prev, n].sort((a, b) => a - b);
    });
  };

  const handleBet = async () => {
    if (picks.length < 1) {
      toast.warning("Pick at least 1 number");
      return;
    }
    setResult(null);
    setRevealedDraw([]);
    setDrawing(true);
    const res = await play("keno", { numbers: picks }, toRaw(bet));
    if (res) {
      const out = res.bet.outcome as {
        picks: number[];
        draw: number[];
        matches: number;
        multiplier: number;
      };
      const matchedNums = picks.filter((n) => out.draw.includes(n));
      // Animate the draw revealing numbers one-by-one
      const draw = out.draw;
      let i = 0;
      drawTimer.current = setInterval(() => {
        setRevealedDraw((prev) => {
          if (i >= draw.length) {
            if (drawTimer.current) clearInterval(drawTimer.current);
            setDrawing(false);
            const finalResult: KenoResult = {
              draw,
              picks,
              matches: matchedNums,
              multiplier: out.multiplier,
              payout: res.bet.payout,
              win: res.bet.win,
            };
            setResult(finalResult);
            if (finalResult.win && finalResult.multiplier >= 2) {
              toast.success(
                `🎉 Matched ${matchedNums.length} — ${finalResult.multiplier}× win!`
              );
            }
            onPlayed?.();
            return prev;
          }
          const next = [...prev, draw[i]];
          i++;
          return next;
        });
      }, 180);
    } else {
      setDrawing(false);
    }
  };

  const busy = playing || drawing;

  // projected payout if all picks matched (max possible)
  const maxPotentialMult = picks.length > 0 ? kenoMultiplier(picks.length, picks.length) : 0;
  const currentMatchMult = result ? result.multiplier : 0;
  const potentialPayout = bet * (result ? currentMatchMult : maxPotentialMult);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      {/* Keno board */}
      <div className="bg-[#0f212e] rounded-lg p-4 min-h-[420px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              Pick {picks.length}/{MAX_PICKS}
            </span>
            {picks.length > 0 && (
              <span className="text-[10px] text-[#b1bad3]">
                Max {maxPotentialMult.toFixed(2)}×
              </span>
            )}
          </div>
          {picks.length > 0 && !busy && (
            <button
              onClick={() => {
                setPicks([]);
                setResult(null);
                setRevealedDraw([]);
              }}
              className="text-[10px] text-[#b1bad3] hover:text-[#ff5c5c]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Number grid 8 cols x 5 rows = 40 */}
        <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
          {Array.from({ length: POOL }).map((_, i) => {
            const n = i + 1;
            const isPicked = picks.includes(n);
            const isDrawn = revealedDraw.includes(n);
            const isMatch = isPicked && isDrawn;
            return (
              <motion.button
                key={n}
                onClick={() => togglePick(n)}
                disabled={busy}
                initial={false}
                animate={{
                  scale: isMatch ? 1.05 : 1,
                }}
                className={`relative aspect-square rounded-md flex items-center justify-center text-sm font-bold transition-all ${
                  isMatch
                    ? "bg-[#00e701] text-[#0a1f12] border-2 border-[#00e701]"
                    : isPicked
                    ? "bg-[#1475e1]/30 border-2 border-[#1475e1] text-white"
                    : isDrawn
                    ? "bg-[#ffd23f]/20 border-2 border-[#ffd23f]/60 text-[#ffd23f]"
                    : "bg-[#1a2c38] border-2 border-[#2f4553] text-[#b1bad3] hover:border-[#1475e1]/50 hover:bg-[#213743]"
                } ${!busy ? "cursor-pointer" : "cursor-default"}`}
              >
                {isMatch && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="absolute inset-0 rounded-md bg-[#00e701]/30 flex items-center justify-center"
                  >
                    {n}
                  </motion.span>
                )}
                <span className={isMatch ? "opacity-0" : ""}>{n}</span>
                {isMatch && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-3 h-3 text-[#00e701]" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Result + matches */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2"
            >
              <ResultStat
                label="Picks"
                value={String(result.picks.length)}
                color="text-white"
              />
              <ResultStat
                label="Matches"
                value={`${result.matches.length}/${result.picks.length}`}
                color="text-[#00e701]"
              />
              <ResultStat
                label="Multiplier"
                value={`${result.multiplier.toFixed(2)}×`}
                color={
                  result.multiplier >= 10
                    ? "text-[#ff5cb1]"
                    : result.multiplier > 0
                    ? "text-[#ffd23f]"
                    : "text-[#ff5c5c]"
                }
              />
              <ResultStat
                label="Payout"
                value={`${result.payout.toFixed(4)} ${activeAsset}`}
                color={result.win ? "text-[#00e701]" : "text-[#ff5c5c]"}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {drawing && (
          <div className="mt-4 flex items-center justify-center gap-2 text-[#ffd23f]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-wider animate-pulse">
              Drawing numbers…
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div>
        <BetPanel
          bet={bet}
          setBet={setBet}
          onBet={handleBet}
          playing={busy}
          betLabel={busy ? "Drawing…" : "Draw"}
          disabled={picks.length < 1}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-[#b1bad3] uppercase tracking-wider">
              <span>Quick Pick</span>
              <span>{picks.length} selected</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 5, 7, 8, 9, 10].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => {
                    if (busy) return;
                    const avail = Array.from(
                      { length: POOL },
                      (_, i) => i + 1
                    ).filter((n) => !picks.includes(n));
                    // shuffle + take needed
                    const need = cnt - picks.length;
                    if (need <= 0) {
                      setPicks(picks.slice(0, cnt).sort((a, b) => a - b));
                      return;
                    }
                    for (let i = avail.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [avail[i], avail[j]] = [avail[j], avail[i]];
                    }
                    setPicks([...picks, ...avail.slice(0, need)].sort((a, b) => a - b));
                    setResult(null);
                    setRevealedDraw([]);
                  }}
                  disabled={busy}
                  className="py-1 text-[10px] rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] disabled:opacity-40"
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#0f212e] rounded-md p-2 text-[10px] text-[#b1bad3]">
            {picks.length > 0 ? (
              <>
                Max payout:{" "}
                <span className="font-bold text-[#ffd23f]">
                  {maxPotentialMult.toFixed(2)}×
                </span>{" "}
                · Profit on max:{" "}
                <span className="font-bold text-[#00e701]">
                  +{(bet * maxPotentialMult - bet).toFixed(4)} {activeAsset}
                </span>
              </>
            ) : (
              "Pick 1–10 numbers from the 40-tile board."
            )}
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

function ResultStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-[#1a2c38] border border-[#2f4553] rounded-md p-2 text-center">
      <div className="text-[9px] uppercase tracking-wider text-[#b1bad3]">
        {label}
      </div>
      <div className={`text-sm font-black tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

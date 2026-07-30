"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui";
import { Rocket, TrendingUp } from "lucide-react";

type Phase = "idle" | "running" | "crashed" | "cashed";

export function CrashGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "crash-bet");
  const [target, setTarget] = useState(2);
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayMult, setDisplayMult] = useState(1);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [cashoutAt, setCashoutAt] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const profit = bet * target - bet;

  const stopAnim = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => () => stopAnim(), [stopAnim]);

  const handleBet = async () => {
    if (target < 1.01 || phase === "running") return;
    stopAnim();
    setPhase("running");
    setDisplayMult(1);
    setCrashPoint(null);
    setCashoutAt(null);
    setLastWin(null);

    const result = await play("crash", { target }, toRaw(bet));
    if (!result) {
      setPhase("idle");
      return;
    }
    const cp = result.bet.outcome.crashPoint as number;
    setCrashPoint(cp);
    const win = result.bet.win;
    setLastWin(win);
    onPlayed?.();

    // Animate from 1.00 to endValue over duration based on log scale
    const endValue = win ? target : cp;
    const duration = Math.min(3500, 800 + Math.log2(endValue) * 350);
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out + log scaling for the multiplier rise
      const eased = 1 - Math.pow(1 - t, 3);
      const current = 1 + (endValue - 1) * eased;
      setDisplayMult(current);

      if (win && current >= target) {
        setDisplayMult(target);
        setCashoutAt(target);
        setPhase("cashed");
        return;
      }
      if (!win && t >= 1) {
        setDisplayMult(cp);
        setPhase("crashed");
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const color =
    phase === "crashed" ? "#ff5c5c" :
    phase === "cashed" ? "#00e701" :
    displayMult >= 10 ? "#ff5cb1" :
    displayMult >= 2 ? "#ffd23f" : "#00e701";

  // Curve path: rising exponential-ish curve in an SVG
  const W = 600;
  const H = 280;
  const cur = Math.max(1, displayMult);
  const progress = Math.min(1, Math.log(cur) / Math.log(Math.max(crashPoint || target || 10, 10)));
  const px = 30 + progress * (W - 60);
  const py = H - 30 - progress * (H - 60);
  const pathD = `M 30 ${H - 30} Q ${30 + (px - 30) * 0.4} ${H - 30} ${px} ${py}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-4 min-h-[340px] flex flex-col relative overflow-hidden">
        {/* Big multiplier */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={phase + Math.floor(displayMult * 10)}
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl sm:text-7xl font-black tabular-nums"
              style={{ color, textShadow: `0 0 30px ${color}55` }}
            >
              {displayMult.toFixed(2)}×
            </motion.div>
          </AnimatePresence>
          {phase === "crashed" && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-2 text-xl font-bold text-[#ff5c5c]"
            >
              💥 CRASHED @ {crashPoint?.toFixed(2)}×
            </motion.div>
          )}
          {phase === "cashed" && cashoutAt !== null && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-2 text-xl font-bold text-[#00e701]"
            >
              ✅ CASHED OUT @ {cashoutAt.toFixed(2)}×
            </motion.div>
          )}
          {phase === "idle" && (
            <div className="mt-3 text-sm text-[#b1bad3]">Place a bet & set your cashout target</div>
          )}
        </div>

        {/* Curve SVG */}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="crashGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity="0.1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.5" />
            </linearGradient>
          </defs>
          {/* grid lines */}
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="30" y1={30 + g * (H - 60)} x2={W - 30} y2={30 + g * (H - 60)} stroke="#2f4553" strokeWidth="0.5" strokeDasharray="4 4" />
          ))}
          {phase !== "idle" && (
            <>
              <path d={`${pathD} L ${px} ${H - 30} Z`} fill="url(#crashGrad)" />
              <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
              <circle cx={px} cy={py} r="6" fill={color} />
              {phase === "running" && (
                <g transform={`translate(${px + 8}, ${py - 8})`}>
                  <Rocket className="w-5 h-5" style={{ color }} />
                </g>
              )}
            </>
          )}
        </svg>

        {/* last crash history strip */}
        {crashPoint && phase !== "running" && (
          <div className="absolute top-2 left-2 flex gap-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${lastWin ? "bg-[#00e701]/20 text-[#00e701]" : "bg-[#ff5c5c]/20 text-[#ff5c5c]"}`}>
              {crashPoint.toFixed(2)}×
            </span>
          </div>
        )}
      </div>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={playing || phase === "running"} betLabel={phase === "running" ? "Running…" : "Place Bet"} disabled={target < 1.01}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Auto Cashout @</Label>
              <span className="text-xs font-bold text-[#00e701] tabular-nums">{target.toFixed(2)}×</span>
            </div>
            <Input
              type="number"
              value={target}
              onChange={(e) => setTarget(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
              min={1.01}
              step="0.01"
              className="bg-[#0f212e] border-[#2f4553] text-white h-10 tabular-nums"
            />
            <div className="flex gap-1">
              {[1.5, 2, 5, 10, 100].map((m) => (
                <button
                  key={m}
                  onClick={() => setTarget(m)}
                  className="flex-1 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white transition-colors"
                >
                  {m}×
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs bg-[#0f212e] rounded-md p-2">
            <span className="text-[#b1bad3]">Profit on win</span>
            <span className="font-bold text-[#00e701] tabular-nums">+{profit.toFixed(6)} {activeAsset}</span>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

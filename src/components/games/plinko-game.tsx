"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PLINKO_MULTIPLIERS, type PlinkoRisk } from "@/lib/provably-fair";
import { useUiStore } from "@/store/ui";
import {
  GameArena, GameStyles, ConfettiRain, GAME_THEMES, StreakBadge,
  PlinkoSlowWinReveal, PlinkoSlowLoseReveal, PlinkoBoardBackground,
} from "./game-effects";
import {
  soundPlinkoDropBall,
  soundPlinkoTick,
  soundPlinkoLand,
  soundPlinkoWinFanfare,
  soundPlinkoWinBig,
  soundPlinkoWinShimmer,
  soundPlinkoLoseImpact,
  soundPlinkoLoseRumble,
} from "@/hooks/use-sound";

const ROWS = 16;

const ROW_COLORS = [
  "#a855f7", "#9333ea", "#7c3aed", "#6366f1",
  "#4f46e5", "#2563eb", "#0ea5e9", "#00c2ff",
  "#06b6d4", "#14b8a6", "#22c55e", "#84cc16",
  "#eab308", "#f59e0b", "#ec4899", "#ffd23f",
];

// Gravity-like step delay: row 0 = 290ms, row 15 = 110ms
function stepDelay(row: number): number {
  return Math.max(110, 290 - row * 11);
}

function bucketColor(m: number) {
  if (m >= 50) return "#ffd23f";
  if (m >= 10) return "#ff5cb1";
  if (m >= 2)  return "#00c2ff";
  if (m >= 1)  return "#4ade80";
  if (m >= 0.3) return "#64748b";
  return "#ef4444";
}

function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("agy_sound_enabled");
  return v === null ? true : v === "true";
}

export function PlinkoGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "plinko-bet");
  const [risk, setRisk] = useState<PlinkoRisk>("medium");
  const [ball, setBall] = useState<{ directions: number[]; bucket: number; multiplier: number } | null>(null);
  const [animStep, setAnimStep] = useState<number>(-1);
  const [hitPegPos, setHitPegPos] = useState<{ x: number; y: number; color: string } | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [showWinReveal, setShowWinReveal] = useState(false);
  const [showLoseReveal, setShowLoseReveal] = useState(false);

  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);
  const table = PLINKO_MULTIPLIERS[risk];
  const dropping = animStep >= 0 && animStep < ROWS;

  // SVG layout constants (defined here so handleBet can use them)
  const W = 560, H = 420, padX = 40, padTop = 30, padBottom = 60;
  const rowGap = (H - padTop - padBottom) / ROWS;

  const handleBet = async () => {
    setLastWin(null);
    setShowWinReveal(false);
    setShowLoseReveal(false);
    setHitPegPos(null);
    if (isSoundEnabled()) soundPlinkoDropBall();
    const result = await play("plinko", { risk }, toRaw(bet));
    if (result) {
      const dirs = result.bet.outcome.directions as number[];
      const bucket = result.bet.outcome.bucket as number;
      const mult = result.bet.outcome.multiplier as number;
      const win = result.bet.win;
      setBall({ directions: dirs, bucket, multiplier: mult });
      setAnimStep(-1);
      setHitPegPos(null);

      let pos = 0;
      for (let i = 0; i <= dirs.length; i++) {
        // Gravity-based delay: slow at top, faster toward bottom
        await new Promise((r) => setTimeout(r, stepDelay(i)));
        setAnimStep(i);

        // Highlight the peg the ball just hit
        if (i < dirs.length) {
          const r2 = i;
          const count = r2 + 3;
          const gap = (W - padX * 2) / (count - 1);
          const colIdx = Math.max(0, Math.min(count - 1, Math.floor((count - 1) / 2) + pos));
          const px = padX + colIdx * gap;
          const py = padTop + r2 * rowGap + rowGap / 2;
          setHitPegPos({ x: px, y: py, color: ROW_COLORS[r2] });
          if (isSoundEnabled()) soundPlinkoTick(i, dirs[i]);
          pos += dirs[i] === 1 ? 1 : -1;
        } else {
          setHitPegPos(null);
        }
      }

      if (isSoundEnabled()) soundPlinkoLand(mult);
      setLastWin(win);
      setStreak(s => win ? s + 1 : 0);
      onPlayed?.();

      await new Promise((r) => setTimeout(r, 150));
      if (win) {
        setShowWinReveal(true);
        if (isSoundEnabled()) {
          soundPlinkoWinFanfare(mult);
          if (mult >= 10) setTimeout(() => soundPlinkoWinBig(mult), 400);
          setTimeout(() => soundPlinkoWinShimmer(), 2200);
        }
      } else {
        setShowLoseReveal(true);
        if (isSoundEnabled()) {
          soundPlinkoLoseRumble();
          setTimeout(() => soundPlinkoLoseImpact(), 1050);
        }
      }
    }
  };

  const pegRadius = 4.5;

  const pegs: { x: number; y: number; row: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    const count = r + 3;
    const y = padTop + r * rowGap + rowGap / 2;
    const gap = (W - padX * 2) / (count - 1);
    for (let c = 0; c < count; c++) pegs.push({ x: padX + c * gap, y, row: r });
  }

  let ballX = W / 2, ballY = padTop - 14;
  if (ball && animStep >= 0) {
    const steps = Math.min(animStep, ball.directions.length);
    let pos = 0;
    for (let i = 0; i < steps; i++) pos += ball.directions[i] === 1 ? 1 : -1;
    const count = steps + 3;
    const gap = (W - padX * 2) / (count - 1);
    ballX = padX + Math.max(0, Math.min(count - 1, Math.floor((count - 1) / 2) + pos)) * gap;
    ballY = padTop + steps * rowGap + rowGap / 2;
  }
  const ballFinalY = animStep >= ROWS ? H - padBottom + 12 : ballY;
  const bucketCount = ROWS + 1;
  const bucketGap = (W - padX * 2) / bucketCount;
  const profit = ball ? bet * ball.multiplier : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameArena gameId="plinko" win={lastWin} shake={false}
        className="p-2 flex flex-col items-center justify-between"
        style={{ minHeight: 460 }}
      >
        <GameStyles />
        <PlinkoBoardBackground dropping={dropping} />
        <div className="absolute top-2 w-full flex justify-center z-40">
          <StreakBadge streak={streak} />
        </div>
        <div className="text-[10px] uppercase tracking-wider text-[#b1bad3] mt-2 mb-1 z-10 relative">
          {dropping
            ? ("Row " + animStep + " / " + ROWS)
            : ball && animStep >= ROWS && !showWinReveal && !showLoseReveal
              ? ("Landed on " + ball.multiplier + "x")
              : "Drop the ball"}
        </div>

        {/* 3D perspective board */}
        <div style={{
          perspective: "1400px", perspectiveOrigin: "50% -5%",
          width: "100%", maxWidth: "600px", flex: 1,
          display: "flex", alignItems: "center", position: "relative",
        }}>
          <div style={{
            transform: "rotateX(12deg) rotateY(0.3deg)",
            transformStyle: "preserve-3d", width: "100%", position: "relative",
          }}>
            <svg viewBox={"0 0 " + W + " " + H} className="w-full" style={{ overflow: "visible" }}>
              <defs>
                {/* 3D ball gradient — specular highlight top-left */}
                <radialGradient id="plinko-ball" cx="26%" cy="24%" r="74%">
                  <stop offset="0%"   stopColor="#ffffff" />
                  <stop offset="22%"  stopColor="#fce7ff" />
                  <stop offset="55%"  stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#4c1d95" />
                </radialGradient>
                {/* Hit peg flash gradient */}
                <radialGradient id="peg-hit" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="60%"  stopColor="#ffd23f" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#ffd23f" stopOpacity="0" />
                </radialGradient>
                {ROW_COLORS.map((col, ri) => (
                  <radialGradient key={"pg-" + ri} id={"peg-g-" + ri} cx="32%" cy="28%" r="72%">
                    <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="50%"  stopColor={col} />
                    <stop offset="100%" stopColor={col} stopOpacity="0.5" />
                  </radialGradient>
                ))}
                <filter id="ball-glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="peg-hit-filter" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Board top edge glow */}
              <line x1={padX} y1={padTop - 2} x2={W - padX} y2={padTop - 2}
                stroke="rgba(139,92,246,0.4)" strokeWidth="2"
                style={{ filter: "blur(3px)" }} />

              {/* Pegs */}
              {pegs.map((p, i) => {
                const col = ROW_COLORS[p.row];
                return (
                  <g key={i}>
                    {/* Outer halo */}
                    <circle cx={p.x} cy={p.y} r={pegRadius + 5}
                      fill="transparent" stroke={col} strokeWidth="0.8"
                      opacity={0.22} style={{ filter: "blur(3px)" }} />
                    {/* Peg body */}
                    <circle cx={p.x} cy={p.y} r={pegRadius}
                      fill={"url(#peg-g-" + p.row + ")"}
                      style={{ filter: "drop-shadow(0 0 5px " + col + ") drop-shadow(0 0 2px " + col + ")" }} />
                  </g>
                );
              })}

              {/* Hit peg flash — expands and fades when ball touches a peg */}
              <AnimatePresence>
                {hitPegPos && (
                  <motion.circle
                    key={hitPegPos.x + "-" + hitPegPos.y}
                    cx={hitPegPos.x} cy={hitPegPos.y}
                    initial={{ r: pegRadius, opacity: 1 }}
                    animate={{ r: pegRadius * 5.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    fill={"url(#peg-hit)"}
                    style={{ pointerEvents: "none" }}
                  />
                )}
              </AnimatePresence>

              {/* Buckets */}
              {Array.from({ length: bucketCount }).map((_, i) => {
                const x = padX + i * bucketGap;
                const m = table[i];
                const color = bucketColor(m);
                const active = ball && animStep >= ROWS && ball.bucket === i;
                const isJackpot = m >= 50;
                const isBig = m >= 10 && m < 50;
                return (
                  <g key={i}>
                    {active && (
                      <rect x={x - bucketGap / 2 + 1} y={H - padBottom + 2}
                        width={bucketGap - 2} height={padBottom - 4} rx={5}
                        fill={color} opacity={0.3} style={{ filter: "blur(10px)" }} />
                    )}
                    <rect x={x - bucketGap / 2 + 2} y={H - padBottom + 4}
                      width={bucketGap - 4} height={padBottom - 8} rx={4}
                      fill={active ? color : "#0e1a24"}
                      stroke={color} strokeWidth={active ? 1.5 : 0.7} opacity={active ? 1 : 0.72}
                      style={{
                        transition: "fill 0.3s, opacity 0.3s",
                        filter: active ? "drop-shadow(0 0 14px " + color + ") drop-shadow(0 0 7px " + color + ")" : "none",
                        animation: active && (isJackpot || isBig) ? "plinkoBucketPulse 0.55s ease-in-out 5" : "none",
                      }}
                    />
                    <text x={x} y={H - padBottom / 2 + 5} textAnchor="middle"
                      fontSize={m >= 10 ? "10" : "9"} fontWeight="bold" fontFamily="monospace"
                      fill={active ? "#080808" : color}
                      style={{ filter: active ? "none" : "drop-shadow(0 0 3px " + color + ")", transition: "fill 0.3s" }}
                    >{m}x</text>
                  </g>
                );
              })}

              {/* Ball — large, prominent, slow spring physics */}
              {ball && (
                <>
                  {/* Glow aura behind everything */}
                  <motion.circle
                    animate={{ cx: ballX, cy: animStep >= ROWS ? ballFinalY : ballY }}
                    transition={{ type: "spring", stiffness: 90, damping: 14 }}
                    r={22}
                    fill="rgba(236,72,153,0.08)"
                    style={{ filter: "blur(12px)" }}
                  />
                  {/* Trail ghosts — 6 ghosts, very slow spring delays */}
                  {[0.52, 0.38, 0.26, 0.17, 0.09, 0.04].map((opacity, idx) => (
                    <motion.circle
                      key={"trail-" + idx}
                      animate={{ cx: ballX, cy: animStep >= ROWS ? ballFinalY : ballY }}
                      transition={{ type: "spring", stiffness: 90, damping: 14, delay: (idx + 1) * 0.09 }}
                      r={9 - idx * 1.2}
                      fill="url(#plinko-ball)"
                      opacity={opacity}
                      style={{ filter: "drop-shadow(0 0 " + (10 - idx * 1.5) + "px #ec4899)" }}
                    />
                  ))}
                  {/* Main ball */}
                  <motion.circle
                    animate={{ cx: ballX, cy: animStep >= ROWS ? ballFinalY : ballY }}
                    transition={{ type: "spring", stiffness: 90, damping: 14 }}
                    r={9}
                    fill="url(#plinko-ball)"
                    style={{ filter: "drop-shadow(0 0 10px #ec4899) drop-shadow(0 0 20px #a855f7) drop-shadow(0 0 35px #6d28d9)" }}
                  />
                </>
              )}
            </svg>
            <div style={{ height: "3px", background: "linear-gradient(transparent, rgba(139,92,246,0.1))", marginTop: "-3px" }} />
          </div>
        </div>

        <PlinkoSlowWinReveal active={showWinReveal} multiplier={ball?.multiplier ?? 0} profit={profit} asset={activeAsset} />
        <PlinkoSlowLoseReveal active={showLoseReveal} multiplier={ball?.multiplier ?? 0} />
        <ConfettiRain active={lastWin === true && animStep >= ROWS} colors={GAME_THEMES.plinko.particleColors} />
        <div className="w-full z-40 h-8" />
      </GameArena>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet}
          playing={playing || (animStep >= 0 && animStep < ROWS)}
          betLabel={playing ? "Dropping..." : "Drop Ball"}
        >
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Risk</div>
            <ToggleGroup type="single" value={risk}
              onValueChange={(v) => v && setRisk(v as PlinkoRisk)}
              className="grid grid-cols-3 gap-1 bg-[#0f212e] rounded-md p-1"
            >
              <ToggleGroupItem value="low"    className="data-[state=on]:bg-[#213743] data-[state=on]:text-[#a855f7] text-[#b1bad3] text-xs h-8">Low</ToggleGroupItem>
              <ToggleGroupItem value="medium" className="data-[state=on]:bg-[#213743] data-[state=on]:text-[#ffd23f] text-[#b1bad3] text-xs h-8">Medium</ToggleGroupItem>
              <ToggleGroupItem value="high"   className="data-[state=on]:bg-[#213743] data-[state=on]:text-[#ff5cb1] text-[#b1bad3] text-xs h-8">High</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="text-[10px] text-[#b1bad3]">
            Max payout: <span className="font-bold text-white">{Math.max(...table)}x</span> &middot; {ROWS} rows
          </div>
        </BetPanel>
      </div>
    </div>
  );
}
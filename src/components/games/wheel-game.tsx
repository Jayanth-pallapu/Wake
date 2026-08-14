"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { WHEEL_CONFIG, type WheelRisk } from "@/lib/provably-fair";
import { useUiStore } from "@/store/ui";
import {
  GameArena, GameStyles, ConfettiRain, GAME_THEMES, StreakBadge,
  WheelSlowWinReveal, WheelSlowLoseReveal,
} from "./game-effects";
import {
  soundWheelSpinStart,
  soundWheelTick,
  soundWheelSlowDown,
  soundWheelLand,
  soundWheelWinFanfare,
  soundWheelWinShimmer,
  soundWheelLoseDrop,
} from "@/hooks/use-sound";

function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("agy_sound_enabled");
  return v === null ? true : v === "true";
}

const SPIN_DURATION = 4500; // ms — longer for more drama

// Rainbow color per multiplier value
function segColor(mult: number) {
  if (mult >= 10) return { fill: "#a855f7", glow: "rgba(168,85,247,0.85)" };
  if (mult >= 5)  return { fill: "#4ade80", glow: "rgba(74,222,128,0.85)" };
  if (mult >= 3)  return { fill: "#ff5cb1", glow: "rgba(255,92,177,0.85)" };
  if (mult >= 2)  return { fill: "#ffd23f", glow: "rgba(255,210,63,0.85)" };
  if (mult >= 1.5) return { fill: "#00c2ff", glow: "rgba(0,194,255,0.8)" };
  if (mult >= 1.2) return { fill: "#6366f1", glow: "rgba(99,102,241,0.8)" };
  if (mult > 0)   return { fill: "#38bdf8", glow: "rgba(56,189,248,0.7)" };
  return { fill: "#1e3040", glow: "rgba(30,48,64,0.3)" };
}

export function WheelGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "wheel-bet");
  const [risk, setRisk] = useState<WheelRisk>("medium");
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ segment: number; multiplier: number } | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [showLose, setShowLose] = useState(false);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slowDownRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);
  const cfg = WHEEL_CONFIG[risk];
  const segments = cfg.segments;
  const segAngle = 360 / segments;

  const clearTicks = useCallback(() => {
    if (tickIntervalRef.current)  clearInterval(tickIntervalRef.current);
    if (slowDownRef.current)      clearInterval(slowDownRef.current);
  }, []);

  useEffect(() => () => clearTicks(), [clearTicks]);

  const handleBet = async () => {
    setSpinning(true);
    setResult(null);
    setLastWin(null);
    setShowWin(false);
    setShowLose(false);
    clearTicks();

    if (isSoundEnabled()) soundWheelSpinStart();

    // Fast ticks for the first 3s
    let speed = 1;
    tickIntervalRef.current = setInterval(() => {
      if (isSoundEnabled()) soundWheelTick(speed);
    }, 85);

    // Slow-down ticks starting at 3s
    const slowTimer = setTimeout(() => {
      clearInterval(tickIntervalRef.current!);
      speed = 0.2;
      let interval = 200;
      const slowTick = () => {
        if (isSoundEnabled()) soundWheelSlowDown();
        interval = Math.min(interval * 1.35, 900);
        slowDownRef.current = setTimeout(slowTick, interval) as unknown as ReturnType<typeof setInterval>;
      };
      slowTick();
    }, 3000);

    const res = await play("wheel", { risk }, toRaw(bet));
    if (res) {
      const segment    = res.bet.outcome.segment as number;
      const multiplier = res.bet.outcome.multiplier as number;
      const win        = res.bet.win;

      const targetAngle  = segment * segAngle + segAngle / 2;
      const spins        = 6 * 360;
      const finalRotation = rotation - (rotation % 360) + spins + (360 - targetAngle);
      setRotation(finalRotation);

      setTimeout(() => {
        clearTimeout(slowTimer);
        clearTicks();
        if (isSoundEnabled()) soundWheelLand();
        setResult({ segment, multiplier });
        setLastWin(win);
        setStreak(s => win ? s + 1 : 0);
        setSpinning(false);
        onPlayed?.();
        if (win) {
          if (isSoundEnabled()) soundWheelWinFanfare(multiplier);
          setTimeout(() => { if (isSoundEnabled()) soundWheelWinShimmer(); }, 2800);
          setTimeout(() => setShowWin(true), 200);
        } else {
          if (isSoundEnabled()) soundWheelLoseDrop();
          setTimeout(() => setShowLose(true), 200);
        }
      }, SPIN_DURATION);
    } else {
      clearTimeout(slowTimer);
      clearTicks();
      setSpinning(false);
    }
  };

  const radius = 130;
  const cx = 150, cy = 150;
  const profit = bet * (result?.multiplier ?? 1) - bet;

  const segPaths = Array.from({ length: segments }).map((_, i) => {
    const startAngle = i * segAngle - 90 - segAngle / 2;
    const endAngle   = startAngle + segAngle;
    const rad = (a: number) => (a * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(rad(startAngle));
    const y1 = cy + radius * Math.sin(rad(startAngle));
    const x2 = cx + radius * Math.cos(rad(endAngle));
    const y2 = cy + radius * Math.sin(rad(endAngle));
    const largeArc  = segAngle > 180 ? 1 : 0;
    const path      = "M " + cx + " " + cy + " L " + x1 + " " + y1 + " A " + radius + " " + radius + " 0 " + largeArc + " 1 " + x2 + " " + y2 + " Z";
    const midAngle  = startAngle + segAngle / 2;
    const labelR    = radius * 0.7;
    const labelX    = cx + labelR * Math.cos(rad(midAngle));
    const labelY    = cy + labelR * Math.sin(rad(midAngle));
    // Specular arc highlight just inside outer rim
    const specR     = radius * 0.93;
    const sx1 = cx + specR * Math.cos(rad(startAngle + 2));
    const sy1 = cy + specR * Math.sin(rad(startAngle + 2));
    const sx2 = cx + specR * Math.cos(rad(endAngle   - 2));
    const sy2 = cy + specR * Math.sin(rad(endAngle   - 2));
    const specPath = "M " + sx1 + " " + sy1 + " A " + specR + " " + specR + " 0 " + largeArc + " 1 " + sx2 + " " + sy2;
    return { path, labelX, labelY, mult: cfg.multipliers[i], specPath };
  });

  // Rim gradient stops — rainbow
  const rimId = "wheelRimGrad";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameArena
        gameId="wheel"
        win={lastWin}
        shake={lastWin === false}
        className="p-4 flex flex-col items-center justify-center relative overflow-hidden"
        style={{ minHeight: 420 }}
      >
        <GameStyles />

        <div className="absolute top-4 w-full flex justify-center z-40">
          <StreakBadge streak={streak} />
        </div>

        {/* Deep space atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Pulsing halo under wheel */}
          <div style={{
            position: "absolute", bottom: "15%", left: "50%", transform: "translateX(-50%)",
            width: 320, height: 80, borderRadius: "50%",
            background: spinning
              ? "radial-gradient(ellipse, rgba(255,210,63,0.35) 0%, rgba(255,92,177,0.15) 50%, transparent 75%)"
              : "radial-gradient(ellipse, rgba(255,210,63,0.18) 0%, transparent 70%)",
            filter: "blur(18px)",
            transition: "background 0.5s",
          }} />
          {/* Side vignette lines */}
          {[15, 85].map((pct) => (
            <div key={pct} style={{
              position: "absolute", top: 0, bottom: 0, left: pct + "%", width: 1,
              background: "linear-gradient(180deg, transparent, rgba(255,210,63,0.12) 40%, rgba(255,92,177,0.1) 80%, transparent)",
            }} />
          ))}
        </div>

        {/* Wheel container */}
        <div className="relative mt-8 z-10">
          {/* Glowing pointer */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-20"
            style={{
              top: -18,
              filter: "drop-shadow(0 4px 12px rgba(255,210,63,0.9)) drop-shadow(0 0 6px rgba(255,210,63,0.6))",
              animation: spinning ? "wheelPointerBob 0.3s ease-in-out infinite" : "none",
            }}
          >
            {/* Arrow pointer */}
            <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
              <polygon points="14,36 0,0 28,0" fill="#ffd23f" />
              <polygon points="14,28 5,6 23,6"  fill="#fbbf24" opacity="0.6" />
              <polygon points="14,8  9,2 19,2"  fill="rgba(255,255,255,0.55)" />
            </svg>
          </div>

          {/* 3D wheel */}
          <div style={{
            filter: spinning
              ? "drop-shadow(0 20px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(255,210,63,0.4))"
              : "drop-shadow(0 20px 40px rgba(0,0,0,0.55))",
            animation: spinning ? "wheelRimGlow 1.8s linear infinite" : "none",
          }}>
            <div style={{ perspective: "900px" }}>
              <div style={{ transform: "perspective(900px) rotateX(28deg)", transformStyle: "preserve-3d" }}>
                <motion.svg
                  viewBox="0 0 300 300"
                  className="w-[300px] h-[300px]"
                  animate={{ rotate: rotation }}
                  transition={{
                    duration: spinning ? SPIN_DURATION / 1000 : 0,
                    ease: spinning ? [0.12, 0.85, 0.06, 1] : undefined,
                  }}
                >
                  <defs>
                    {/* Multi-stop rainbow rim gradient */}
                    <linearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%"   stopColor="#ffd23f" />
                      <stop offset="25%"  stopColor="#ff5cb1" />
                      <stop offset="50%"  stopColor="#00c2ff" />
                      <stop offset="75%"  stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#ffd23f" />
                    </linearGradient>
                    {/* Dark inner gradient */}
                    <radialGradient id="wheelInner" cx="50%" cy="50%" r="50%">
                      <stop offset="0%"   stopColor="#1a2c38" />
                      <stop offset="100%" stopColor="#0a1522" />
                    </radialGradient>
                    {/* Per-segment radial gradients */}
                    {segPaths.map((s, i) => {
                      const c = segColor(s.mult);
                      return (
                        <radialGradient key={"sg-" + i} id={"sg-" + i} cx="50%" cy="50%" r="100%">
                          <stop offset="0%"   stopColor="#0e1e2c" stopOpacity="0.95" />
                          <stop offset="65%"  stopColor={c.fill}  stopOpacity="0.55" />
                          <stop offset="100%" stopColor={c.fill}  stopOpacity="0.95" />
                        </radialGradient>
                      );
                    })}
                    <filter id="segGlow">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  {/* Outer rainbow rim */}
                  <circle cx={cx} cy={cy} r={radius + 8} fill={"url(#" + rimId + ")"} opacity="0.95" />
                  {/* Dark rim border */}
                  <circle cx={cx} cy={cy} r={radius + 3} fill="#060d14" />
                  {/* Base wheel fill */}
                  <circle cx={cx} cy={cy} r={radius}     fill="url(#wheelInner)" />

                  {/* Segments */}
                  {segPaths.map((s, i) => {
                    const isWin = result && result.segment === i;
                    const c = segColor(s.mult);
                    return (
                      <g key={i}>
                        <path
                          d={s.path}
                          fill={"url(#sg-" + i + ")"}
                          stroke="#060d14"
                          strokeWidth="1.2"
                          style={{
                            transformOrigin: "150px 150px",
                            transform: isWin ? "scale(1.04)" : "scale(1)",
                            transition: "transform 0.35s ease",
                            filter: isWin ? "drop-shadow(0 0 12px " + c.glow + ")" : "none",
                            animation: isWin ? "wheelSegFlash 0.8s ease-out 3" : "none",
                          }}
                        />
                        {/* Specular arc highlight at outer rim */}
                        <path
                          d={s.specPath}
                          fill="none"
                          stroke="rgba(255,255,255,0.22)"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        {/* Label */}
                        <text
                          x={s.labelX} y={s.labelY}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize={segAngle < 20 ? "9" : "10"}
                          fontWeight="900"
                          fill="#ffffff"
                          style={{
                            filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9)) drop-shadow(0 0 4px " + c.glow + ")",
                            paintOrder: "stroke fill",
                          }}
                        >
                          {s.mult > 0 ? s.mult + "x" : "0"}
                        </text>
                      </g>
                    );
                  })}

                  {/* Divider ring lines */}
                  <circle cx={cx} cy={cy} r={radius - 1} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

                  {/* Center hub — 3D radial */}
                  <defs>
                    <radialGradient id="hubGrad" cx="35%" cy="30%" r="70%">
                      <stop offset="0%"   stopColor="#fff8d6" />
                      <stop offset="40%"  stopColor="#ffd23f" />
                      <stop offset="75%"  stopColor="#b45309" />
                      <stop offset="100%" stopColor="#7c2d00" />
                    </radialGradient>
                  </defs>
                  <circle cx={cx} cy={cy} r="26" fill="#111827" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  <circle cx={cx} cy={cy} r="22" fill="url(#hubGrad)" stroke="#92400e" strokeWidth="3" />
                  <circle cx={cx} cy={cy} r="8"  fill="rgba(255,255,255,0.7)" />
                  <circle cx={cx - 4} cy={cy - 4} r="3" fill="rgba(255,255,255,0.9)" />
                </motion.svg>
              </div>
            </div>
          </div>

          {/* Spinning orbit sparks */}
          {spinning && (
            <div style={{ position: "absolute", inset: -10, pointerEvents: "none" }}>
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <div key={i} style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  width: 5, height: 5,
                  borderRadius: "50%",
                  background: ["#ffd23f","#ff5cb1","#00c2ff","#4ade80","#a855f7","#fbbf24"][i],
                  boxShadow: "0 0 8px " + ["#ffd23f","#ff5cb1","#00c2ff","#4ade80","#a855f7","#fbbf24"][i],
                  transform: "translate(-50%, -50%) rotate(" + angle + "deg) translateY(-162px)",
                  animation: "gfxStarTwinkle " + (0.6 + i * 0.1) + "s ease-in-out " + (i * 0.08) + "s infinite",
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Status text */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.segment}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                marginTop: 14, fontSize: 13, fontFamily: "monospace",
                color: lastWin ? "#ffd23f" : "#ef4444",
                textShadow: lastWin
                  ? "0 0 10px rgba(255,210,63,0.7)"
                  : "0 0 10px rgba(239,68,68,0.7)",
                zIndex: 10,
              }}
            >
              {lastWin
                ? "Landed " + result.multiplier + "x — won " + (bet * result.multiplier).toFixed(4) + " " + activeAsset
                : "Landed 0 — better luck next spin"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic reveals */}
        <WheelSlowWinReveal
          active={showWin}
          multiplier={result?.multiplier ?? 0}
          profit={profit}
          asset={activeAsset}
        />
        <WheelSlowLoseReveal active={showLose} />
        <ConfettiRain active={lastWin === true && showWin} colors={GAME_THEMES.wheel.particleColors} />
      </GameArena>

      {/* ── Right Panel ── */}
      <div>
        <BetPanel
          bet={bet} setBet={setBet} onBet={handleBet}
          playing={playing || spinning}
          betLabel={spinning ? "Spinning..." : "Spin Wheel"}
        >
          <div className="space-y-2">
            {/* Risk selector */}
            <div className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Risk</div>
            <ToggleGroup
              type="single" value={risk}
              onValueChange={(v) => v && setRisk(v as WheelRisk)}
              className="grid grid-cols-3 gap-1"
            >
              {(["low","medium","high"] as WheelRisk[]).map((r) => (
                <ToggleGroupItem
                  key={r} value={r}
                  style={{
                    background: risk === r
                      ? r === "low" ? "rgba(0,194,255,0.15)" : r === "medium" ? "rgba(255,210,63,0.15)" : "rgba(255,92,177,0.15)"
                      : "rgba(255,255,255,0.04)",
                    border: risk === r
                      ? "1px solid " + (r === "low" ? "rgba(0,194,255,0.5)" : r === "medium" ? "rgba(255,210,63,0.5)" : "rgba(255,92,177,0.5)")
                      : "1px solid rgba(255,255,255,0.08)",
                    color: risk === r
                      ? r === "low" ? "#00c2ff" : r === "medium" ? "#ffd23f" : "#ff5cb1"
                      : "#b1bad3",
                    boxShadow: risk === r
                      ? "0 0 10px " + (r === "low" ? "rgba(0,194,255,0.2)" : r === "medium" ? "rgba(255,210,63,0.2)" : "rgba(255,92,177,0.2)")
                      : "none",
                    fontWeight: 700, fontSize: 11, textTransform: "capitalize",
                    borderRadius: 6, padding: "6px 0",
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {/* Segment preview */}
            <div style={{
              padding: "10px 12px", borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: "#b1bad3", fontFamily: "monospace" }}>SEGMENTS</span>
                <span style={{ fontSize: 10, color: "#ffd23f", fontFamily: "monospace", fontWeight: 700 }}>{segments}</span>
              </div>
              {/* Colorful segment preview dots */}
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {cfg.multipliers.map((m, i) => {
                  const c = segColor(m);
                  return (
                    <div key={i} title={m + "x"} style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: c.fill,
                      boxShadow: "0 0 4px " + c.glow,
                    }} />
                  );
                })}
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "#b1bad3" }}>Max payout</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#ff5cb1" }}>
                  {Math.max(...cfg.multipliers)}x
                </span>
              </div>
            </div>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUiStore } from "@/store/ui";
import {
  GameArena, GameStyles, Spotlight, NeonMultiplier, ParticleBurst,
  PulseRings, ConfettiRain, GAME_THEMES, StreakBadge,
  CrashBackground3D, RocketTrail, MilestoneFlash,
  CrashExplosion, SlowWinReveal, SlowLoseReveal,
} from "./game-effects";
import {
  soundRocketLaunch, soundMultiplierTick, soundMilestone,
  soundCashoutWin, soundCrashExplode, soundBetPlace,
} from "@/hooks/use-sound";
import { SoundToggle } from "./sound-toggle";

type Phase = "idle" | "running" | "crashed" | "cashed";

/* ─── Multiplier → color mapping ────────────────────────────── */
function getMultColor(phase: Phase, mult: number): string {
  if (phase === "crashed") return "#ff2020";
  if (phase === "cashed")  return "#ffd23f";
  if (mult >= 100) return "#a855f7";
  if (mult >= 50)  return "#ff5cb1";
  if (mult >= 10)  return "#ff4e00";
  if (mult >= 5)   return "#ff8c00";
  if (mult >= 2)   return "#ffd23f";
  return "#00ff88";
}

/* ─── Star field (50 colorful twinkling stars) ──────────────── */
const STAR_COLORS = ["#ffffff", "#ffffff", "#ffffff", "#00c2ff", "#ffd23f", "#ff5cb1", "#a855f7", "#00ff88"];
const STARS = Array.from({ length: 50 }, (_, i) => ({
  id: `star-${i}`,
  size: i % 5 === 0 ? "3px" : i % 3 === 0 ? "2px" : "1.5px",
  left: `${((i * 37 + 11) % 100)}%`,
  top: `${((i * 53 + 7) % 100)}%`,
  dur: `${3 + (i % 7) * 0.8}s`,
  delay: `${(i % 5) * 0.7}s`,
  color: STAR_COLORS[i % STAR_COLORS.length],
  glow: i % 3 === 0,
}));

/* ─── SVG dimensions ─────────────────────────────────────────── */
const W = 600;
const H = 280;

export function CrashGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "crash-bet");
  const [target, setTarget] = useState(2);
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayMult, setDisplayMult] = useState(1);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [cashoutAt, setCashoutAt] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [trailPoints, setTrailPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPos, setExplosionPos] = useState({ x: 0, y: 0 });
  const [arenaDesaturate, setArenaDesaturate] = useState(false);
  const soundEnabled = useRef(true);
  const lastTickMult = useRef(0);
  const lastTickTime = useRef(0);

  // Sync mute state
  useEffect(() => {
    const KEY = "agy_sound_enabled";
    const sync = () => {
      const v = localStorage.getItem(KEY);
      soundEnabled.current = v === null ? true : v === "true";
    };
    sync();
    window.addEventListener("agy_sound_toggle", sync);
    return () => window.removeEventListener("agy_sound_toggle", sync);
  }, []);

  const playSound = useCallback((fn: () => void) => {
    if (soundEnabled.current) fn();
  }, []);

  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const milestonesFired = useRef<Set<number>>(new Set());

  const profit = bet * target - bet;

  const stopAnim = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => () => stopAnim(), [stopAnim]);

  /* ─── Compute SVG path point for a given multiplier ─── */
  const getPoint = useCallback((mult: number, endValue: number) => {
    const cur = Math.max(1, mult);
    const progress = Math.min(1, Math.log(cur) / Math.log(Math.max(endValue, 2)));
    const px = 30 + progress * (W - 60);
    const py = H - 30 - progress * (H - 60);
    return { px, py, progress };
  }, []);

  const handleBet = async () => {
    if (target < 1.01 || phase === "running") return;
    stopAnim();
    setPhase("running");
    setDisplayMult(1);
    setCrashPoint(null);
    setCashoutAt(null);
    setLastWin(null);
    setTrailPoints([]);
    setShowExplosion(false);
    setArenaDesaturate(false);
    milestonesFired.current = new Set();
    playSound(soundBetPlace);
    setTimeout(() => playSound(soundRocketLaunch), 80);

    const result = await play("crash", { target }, toRaw(bet));
    if (!result) { setPhase("idle"); return; }

    const cp = result.bet.outcome.crashPoint as number;
    setCrashPoint(cp);
    const win = result.bet.win;
    setLastWin(win);
    onPlayed?.();

    const endValue = win ? target : cp;

    // ── Slow-motion 3-phase easing ──────────────────────────────
    // Phase 1 (0–25%):  Power-in launch — rocket crawls off the pad
    // Phase 2 (25–75%): Linear cruise   — steady confident climb
    // Phase 3 (75–100%): Strong ease-out — rocket slows near result, max tension
    //
    // Duration scales with final multiplier so big wins feel EPIC
    const duration = Math.min(18000, 6000 + Math.log2(Math.max(endValue, 1.01)) * 1200);
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / duration);

      let eased: number;
      if (t < 0.30) {
        // Phase 1 — ultra-slow power-in (rocket barely lifts off the pad)
        eased = Math.pow(t / 0.30, 3.5) * 0.25;
      } else if (t < 0.70) {
        // Phase 2 — gentle cruise at a relaxed pace
        eased = 0.25 + ((t - 0.30) / 0.40) * 0.50;
      } else {
        // Phase 3 — heavy slow-motion crawl to result, extreme tension
        const p = (t - 0.70) / 0.30;
        eased = 0.75 + (1 - Math.pow(1 - p, 7.0)) * 0.25;
      }

      const current = 1 + (endValue - 1) * eased;
      setDisplayMult(current);

      // Update trail
      const { px, py } = getPoint(current, endValue);
      setTrailPoints(prev => [...prev.slice(-12), { x: px, y: py }]);

      // Throttled tick sound: only fire every 0.15s and when mult crosses a new integer 0.5
      const now2 = performance.now();
      const crossed = Math.floor(current * 2) > Math.floor(lastTickMult.current * 2);
      if (crossed && now2 - lastTickTime.current > 150) {
        playSound(() => soundMultiplierTick(current));
        lastTickMult.current = current;
        lastTickTime.current = now2;
      }

      // Milestone sound
      for (const ms of [2, 5, 10, 50, 100]) {
        if (current >= ms && !milestonesFired.current.has(ms)) {
          milestonesFired.current.add(ms);
          playSound(() => soundMilestone(ms));
        }
      }

      if (win && current >= target) {
        setDisplayMult(target);
        setCashoutAt(target);
        setPhase("cashed");
        setStreak(s => s + 1);
        // 1.2s pause — let the player see the number hanging before the fanfare
        setTimeout(() => playSound(() => soundCashoutWin(target)), 1200);
        return;
      }
      if (!win && t >= 1) {
        setDisplayMult(cp);
        const { px: ex, py: ey } = getPoint(cp, endValue);
        setExplosionPos({ x: ex, y: ey });
        setShowExplosion(true);
        setPhase("crashed");
        setStreak(0);
        // 0.8s pause before explosion sound so the silence hits first
        setTimeout(() => playSound(soundCrashExplode), 800);
        setTimeout(() => setArenaDesaturate(true), 1500);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const color = getMultColor(phase, displayMult);

  const { px, py, progress } = (() => {
    const cur = isFinite(displayMult) && displayMult >= 1 ? displayMult : 1;
    const endVal = Math.max(2, isFinite(crashPoint ?? 0) && (crashPoint ?? 0) > 1 ? crashPoint! : isFinite(target) && target > 1 ? target : 10);
    const p = Math.min(1, Math.max(0, Math.log(cur) / Math.log(endVal)));
    const x = isFinite(p) ? 30 + p * (W - 60) : 30;
    const y = isFinite(p) ? H - 30 - p * (H - 60) : H - 30;
    return { px: x, py: y, progress: isFinite(p) ? p : 0 };
  })();

  // Quadratic bezier path
  const pathD = `M 30 ${H - 30} Q ${30 + (px - 30) * 0.35} ${H - 30} ${px} ${py}`;

  // Dynamic gradient ID changes with phase so it re-renders
  const gradId = `crashGrad-${phase}`;

  // Gradient stops based on multiplier
  const gradStops = (() => {
    if (phase === "crashed") return [{ o: "0%", c: "#ff2020" }, { o: "100%", c: "#7a0000" }];
    if (phase === "cashed")  return [{ o: "0%", c: "#00c2ff" }, { o: "100%", c: "#ffd23f" }];
    if (displayMult >= 10)   return [{ o: "0%", c: "#00ff88" }, { o: "40%", c: "#ffd23f" }, { o: "70%", c: "#ff8c00" }, { o: "100%", c: "#ff5cb1" }];
    if (displayMult >= 5)    return [{ o: "0%", c: "#00ff88" }, { o: "50%", c: "#ffd23f" }, { o: "100%", c: "#ff8c00" }];
    if (displayMult >= 2)    return [{ o: "0%", c: "#00ff88" }, { o: "100%", c: "#ffd23f" }];
    return [{ o: "0%", c: "#00c2ff" }, { o: "100%", c: "#00ff88" }];
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameArena
        gameId="crash"
        win={lastWin}
        shake={phase === "crashed"}
        desaturate={arenaDesaturate}
        className="p-4 flex flex-col items-center justify-center relative"
        style={{ minHeight: 380 }}
      >
        <GameStyles />
        {/* Sound toggle */}
        <div className="absolute top-3 right-3 z-50">
          <SoundToggle />
        </div>

        {/* 3D Background layer */}
        <CrashBackground3D active={phase === "running"} color={color} />

        {/* Spotlight beam */}
        <Spotlight color={phase === "running" ? "#ff8c00" : color} active={phase === "running"} />

        {/* Streak badge */}
        <div className="absolute top-4 w-full flex justify-center z-40">
          <StreakBadge streak={streak} />
        </div>

        {/* Colorful twinkling star field */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
          {STARS.map((s) => (
            <div
              key={s.id}
              style={{
                position: "absolute",
                width: s.size, height: s.size,
                background: s.color,
                borderRadius: "50%",
                left: s.left, top: s.top,
                animation: `drift ${s.dur} ease-in-out ${s.delay} infinite`,
                boxShadow: s.glow ? `0 0 ${parseInt(s.size) * 3}px ${s.color}, 0 0 ${parseInt(s.size) * 6}px ${s.color}88` : "none",
                opacity: 0.7,
              }}
            />
          ))}
        </div>

        {/* Milestone flash */}
        <MilestoneFlash multiplier={displayMult} active={phase === "running"} />

        {/* Central multiplier display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 pt-8">
          <AnimatePresence mode="popLayout">
            {/* Show multiplier only when NOT in win/lose reveal */}
            {(phase === "idle" || phase === "running") && (
              <motion.div
                key={`mult-${phase}`}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <NeonMultiplier value={displayMult.toFixed(2) + "×"} color={color} />
              </motion.div>
            )}
            {phase === "crashed" && !arenaDesaturate && (
              <motion.div
                key="mult-crashed"
                initial={{ scale: 1 }}
                animate={{ scale: 1 }}
              >
                <NeonMultiplier value={displayMult.toFixed(2) + "×"} color="#ff2020" />
              </motion.div>
            )}
            {phase === "cashed" && (
              <motion.div
                key="mult-cashed"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <NeonMultiplier value={displayMult.toFixed(2) + "×"} color="#ffd23f" />
              </motion.div>
            )}
          </AnimatePresence>

          {phase === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-sm font-semibold"
              style={{ color: "#a0b8cc", letterSpacing: 1 }}
            >
              Place a bet &amp; set your cashout target
            </motion.div>
          )}
        </div>

        {/* Win cinematic reveal */}
        <SlowWinReveal
          active={phase === "cashed"}
          cashoutAt={cashoutAt}
          profit={cashoutAt !== null ? bet * cashoutAt - bet : undefined}
          asset={activeAsset}
        />

        {/* Lose cinematic reveal */}
        <SlowLoseReveal active={phase === "crashed"} crashPoint={crashPoint} />

        {/* Confetti on win */}
        <ConfettiRain active={phase === "cashed" && lastWin === true} colors={GAME_THEMES.crash.particleColors} />

        {/* Particle burst at rocket tip */}
        <div style={{ position: "absolute", left: `${(px / W) * 100}%`, top: `${(py / H) * 100}%`, zIndex: 30, transform: "translate(-50%, -50%)" }}>
          <ParticleBurst active={phase === "cashed" && lastWin === true} colors={GAME_THEMES.crash.particleColors} />
          <PulseRings active={phase === "cashed" && lastWin === true} color="#ffd23f" />
        </div>

        {/* SVG chart */}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full z-20 absolute inset-0" preserveAspectRatio="none">
          <defs>
            {/* Dynamic multi-stop stroke gradient */}
            <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
              {gradStops.map((s, i) => (
                <stop key={i} offset={s.o} stopColor={s.c} />
              ))}
            </linearGradient>
            {/* Fill gradient — same stops but more transparent */}
            <linearGradient id={`${gradId}-fill`} x1="0" y1="1" x2="1" y2="0">
              {gradStops.map((s, i) => (
                <stop key={i} offset={s.o} stopColor={s.c} stopOpacity={i === 0 ? 0.04 : i === gradStops.length - 1 ? 0.35 : 0.18} />
              ))}
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Strong glow for rocket */}
            <filter id="rocketGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* 3D-style perspective grid lines — thinner near top */}
          {[0.2, 0.4, 0.6, 0.8].map((g, i) => (
            <line
              key={g}
              x1="30" y1={30 + g * (H - 60)}
              x2={W - 30} y2={30 + g * (H - 60)}
              stroke="rgba(100,60,200,0.2)"
              strokeWidth={1.5 - i * 0.25}
              strokeDasharray={i % 2 === 0 ? "none" : "4 8"}
            />
          ))}
          {/* Vertical grid lines */}
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1={30 + g * (W - 60)} y1="30"
              x2={30 + g * (W - 60)} y2={H - 30}
              stroke="rgba(100,60,200,0.12)"
              strokeWidth={1}
              strokeDasharray="4 8"
            />
          ))}

          {/* Y-axis multiplier labels */}
          {[{ label: "1×", y: H - 30 }, { label: "2×", y: H - 30 - (H - 60) * 0.35 }, { label: "5×", y: H - 30 - (H - 60) * 0.6 }, { label: "10×", y: H - 30 - (H - 60) * 0.75 }].map(({ label, y }) => (
            <text key={label} x="25" y={y} textAnchor="end" fontSize="8" fill="rgba(161,186,211,0.5)" dominantBaseline="middle">{label}</text>
          ))}

          {phase !== "idle" && (
            <>
              {/* Area fill under curve */}
              <path
                d={`${pathD} L ${px} ${H - 30} Z`}
                fill={`url(#${gradId}-fill)`}
              />
              {/* Main curve — gradient stroke */}
              <path
                d={pathD}
                fill="none"
                stroke={`url(#${gradId})`}
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#glow)"
              />
              {/* Glowing dot at rocket tip */}
              <circle cx={px} cy={py} r="7" fill={color} filter="url(#glow)" opacity="0.5" />
              <circle cx={px} cy={py} r="4" fill={color} filter="url(#glow)" />

              {/* Rocket trail */}
              <RocketTrail points={trailPoints} />

              {/* Crash explosion */}
              {showExplosion && <CrashExplosion active={showExplosion} x={explosionPos.x} y={explosionPos.y} />}

              {/* Rocket emoji (running only) */}
              {phase === "running" && (
                <g transform={`translate(${px + 14}, ${py - 14})`}>
                  <text
                    fontSize="26"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ animation: "gfxRocketGlow 1s ease-in-out infinite" }}
                    filter="url(#rocketGlow)"
                  >
                    🚀
                  </text>
                </g>
              )}

              {/* Crash emoji (crashed only) */}
              {phase === "crashed" && (
                <g transform={`translate(${explosionPos.x}, ${explosionPos.y})`}>
                  <text fontSize="24" textAnchor="middle" dominantBaseline="middle">💥</text>
                </g>
              )}
            </>
          )}
        </svg>

        {/* Last crash point badge */}
        {crashPoint && phase !== "running" && (
          <div className="absolute top-2 left-2 flex gap-1 z-40">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${lastWin ? "bg-[#ffd23f]/20 text-[#ffd23f]" : "bg-[#ff2020]/20 text-[#ff4444]"}`}
              style={{ border: `1px solid ${lastWin ? "#ffd23f44" : "#ff202044"}` }}
            >
              {crashPoint.toFixed(2)}×
            </span>
          </div>
        )}
      </GameArena>

      {/* Right panel */}
      <div>
        <BetPanel
          bet={bet}
          setBet={setBet}
          onBet={handleBet}
          playing={playing || phase === "running"}
          betLabel={phase === "running" ? "Running…" : "Place Bet"}
          disabled={target < 1.01}
        >
          {/* Auto cashout controls */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Auto Cashout @</Label>
              <span
                className="text-xs font-bold tabular-nums"
                style={{ color: getMultColor("idle", target) }}
              >
                {target.toFixed(2)}×
              </span>
            </div>
            <Input
              type="number"
              value={target}
              onChange={(e) => setTarget(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
              min={1.01}
              step="0.01"
              className="bg-[#0f212e] border-[#2f4553] text-white h-10 tabular-nums"
              style={{
                fontFamily: "var(--font-orbitron), monospace",
                transition: "box-shadow 0.3s",
              }}
              onFocus={(e) => e.target.style.boxShadow = "inset 0 0 12px rgba(0,255,136,0.15), 0 0 0 1.5px #00ff8844"}
              onBlur={(e) => e.target.style.boxShadow = "none"}
            />
            {/* Preset buttons with color coding */}
            <div className="flex gap-1">
              {([
                { m: 1.5, color: "#00ff88" },
                { m: 2,   color: "#ffd23f" },
                { m: 5,   color: "#ff8c00" },
                { m: 10,  color: "#ff5cb1" },
                { m: 100, color: "#a855f7" },
              ] as const).map(({ m, color: c }) => (
                <button
                  key={m}
                  onClick={() => setTarget(m)}
                  className="flex-1 py-1 text-[10px] font-bold rounded transition-all duration-200"
                  style={{
                    background: target === m ? `${c}22` : "#213743",
                    border: `1px solid ${target === m ? c + "88" : "#2f4553"}`,
                    color: target === m ? c : "#b1bad3",
                    boxShadow: target === m ? `0 0 8px ${c}44` : "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = `${c}18`;
                    (e.currentTarget as HTMLButtonElement).style.color = c;
                    (e.currentTarget as HTMLButtonElement).style.borderColor = `${c}66`;
                  }}
                  onMouseLeave={(e) => {
                    if (target !== m) {
                      (e.currentTarget as HTMLButtonElement).style.background = "#213743";
                      (e.currentTarget as HTMLButtonElement).style.color = "#b1bad3";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#2f4553";
                    }
                  }}
                >
                  {m}×
                </button>
              ))}
            </div>
          </div>

          {/* Profit on win */}
          <div
            className="flex items-center justify-between text-xs rounded-md p-2"
            style={{
              background: "linear-gradient(135deg, #0f212e 0%, #14243a 100%)",
              border: "1px solid #2f4553",
            }}
          >
            <span className="text-[#b1bad3]">Profit on win</span>
            <span
              className="font-bold tabular-nums"
              style={{
                color: "#00c2ff",
                textShadow: "0 0 10px rgba(0,194,255,0.6)",
                fontFamily: "var(--font-orbitron), monospace",
                fontSize: 11,
              }}
            >
              +{profit.toFixed(6)} {activeAsset}
            </span>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

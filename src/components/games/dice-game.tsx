"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { useUiStore } from "@/store/ui";
import {
  GameArena, GameStyles, ParticleBurst, PulseRings, ConfettiRain,
  GAME_THEMES, StreakBadge,
  DiceBackground3D, PremiumResultBar, DiceWinReveal, DiceLoseReveal,
} from "./game-effects";
import {
  soundDiceRollTick, soundDiceLand, soundDiceWin,
  soundDiceLose, soundBetPlace,
} from "@/hooks/use-sound";
import { SoundToggle } from "./sound-toggle";

/* ─── Pip positions per face ─────────────────────────────────── */
interface PipPos {
  top?: string; bottom?: string;
  left?: string; right?: string;
  center?: boolean;
}
function getPips(num: number): PipPos[] {
  const pips: PipPos[] = [];
  if ([1, 3, 5].includes(num)) pips.push({ center: true });
  if ([2, 3, 4, 5, 6].includes(num)) {
    pips.push({ top: "22%", left: "22%" });
    pips.push({ bottom: "22%", right: "22%" });
  }
  if ([4, 5, 6].includes(num)) {
    pips.push({ top: "22%", right: "22%" });
    pips.push({ bottom: "22%", left: "22%" });
  }
  if (num === 6) {
    pips.push({ top: "50%", left: "22%" });
    pips.push({ top: "50%", right: "22%" });
  }
  return pips;
}

/* ─── Face transform strings (CSS translateZ) ───────────────── */
const FACE_TRANSFORMS = [
  "translateZ(55px)",
  "rotateY(180deg) translateZ(55px)",
  "rotateY(90deg) translateZ(55px)",
  "rotateY(-90deg) translateZ(55px)",
  "rotateX(90deg) translateZ(55px)",
  "rotateX(-90deg) translateZ(55px)",
];

/* ─── Exact x/y degree targets for each face index ──────────── */
const FACE_ROTATIONS = [
  { x: 0,   y: 0   },   // face 1 front
  { x: 0,   y: 180 },   // face 2 back
  { x: 0,   y: -90 },   // face 3 right
  { x: 0,   y: 90  },   // face 4 left
  { x: -90, y: 0   },   // face 5 top
  { x: 90,  y: 0   },   // face 6 bottom
];

/** Snap accumulated angle to nearest equivalent target angle. */
function snapAngle(cur: number, target: number): number {
  return Math.round(cur / 360) * 360 + target;
}

/* ─── Roll deceleration constants ────────────────────────────── */
const ROLL_DURATION_MS = 1900; // total animation length
const V_MAX = 860;             // peak angular velocity (deg/sec)

type DiceState = "idle" | "rolling" | "snapping" | "win" | "lose";

/* ─── Component ─────────────────────────────────────────────── */
export function DiceGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "dice-bet");
  const [target, setTarget] = useState(50);
  const [direction, setDirection] = useState<"under" | "over">("under");
  const [roll, setRoll] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [diceState, setDiceState] = useState<DiceState>("idle");
  const [streak, setStreak] = useState(0);
  const [showReveal, setShowReveal] = useState(false);

  /* Live rotation driven by RAF */
  const [diceRot, setDiceRot] = useState({ x: -15, y: 20, z: 0 });
  const [isSnapping, setIsSnapping] = useState(false);

  /* Slot-machine multiplier text during roll */
  const [rollingMultText, setRollingMultText] = useState<string | null>(null);

  /* Refs — stable across renders, safe inside RAF */
  const rafRef       = useRef<number | null>(null);
  const angleXRef    = useRef(-15);
  const angleYRef    = useRef(20);
  const rollStartRef = useRef(0);
  const prevFrameRef = useRef(0);
  const lastSndRef   = useRef(0);
  const lastMultRef  = useRef(0);
  const pendingRef   = useRef<{ roll: number; win: boolean } | null>(null);
  const soundOnRef   = useRef(true);
  const multiplierRef = useRef(1.98);
  const onPlayedRef  = useRef(onPlayed);
  onPlayedRef.current = onPlayed;

  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const winProb    = direction === "under" ? target / 100 : (100 - target) / 100;
  const multiplier = winProb > 0 ? Math.floor((0.99 / winProb) * 100) / 100 : 0;
  const profit     = bet * multiplier - bet;
  multiplierRef.current = multiplier;

  /* Sync mute state */
  useEffect(() => {
    const KEY = "agy_sound_enabled";
    const sync = () => {
      const v = localStorage.getItem(KEY);
      soundOnRef.current = v === null ? true : v === "true";
    };
    sync();
    window.addEventListener("agy_sound_toggle", sync);
    return () => window.removeEventListener("agy_sound_toggle", sync);
  }, []);

  /* Cleanup RAF on unmount */
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const ps = (fn: () => void) => { if (soundOnRef.current) fn(); };

  /* ─── Apply result once animation finishes ───────────────── */
  const applyResult = useCallback((r: number, win: boolean) => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    /* Snap to correct face using spring transition */
    const faceIdx = Math.floor(r) % 6;
    const fr = FACE_ROTATIONS[faceIdx];
    const snapX = snapAngle(angleXRef.current, fr.x);
    const snapY = snapAngle(angleYRef.current, fr.y);

    setIsSnapping(true);
    setDiceRot({ x: snapX, y: snapY, z: 0 });
    setRollingMultText(null);

    // After spring settles (650ms) → show win/lose state
    setTimeout(() => {
      setIsSnapping(false);
      setRoll(r);
      setLastWin(win);
      setDiceState(win ? "win" : "lose");
      setStreak(s => win ? s + 1 : 0);
      onPlayedRef.current?.();
      ps(soundDiceLand);
      setTimeout(() => { ps(win ? soundDiceWin : soundDiceLose); }, 180);
      setTimeout(() => setShowReveal(true), 180);
      setTimeout(() => {
        setShowReveal(false);
        setRoll(null);
        setLastWin(null);
        setDiceState("idle");
        angleXRef.current = -15;
        angleYRef.current = 20;
        setDiceRot({ x: -15, y: 20, z: 0 });
      }, 3600);
    }, 650);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── RAF deceleration loop ──────────────────────────────── */
  const startRoll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rollStartRef.current = performance.now();
    prevFrameRef.current = performance.now();
    lastSndRef.current   = 0;
    lastMultRef.current  = 0;

    const tick = (now: number) => {
      const elapsed  = now - rollStartRef.current;
      const t        = Math.min(1, elapsed / ROLL_DURATION_MS);
      /* Power ease-out: starts at V_MAX, hits near zero at t=1 */
      const velFrac  = Math.pow(1 - t, 2.8);          // 0→1 fraction
      const velocity = V_MAX * velFrac;                // deg/sec
      const dt       = Math.min((now - prevFrameRef.current) / 1000, 0.05);
      prevFrameRef.current = now;

      /* Accumulate rotation — Y axis slightly faster for organic tumble */
      angleXRef.current += velocity * dt * 1.00;
      angleYRef.current += velocity * dt * 1.38;

      setDiceRot({
        x: angleXRef.current,
        y: angleYRef.current,
        z: angleXRef.current * 0.18,
      });

      /* ── Throttled rattle sound ── */
      /* At full speed: fire every ~35ms. At crawl: every ~135ms */
      const sndInterval = 35 + Math.round(100 * (1 - velFrac));
      if (now - lastSndRef.current > sndInterval) {
        ps(() => soundDiceRollTick(velFrac));
        lastSndRef.current = now;
      }

      /* ── Slot-machine multiplier cycling ── */
      /* At full speed: update every ~85ms. At crawl: every ~500ms */
      const multInterval = 85 + Math.round(415 * (1 - velFrac));
      if (now - lastMultRef.current > multInterval) {
        const realMult = multiplierRef.current;
        let display: number;
        if (t > 0.80 && pendingRef.current !== null) {
          /* Converge to real value: within ±0.4 of actual */
          display = Math.max(1.01, realMult + (Math.random() - 0.5) * 0.8);
        } else {
          /* Wild random in plausible range */
          display = 1.01 + Math.random() * Math.min(realMult * 2.5, 18);
        }
        setRollingMultText(display.toFixed(2) + "×");
        lastMultRef.current = now;
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        /* Animation complete — apply stored result */
        if (pendingRef.current) {
          applyResult(pendingRef.current.roll, pendingRef.current.win);
        }
        /* If API hasn't returned yet, applyResult will be called by handleBet */
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [applyResult]);

  /* ─── Handle bet ─────────────────────────────────────────── */
  const handleBet = async () => {
    if (diceState === "rolling" || diceState === "snapping") return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setDiceState("rolling");
    setLastWin(null);
    setRoll(null);
    setShowReveal(false);
    setIsSnapping(false);
    setRollingMultText("···");
    pendingRef.current = null;

    ps(soundBetPlace);

    /* Start animation immediately — no waiting for API */
    startRoll();

    /* Fire API in parallel */
    const result = await play("dice", { target, direction }, toRaw(bet));

    if (!result) {
      /* Network failure — cancel animation, go back to idle */
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setDiceState("idle");
      setRollingMultText(null);
      angleXRef.current = -15; angleYRef.current = 20;
      setDiceRot({ x: -15, y: 20, z: 0 });
      return;
    }

    const r   = result.bet.outcome.roll as number;
    const win = result.bet.win;

    if (rafRef.current === null) {
      /* RAF already finished before API returned (very fast API) */
      applyResult(r, win);
    } else {
      /* Store for RAF loop to consume when animation ends */
      pendingRef.current = { roll: r, win };
    }
  };

  /* ─── Derived colors ─────────────────────────────────────── */
  const pipColor = diceState === "win"
    ? "#ffd23f" : diceState === "lose"
    ? "#ff4444" : diceState === "rolling" || diceState === "snapping"
    ? "#c084fc" : "#a855f7";

  const pipGlow = diceState === "win"
    ? "0 0 10px #ffd23f, 0 0 20px #ffd23f88"
    : diceState === "lose"
    ? "0 0 10px #ff4444, 0 0 20px #ff444488"
    : diceState === "rolling" || diceState === "snapping"
    ? "0 0 8px #c084fc"
    : "0 0 8px #a855f7, 0 0 16px #a855f755";

  const diceBorderColor = diceState === "win"
    ? "#ffd23f" : diceState === "lose"
    ? "#ff4444" : "#a855f7";

  const diceShadow = diceState === "win"
    ? "0 0 40px rgba(255,210,63,0.6), 0 16px 50px rgba(0,0,0,0.7)"
    : diceState === "lose"
    ? "0 0 35px rgba(255,68,68,0.55), 0 14px 45px rgba(0,0,0,0.7)"
    : diceState === "rolling" || diceState === "snapping"
    ? "0 0 30px rgba(192,132,252,0.5), 0 12px 40px rgba(0,0,0,0.7)"
    : "0 0 20px rgba(168,85,247,0.35), 0 10px 32px rgba(0,0,0,0.6)";

  const multColor = diceState === "win"
    ? "#ffd23f" : diceState === "lose"
    ? "#ff4444" : diceState === "rolling" || diceState === "snapping"
    ? "#c084fc" : "#9CA3AF";

  const chanceColor = winProb >= 0.5
    ? "#a855f7" : winProb >= 0.25
    ? "#ffd23f" : "#ff8c00";

  const isRollingPhase = diceState === "rolling" || diceState === "snapping";

  /* ─── Dice transform ─────────────────────────────────────── */
  const diceTransform = `rotateX(${diceRot.x}deg) rotateY(${diceRot.y}deg) rotateZ(${diceRot.z}deg)`;
  const diceTransition = isSnapping
    ? "transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)"
    : "none";
  /* CSS animation only active on idle/win/lose — not during RAF-driven phases */
  const diceAnimation = diceState === "idle"
    ? "gfxDiceFloat 4s ease-in-out infinite"
    : diceState === "lose"
    ? "gfxDiceShake 0.45s ease-out"
    : diceState === "win"
    ? "gfxDiceLand 0.5s ease-out"
    : "none";

  /* ─── Multiplier display text ────────────────────────────── */
  const multDisplayText = rollingMultText !== null
    ? rollingMultText
    : `${multiplier.toFixed(2)}×`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameArena
        gameId="dice"
        win={lastWin}
        shake={diceState === "lose"}
        className="p-6 flex flex-col justify-center relative"
        style={{ minHeight: 400 }}
      >
        <GameStyles />

        {/* Sound toggle */}
        <div className="absolute top-3 right-3 z-50">
          <SoundToggle />
        </div>

        {/* 3D Background */}
        <DiceBackground3D state={isRollingPhase ? "rolling" : diceState === "win" ? "win" : diceState === "lose" ? "lose" : "idle"} />

        {/* Streak badge */}
        <div className="absolute top-4 w-full flex justify-center z-40">
          <StreakBadge streak={streak} />
        </div>

        {/* Confetti + particles on win */}
        <ParticleBurst active={diceState === "win"} colors={GAME_THEMES.dice.particleColors} />
        <PulseRings active={diceState === "win"} color="#ffd23f" />
        <ConfettiRain active={diceState === "win"} colors={GAME_THEMES.dice.particleColors} />

        {/* Win / Lose cinematic reveals */}
        <DiceWinReveal
          active={showReveal && lastWin === true}
          multiplier={multiplier}
          profit={profit}
          asset={activeAsset}
        />
        <DiceLoseReveal active={showReveal && lastWin === false} />

        {/* ─── 3D Dice ─── */}
        <div className="mx-auto mb-6 relative" style={{ width: 110, height: 110 }}>
          {/* Floating glow beneath */}
          <div style={{
            position: "absolute", bottom: -14, left: "50%",
            transform: "translateX(-50%)",
            width: 80, height: 20,
            background: `radial-gradient(ellipse, ${pipColor}66 0%, transparent 70%)`,
            filter: "blur(8px)",
            transition: "background 0.4s ease",
            borderRadius: "50%",
          }} />

          <div style={{ width: "100%", height: "100%", perspective: "500px" }}>
            <div style={{
              width: "100%", height: "100%",
              position: "relative",
              transformStyle: "preserve-3d",
              transform: diceTransform,
              transition: diceTransition,
              boxShadow: diceShadow,
              borderRadius: 14,
              animation: diceAnimation,
            }}>
              {[1, 2, 3, 4, 5, 6].map((faceNum, idx) => (
                <div
                  key={faceNum}
                  style={{
                    position: "absolute", inset: 0,
                    backfaceVisibility: "hidden",
                    transform: FACE_TRANSFORMS[idx],
                    borderRadius: 14,
                    background: `
                      linear-gradient(135deg,
                        rgba(255,255,255,0.06) 0%,
                        rgba(255,255,255,0.02) 40%,
                        rgba(0,0,0,0.12) 100%
                      ),
                      linear-gradient(145deg, #2a1060 0%, #1a0844 60%, #120630 100%)
                    `,
                    border: `1.5px solid ${diceBorderColor}88`,
                    boxShadow: `
                      inset 0 1px 0 rgba(255,255,255,0.12),
                      inset 0 -1px 0 rgba(0,0,0,0.3),
                      inset 1px 0 0 rgba(255,255,255,0.07),
                      inset -1px 0 0 rgba(0,0,0,0.2)
                    `,
                    overflow: "hidden",
                    transition: "border-color 0.4s ease",
                  }}
                >
                  {/* Specular highlight */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "42%",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)",
                    borderRadius: "14px 14px 0 0",
                    pointerEvents: "none",
                  }} />

                  {/* Pips */}
                  {getPips(faceNum).map((pos, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        width: 12, height: 12,
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), ${pipColor})`,
                        boxShadow: pipGlow,
                        transform: "translate(-50%, -50%)",
                        transition: "background 0.4s ease, box-shadow 0.4s ease",
                        animation: diceState === "win" ? "gfxPipPulse 0.8s ease-in-out 3" : "none",
                        ...(pos.center
                          ? { top: "50%", left: "50%" }
                          : {
                              top: pos.top, bottom: pos.bottom,
                              left: pos.left, right: pos.right,
                              transform: pos.top || pos.bottom
                                ? `translate(${pos.left ? "-50%" : "50%"}, -50%)`
                                : "translate(-50%, 50%)",
                            }),
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Multiplier display ─── */}
        <div className="text-center mb-5 z-10 relative">
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 3,
            color: "rgba(161,186,211,0.7)",
            textTransform: "uppercase" as const,
            marginBottom: 6,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${multColor}44)`, maxWidth: 60 }} />
            PAYOUT MULTIPLIER
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${multColor}44, transparent)`, maxWidth: 60 }} />
          </div>

          <AnimatePresence mode="popLayout">
            <motion.div
              key={rollingMultText ?? multColor}
              initial={{ scale: 0.85, opacity: 0, y: 4 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={rollingMultText !== null
                ? { duration: 0.06 }           // fast snap during slot-machine
                : { type: "spring", stiffness: 400, damping: 22 }}
            >
              <div style={{
                fontSize: 60, fontWeight: 900,
                fontFamily: "var(--font-orbitron), monospace",
                color: multColor,
                textShadow: [
                  `0 1px 0 ${multColor}cc`,
                  `0 2px 0 ${multColor}99`,
                  `0 3px 0 ${multColor}66`,
                  `0 4px 0 ${multColor}44`,
                  `0 0 20px ${multColor}aa`,
                  `0 0 50px ${multColor}55`,
                ].join(", "),
                lineHeight: 1,
                transition: "color 0.35s ease, text-shadow 0.35s ease",
                letterSpacing: 2,
              }}>
                {multDisplayText}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Win condition */}
          <div style={{
            fontSize: 11, marginTop: 6, fontWeight: 600,
            color: "rgba(161,186,211,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <span>{direction === "under" ? `Roll under ${target}` : `Roll over ${target}`} to win</span>
            <span style={{
              color: chanceColor, fontWeight: 800,
              fontFamily: "var(--font-orbitron), monospace",
              fontSize: 10,
              textShadow: `0 0 8px ${chanceColor}88`,
              background: `${chanceColor}12`,
              border: `1px solid ${chanceColor}44`,
              borderRadius: 4, padding: "1px 6px",
            }}>
              {(winProb * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* ─── Premium Result Bar ─── */}
        <div className="z-10 relative px-2">
          <PremiumResultBar
            target={target}
            direction={direction}
            roll={roll}
            win={lastWin}
          />
        </div>

        {/* Rolling phase indicator */}
        <AnimatePresence>
          {diceState === "rolling" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "absolute", bottom: 16, left: "50%",
                transform: "translateX(-50%)",
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 10, fontWeight: 700, letterSpacing: 2,
                color: "rgba(192,132,252,0.8)",
                textTransform: "uppercase" as const,
                pointerEvents: "none",
              }}
            >
              {/* Three animated dots showing deceleration phase */}
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "#c084fc",
                    boxShadow: "0 0 6px #c084fc",
                    animation: `gfxPulse ${0.6 + i * 0.15}s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
              <span>Rolling</span>
              {[3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "#c084fc",
                    boxShadow: "0 0 6px #c084fc",
                    animation: `gfxPulse ${0.6 + (i - 3) * 0.15}s ease-in-out ${(i - 3) * 0.15}s infinite`,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </GameArena>

      {/* ─── Right panel ─── */}
      <div className="space-y-4">
        <BetPanel
          bet={bet}
          setBet={setBet}
          onBet={handleBet}
          playing={playing || isRollingPhase}
          betLabel={isRollingPhase ? "Rolling…" : "Roll Dice"}
        >
          <div className="space-y-3">
            {/* Target slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Target</Label>
                <span className="text-xs font-bold tabular-nums" style={{
                  fontFamily: "var(--font-orbitron), monospace",
                  color: "#a855f7",
                  textShadow: "0 0 8px rgba(168,85,247,0.6)",
                }}>
                  {target.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[target]}
                min={2} max={98} step={0.01}
                onValueChange={(v) => setTarget(v[0])}
                className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-2"
              />
            </div>

            {/* Roll Under / Over toggle */}
            <ToggleGroup
              type="single"
              value={direction}
              onValueChange={(v) => v && setDirection(v as "under" | "over")}
              className="grid grid-cols-2 gap-1 p-1 rounded-lg"
              style={{ background: "rgba(15,33,46,0.8)", border: "1px solid rgba(47,69,83,0.6)" }}
            >
              {(["under", "over"] as const).map((d) => (
                <ToggleGroupItem
                  key={d}
                  value={d}
                  className="text-xs h-9 rounded-md font-bold transition-all duration-200"
                  style={{
                    background: direction === d
                      ? "linear-gradient(135deg, #4338ca, #7c3aed, #a855f7)"
                      : "transparent",
                    color: direction === d ? "#fff" : "#b1bad3",
                    boxShadow: direction === d
                      ? "0 0 14px rgba(168,85,247,0.45), inset 0 1px 0 rgba(255,255,255,0.12)"
                      : "none",
                    border: direction === d ? "1px solid rgba(168,85,247,0.5)" : "1px solid transparent",
                    fontFamily: direction === d ? "var(--font-orbitron), monospace" : "inherit",
                    letterSpacing: direction === d ? 0.5 : 0,
                    fontSize: 11,
                  }}
                >
                  Roll {d.charAt(0).toUpperCase() + d.slice(1)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {/* Profit on win */}
            <div
              className="flex items-center justify-between text-xs rounded-lg p-2.5"
              style={{
                background: "linear-gradient(135deg, rgba(15,33,46,0.9), rgba(20,40,60,0.8))",
                border: "1px solid rgba(47,69,83,0.6)",
              }}
            >
              <span className="text-[#b1bad3]">Profit on win</span>
              <span style={{
                fontWeight: 800,
                fontFamily: "var(--font-orbitron), monospace",
                fontSize: 11,
                color: "#a855f7",
                textShadow: "0 0 10px rgba(168,85,247,0.7)",
              }}>
                +{profit.toFixed(6)} {activeAsset}
              </span>
            </div>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

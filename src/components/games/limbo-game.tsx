"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUiStore } from "@/store/ui";
import {
  GameArena, GameStyles, ConfettiRain, GAME_THEMES, StreakBadge,
  LimboSlowWinReveal, LimboSlowLoseReveal,
} from "./game-effects";
import {
  soundLimboRoll,
  soundLimboCountUp,
  soundLimboTension,
  soundLimboWinReveal,
  soundLimboLoseReveal,
  soundLimboWinShimmer,
} from "@/hooks/use-sound";

function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("agy_sound_enabled");
  return v === null ? true : v === "true";
}

// Win probability for a given target multiplier
function winChance(t: number) {
  return Math.min(99, Math.max(0.1, (99 / t)));
}

export function LimboGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "limbo-bet");
  const [target, setTarget] = useState(2);
  // rolled: the true result from the server
  const [rolled, setRolled] = useState<number | null>(null);
  // displayed: the animated count-up value shown to user
  const [displayed, setDisplayed] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [showLose, setShowLose] = useState(false);
  const [rolling, setRolling] = useState(false);
  const rafRef = useRef<number | null>(null);

  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);
  const profit = bet * target - bet;

  // Slow count-up animation: tick from random start toward true result over ~2s
  const animateRoll = (finalVal: number, win: boolean) => {
    const TICK_DURATION = 1900; // ms
    const startVal = 1 + Math.random() * 0.8; // start near 1x
    const startTime = performance.now();
    let lastTickTime = 0;
    let tensionFired = false;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const raw = Math.min(1, elapsed / TICK_DURATION);
      // Ease out cubic — fast start, slow landing
      const eased = 1 - Math.pow(1 - raw, 3);
      const current = startVal + (finalVal - startVal) * eased;
      setDisplayed(parseFloat(current.toFixed(2)));

      // Sound: tick every 80ms
      if (now - lastTickTime > 80 && isSoundEnabled()) {
        soundLimboCountUp(raw);
        lastTickTime = now;
      }

      // Tension pulse when within 20% of target
      if (!tensionFired && raw > 0.78 && isSoundEnabled()) {
        tensionFired = true;
        soundLimboTension();
      }

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Snap to true result
        setDisplayed(finalVal);
        setRolling(false);
        setLastWin(win);
        if (win) {
          if (isSoundEnabled()) soundLimboWinReveal(finalVal);
          setTimeout(() => {
            if (isSoundEnabled()) soundLimboWinShimmer();
          }, 2800);
          setTimeout(() => setShowWin(true), 200);
        } else {
          if (isSoundEnabled()) soundLimboLoseReveal();
          setTimeout(() => setShowLose(true), 200);
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const handleBet = async () => {
    if (target < 1.01 || rolling || playing) return;
    // Reset state
    setLastWin(null);
    setShowWin(false);
    setShowLose(false);
    setDisplayed(null);
    setRolled(null);
    setRolling(true);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (isSoundEnabled()) soundLimboRoll();

    const result = await play("limbo", { target }, toRaw(bet));
    if (result) {
      const finalVal = result.bet.outcome.rolled as number;
      const win = result.bet.win;
      setRolled(finalVal);
      setStreak(s => win ? s + 1 : 0);
      onPlayed?.();
      animateRoll(finalVal, win);
    } else {
      setRolling(false);
    }
  };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Multiplier color
  const dispColor = lastWin === true ? "#00c2ff" : lastWin === false ? "#ef4444" : "#ffffff";
  const dispGlow  = lastWin === true
    ? "drop-shadow(0 0 18px rgba(0,194,255,0.95)) drop-shadow(0 0 35px rgba(0,194,255,0.4))"
    : lastWin === false
    ? "drop-shadow(0 0 18px rgba(239,68,68,0.95)) drop-shadow(0 0 35px rgba(239,68,68,0.4))"
    : "drop-shadow(0 0 8px rgba(255,255,255,0.2))";

  // Win probability
  const chance = winChance(target);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameArena
        gameId="limbo"
        win={lastWin}
        shake={lastWin === false}
        className="p-6 flex flex-col items-center justify-center relative overflow-hidden"
        style={{ minHeight: 380 }}
      >
        <GameStyles />

        <div className="absolute top-4 w-full flex justify-center z-40">
          <StreakBadge streak={streak} />
        </div>

        {/* ── Deep space cyber grid ── */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", perspective: "700px" }}>
          {/* Perspective floor grid */}
          <div style={{
            position: "absolute", bottom: 0, left: "-20%", right: "-20%", height: "120px",
            backgroundImage: [
              "repeating-linear-gradient(90deg, rgba(0,194,255,0.18) 0, rgba(0,194,255,0.18) 1px, transparent 1px, transparent 48px)",
              "repeating-linear-gradient(0deg, rgba(0,194,255,0.18) 0, rgba(0,194,255,0.18) 1px, transparent 1px, transparent 24px)",
            ].join(","),
            transform: "rotateX(65deg)",
            transformOrigin: "bottom center",
            animation: "gfxSlideUp 14s linear infinite",
          }} />
          {/* Vertical lines on sides */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: "8%", width: "1px",
            background: "linear-gradient(180deg, transparent, rgba(0,194,255,0.22) 40%, rgba(168,85,247,0.18) 80%, transparent)",
          }} />
          <div style={{
            position: "absolute", top: 0, bottom: 0, right: "8%", width: "1px",
            background: "linear-gradient(180deg, transparent, rgba(0,194,255,0.22) 40%, rgba(168,85,247,0.18) 80%, transparent)",
          }} />
          {/* Horizontal sweep laser */}
          {rolling && (
            <div style={{
              position: "absolute", left: 0, right: 0, height: "2px",
              background: "linear-gradient(90deg, transparent, rgba(0,194,255,0.8) 20%, rgba(168,85,247,0.9) 50%, rgba(0,194,255,0.8) 80%, transparent)",
              filter: "blur(2px)",
              animation: "limboLaserSweep 2.1s ease-in-out infinite",
            }} />
          )}
          {/* Floating orbs */}
          {[
            { top: "22%", left: "12%", size: 80, color: "rgba(0,194,255,0.12)", delay: "0s", dur: "5.2s" },
            { top: "55%", left: "78%", size: 60, color: "rgba(168,85,247,0.1)",  delay: "1.8s", dur: "6.5s" },
            { top: "72%", left: "40%", size: 45, color: "rgba(0,194,255,0.08)",  delay: "0.9s", dur: "4.8s" },
          ].map((orb, i) => (
            <div key={i} style={{
              position: "absolute",
              top: orb.top, left: orb.left,
              width: orb.size, height: orb.size,
              borderRadius: "50%",
              background: "radial-gradient(circle, " + orb.color + " 0%, transparent 70%)",
              filter: "blur(18px)",
              animation: "limboOrbFloat " + orb.dur + " ease-in-out " + orb.delay + " infinite",
            }} />
          ))}
        </div>

        {/* ── Target line indicator ── */}
        {!rolling && !lastWin && (
          <div style={{
            position: "absolute", left: "8%", right: "8%", zIndex: 5,
            top: "30%",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              flex: 1, height: "1px",
              background: "repeating-linear-gradient(90deg, rgba(0,194,255,0.5) 0, rgba(0,194,255,0.5) 8px, transparent 8px, transparent 16px)",
              animation: "limboTargetPulse 1.8s ease-in-out infinite",
            }} />
            <span style={{
              fontSize: 10, fontFamily: "monospace", fontWeight: 700,
              color: "rgba(0,194,255,0.75)", letterSpacing: 2,
              whiteSpace: "nowrap",
            }}>TARGET {target.toFixed(2)}x</span>
            <div style={{
              flex: 1, height: "1px",
              background: "repeating-linear-gradient(90deg, rgba(0,194,255,0.5) 0, rgba(0,194,255,0.5) 8px, transparent 8px, transparent 16px)",
              animation: "limboTargetPulse 1.8s ease-in-out infinite",
            }} />
          </div>
        )}

        {/* ── Main display — result / rolling number ── */}
        <div style={{ perspective: "500px", zIndex: 10, textAlign: "center" }}>
          <div style={{ transform: "rotateX(-8deg)" }}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)", fontFamily: "monospace",
              marginBottom: 6,
            }}>
              {rolling ? "Rolling..." : displayed !== null ? "Result" : "Result Multiplier"}
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div
                key={displayed ?? "idle"}
                initial={{ scale: 0.7, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.7, opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              >
                <div style={{
                  fontSize: 88, fontWeight: 900, lineHeight: 1,
                  fontFamily: "monospace", letterSpacing: 2,
                  color: rolling ? "#ffffff" : dispColor,
                  filter: rolling ? "drop-shadow(0 0 8px rgba(0,194,255,0.4))" : dispGlow,
                  transition: "color 0.3s, filter 0.3s",
                  animation: rolling ? "limboDigitTick 0.14s linear infinite" : "none",
                }}>
                  {displayed !== null ? displayed.toFixed(2) + "x" : "—"}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Status text */}
            <motion.div
              key={lastWin === null ? "idle" : lastWin ? "win" : "lose"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                marginTop: 10, fontSize: 13, fontFamily: "monospace",
                color: lastWin === true ? "#00c2ff" : lastWin === false ? "#ef4444" : "rgba(255,255,255,0.35)",
                textShadow: lastWin === true ? "0 0 10px rgba(0,194,255,0.6)" : lastWin === false ? "0 0 10px rgba(239,68,68,0.6)" : "none",
                minHeight: 22,
              }}
            >
              {rolling
                ? "Calculating..."
                : displayed !== null
                  ? lastWin
                    ? "Beat " + target + "x — won " + (bet * target).toFixed(4) + " " + activeAsset
                    : "Rolled " + (rolled?.toFixed(2) ?? "") + "x — needed " + target + "x"
                  : "Target: " + target + "x  ·  roll ≥ target to win"}
            </motion.div>
          </div>
        </div>

        {/* Win chance indicator bar */}
        {!rolling && lastWin === null && (
          <div style={{ marginTop: 18, zIndex: 10, width: "70%", maxWidth: 260 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>WIN CHANCE</span>
              <span style={{ fontSize: 10, color: "#00c2ff", fontFamily: "monospace", fontWeight: 700 }}>{chance.toFixed(1)}%</span>
            </div>
            <div style={{
              height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: chance + "%",
                background: "linear-gradient(90deg, #00c2ff, #a855f7)",
                boxShadow: "0 0 8px rgba(0,194,255,0.6)",
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        )}

        {/* Cinematic overlays */}
        <LimboSlowWinReveal
          active={showWin}
          rolled={rolled ?? 0}
          target={target}
          profit={profit}
          asset={activeAsset}
        />
        <LimboSlowLoseReveal
          active={showLose}
          rolled={rolled ?? 0}
          target={target}
        />
        <ConfettiRain active={lastWin === true && showWin} colors={GAME_THEMES.limbo.particleColors} />
      </GameArena>

      {/* ── Right Panel ── */}
      <div>
        <BetPanel
          bet={bet} setBet={setBet} onBet={handleBet}
          playing={playing || rolling}
          betLabel={rolling ? "Rolling..." : "Roll Limbo"}
          disabled={target < 1.01}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Target Multiplier</Label>
              <span className="text-xs font-bold tabular-nums" style={{ color: "#00c2ff", textShadow: "0 0 8px rgba(0,194,255,0.6)" }}>
                {target.toFixed(2)}x
              </span>
            </div>
            <Input
              type="number"
              value={target}
              onChange={(e) => setTarget(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
              min={1.01} step="0.01"
              className="bg-[#0f212e] border-[#2f4553] text-white h-10 tabular-nums"
              style={{ color: "#00c2ff", fontWeight: 700 }}
            />
            {/* Preset buttons */}
            <div className="grid grid-cols-4 gap-1">
              {[2, 5, 10, 100].map((m) => (
                <button
                  key={m}
                  onClick={() => setTarget(m)}
                  style={{
                    padding: "6px 0", fontSize: 11, fontWeight: 700, borderRadius: 6,
                    fontFamily: "monospace",
                    background: target === m ? "rgba(0,194,255,0.18)" : "rgba(255,255,255,0.04)",
                    border: target === m ? "1px solid rgba(0,194,255,0.6)" : "1px solid rgba(255,255,255,0.08)",
                    color: target === m ? "#00c2ff" : "#b1bad3",
                    boxShadow: target === m ? "0 0 10px rgba(0,194,255,0.25)" : "none",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  {m}x
                </button>
              ))}
            </div>
            {/* Win chance bar */}
            <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(0,194,255,0.06)", border: "1px solid rgba(0,194,255,0.12)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: "#b1bad3", fontFamily: "monospace" }}>Win Chance</span>
                <span style={{ fontSize: 10, color: "#00c2ff", fontFamily: "monospace", fontWeight: 700 }}>{chance.toFixed(2)}%</span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: Math.min(100, chance) + "%",
                  background: "linear-gradient(90deg, #00c2ff, #a855f7)",
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 10px", borderRadius: 8,
            background: "rgba(0,194,255,0.06)", border: "1px solid rgba(0,194,255,0.12)",
            fontSize: 12,
          }}>
            <span style={{ color: "#b1bad3" }}>Profit on win</span>
            <span style={{ fontWeight: 800, fontFamily: "monospace", color: "#00c2ff", textShadow: "0 0 8px rgba(0,194,255,0.5)" }}>
              +{profit.toFixed(6)} {activeAsset}
            </span>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}
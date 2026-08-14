"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { useUiStore } from "@/store/ui";
import { kenoMultiplier } from "@/lib/provably-fair";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  GameArena, GameStyles, ConfettiRain, GAME_THEMES, StreakBadge,
  KenoSlowWinReveal, KenoSlowLoseReveal,
} from "./game-effects";
import {
  soundKenoDraw, soundKenoBall, soundKenoLastBall,
  soundKenoHighMatch, soundKenoWinFanfare, soundKenoWinShimmer, soundKenoLoseDrop,
} from "@/hooks/use-sound";

function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("agy_sound_enabled");
  return v === null ? true : v === "true";
}

const POOL = 40;
const MAX_PICKS = 10;

// Ball drop delay schedule — decelerates toward the end for maximum suspense
function ballDelay(idx: number, total: number): number {
  if (idx < total - 3) return 185;
  if (idx < total - 1) return 320;
  return 620; // last ball
}

interface KenoResult {
  draw: number[]; picks: number[]; matches: number[];
  multiplier: number; payout: number; win: boolean;
}

// Quick pick count color
function quickPickColor(cnt: number) {
  if (cnt <= 3) return { active: "#00c2ff", glow: "rgba(0,194,255,0.25)" };
  if (cnt <= 6) return { active: "#f59e0b", glow: "rgba(245,158,11,0.25)" };
  return { active: "#ff5cb1", glow: "rgba(255,92,177,0.25)" };
}

export function KenoGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "keno-bet");
  const [picks, setPicks] = useState<number[]>([]);
  const [result, setResult] = useState<KenoResult | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [revealedDraw, setRevealedDraw] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [showLose, setShowLose] = useState(false);
  const [justPicked, setJustPicked] = useState<number | null>(null);

  const drawTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const togglePick = (n: number) => {
    if (drawing || playing) return;
    setResult(null);
    setRevealedDraw([]);
    setShowWin(false);
    setShowLose(false);
    setPicks((prev) => {
      if (prev.includes(n)) return prev.filter((p) => p !== n);
      if (prev.length >= MAX_PICKS) { toast.warning("Max 10 numbers"); return prev; }
      return [...prev, n].sort((a, b) => a - b);
    });
    // Pop animation
    setJustPicked(n);
    setTimeout(() => setJustPicked(null), 380);
  };

  const handleBet = async () => {
    if (picks.length < 1) { toast.warning("Pick at least 1 number"); return; }
    setResult(null);
    setRevealedDraw([]);
    setShowWin(false);
    setShowLose(false);
    setDrawing(true);
    if (isSoundEnabled()) soundKenoDraw();

    const res = await play("keno", { numbers: picks }, toRaw(bet));
    if (res) {
      const out = res.bet.outcome as { picks: number[]; draw: number[]; matches: number; multiplier: number };
      const matchedNums = picks.filter((n) => out.draw.includes(n));
      const draw = out.draw;
      let i = 0;

      const scheduleNext = () => {
        if (i >= draw.length) {
          setDrawing(false);
          const finalResult: KenoResult = {
            draw, picks, matches: matchedNums,
            multiplier: out.multiplier, payout: res.bet.payout, win: res.bet.win,
          };
          setResult(finalResult);
          setStreak((s) => finalResult.win ? s + 1 : 0);
          onPlayed?.();
          if (finalResult.win) {
            if (isSoundEnabled()) {
              if (matchedNums.length >= 5) soundKenoHighMatch(matchedNums.length);
              setTimeout(() => soundKenoWinFanfare(out.multiplier), 250);
              setTimeout(() => soundKenoWinShimmer(), 2900);
            }
            setTimeout(() => setShowWin(true), 200);
          } else {
            if (isSoundEnabled()) soundKenoLoseDrop();
            setTimeout(() => setShowLose(true), 200);
          }
          return;
        }

        const ballNum = draw[i];
        const isMatch = picks.includes(ballNum);
        const isLast = i === draw.length - 1;

        if (isLast && isSoundEnabled()) soundKenoLastBall();

        setRevealedDraw((prev) => [...prev, ballNum]);
        if (isSoundEnabled()) soundKenoBall(isMatch, i);

        i++;
        drawTimer.current = setTimeout(scheduleNext, ballDelay(i, draw.length));
      };

      drawTimer.current = setTimeout(scheduleNext, 120);
    } else {
      setDrawing(false);
    }
  };

  const busy = playing || drawing;
  const maxPotentialMult = picks.length > 0 ? kenoMultiplier(picks.length, picks.length) : 0;
  const currentMatchMult = result ? result.multiplier : 0;
  const potentialPayout = bet * (result ? currentMatchMult : maxPotentialMult);
  const lastWin = result ? result.win : null;
  const profit = result ? result.payout - bet : bet * maxPotentialMult - bet;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameArena
        gameId="keno" win={lastWin} shake={lastWin === false}
        className="p-4 flex flex-col justify-between relative overflow-hidden"
        style={{ minHeight: 440 }}
      >
        <GameStyles />

        <div className="absolute top-2 w-full flex justify-center z-40">
          <StreakBadge streak={streak} />
        </div>

        {/* Draw sweep beam */}
        {drawing && (
          <div style={{
            position: "absolute", top: 0, bottom: 0, width: "28%",
            background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.08), rgba(34,197,94,0.04), transparent)",
            animation: "kenoDrawSweep 1.1s linear infinite",
            pointerEvents: "none", zIndex: 5,
          }} />
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-3 z-10 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Pick {picks.length}/{MAX_PICKS}</span>
            {picks.length > 0 && (
              <span style={{
                fontSize: 10, fontFamily: "monospace",
                color: "#22c55e", textShadow: "0 0 8px rgba(34,197,94,0.6)",
              }}>
                Max {maxPotentialMult.toFixed(2)}×
              </span>
            )}
          </div>
          {picks.length > 0 && !busy && (
            <button
              onClick={() => { setPicks([]); setResult(null); setRevealedDraw([]); setShowWin(false); setShowLose(false); }}
              style={{ fontSize: 10, color: "#b1bad3", cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#b1bad3"; }}
            >
              Clear
            </button>
          )}
        </div>

        {/* 40-tile grid */}
        <div className="grid grid-cols-8 gap-1.5 sm:gap-2 z-10">
          {Array.from({ length: POOL }).map((_, i) => {
            const n = i + 1;
            const isPicked = picks.includes(n);
            const isDrawn   = revealedDraw.includes(n);
            const isMatch   = isPicked && isDrawn;
            const isMiss    = !isPicked && isDrawn;
            const isPopped  = justPicked === n;

            // Backgrounds
            let bg = "linear-gradient(145deg, #0d1c2a 0%, #152336 100%)";
            let border = "1px solid rgba(255,255,255,0.05)";
            let shadow = "0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)";
            let textColor = "#4a6070";
            let anim = "";

            if (isMatch) {
              bg = "radial-gradient(circle at 38% 32%, #fef08a 0%, #fbbf24 30%, #f59e0b 60%, #d97706 100%)";
              border = "1.5px solid #fcd34d";
              shadow = "0 0 22px rgba(255,210,63,0.9), 0 0 44px rgba(255,210,63,0.35)";
              textColor = "#000";
              anim = "kenoBallGlow 1.8s ease-in-out infinite";
            } else if (isPicked) {
              bg = "radial-gradient(circle at 38% 32%, #4ade80 0%, #22c55e 45%, #15803d 85%)";
              border = "1.5px solid #4ade80";
              shadow = "0 0 14px rgba(34,197,94,0.7), 0 0 28px rgba(34,197,94,0.25)";
              textColor = "#ffffff";
              anim = isPopped ? "kenoPickSelect 0.35s ease-out" : "";
            } else if (isMiss) {
              bg = "linear-gradient(145deg, #0a1820 0%, #0d2028 100%)";
              border = "1px solid rgba(20,184,166,0.2)";
              shadow = "0 0 8px rgba(20,184,166,0.1)";
              textColor = "rgba(255,210,63,0.45)";
              anim = "kenoBallDrop 0.38s cubic-bezier(0.22,1,0.36,1)";
            } else if (isDrawn) {
              anim = "kenoBallDrop 0.38s cubic-bezier(0.22,1,0.36,1)";
            }

            const isMatchJustRevealed = isMatch && revealedDraw[revealedDraw.length - 1] === n;

            return (
              <motion.button
                key={n}
                onClick={() => togglePick(n)}
                disabled={busy}
                initial={false}
                whileHover={!busy ? { scale: 1.08, y: -2 } : {}}
                whileTap={!busy ? { scale: 0.94 } : {}}
                style={{
                  aspectRatio: "1", borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, fontFamily: "monospace",
                  position: "relative", overflow: "hidden",
                  background: bg, border, boxShadow: shadow,
                  color: textColor,
                  cursor: busy ? "default" : "pointer",
                  animation: anim,
                  transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s, color 0.2s",
                }}
              >
                {/* Specular glint */}
                {!isMatch && !isMiss && (
                  <div style={{
                    position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                  }} />
                )}

                {/* Match explosion ring */}
                {isMatchJustRevealed && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 8,
                    border: "2px solid rgba(255,210,63,0.9)",
                    animation: "kenoMatchExplosion 0.6s ease-out forwards",
                    pointerEvents: "none",
                  }} />
                )}

                <span style={{ position: "relative", zIndex: 1 }}>{n}</span>

                {/* Sparkle on match */}
                {isMatch && (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.08 }}
                    style={{
                      position: "absolute", top: -4, right: -4,
                      fontSize: 10, zIndex: 2, pointerEvents: "none",
                    }}
                  >
                    ✨
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Result stats bar */}
        <div className="mt-3 min-h-[58px] z-10">
          <AnimatePresence mode="wait">
            {result && !drawing ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-4 gap-2"
              >
                {[
                  { label: "Picks",      value: String(result.picks.length),                                   color: "#ffffff" },
                  { label: "Matches",    value: result.matches.length + "/" + result.picks.length,             color: "#22c55e" },
                  { label: "Multiplier", value: result.multiplier.toFixed(2) + "×",
                    color: result.multiplier >= 10 ? "#ffd23f" : result.multiplier > 0 ? "#22c55e" : "#ef4444" },
                  { label: "Payout",     value: result.payout.toFixed(4),                                     color: result.win ? "#22c55e" : "#ef4444" },
                ].map((s) => (
                  <div key={s.label} style={{
                    background: "linear-gradient(145deg,#0a1820,#0d2028)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 8, padding: "6px 8px", textAlign: "center",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.4)",
                  }}>
                    <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#4a6070", textTransform: "uppercase", marginBottom: 3 }}>
                      {s.label}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 900, fontFamily: "monospace", color: s.color,
                      textShadow: s.color !== "#ffffff" && s.color !== "#ef4444"
                        ? "0 0 10px " + s.color + "88" : "none",
                    }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : drawing ? (
              <motion.div key="drawing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: "100%" }}>
                <Loader2 style={{ width: 14, height: 14, color: "#22c55e", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", letterSpacing: 2,
                  color: "#22c55e", textShadow: "0 0 10px rgba(34,197,94,0.6)", textTransform: "uppercase" }}>
                  Drawing numbers...
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Cinematic overlays */}
        <KenoSlowWinReveal
          active={showWin}
          matches={result?.matches.length ?? 0}
          multiplier={result?.multiplier ?? 0}
          profit={profit}
          asset={activeAsset}
        />
        <KenoSlowLoseReveal active={showLose} />
        <ConfettiRain active={lastWin === true && showWin} colors={GAME_THEMES.keno.particleColors} />
      </GameArena>

      {/* ── Right Panel ── */}
      <div>
        <BetPanel
          bet={bet} setBet={setBet} onBet={handleBet}
          playing={busy}
          betLabel={busy ? "Drawing..." : "Draw"}
          disabled={picks.length < 1}
        >
          <div className="space-y-2">
            {/* Quick Pick */}
            <div className="flex items-center justify-between" style={{ fontSize: 10, color: "#b1bad3", textTransform: "uppercase", letterSpacing: 1.5 }}>
              <span>Quick Pick</span>
              <span style={{ color: picks.length > 0 ? "#22c55e" : "#4a6070" }}>{picks.length} selected</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 5, 7, 8, 9, 10].map((cnt) => {
                const qc = quickPickColor(cnt);
                const isActive = picks.length === cnt;
                return (
                  <button
                    key={cnt}
                    onClick={() => {
                      if (busy) return;
                      const avail = Array.from({ length: POOL }, (_, i) => i + 1).filter((n) => !picks.includes(n));
                      const need = cnt - picks.length;
                      if (need <= 0) { setPicks(picks.slice(0, cnt).sort((a, b) => a - b)); return; }
                      for (let i = avail.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [avail[i], avail[j]] = [avail[j], avail[i]];
                      }
                      setPicks([...picks, ...avail.slice(0, need)].sort((a, b) => a - b));
                      setResult(null); setRevealedDraw([]);
                    }}
                    disabled={busy}
                    style={{
                      padding: "6px 0", fontSize: 11, fontWeight: 700, borderRadius: 6,
                      fontFamily: "monospace",
                      background: isActive ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                      border: "1px solid " + (isActive ? qc.active : "rgba(255,255,255,0.07)"),
                      color: isActive ? qc.active : "#6b7a8a",
                      boxShadow: isActive ? "0 0 10px " + qc.glow : "none",
                      cursor: busy ? "not-allowed" : "pointer",
                      transition: "all 0.2s", opacity: busy ? 0.45 : 1,
                    }}
                  >
                    {cnt}
                  </button>
                );
              })}
            </div>

            {/* Payout info */}
            <div style={{
              padding: "8px 10px", borderRadius: 8,
              background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)",
              fontSize: 11,
            }}>
              {picks.length > 0 ? (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#b1bad3" }}>Max payout</span>
                  <span style={{ fontWeight: 800, fontFamily: "monospace", color: "#ffd23f", textShadow: "0 0 8px rgba(255,210,63,0.5)" }}>
                    {maxPotentialMult.toFixed(2)}× · +{(bet * maxPotentialMult - bet).toFixed(4)} {activeAsset}
                  </span>
                </div>
              ) : (
                <span style={{ color: "#4a6070" }}>Pick 1–10 numbers from the 40-tile board.</span>
              )}
            </div>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

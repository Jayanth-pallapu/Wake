"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useUiStore } from "@/store/ui";
import { useWalletStore } from "@/store/wallet";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import {
  GameArena, GameStyles, Card3D, ParticleBurst, ConfettiRain,
  StreakBadge, NeonMultiplier, GAME_THEMES,
  BlackjackWinReveal, BlackjackLoseReveal, BlackjackArenaBackground, BJChipRain,
} from "./game-effects";

type Phase = "idle" | "playing" | "dealerTurn" | "ended";
type CardInfo = { rank: string; suit: "♠" | "♥" | "♦" | "♣" };

/* ══════════════════════════════════════════════════════════════
   PREMIUM SOUND ENGINE
══════════════════════════════════════════════════════════════ */
function useBlackjackSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    const soundEnabled = localStorage.getItem("agy_sound_enabled");
    if (soundEnabled === "false") return null;
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  // Metallic chip tink — for bet interactions
  const playChip = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
  }, [getCtx]);

  // Card deal — whirr + snap feel (paper sliding on felt)
  const playDeal = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    // Whirr sweep
    const osc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(2800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
    sweepGain.gain.setValueAtTime(0.08, ctx.currentTime);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    const fSweep = ctx.createBiquadFilter();
    fSweep.type = "bandpass"; fSweep.frequency.value = 1600; fSweep.Q.value = 1.2;
    osc.connect(fSweep); fSweep.connect(sweepGain); sweepGain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.07);
    // Snap at the end
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.016));
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.055);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 2000; filter.Q.value = 0.9;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start(ctx.currentTime + 0.055);
  }, [getCtx]);

  // Crisp card flip — papery flip for dealer hole card reveal
  const playFlip = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    [0, 0.035].forEach((t) => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.07, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.011));
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25 + t * 3, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.07);
      const f = ctx.createBiquadFilter();
      f.type = "bandpass"; f.frequency.value = 1600 + t * 2000; f.Q.value = 1.0;
      src.connect(f); f.connect(gain); gain.connect(ctx.destination);
      src.start(ctx.currentTime + t);
    });
  }, [getCtx]);

  // Crisp hit snap (higher pitch than deal)
  const playHit = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.09, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.34, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 2600; filter.Q.value = 1.1;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start();
  }, [getCtx]);

  // Stand — bass thud
  const playStand = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.45, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.32);
  }, [getCtx]);

  // Double — double snap
  const playDouble = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    [0, 0.09].forEach(t => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.09, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.014));
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3 + t * 0.1, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.09);
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass"; filter.frequency.value = 2100 + t * 500; filter.Q.value = 0.9;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start(ctx.currentTime + t);
    });
    playChip();
  }, [getCtx, playChip]);

  // Win chime C→E→G→C with reverb echo
  const playWin = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + idx * 0.16;
      osc.type = "triangle"; osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.7);
      // Reverb echo slightly behind
      const echo = ctx.createOscillator();
      const eGain = ctx.createGain();
      echo.type = "triangle"; echo.frequency.setValueAtTime(freq, t + 0.09);
      eGain.gain.setValueAtTime(0, t + 0.09);
      eGain.gain.linearRampToValueAtTime(0.1, t + 0.12);
      eGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      echo.connect(eGain); eGain.connect(ctx.destination);
      echo.start(t + 0.09); echo.stop(t + 0.55);
    });
  }, [getCtx]);

  // Grand Blackjack fanfare — drum thud + 5-note ascending
  const playBlackjack = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    // Low drum thud at start
    const drumOsc = ctx.createOscillator();
    const drumGain = ctx.createGain();
    drumOsc.type = "sine";
    drumOsc.frequency.setValueAtTime(90, ctx.currentTime);
    drumOsc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.18);
    drumGain.gain.setValueAtTime(0.6, ctx.currentTime);
    drumGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    drumOsc.connect(drumGain); drumGain.connect(ctx.destination);
    drumOsc.start(); drumOsc.stop(ctx.currentTime + 0.24);
    // Ascending fanfare notes
    const notes = [392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + 0.08 + idx * 0.14;
      osc.type = idx < 4 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(idx === 4 ? 0.52 : 0.36, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (idx === 4 ? 1.4 : 0.55));
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 1.6);
    });
    // Shimmer overtone
    const shimmer = ctx.createOscillator();
    const shimGain = ctx.createGain();
    shimmer.type = "sine"; shimmer.frequency.setValueAtTime(1760, ctx.currentTime + 0.65);
    shimGain.gain.setValueAtTime(0, ctx.currentTime + 0.65);
    shimGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.78);
    shimGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);
    shimmer.connect(shimGain); shimGain.connect(ctx.destination);
    shimmer.start(ctx.currentTime + 0.65); shimmer.stop(ctx.currentTime + 1.7);
  }, [getCtx]);

  // Descending lose — chromatic run then wah-wah
  const playLose = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    // Chromatic descend C→B→Bb→A
    const descNotes = [523.25, 493.88, 466.16, 440];
    descNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.08;
      osc.type = "triangle"; osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.12);
    });
    const offset = 0.32;
    // Wah-wah sawtooth tones
    const notes = [300, 220];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + offset + idx * 0.24;
      osc.type = "sawtooth"; osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.3);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = 800;
      osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.5);
    });
    // Low rumble
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15)) * 0.4;
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const rGain = ctx.createGain(); rGain.gain.value = 0.2;
    const filter2 = ctx.createBiquadFilter(); filter2.type = "lowpass"; filter2.frequency.value = 160;
    src.connect(filter2); filter2.connect(rGain); rGain.connect(ctx.destination);
    src.start(ctx.currentTime + offset + 0.48);
  }, [getCtx]);

  // Neutral push chime
  const playPush = useCallback(() => {
    const ctx = getCtx(); if (!ctx) return;
    [440, 440].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + idx * 0.2;
      osc.type = "sine"; osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.45);
    });
  }, [getCtx]);

  return { playChip, playDeal, playFlip, playHit, playStand, playDouble, playWin, playBlackjack, playLose, playPush };
}

/* ══════════════════════════════════════════════════════════════
   PREMIUM SCORE BADGE — neon cycling border, pops on change
══════════════════════════════════════════════════════════════ */
function ScoreBadge({ label, total, hide, isBust, isWin }: {
  label: string; total: number; hide?: boolean; isBust?: boolean; isWin?: boolean;
}) {
  const is21 = !hide && total === 21;
  const isSafe = !hide && total >= 17 && total <= 20;

  const borderColor = isBust ? "#ff3030"
    : isWin ? "#FFD700"
    : is21 ? "#FFD23F"
    : isSafe ? "rgba(255,210,63,0.5)"
    : "rgba(0,255,136,0.5)";

  const glowColor = isBust ? "rgba(255,48,48,0.55)"
    : isWin ? "rgba(255,215,0,0.55)"
    : is21 ? "rgba(255,210,63,0.65)"
    : "rgba(0,255,136,0.25)";

  const textColor = isBust ? "#ff6060"
    : isWin || is21 ? "#FFD700"
    : "#ffffff";

  const bg = isBust
    ? "linear-gradient(135deg, rgba(120,0,0,0.75), rgba(60,0,0,0.88))"
    : isWin || is21
    ? "linear-gradient(135deg, rgba(90,70,0,0.78), rgba(50,38,0,0.88))"
    : "linear-gradient(135deg, rgba(0,50,25,0.72), rgba(5,28,14,0.88))";

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: bg,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 26, padding: "5px 18px",
      boxShadow: `0 0 22px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`,
      backdropFilter: "blur(12px)",
      animation: isBust || is21
        ? "bjScorePop 0.5s ease-out"
        : "bjNeonPulse 4s ease-in-out infinite",
      transition: "all 0.4s ease",
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: "#b1bad3",
        textTransform: "uppercase", letterSpacing: 2, fontFamily: "monospace",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 20, fontWeight: 900, color: textColor,
        fontFamily: "'Orbitron', monospace",
        textShadow: `0 0 12px ${borderColor}`,
        transition: "all 0.3s ease",
        minWidth: 26, textAlign: "center",
      }}>
        {hide ? "?" : total}
      </span>
      {isBust && (
        <span style={{ fontSize: 10, color: "#ff6060", fontWeight: 700, letterSpacing: 1.5 }}>BUST</span>
      )}
      {is21 && !isBust && (
        <span style={{ fontSize: 9, color: "#FFD700", fontWeight: 700, letterSpacing: 1 }}>✦21✦</span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PREMIUM ACTION BUTTON — 3D press + shimmer + ripple
══════════════════════════════════════════════════════════════ */
function ActionBtn({
  onClick, disabled, label, gradient, shadow, shimmerDelay = "0s",
  width = "100%", height = 54,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  gradient: string;
  shadow: string;
  shimmerDelay?: string;
  width?: string;
  height?: number;
}) {
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const rippleId = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    rippleId.current++;
    setRipple({ x, y, id: rippleId.current });
    setTimeout(() => setRipple(null), 600);
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.03, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.97, y: 3 }}
      style={{
        width, height,
        background: disabled ? "rgba(30,44,52,0.6)" : gradient,
        border: disabled ? "1px solid rgba(47,69,83,0.5)" : "none",
        borderRadius: 14,
        color: disabled ? "#4f6272" : "#fff",
        fontSize: height >= 54 ? 15 : 13, fontWeight: 900,
        fontFamily: "'Orbitron', monospace",
        letterSpacing: 1.5,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : `${shadow}, inset 0 1px 0 rgba(255,255,255,0.22)`,
        textShadow: disabled ? "none" : "0 1px 3px rgba(0,0,0,0.5)",
        transition: "box-shadow 0.15s, background 0.2s",
        position: "relative", overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Shimmer sweep */}
      {!disabled && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14,
          background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 50%, rgba(200,240,255,0.12) 55%, transparent 70%)",
          backgroundSize: "220% 100%",
          animation: `shimmer 1.6s linear infinite ${shimmerDelay}`,
          pointerEvents: "none",
        }} />
      )}
      {/* 3D bottom edge */}
      {!disabled && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 4, borderRadius: "0 0 14px 14px",
          background: "rgba(0,0,0,0.35)",
          pointerEvents: "none",
        }} />
      )}
      {/* Ripple */}
      {ripple && (
        <span style={{
          position: "absolute",
          left: ripple.x - 20, top: ripple.y - 20,
          width: 40, height: 40,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.35)",
          animation: "bjRipple 0.55s ease-out forwards",
          pointerEvents: "none",
        }} />
      )}
      {label}
    </motion.button>
  );
}

/* ══════════════════════════════════════════════════════════════
   IDLE CARD SLOT PLACEHOLDER
══════════════════════════════════════════════════════════════ */
function EmptyCardSlot() {
  return (
    <div style={{
      width: 88, height: 124, borderRadius: 12,
      border: "2px dashed rgba(0,255,136,0.18)",
      background: "rgba(0,255,136,0.03)",
      boxShadow: "inset 0 0 14px rgba(0,0,0,0.3)",
      flexShrink: 0,
    }} />
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN BLACKJACK GAME
══════════════════════════════════════════════════════════════ */
export function BlackjackGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "blackjack-bet");
  const [phase, setPhase] = useState<Phase>("idle");
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerHand, setPlayerHand] = useState<CardInfo[]>([]);
  const [dealerHand, setDealerHand] = useState<CardInfo[]>([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastPayout, setLastPayout] = useState<number | undefined>();
  const [dealerHoleRevealed, setDealerHoleRevealed] = useState(false);

  const activeAsset = useUiStore((s) => s.activeAsset);
  const updateBalance = useWalletStore((s) => s.updateBalance);
  const refreshWallet = useWalletStore((s) => s.refresh);

  const snd = useBlackjackSounds();

  const isWin = result?.includes("WIN") || result?.includes("BLACKJACK");
  const isLose = (result?.includes("BUST") && !result.includes("DEALER")) || result?.includes("LOSE");
  const isPush = result?.includes("PUSH");
  const isBlackjack = result?.includes("BLACKJACK");
  const isPlayerBust = result?.includes("PLAYER BUST");

  const lastWin = phase === "ended"
    ? (isWin ? true : isLose || isPlayerBust ? false : isPush ? null : null)
    : null;

  const start = async () => {
    if (loading) return;
    setLoading(true);
    setLastPayout(undefined);
    setDealerHoleRevealed(false);
    try {
      const res = await api.post<any>("/api/games/blackjack/start", { betRaw: toRaw(bet), asset: activeAsset });
      setGameId(res.gameId);
      setPlayerHand(res.playerHand || []);
      setDealerHand(res.dealerHand || []);
      setPlayerTotal(res.playerTotal || 0);
      setDealerTotal(res.dealerTotal || 0);
      setResult(res.result);
      const newPhase = res.status === "playing" ? "playing" : "ended";
      setPhase(newPhase);

      updateBalance(activeAsset, res.balanceAfterRaw);
      refreshWallet();

      // Staggered deal sounds — 4 cards × 180ms apart
      [0, 180, 360, 540].forEach(delay => {
        setTimeout(() => snd.playDeal(), delay);
      });

      if (res.status === "ended") {
        // Natural blackjack — reveal all immediately
        setDealerHoleRevealed(true);
        handleEnd(res);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to start game");
    } finally {
      setLoading(false);
    }
  };

  const action = async (act: "hit" | "stand" | "double") => {
    if (loading || !gameId || phase !== "playing") return;
    setLoading(true);

    if (act === "hit") snd.playHit();
    else if (act === "stand") {
      snd.playStand();
      // Reveal dealer hole card with flip sound after brief delay
      setTimeout(() => {
        snd.playFlip();
        setDealerHoleRevealed(true);
      }, 200);
    } else if (act === "double") snd.playDouble();

    try {
      const res = await api.post<any>("/api/games/blackjack/action", { gameId, action: act });
      setPlayerHand(res.playerHand || []);
      setDealerHand(res.dealerHand || []);
      setPlayerTotal(res.playerTotal || 0);
      setDealerTotal(res.dealerTotal || 0);
      setResult(res.result);

      if (res.status === "ended") {
        setPhase("ended");
        // For bust: hole card doesn't need separate reveal since game is over
        if (res.result?.includes("PLAYER BUST")) {
          setDealerHoleRevealed(false);
        } else {
          setDealerHoleRevealed(true);
        }
        handleEnd(res);
      } else {
        setPhase("playing");
      }
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = (res: any) => {
    const resultStr: string = res.result || "";
    const won = res.win;
    const bj = resultStr.includes("BLACKJACK");
    const push = resultStr.includes("PUSH");

    // Delay sound to allow card animation to complete
    setTimeout(() => {
      if (won && bj) snd.playBlackjack();
      else if (won) snd.playWin();
      else if (push) snd.playPush();
      else snd.playLose();
    }, 200);

    if (won) {
      const payoutNum = res.payout ? parseFloat(res.payout) : undefined;
      toast.success(`🎉 Won ${res.payout} ${activeAsset}!`);
      updateBalance(activeAsset, res.balanceAfterRaw);
      refreshWallet();
      setStreak(s => s + 1);
      setLastPayout(payoutNum);
    } else if (!push) {
      setStreak(0);
    }
    onPlayed?.();
  };

  const resetGame = () => {
    setPhase("idle");
    setGameId(null);
    setPlayerHand([]);
    setDealerHand([]);
    setPlayerTotal(0);
    setDealerTotal(0);
    setResult(null);
    setLastPayout(undefined);
    setDealerHoleRevealed(false);
  };

  // Derived states
  const isPlayerBustState = result?.includes("PLAYER BUST") && phase === "ended";
  const isDealerBustWin = result?.includes("DEALER BUST") && phase === "ended";

  // Whether dealer's 2nd card is hidden
  const hideDealerHole = phase === "playing" && dealerHand.length >= 2 && !dealerHoleRevealed;

  // Card fan rotation for player hand — subtle fan effect
  const getFanRotation = (idx: number, total: number) => {
    if (total <= 1) return 0;
    const range = Math.min(total * 2.5, 12);
    return -range / 2 + (idx / Math.max(total - 1, 1)) * range;
  };

  const CardRow = ({ cards, total, label, hideSecond, isDealer }: {
    cards: CardInfo[]; total: number; label: string; hideSecond?: boolean; isDealer?: boolean;
  }) => {
    const isBust = label === "Player" ? isPlayerBustState : false;
    const isCardWin = phase === "ended" && label === "Player" && lastWin === true;
    const isCardLose = phase === "ended" && label === "Player" && lastWin === false;

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", padding: "20px 8px" }}>
        {/* Score badge */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%) translateY(-50%)", zIndex: 20 }}>
          <ScoreBadge
            label={label}
            total={total}
            hide={hideSecond}
            isBust={isBust}
            isWin={isCardWin}
          />
        </div>

        {/* Cards with fan layout */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32, minHeight: 128, perspective: "900px", alignItems: "flex-end" }}>
          {cards.length === 0 ? (
            // Idle: show empty placeholders
            <>
              <EmptyCardSlot />
              <div style={{ marginLeft: -20 }}><EmptyCardSlot /></div>
            </>
          ) : (
            cards.map((c, i) => {
              const fanRot = getFanRotation(i, cards.length);
              const isHoleCard = isDealer && hideSecond && i === 1;
              // Dealer hole card flip animation when revealed
              const holeFlipAnim = isDealer && !hideSecond && i === 1 && dealerHoleRevealed && phase === "ended"
                ? "bjDealerHoleFlip 0.55s ease-out"
                : undefined;

              return (
                <div
                  key={`${i}-${c.rank}-${c.suit}`}
                  style={{
                    position: "relative",
                    marginLeft: i > 0 ? "-30px" : 0,
                    zIndex: i,
                    transform: `rotate(${fanRot}deg)`,
                    transformOrigin: "bottom center",
                    transition: "transform 0.3s ease",
                    animation: holeFlipAnim,
                  }}
                >
                  <Card3D
                    card={isHoleCard ? undefined : c}
                    faceDown={isHoleCard}
                    lifted={isCardWin}
                    drooping={isCardLose && !isBlackjack}
                    dealMode
                    delay={i * 0.16}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameStyles />
      <GameArena
        gameId="blackjack"
        win={lastWin}
        shake={isPlayerBustState}
        className="p-6 flex flex-col justify-between overflow-hidden"
        style={{ minHeight: 440 }}
      >
        {/* Premium arena background */}
        <BlackjackArenaBackground win={lastWin} />

        {/* Felt texture overlay */}
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/felt.png')",
          opacity: 0.08,
        }} />

        {/* Streak badge */}
        <div className="absolute top-4 left-4 z-30">
          <StreakBadge streak={streak} />
        </div>

        {/* Particle burst on win */}
        <ParticleBurst active={lastWin === true} colors={GAME_THEMES.blackjack.particleColors} />

        {/* ── WIN REVEAL ── */}
        <BlackjackWinReveal
          active={phase === "ended" && (isWin === true)}
          isBlackjack={isBlackjack}
          payout={lastPayout}
          asset={activeAsset}
        />

        {/* ── LOSE / BUST REVEAL ── */}
        <BlackjackLoseReveal
          active={phase === "ended" && (isLose === true || isPlayerBust === true)}
          isBust={isPlayerBustState}
          bustWho="player"
        />

        {/* PUSH banner */}
        <AnimatePresence>
          {phase === "ended" && isPush && (
            <motion.div
              initial={{ scale: 0.75, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 40, textAlign: "center", pointerEvents: "none",
              }}
            >
              <div style={{
                padding: "12px 32px", borderRadius: 32,
                background: "linear-gradient(135deg, rgba(0,150,200,0.3), rgba(0,80,120,0.42))",
                border: "1.5px solid rgba(0,194,255,0.7)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 0 40px rgba(0,194,255,0.35)",
                fontSize: 24, fontWeight: 900, color: "#00c2ff",
                fontFamily: "'Orbitron', monospace", letterSpacing: 3,
                textShadow: "0 0 20px rgba(0,194,255,0.95)",
              }}>
                🤝 PUSH
              </div>
              <div style={{ fontSize: 11, color: "#b1bad3", marginTop: 8, fontWeight: 600, letterSpacing: 2 }}>
                BET RETURNED
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle call-to-action glow text */}
        <AnimatePresence>
          {phase === "idle" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
                zIndex: 5, pointerEvents: "none", textAlign: "center",
              }}
            >
              <div style={{
                fontSize: 13, fontWeight: 700, color: "rgba(0,255,136,0.6)",
                fontFamily: "'Orbitron', monospace", letterSpacing: 2.5,
                textShadow: "0 0 12px rgba(0,255,136,0.4)",
                animation: "gfxPulse 2.5s ease-in-out infinite",
              }}>
                PLACE YOUR BET & DEAL
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card area */}
        <div style={{
          width: "100%", flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "space-around", padding: "16px 0",
          position: "relative", zIndex: 10,
        }}>
          <CardRow
            cards={dealerHand}
            total={dealerTotal}
            label="Dealer"
            hideSecond={hideDealerHole}
            isDealer
          />

          {/* Holographic table divider — rendered by BlackjackArenaBackground, just add extra visible one here */}
          <div style={{ margin: "4px 0", opacity: 0 }} />

          <CardRow
            cards={playerHand}
            total={playerTotal}
            label="Player"
          />
        </div>

        {/* "Play again" hint when ended */}
        <AnimatePresence>
          {phase === "ended" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 2.4, duration: 0.5 }}
              style={{
                position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
                zIndex: 5, pointerEvents: "none",
              }}
            >
              <div style={{
                fontSize: 11, color: "rgba(177,186,211,0.7)", fontWeight: 600,
                letterSpacing: 2, textTransform: "uppercase",
                animation: "gfxPulse 2s ease-in-out infinite",
              }}>
                ↓ Deal again to play
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GameArena>

      {/* Bet Panel */}
      <div>
        <BetPanel
          bet={bet}
          setBet={setBet}
          onBet={phase === "ended" ? resetGame : start}
          playing={phase === "playing" || loading}
          betLabel={phase === "idle" ? "Deal" : phase === "ended" ? "▶ Play Again" : "Playing..."}
          disabled={loading || phase === "playing"}
        >
          {phase === "playing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {/* HIT + STAND row */}
              <div style={{ display: "flex", gap: 10 }}>
                <ActionBtn
                  onClick={() => action("hit")}
                  disabled={loading}
                  label="HIT"
                  gradient="linear-gradient(145deg, #00ff88 0%, #00d070 45%, #00924f 100%)"
                  shadow="0 6px 0 #005a2e, 0 0 22px rgba(0,255,136,0.38)"
                  width="50%"
                />
                <ActionBtn
                  onClick={() => action("stand")}
                  disabled={loading}
                  label="STAND"
                  gradient="linear-gradient(145deg, #ff5252 0%, #e53935 50%, #b71c1c 100%)"
                  shadow="0 6px 0 #7f0000, 0 0 20px rgba(255,82,82,0.32)"
                  shimmerDelay="0.4s"
                  width="50%"
                />
              </div>

              {/* DOUBLE DOWN */}
              <div style={{ position: "relative" }}>
                <ActionBtn
                  onClick={() => action("double")}
                  disabled={loading || playerHand.length > 2}
                  label="⚡ DOUBLE DOWN"
                  gradient="linear-gradient(135deg, #2979ff 0%, #651fff 50%, #d500f9 100%)"
                  shadow="0 5px 0 #1a00a0, 0 0 22px rgba(101,31,255,0.38)"
                  shimmerDelay="0.8s"
                  height={46}
                />
                {/* 2× badge */}
                {playerHand.length <= 2 && !loading && (
                  <div style={{
                    position: "absolute", top: -8, right: 10,
                    background: "linear-gradient(135deg, #ffd23f, #ff9800)",
                    color: "#000", fontSize: 10, fontWeight: 900,
                    padding: "2px 7px", borderRadius: 10,
                    fontFamily: "monospace", letterSpacing: 0.5,
                    boxShadow: "0 2px 8px rgba(255,210,63,0.5)",
                  }}>
                    2×
                  </div>
                )}
              </div>
            </div>
          )}
        </BetPanel>
      </div>
    </div>
  );
}

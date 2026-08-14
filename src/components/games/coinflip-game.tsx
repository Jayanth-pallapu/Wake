"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { useUiStore } from "@/store/ui";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Side   = "heads" | "tails";
type Phase  = "idle" | "flipping" | "result";

/* ─── Particle colours ──────────────────────────────────────────────────── */
const PARTICLE_COLORS = [
  "#FFD700","#FFA500","#00c2ff","#ffffff","#ffd23f",
  "#ff5cb1","#a855f7","#00ffaa","#FFD700","#00c2ff",
];

/* ─── Inline CSS (all @keyframes live here) ─────────────────────────────── */
const STYLES = `
  /* ── Coin spin ── */
  @keyframes coinFlip {
    0%   { transform: perspective(700px) translateY(0px)   rotateY(0deg)    scaleY(1);   }
    15%  { transform: perspective(700px) translateY(-55px) rotateY(360deg)  scaleY(1.05);}
    50%  { transform: perspective(700px) translateY(-70px) rotateY(1080deg) scaleY(1);   }
    85%  { transform: perspective(700px) translateY(-20px) rotateY(1620deg) scaleY(0.92);}
    93%  { transform: perspective(700px) translateY(2px)   rotateY(1750deg) scaleY(1.04);}
    100% { transform: perspective(700px) translateY(0px)   rotateY(1800deg) scaleY(1);   }
  }
  @keyframes coinLandHeads {
    0%   { transform: perspective(700px) rotateY(1800deg) scaleY(1);   }
    40%  { transform: perspective(700px) rotateY(1800deg) scaleY(0.88);}
    70%  { transform: perspective(700px) rotateY(1800deg) scaleY(1.06);}
    100% { transform: perspective(700px) rotateY(1800deg) scaleY(1);   }
  }
  @keyframes coinLandTails {
    0%   { transform: perspective(700px) rotateY(1980deg) scaleY(1);   }
    40%  { transform: perspective(700px) rotateY(1980deg) scaleY(0.88);}
    70%  { transform: perspective(700px) rotateY(1980deg) scaleY(1.06);}
    100% { transform: perspective(700px) rotateY(1980deg) scaleY(1);   }
  }

  /* ── Shadow under coin ── */
  @keyframes shadowSpin {
    0%   { transform: scaleX(1);   opacity: 0.55; }
    40%  { transform: scaleX(0.3); opacity: 0.2;  }
    85%  { transform: scaleX(1);   opacity: 0.55; }
    100% { transform: scaleX(1);   opacity: 0.55; }
  }

  /* ── Win particle ── */
  @keyframes particleFly0  { 0%{transform:rotate(0deg)   translateY(0);opacity:1} 100%{transform:rotate(0deg)   translateY(-130px) translateX(30px);opacity:0}  }
  @keyframes particleFly1  { 0%{transform:rotate(18deg)  translateY(0);opacity:1} 100%{transform:rotate(18deg)  translateY(-140px) translateX(-20px);opacity:0} }
  @keyframes particleFly2  { 0%{transform:rotate(36deg)  translateY(0);opacity:1} 100%{transform:rotate(36deg)  translateY(-110px) translateX(50px);opacity:0}  }
  @keyframes particleFly3  { 0%{transform:rotate(54deg)  translateY(0);opacity:1} 100%{transform:rotate(54deg)  translateY(-90px)  translateX(-40px);opacity:0} }
  @keyframes particleFly4  { 0%{transform:rotate(72deg)  translateY(0);opacity:1} 100%{transform:rotate(72deg)  translateY(-150px) translateX(10px);opacity:0}  }
  @keyframes particleFly5  { 0%{transform:rotate(90deg)  translateY(0);opacity:1} 100%{transform:rotate(90deg)  translateY(-120px) translateX(-60px);opacity:0} }
  @keyframes particleFly6  { 0%{transform:rotate(108deg) translateY(0);opacity:1} 100%{transform:rotate(108deg) translateY(-100px) translateX(70px);opacity:0}  }
  @keyframes particleFly7  { 0%{transform:rotate(126deg) translateY(0);opacity:1} 100%{transform:rotate(126deg) translateY(-135px) translateX(-30px);opacity:0} }
  @keyframes particleFly8  { 0%{transform:rotate(144deg) translateY(0);opacity:1} 100%{transform:rotate(144deg) translateY(-80px)  translateX(55px);opacity:0}  }
  @keyframes particleFly9  { 0%{transform:rotate(162deg) translateY(0);opacity:1} 100%{transform:rotate(162deg) translateY(-145px) translateX(-15px);opacity:0} }
  @keyframes particleFly10 { 0%{transform:rotate(180deg) translateY(0);opacity:1} 100%{transform:rotate(180deg) translateY(-125px) translateX(45px);opacity:0}  }
  @keyframes particleFly11 { 0%{transform:rotate(198deg) translateY(0);opacity:1} 100%{transform:rotate(198deg) translateY(-95px)  translateX(-50px);opacity:0} }
  @keyframes particleFly12 { 0%{transform:rotate(216deg) translateY(0);opacity:1} 100%{transform:rotate(216deg) translateY(-155px) translateX(25px);opacity:0}  }
  @keyframes particleFly13 { 0%{transform:rotate(234deg) translateY(0);opacity:1} 100%{transform:rotate(234deg) translateY(-110px) translateX(-65px);opacity:0} }
  @keyframes particleFly14 { 0%{transform:rotate(252deg) translateY(0);opacity:1} 100%{transform:rotate(252deg) translateY(-130px) translateX(60px);opacity:0}  }
  @keyframes particleFly15 { 0%{transform:rotate(270deg) translateY(0);opacity:1} 100%{transform:rotate(270deg) translateY(-100px) translateX(-35px);opacity:0} }
  @keyframes particleFly16 { 0%{transform:rotate(288deg) translateY(0);opacity:1} 100%{transform:rotate(288deg) translateY(-145px) translateX(15px);opacity:0}  }
  @keyframes particleFly17 { 0%{transform:rotate(306deg) translateY(0);opacity:1} 100%{transform:rotate(306deg) translateY(-120px) translateX(-55px);opacity:0} }
  @keyframes particleFly18 { 0%{transform:rotate(324deg) translateY(0);opacity:1} 100%{transform:rotate(324deg) translateY(-85px)  translateX(40px);opacity:0}  }
  @keyframes particleFly19 { 0%{transform:rotate(342deg) translateY(0);opacity:1} 100%{transform:rotate(342deg) translateY(-140px) translateX(-25px);opacity:0} }

  /* ── Win pulse rings ── */
  @keyframes pulseRing {
    0%   { transform: scale(0.6); opacity: 0.9; }
    100% { transform: scale(2.8); opacity: 0;   }
  }

  /* ── Arena lose shake ── */
  @keyframes arenaShake {
    0%,100% { transform: translateX(0);  }
    15%     { transform: translateX(-9px);}
    35%     { transform: translateX(9px); }
    55%     { transform: translateX(-7px);}
    75%     { transform: translateX(7px); }
    90%     { transform: translateX(-3px);}
  }

  /* ── Streak flame ── */
  @keyframes flamePulse {
    0%,100% { transform: scale(1);    }
    50%     { transform: scale(1.25); }
  }

  /* ── Confetti ── */
  @keyframes confetti0  { 0%{transform:translateY(-20px) rotate(0deg);opacity:1}   100%{transform:translateY(220px) rotate(520deg);opacity:0}  }
  @keyframes confetti1  { 0%{transform:translateY(-20px) rotate(0deg);opacity:1}   100%{transform:translateY(200px) rotate(-430deg);opacity:0} }
  @keyframes confetti2  { 0%{transform:translateY(-20px) rotate(0deg);opacity:1}   100%{transform:translateY(240px) rotate(600deg);opacity:0}  }
  @keyframes confetti3  { 0%{transform:translateY(-20px) rotate(0deg);opacity:1}   100%{transform:translateY(190px) rotate(-550deg);opacity:0} }
  @keyframes confetti4  { 0%{transform:translateY(-20px) rotate(0deg);opacity:1}   100%{transform:translateY(230px) rotate(480deg);opacity:0}  }
  @keyframes confetti5  { 0%{transform:translateY(-20px) rotate(0deg);opacity:1}   100%{transform:translateY(210px) rotate(-500deg);opacity:0} }
  @keyframes confetti6  { 0%{transform:translateY(-20px) rotate(0deg);opacity:1}   100%{transform:translateY(250px) rotate(420deg);opacity:0}  }
  @keyframes confetti7  { 0%{transform:translateY(-20px) rotate(0deg);opacity:1}   100%{transform:translateY(195px) rotate(-470deg);opacity:0} }

  /* ── Coin idle float ── */
  @keyframes coinFloat {
    0%,100% { transform: perspective(700px) translateY(0px)  rotateY(15deg);  }
    50%     { transform: perspective(700px) translateY(-8px) rotateY(-15deg); }
  }

  /* ── Spotlight ── */
  @keyframes spotlightPulse {
    0%,100% { opacity: 0.18; }
    50%     { opacity: 0.35; }
  }
`;

/* ─── 3D Coin ────────────────────────────────────────────────────────────── */
function Coin3D({ phase, result }: { phase: Phase; result: Side | null }) {
  const animStyle = (): React.CSSProperties => {
    if (phase === "flipping") return { animation: "coinFlip 1.6s cubic-bezier(.4,0,.2,1) forwards" };
    if (phase === "result" && result === "heads") return { animation: "coinLandHeads 0.45s ease-out forwards" };
    if (phase === "result" && result === "tails") return { animation: "coinLandTails 0.45s ease-out forwards" };
    return { animation: "coinFloat 3s ease-in-out infinite" };
  };

  return (
    <div style={{ position: "relative", width: 160, height: 160 }}>
      {/* Coin body */}
      <div
        style={{
          width: 160, height: 160,
          position: "relative",
          transformStyle: "preserve-3d",
          ...animStyle(),
        }}
      >
        {/* HEADS face */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          backfaceVisibility: "hidden",
          background: "radial-gradient(circle at 35% 35%, #FFF176, #FFD700 40%, #B8860B 80%, #8B6914)",
          boxShadow: "inset -6px -6px 18px rgba(0,0,0,0.35), inset 4px 4px 12px rgba(255,255,200,0.5), 0 0 40px rgba(255,215,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* Rim ring */}
          <div style={{
            position: "absolute", inset: 7, borderRadius: "50%",
            border: "3px solid rgba(184,134,11,0.7)",
          }} />
          {/* Crown SVG */}
          <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
            <path d="M10 48 L10 28 L22 38 L35 18 L48 38 L60 28 L60 48 Z"
              fill="#8B6914" stroke="#FFD700" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="10" cy="28" r="4" fill="#FFD700"/>
            <circle cx="35" cy="18" r="4" fill="#FFD700"/>
            <circle cx="60" cy="28" r="4" fill="#FFD700"/>
          </svg>
          {/* Specular highlight */}
          <div style={{
            position: "absolute", top: 12, left: 18, width: 40, height: 24,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.45) 0%, transparent 70%)",
            pointerEvents: "none",
          }}/>
        </div>

        {/* TAILS face */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: "radial-gradient(circle at 35% 35%, #F5F5F5, #C0C0C0 45%, #808080 80%, #606060)",
          boxShadow: "inset -6px -6px 18px rgba(0,0,0,0.35), inset 4px 4px 12px rgba(255,255,255,0.4), 0 0 40px rgba(192,192,192,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            position: "absolute", inset: 7, borderRadius: "50%",
            border: "3px solid rgba(96,96,96,0.6)",
          }} />
          {/* Star SVG */}
          <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
            <path d="M35 10 L40 28 L60 28 L44 40 L50 58 L35 47 L20 58 L26 40 L10 28 L30 28 Z"
              fill="#505050" stroke="#C0C0C0" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
          <div style={{
            position: "absolute", top: 12, left: 18, width: 40, height: 24,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.4) 0%, transparent 70%)",
            pointerEvents: "none",
          }}/>
        </div>

        {/* Coin edge (visible mid-flip) */}
        <div style={{
          position: "absolute", inset: "0 0 0 75px",
          background: "linear-gradient(90deg, #8B6914, #5a4009)",
          transform: "rotateY(90deg) scaleX(12)",
          transformOrigin: "left center",
          borderRadius: "0 50% 50% 0",
          backfaceVisibility: "hidden",
        }}/>
      </div>

      {/* Shadow on ground */}
      <div style={{
        position: "absolute", bottom: -14, left: "50%",
        transform: "translateX(-50%)",
        width: 120, height: 14, borderRadius: "50%",
        background: "rgba(0,0,0,0.5)",
        filter: "blur(6px)",
        animation: phase === "flipping" ? "shadowSpin 1.6s cubic-bezier(.4,0,.2,1) forwards" : "none",
      }}/>
    </div>
  );
}

/* ─── Particle burst ─────────────────────────────────────────────────────── */
function ParticleBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
          height: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
          borderRadius: i % 2 === 0 ? "50%" : "2px",
          background: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
          animation: `particleFly${i} 0.9s ease-out forwards`,
          boxShadow: `0 0 6px ${PARTICLE_COLORS[i % PARTICLE_COLORS.length]}`,
        }}/>
      ))}
    </div>
  );
}

/* ─── Confetti rain ──────────────────────────────────────────────────────── */
function ConfettiRain({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = ["#FFD700","#00c2ff","#ff5cb1","#a855f7","#00ffaa","#ffd23f","#ff6b35","#ffffff"];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {pieces.map((color, i) => (
        <div key={i} style={{
          position: "absolute",
          top: 0,
          left: `${10 + i * 11}%`,
          width: 8, height: 12,
          borderRadius: 2,
          background: color,
          animation: `confetti${i} ${1.2 + i * 0.12}s ease-in ${i * 0.08}s forwards`,
        }}/>
      ))}
    </div>
  );
}

/* ─── Win pulse rings ────────────────────────────────────────────────────── */
function PulseRings({ active, color }: { active: boolean; color: string }) {
  if (!active) return null;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          position: "absolute",
          width: 160, height: 160,
          borderRadius: "50%",
          border: `3px solid ${color}`,
          animation: `pulseRing 1.1s ease-out ${i * 0.22}s forwards`,
          opacity: 0,
        }}/>
      ))}
    </div>
  );
}

/* ─── Pick Card ──────────────────────────────────────────────────────────── */
function PickCard({ side, selected, onClick, disabled }: {
  side: Side; selected: boolean; onClick: () => void; disabled: boolean;
}) {
  const isHeads = side === "heads";
  const activeGrad = isHeads
    ? "linear-gradient(135deg, #8B6914 0%, #FFD700 50%, #B8860B 100%)"
    : "linear-gradient(135deg, #505050 0%, #C0C0C0 50%, #707070 100%)";
  const idleGrad = "linear-gradient(135deg, #1a2c38, #213743)";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, height: 88, borderRadius: 14, cursor: disabled ? "not-allowed" : "pointer",
        border: selected ? `2px solid ${isHeads ? "#FFD700" : "#C0C0C0"}` : "2px solid #2f4553",
        background: selected ? activeGrad : idleGrad,
        transform: selected ? "translateY(-4px)" : "translateY(0)",
        boxShadow: selected
          ? `0 8px 30px ${isHeads ? "rgba(255,215,0,0.45)" : "rgba(192,192,192,0.35)"}`
          : "none",
        transition: "all 0.2s ease",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        opacity: disabled ? 0.6 : 1,
        position: "relative", overflow: "hidden",
      }}
    >
      {selected && (
        <div style={{
          position: "absolute", top: 6, right: 8,
          fontSize: 12, color: isHeads ? "#8B6914" : "#505050",
          background: isHeads ? "#FFD700" : "#C0C0C0",
          borderRadius: "50%", width: 18, height: 18,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900,
        }}>✓</div>
      )}
      {/* Mini coin */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: isHeads
          ? "radial-gradient(circle at 35% 35%, #FFF176, #FFD700 50%, #B8860B)"
          : "radial-gradient(circle at 35% 35%, #F5F5F5, #C0C0C0 50%, #707070)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
        fontSize: 16, fontWeight: 900,
        color: isHeads ? "#8B6914" : "#505050",
      }}>
        {isHeads ? "♔" : "★"}
      </div>
      <span style={{
        fontSize: 13, fontWeight: 800,
        color: selected ? (isHeads ? "#8B6914" : "#404040") : "#ffffff",
      }}>
        {isHeads ? "HEADS" : "TAILS"}
      </span>
      <span style={{
        fontSize: 10,
        color: selected ? (isHeads ? "#6b4f0e" : "#505050") : "#b1bad3",
      }}>1.96× payout</span>
    </button>
  );
}

/* ─── Streak badge ───────────────────────────────────────────────────────── */
function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;
  const hot = streak >= 3;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      background: hot ? "linear-gradient(90deg,#7c2d12,#ea580c)" : "#1a2c38",
      border: `1px solid ${hot ? "#f97316" : "#2f4553"}`,
      borderRadius: 20, padding: "4px 12px",
      boxShadow: hot ? "0 0 16px rgba(249,115,22,0.5)" : "none",
    }}>
      <span style={{
        fontSize: 16,
        animation: hot ? "flamePulse 0.7s ease-in-out infinite" : "none",
        display: "inline-block",
      }}>🔥</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: hot ? "#fed7aa" : "#b1bad3" }}>
        {streak}× Win Streak!
      </span>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function CoinflipGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet]       = useBetAmount(1, "coinflip-bet");
  const [pick, setPick]     = useState<Side>("heads");
  const [phase, setPhase]   = useState<Phase>("idle");
  const [result, setResult] = useState<Side | null>(null);
  const [win, setWin]       = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const [showConfetti,  setShowConfetti]  = useState(false);
  const [showRings,     setShowRings]     = useState(false);
  const [shake,         setShake]         = useState(false);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);
  const pendingResult = useRef<{ result: Side; win: boolean } | null>(null);

  const handleBet = async () => {
    if (phase !== "idle" || playing) return;
    setPhase("flipping");
    setResult(null);
    setWin(null);
    setShowParticles(false);
    setShowConfetti(false);
    setShowRings(false);
    setShake(false);

    const res = await play("coinflip", { pick }, toRaw(bet));
    if (res) {
      pendingResult.current = {
        result: res.bet.outcome.result as Side,
        win: res.bet.win,
      };
    }
  };

  /* Resolve after animation finishes */
  useEffect(() => {
    if (phase !== "flipping") return;
    const t = setTimeout(() => {
      const pending = pendingResult.current;
      if (!pending) { setPhase("idle"); return; }
      setResult(pending.result);
      setWin(pending.win);
      setPhase("result");
      pendingResult.current = null;

      if (pending.win) {
        setStreak((s) => s + 1);
        setShowParticles(true);
        setShowRings(true);
        setTimeout(() => setShowConfetti(true), 100);
        setTimeout(() => { setShowParticles(false); setShowRings(false); setShowConfetti(false); }, 2000);
      } else {
        setStreak(0);
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
      onPlayed?.();

      // Auto-reset to idle after showing result
      setTimeout(() => setPhase("idle"), 3500);
    }, 1700);
    return () => clearTimeout(t);
  }, [phase]);

  const disabled = phase !== "idle" || playing;

  /* Arena glow based on state */
  const arenaGlow =
    phase === "flipping" ? "radial-gradient(ellipse at 50% 30%, rgba(0,194,255,0.12) 0%, transparent 65%)" :
    win === true  ? "radial-gradient(ellipse at 50% 50%, rgba(0,255,128,0.18) 0%, transparent 60%)" :
    win === false ? "radial-gradient(ellipse at 50% 50%, rgba(255,59,59,0.15) 0%, transparent 60%)" :
    "radial-gradient(ellipse at 50% 20%, rgba(255,215,0,0.07) 0%, transparent 60%)";

  const borderColor =
    win === true  ? "rgba(0,255,128,0.35)" :
    win === false ? "rgba(255,59,59,0.35)" :
    "rgba(47,69,83,0.8)";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <style>{STYLES}</style>

      {/* ── Arena ── */}
      <div
        style={{
          background: `radial-gradient(ellipse at 50% 60%, #0d1f2e 0%, #060f18 100%), ${arenaGlow}`,
          backgroundBlendMode: "screen",
          borderRadius: 16,
          border: `1.5px solid ${borderColor}`,
          minHeight: 440,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
          transition: "border-color 0.4s ease",
          animation: shake ? "arenaShake 0.55s ease-out" : "none",
        }}
      >
        {/* Ambient glow overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: arenaGlow,
          transition: "all 0.6s ease",
        }}/>

        {/* Spotlight beam (only while flipping) */}
        {phase === "flipping" && (
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: 200, height: "60%",
            background: "linear-gradient(180deg, rgba(0,194,255,0.14) 0%, transparent 100%)",
            clipPath: "polygon(35% 0%, 65% 0%, 90% 100%, 10% 100%)",
            animation: "spotlightPulse 0.5s ease-in-out infinite",
            pointerEvents: "none",
          }}/>
        )}

        {/* Loss red vignette */}
        {win === false && (
          <div style={{
            position: "absolute", inset: 0,
            boxShadow: "inset 0 0 80px rgba(255,59,59,0.35)",
            borderRadius: 16,
            pointerEvents: "none",
            transition: "opacity 0.5s",
          }}/>
        )}

        {/* Win border glow */}
        {win === true && (
          <div style={{
            position: "absolute", inset: 0,
            boxShadow: "inset 0 0 80px rgba(0,255,128,0.22)",
            borderRadius: 16,
            pointerEvents: "none",
          }}/>
        )}

        {/* Streak badge */}
        <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)" }}>
          <StreakBadge streak={streak} />
        </div>

        {/* Coin + effects */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 200, height: 200 }}>
          <ParticleBurst active={showParticles} />
          <PulseRings active={showRings} color={win === true ? "#00ff88" : "#00c2ff"} />
          <Coin3D phase={phase} result={result} />
        </div>

        {/* Confetti */}
        <ConfettiRain active={showConfetti} />

        {/* Result banner */}
        <AnimatePresence>
          {phase === "result" && result && win !== null && (
            <motion.div
              key="result-banner"
              initial={{ y: -30, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ textAlign: "center", marginTop: 24 }}
            >
              {win ? (
                <>
                  <div style={{
                    fontSize: 30, fontWeight: 900,
                    background: "linear-gradient(90deg, #FFD700, #00c2ff, #FFD700)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    letterSpacing: 2,
                    textShadow: "none",
                    filter: "drop-shadow(0 0 14px rgba(255,215,0,0.8))",
                    animation: "none",
                  }}>
                    🏆 YOU WIN!
                  </div>
                  <div style={{ fontSize: 14, color: "#00c2ff", fontWeight: 700, marginTop: 4 }}>
                    {result.toUpperCase()} — Payout 1.96×
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    fontSize: 28, fontWeight: 900, color: "#ff5c5c",
                    letterSpacing: 2,
                    filter: "drop-shadow(0 0 10px rgba(255,59,59,0.7))",
                  }}>
                    💀 YOU LOSE
                  </div>
                  <div style={{ fontSize: 13, color: "#b1bad3", fontWeight: 600, marginTop: 4 }}>
                    {result.toUpperCase()} — Better luck next time
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle prompt */}
        {phase === "idle" && !result && (
          <p style={{ color: "#b1bad3", fontSize: 13, marginTop: 24, letterSpacing: 1 }}>
            Pick a side and flip the coin
          </p>
        )}
      </div>

      {/* ── Bet Panel ── */}
      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={disabled} betLabel="Flip Coin">
          {/* Pick cards */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <PickCard side="heads" selected={pick === "heads"} onClick={() => setPick("heads")} disabled={disabled} />
            <PickCard side="tails" selected={pick === "tails"} onClick={() => setPick("tails")} disabled={disabled} />
          </div>

          {/* Payout info */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#0f212e", borderRadius: 8, padding: "8px 12px",
            border: "1px solid #2f4553",
          }}>
            <span style={{ color: "#b1bad3", fontSize: 12 }}>Payout</span>
            <span style={{ fontWeight: 800, color: "#ffffff", fontFamily: "monospace" }}>1.96×</span>
          </div>

          {/* Win chance */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#0f212e", borderRadius: 8, padding: "8px 12px",
            border: "1px solid #2f4553", marginTop: 6,
          }}>
            <span style={{ color: "#b1bad3", fontSize: 12 }}>Win Chance</span>
            <span style={{ fontWeight: 800, color: "#00c2ff", fontFamily: "monospace" }}>49.00%</span>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

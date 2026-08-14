"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard } from "./game-effects";

/* ═══════════════════════════════════════════════════════════════
   HILO PREMIUM COMPONENTS — colorful, 3D, addictive
═══════════════════════════════════════════════════════════════ */

/* ─── HiLo Arena Background ──────────────────────────────────── */
export function HiloBackground3D({ streak = 0 }: { streak?: number }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Nebula 1 — magenta */}
      <div style={{
        position: "absolute", top: "-15%", left: "-10%",
        width: "65%", height: "65%",
        background: "radial-gradient(ellipse, rgba(255,45,219,0.32) 0%, rgba(180,0,180,0.12) 50%, transparent 75%)",
        filter: "blur(60px)", borderRadius: "50%",
        animation: "hiloArenaBreath 5s ease-in-out infinite",
      }} />
      {/* Nebula 2 — violet */}
      <div style={{
        position: "absolute", bottom: "-10%", right: "-8%",
        width: "55%", height: "55%",
        background: "radial-gradient(ellipse, rgba(111,0,255,0.28) 0%, rgba(60,0,160,0.1) 55%, transparent 75%)",
        filter: "blur(65px)", borderRadius: "50%",
        animation: "hiloArenaBreath 7s ease-in-out 2s infinite",
      }} />
      {/* Nebula 3 — cyan */}
      <div style={{
        position: "absolute", top: "35%", right: "15%",
        width: "35%", height: "35%",
        background: "radial-gradient(ellipse, rgba(0,234,255,0.14) 0%, transparent 70%)",
        filter: "blur(45px)", borderRadius: "50%",
        animation: "hiloArenaBreath 9s ease-in-out 4s infinite",
      }} />
      {/* 3D grid floor */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
        backgroundImage: `
          linear-gradient(to right, rgba(255,45,219,0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(111,0,255,0.15) 1px, transparent 1px)
        `,
        backgroundSize: "44px 32px",
        transform: "perspective(320px) rotateX(58deg)",
        transformOrigin: "bottom center",
        opacity: 0.65,
        maskImage: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
      }} />
      {/* Horizon neon strip */}
      <div style={{
        position: "absolute", bottom: 0, left: "5%", right: "5%", height: "2px",
        background: "linear-gradient(90deg, transparent, rgba(255,45,219,0.8), rgba(111,0,255,0.8), transparent)",
        filter: "blur(3px)",
      }} />
      {/* Side light rays */}
      {([-30, 30] as number[]).map((deg, i) => (
        <div key={i} style={{
          position: "absolute", top: 0, left: "50%",
          transformOrigin: "top center",
          width: "2px", height: "55%",
          background: i === 0
            ? "linear-gradient(180deg, rgba(255,45,219,0.35) 0%, transparent 100%)"
            : "linear-gradient(180deg, rgba(111,0,255,0.35) 0%, transparent 100%)",
          transform: `rotate(${deg}deg)`,
          animation: "hiloArenaBreath 4s ease-in-out infinite",
          opacity: 0.5,
        }} />
      ))}
      {/* Crown — glows on streak */}
      {streak >= 3 && (
        <div style={{
          position: "absolute", top: 8, left: "50%",
          transform: "translateX(-50%)",
          fontSize: 22, animation: "hiloCrownGlow 1.5s ease-in-out infinite",
          userSelect: "none",
        }}>
          👑
        </div>
      )}
    </div>
  );
}

/* ─── HiLo Premium Card ──────────────────────────────────────── */
const HILO_SUIT_COLOR: Record<string, string> = {
  "♥": "#ff2ddb", "♦": "#ff6ef7", "♠": "#6f00ff", "♣": "#a855f7",
};
const HILO_SUIT_GLOW: Record<string, string> = {
  "♥": "rgba(255,45,219,0.8)", "♦": "rgba(255,110,247,0.7)",
  "♠": "rgba(111,0,255,0.8)",  "♣": "rgba(168,85,247,0.7)",
};

export function HiloPremiumCard3D({
  card, faceDown = false, lifted = false,
  shaking = false, crumbling = false, delay = 0,
}: {
  card?: PlayingCard;
  faceDown?: boolean;
  lifted?: boolean;
  shaking?: boolean;
  crumbling?: boolean;
  delay?: number;
}) {
  const suitColor = card ? HILO_SUIT_COLOR[card.suit] : "#6f00ff";
  const suitGlow  = card ? HILO_SUIT_GLOW[card.suit]  : "rgba(111,0,255,0.5)";

  const extraAnim = crumbling
    ? "hiloCardCrumble 0.7s cubic-bezier(0.55,0,1,0.45) forwards"
    : shaking
    ? "hiloCardShakeRed 0.55s ease-out"
    : undefined;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0, rotateY: -90, scale: 0.7 }}
      animate={{ y: lifted ? -16 : 0, opacity: 1, rotateY: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay }}
      style={{
        width: 96, height: 136, borderRadius: 12,
        position: "relative", flexShrink: 0,
        cursor: "default", transformStyle: "preserve-3d",
        animation: extraAnim,
        boxShadow: lifted
          ? `0 20px 50px rgba(0,0,0,0.8), 0 0 30px ${suitGlow}, 0 0 60px rgba(255,215,0,0.3)`
          : shaking
          ? `0 0 25px rgba(255,40,40,0.8), 0 6px 20px rgba(0,0,0,0.6)`
          : `0 8px 24px rgba(0,0,0,0.7), 0 0 16px ${suitGlow}44`,
        transition: "box-shadow 0.4s ease",
      }}
    >
      {faceDown ? (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 12,
          background: "linear-gradient(135deg, #2a0050 0%, #0d0028 50%, #2a0050 100%)",
          border: "1.5px solid rgba(111,0,255,0.5)", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 5, borderRadius: 8,
            background: "repeating-linear-gradient(45deg, rgba(255,45,219,0.15), rgba(255,45,219,0.15) 5px, rgba(111,0,255,0.15) 5px, rgba(111,0,255,0.15) 10px)",
          }} />
          <div style={{
            position: "absolute", inset: 0, borderRadius: 12,
            background: "radial-gradient(ellipse at 50% 30%, rgba(255,45,219,0.18) 0%, transparent 65%)",
          }} />
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            fontSize: 28, opacity: 0.2, color: "#ff2ddb", userSelect: "none",
          }}>♦</div>
        </div>
      ) : card ? (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 12,
          background: "linear-gradient(160deg, #ffffff 0%, #f0eaff 60%, #f8f0ff 100%)",
          border: `1.5px solid ${suitColor}44`, overflow: "hidden",
        }}>
          {/* Holographic shimmer */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 12, pointerEvents: "none",
            background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.5) 40%, rgba(200,150,255,0.3) 60%, transparent 100%)",
            backgroundSize: "300% 100%",
            animation: "hiloSuitShimmer 3s linear infinite",
          }} />
          {/* Top-left pip */}
          <div style={{
            position: "absolute", top: 6, left: 8,
            fontSize: 15, fontWeight: 900, color: suitColor, lineHeight: 1,
            textShadow: `0 0 8px ${suitGlow}`,
            animation: "hiloPipGlow 2s ease-in-out infinite",
          }}>
            <div>{card.rank}</div>
            <div>{card.suit}</div>
          </div>
          {/* Center suit */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            fontSize: 42, color: suitColor, userSelect: "none",
            textShadow: `0 0 12px ${suitGlow}, 0 0 28px ${suitGlow}88`,
            animation: "hiloPipGlow 2s ease-in-out infinite",
          }}>
            {card.suit}
          </div>
          {/* Bottom-right pip */}
          <div style={{
            position: "absolute", bottom: 6, right: 8, transform: "rotate(180deg)",
            fontSize: 15, fontWeight: 900, color: suitColor, lineHeight: 1,
            textShadow: `0 0 8px ${suitGlow}`,
            animation: "hiloPipGlow 2s ease-in-out infinite",
          }}>
            <div>{card.rank}</div>
            <div>{card.suit}</div>
          </div>
          {/* Specular gloss */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 55,
            borderRadius: "12px 12px 0 0", pointerEvents: "none",
            background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 100%)",
          }} />
          {/* Bottom color bleed */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 30,
            borderRadius: "0 0 12px 12px", pointerEvents: "none",
            background: `linear-gradient(0deg, ${suitColor}22 0%, transparent 100%)`,
          }} />
        </div>
      ) : null}
    </motion.div>
  );
}

/* ─── HiLo Slow Reveal (cinematic win/lose sequence) ─────────── */
export function HiloSlowReveal({
  active, win, action, prevMultiplier = 1, newMultiplier = 1,
}: {
  active: boolean;
  win: boolean | null;
  action?: "higher" | "lower" | null;
  prevMultiplier?: number;
  newMultiplier?: number;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    // win: 5 steps; lose: 4 steps
    const timings = win
      ? [100, 400, 700, 900, 1300]
      : [100, 300, 600, 900];
    const timers = timings.map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [active, win]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="hilo-reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute", inset: 0, zIndex: 50,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {/* ── WIN ── */}
          {win === true && (
            <>
              {/* White flash */}
              {step >= 1 && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(255,255,255,0.82)",
                  animation: "hiloFlashWhite 0.3s ease-out forwards",
                  borderRadius: 16, pointerEvents: "none",
                }} />
              )}
              {/* Light rays */}
              {step >= 2 && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                  {[0, 45, 90, 135].map((deg, i) => (
                    <div key={i} style={{
                      position: "absolute", top: "50%", left: "50%",
                      width: 3, height: "70%", transformOrigin: "top center",
                      background: "linear-gradient(180deg, rgba(255,215,0,0.7) 0%, transparent 100%)",
                      transform: `rotate(${deg}deg) translateX(-50%)`,
                      animation: `hiloWinRay 1.2s ease-out ${i * 0.12}s forwards`,
                    }} />
                  ))}
                </div>
              )}
              {/* Shock ring */}
              {step >= 2 && (
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  borderRadius: "50%", border: "3px solid rgba(255,215,0,0.9)",
                  animation: "hiloShockRing 1s ease-out forwards",
                  pointerEvents: "none",
                }} />
              )}
              {/* Action label */}
              {step >= 2 && action && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.7 }}
                  animate={{ opacity: 1, y: -80, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  style={{
                    position: "absolute",
                    fontSize: 20, fontWeight: 900,
                    fontFamily: "'Orbitron', monospace", letterSpacing: 3,
                    color: "#ffd700",
                    textShadow: "0 0 18px rgba(255,215,0,0.9), 0 0 40px rgba(255,215,0,0.5)",
                    padding: "6px 20px",
                    background: "rgba(0,0,0,0.55)", borderRadius: 12,
                    border: "1.5px solid rgba(255,215,0,0.4)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  ✓ {action === "higher" ? "⬆ HIGHER!" : "⬇ LOWER!"}
                </motion.div>
              )}
              {/* Multiplier roll */}
              {step >= 4 && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  style={{
                    position: "absolute", top: 20,
                    fontSize: 17, fontWeight: 900, fontFamily: "'Orbitron', monospace",
                    color: "#ffd700", textShadow: "0 0 16px rgba(255,215,0,0.9)",
                    padding: "4px 14px", background: "rgba(0,0,0,0.6)",
                    borderRadius: 10, border: "1.5px solid rgba(255,215,0,0.5)",
                    animation: "hiloMultFlash 0.6s ease-out",
                  }}
                >
                  {prevMultiplier.toFixed(2)}× → {newMultiplier.toFixed(2)}×
                </motion.div>
              )}
              {/* Win banner */}
              {step >= 5 && (
                <motion.div
                  initial={{ y: 30, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  style={{ position: "absolute", bottom: 40, textAlign: "center" }}
                >
                  <div style={{
                    fontSize: 30, fontWeight: 900, letterSpacing: 4,
                    fontFamily: "'Orbitron', monospace",
                    background: "linear-gradient(90deg,#ffd700,#ff2ddb,#00eaff,#ffd700)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 18px rgba(255,215,0,0.8))",
                  }}>
                    🏆 YOU WIN!
                  </div>
                  <div style={{ fontSize: 14, color: "#00eaff", fontWeight: 700, marginTop: 4 }}>
                    {newMultiplier.toFixed(2)}× multiplier
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* ── LOSE ── */}
          {win === false && (
            <>
              {/* Red vignette */}
              {step >= 1 && (
                <div style={{
                  position: "absolute", inset: 0,
                  boxShadow: "inset 0 0 120px rgba(255,40,40,0.85)",
                  borderRadius: 16,
                  animation: "hiloRedVig 0.9s ease-out forwards",
                  pointerEvents: "none",
                }} />
              )}
              {/* Shock ring */}
              {step >= 2 && (
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  borderRadius: "50%", border: "3px solid rgba(255,40,40,0.9)",
                  animation: "hiloShockRing 0.8s ease-out forwards",
                  pointerEvents: "none",
                }} />
              )}
              {/* Bust label */}
              {step >= 3 && (
                <motion.div
                  initial={{ y: -30, opacity: 0, scale: 1.3 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  style={{
                    position: "absolute",
                    fontSize: 20, fontWeight: 900,
                    fontFamily: "'Orbitron', monospace",
                    letterSpacing: 4, color: "#ff4040",
                    textShadow: "0 0 18px rgba(255,40,40,0.9), 0 0 40px rgba(255,40,40,0.5)",
                    padding: "6px 20px", background: "rgba(0,0,0,0.6)",
                    borderRadius: 12, border: "1.5px solid rgba(255,40,40,0.4)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  ✗ {action === "higher" ? "⬆ NOT HIGHER" : action === "lower" ? "⬇ NOT LOWER" : "BUST!"}
                </motion.div>
              )}
              {/* Lose banner */}
              {step >= 4 && (
                <motion.div
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  style={{ position: "absolute", bottom: 40, textAlign: "center" }}
                >
                  <div style={{
                    fontSize: 30, fontWeight: 900, color: "#ff4040",
                    fontFamily: "'Orbitron', monospace", letterSpacing: 3,
                    filter: "drop-shadow(0 0 14px rgba(255,40,40,0.8))",
                  }}>
                    💀 YOU LOSE
                  </div>
                  <div style={{ fontSize: 12, color: "#b1bad3", fontWeight: 600, marginTop: 4 }}>
                    Better luck next time...
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

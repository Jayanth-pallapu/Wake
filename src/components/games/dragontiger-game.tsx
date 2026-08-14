"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { useUiStore } from "@/store/ui";
import {
  GameArena, GameStyles, ConfettiRain, StreakBadge, GAME_THEMES,
  DragonTigerBackground3D, Card3DFlip, CardCompareBar,
  DragonTigerSlowWin, DragonTigerSlowLose, DragonTigerTieBurst,
} from "./game-effects";
import {
  soundPokerShuffle, soundPokerCardDeal,
} from "@/hooks/use-sound";

function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("agy_sound_enabled");
  return v === null ? true : v === "true";
}

type Selection = "dragon" | "tie" | "tiger";
type CardInfo = { rank: string; suit: "♠" | "♥" | "♦" | "♣" };

const BETS = [
  {
    id: "dragon" as Selection,
    label: "DRAGON",
    emoji: "🐉",
    mult: "1.95×",
    color: "#ff4400",
    glow: "rgba(255,68,0,0.35)",
    activeGlow: "0 0 22px rgba(255,68,0,0.5), inset 0 0 12px rgba(255,68,0,0.1)",
    activeBg: "linear-gradient(135deg, rgba(255,68,0,0.18) 0%, rgba(200,20,0,0.08) 100%)",
    activeBorder: "rgba(255,100,0,0.65)",
  },
  {
    id: "tie" as Selection,
    label: "TIE",
    emoji: "⚖️",
    mult: "8×",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.35)",
    activeGlow: "0 0 22px rgba(168,85,247,0.5), inset 0 0 12px rgba(168,85,247,0.1)",
    activeBg: "linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(100,30,200,0.08) 100%)",
    activeBorder: "rgba(168,85,247,0.65)",
  },
  {
    id: "tiger" as Selection,
    label: "TIGER",
    emoji: "🐅",
    mult: "1.95×",
    color: "#0099ff",
    glow: "rgba(0,153,255,0.35)",
    activeGlow: "0 0 22px rgba(0,153,255,0.5), inset 0 0 12px rgba(0,153,255,0.1)",
    activeBg: "linear-gradient(135deg, rgba(0,153,255,0.18) 0%, rgba(0,60,200,0.08) 100%)",
    activeBorder: "rgba(0,153,255,0.65)",
  },
];

export function DragontigerGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "dragontiger-bet");
  const [selection, setSelection] = useState<Selection>("dragon");
  const [playing, setPlaying] = useState(false);
  const [dragonCard, setDragonCard] = useState<CardInfo | null>(null);
  const [tigerCard, setTigerCard]   = useState<CardInfo | null>(null);
  const [winner, setWinner]         = useState<Selection | null>(null);
  const [streak, setStreak]         = useState(0);
  const [showWin, setShowWin]       = useState(false);
  const [showLose, setShowLose]     = useState(false);
  const [profit, setProfit]         = useState(0);
  const [animDeal, setAnimDeal]     = useState(false);

  const activeAsset = useUiStore((s) => s.activeAsset);
  const { play } = useGame();

  const didWin   = winner !== null && (winner === selection || (winner === "tie" && selection === "tie"));
  const lastWin  = winner !== null ? didWin : null;
  const isTie    = winner === "tie";

  const handleBet = async () => {
    if (playing) return;
    setPlaying(true);
    setDragonCard(null);
    setTigerCard(null);
    setWinner(null);
    setShowWin(false);
    setShowLose(false);
    setAnimDeal(false);
    setProfit(0);

    if (isSoundEnabled()) soundPokerShuffle();

    const res = await play("dragontiger", { bet: selection }, toRaw(bet));
    if (res) {
      // Staggered reveal: dragon first, then tiger
      setTimeout(() => {
        setAnimDeal(true);
        if (isSoundEnabled()) soundPokerCardDeal(0);
        setDragonCard(res.bet.outcome.dragonCard as CardInfo);
      }, 400);

      setTimeout(() => {
        if (isSoundEnabled()) soundPokerCardDeal(3);
        setTigerCard(res.bet.outcome.tigerCard as CardInfo);
      }, 880);

      setTimeout(() => {
        const w = res.bet.outcome.winner as Selection;
        setWinner(w);
        const won = w === selection || (w === "tie" && selection === "tie");
        const p = res.bet.payout - Number(toRaw(bet)) / 1e8;

        if (won) {
          setStreak((s) => s + 1);
          setProfit(p);
          setTimeout(() => setShowWin(true), 350);
        } else {
          setStreak(0);
          setTimeout(() => setShowLose(true), 350);
        }
        setPlaying(false);
        onPlayed?.();
      }, 1500);
    } else {
      setPlaying(false);
    }
  };

  const selectedBet = BETS.find((b) => b.id === selection)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameStyles />
      <GameArena
        gameId="dragontiger" win={lastWin} shake={lastWin === false}
        className="flex flex-col min-h-[460px] p-0 relative overflow-hidden"
      >
        {/* Animated 3D arena background */}
        <DragonTigerBackground3D />

        {/* Streak */}
        <div style={{ position: "absolute", top: 14, left: 14, zIndex: 30 }}>
          <StreakBadge streak={streak} />
        </div>

        {/* Odds display */}
        {winner === null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: "absolute", top: 14, right: 14, zIndex: 30,
              fontSize: 10, fontFamily: "monospace", fontWeight: 700, letterSpacing: 2,
              color: "#ffd23f", textShadow: "0 0 8px rgba(255,210,63,0.6)",
              background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)",
              padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(255,210,63,0.2)",
            }}
          >
            {selectedBet.emoji} {selectedBet.label} {selectedBet.mult}
          </motion.div>
        )}

        {/* Main arena — two sides + VS badge */}
        <div style={{ flex: 1, display: "flex", position: "relative", zIndex: 10 }}>

          {/* ── Dragon Side ─────────────────────────────────── */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
            borderRight: "1px solid rgba(255,80,0,0.18)",
          }}>
            {/* Dragon win spotlight */}
            {winner === "dragon" && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                  position: "absolute", inset: 0,
                  background: "radial-gradient(ellipse at 50% 60%, rgba(255,80,0,0.28) 0%, transparent 70%)",
                  animation: "gfxFlame 3s ease-in-out infinite",
                }}
              />
            )}

            {/* Dragon emoji + label */}
            <motion.div
              animate={winner === "dragon" ? { scale: [1, 1.12, 1], y: [0, -6, 0] } : {}}
              transition={{ duration: 1.4, repeat: winner === "dragon" ? Infinity : 0 }}
              style={{ textAlign: "center", marginBottom: 20, zIndex: 10 }}
            >
              <div style={{
                fontSize: 54,
                filter: winner === "dragon"
                  ? "drop-shadow(0 0 18px rgba(255,100,0,0.9)) drop-shadow(0 0 35px rgba(255,60,0,0.5))"
                  : winner === "tiger" ? "grayscale(0.5) opacity(0.6)" : "none",
                transition: "filter 0.6s ease",
              }}>🐉</div>
              <div style={{
                fontSize: 16, fontWeight: 900, letterSpacing: 4,
                fontFamily: "monospace",
                color: winner === "dragon" ? "#ff4400" : winner === "tiger" ? "#4a2a20" : "#ff6600",
                textShadow: winner === "dragon" ? "0 0 18px rgba(255,68,0,0.85)" : "none",
                transition: "all 0.6s ease",
              }}>DRAGON</div>
            </motion.div>

            {/* Dragon card */}
            <div style={{ zIndex: 10, transform: "scale(1.15)" }}>
              <Card3DFlip
                card={dragonCard || undefined}
                faceDown={!dragonCard}
                lifted={winner === "dragon"}
                winner={winner === "dragon"}
                loser={winner !== null && winner !== "dragon"}
                delay={0}
              />
            </div>

            {/* Win particles on dragon side */}
            {winner === "dragon" && animDeal && (
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                {["#ff4400","#ff6600","#ffd23f","#ff2200"].map((c, i) => (
                  <div key={i} style={{
                    position: "absolute", top: "30%", left: (15 + i * 18) + "%",
                    width: 7, height: 10, borderRadius: "50%", background: c,
                    boxShadow: "0 0 8px " + c,
                    animation: "gfxParticle" + (i % 20) + " 1.4s ease-out " + (i * 0.12) + "s forwards",
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* ── VS Badge (center) ────────────────────────────── */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%)", zIndex: 20,
          }}>
            <motion.div
              animate={playing ? { rotate: 360, scale: [1, 1.1, 1] } : winner !== null ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: playing ? 2 : 0.5, repeat: playing ? Infinity : 0, ease: "linear" }}
              style={{
                width: 66, height: 66, borderRadius: "50%",
                background: "linear-gradient(135deg, #ffd23f 0%, #d97706 55%, #ffd23f 100%)",
                border: "3.5px solid rgba(20,8,10,0.9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 28px rgba(255,210,63,0.6), 0 0 55px rgba(255,210,63,0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 900, color: "#14080a", fontStyle: "italic", fontFamily: "monospace" }}>
                VS
              </span>
            </motion.div>
          </div>

          {/* ── Tiger Side ──────────────────────────────────── */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
            borderLeft: "1px solid rgba(0,100,255,0.18)",
          }}>
            {/* Tiger win spotlight */}
            {winner === "tiger" && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{
                  position: "absolute", inset: 0,
                  background: "radial-gradient(ellipse at 50% 60%, rgba(0,120,255,0.28) 0%, transparent 70%)",
                  animation: "gfxPulse 3s ease-in-out infinite",
                }}
              />
            )}

            {/* Tiger emoji + label */}
            <motion.div
              animate={winner === "tiger" ? { scale: [1, 1.12, 1], y: [0, -6, 0] } : {}}
              transition={{ duration: 1.4, repeat: winner === "tiger" ? Infinity : 0 }}
              style={{ textAlign: "center", marginBottom: 20, zIndex: 10 }}
            >
              <div style={{
                fontSize: 54,
                filter: winner === "tiger"
                  ? "drop-shadow(0 0 18px rgba(0,153,255,0.9)) drop-shadow(0 0 35px rgba(0,100,255,0.5))"
                  : winner === "dragon" ? "grayscale(0.5) opacity(0.6)" : "none",
                transition: "filter 0.6s ease",
              }}>🐅</div>
              <div style={{
                fontSize: 16, fontWeight: 900, letterSpacing: 4,
                fontFamily: "monospace",
                color: winner === "tiger" ? "#0099ff" : winner === "dragon" ? "#1a2a3a" : "#0099ff",
                textShadow: winner === "tiger" ? "0 0 18px rgba(0,153,255,0.85)" : "none",
                transition: "all 0.6s ease",
              }}>TIGER</div>
            </motion.div>

            {/* Tiger card */}
            <div style={{ zIndex: 10, transform: "scale(1.15)" }}>
              <Card3DFlip
                card={tigerCard || undefined}
                faceDown={!tigerCard}
                lifted={winner === "tiger"}
                winner={winner === "tiger"}
                loser={winner !== null && winner !== "tiger"}
                delay={0.12}
              />
            </div>

            {/* Win particles on tiger side */}
            {winner === "tiger" && animDeal && (
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                {["#0099ff","#00d4ff","#ffd23f","#0066ff"].map((c, i) => (
                  <div key={i} style={{
                    position: "absolute", top: "30%", left: (15 + i * 18) + "%",
                    width: 7, height: 10, borderRadius: "50%", background: c,
                    boxShadow: "0 0 8px " + c,
                    animation: "gfxParticle" + (i % 20) + " 1.4s ease-out " + (i * 0.12) + "s forwards",
                  }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card compare bar */}
        <CardCompareBar dragonCard={dragonCard} tigerCard={tigerCard} winner={winner} />

        {/* Tie burst overlay */}
        <DragonTigerTieBurst active={isTie && winner !== null} />

        {/* Win / Lose cinematic overlays */}
        <DragonTigerSlowWin
          active={showWin}
          winner={winner}
          profit={profit}
          asset={activeAsset}
        />
        <DragonTigerSlowLose active={showLose} winner={winner} />
        <ConfettiRain active={didWin && showWin} colors={GAME_THEMES.dragontiger.particleColors} />
      </GameArena>

      {/* ── Right Panel ─────────────────────────────────────── */}
      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={playing} betLabel="Place Bet">
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
            {BETS.map((b) => {
              const isSelected = selection === b.id;
              const isTieBet   = b.id === "tie";
              return (
                <button
                  key={b.id}
                  onClick={() => !playing && setSelection(b.id)}
                  disabled={playing}
                  style={{
                    height: isTieBet ? 44 : 56,
                    borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0 16px",
                    background: isSelected ? b.activeBg : "rgba(255,255,255,0.03)",
                    border: "1px solid " + (isSelected ? b.activeBorder : "rgba(255,255,255,0.08)"),
                    boxShadow: isSelected ? b.activeGlow : "none",
                    cursor: playing ? "not-allowed" : "pointer",
                    opacity: playing ? 0.55 : 1,
                    transition: "all 0.25s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: isTieBet ? 18 : 22 }}>{b.emoji}</span>
                    <span style={{
                      fontSize: isTieBet ? 11 : 13, fontWeight: 900,
                      fontFamily: "monospace", letterSpacing: 2,
                      color: isSelected ? b.color : "#6b7a8a",
                      textShadow: isSelected ? "0 0 10px " + b.glow : "none",
                      transition: "all 0.25s",
                    }}>
                      {b.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: isTieBet ? 12 : 14, fontWeight: 900, fontFamily: "monospace",
                    color: isSelected ? b.color : "#3a4d5c",
                    textShadow: isSelected ? "0 0 8px " + b.glow : "none",
                    transition: "all 0.25s",
                  }}>
                    {b.mult}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Info card */}
          <div style={{
            padding: "10px 12px", borderRadius: 9,
            background: "rgba(255,210,63,0.05)",
            border: "1px solid rgba(255,210,63,0.12)",
            fontSize: 11, fontFamily: "monospace",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#6b7a8a" }}>Your pick</span>
              <span style={{ color: selectedBet.color, fontWeight: 700,
                textShadow: "0 0 8px " + selectedBet.glow }}>
                {selectedBet.emoji} {selectedBet.label}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6b7a8a" }}>Max payout</span>
              <span style={{ color: "#ffd23f", fontWeight: 700, textShadow: "0 0 8px rgba(255,210,63,0.5)" }}>
                {selectedBet.mult}
              </span>
            </div>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

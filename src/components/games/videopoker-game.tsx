"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useUiStore } from "@/store/ui";
import { useWalletStore } from "@/store/wallet";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import {
  GameArena, GameStyles, Card3D, ConfettiRain,
  StreakBadge, GAME_THEMES,
  PokerSlowWinReveal, PokerSlowLoseReveal,
} from "./game-effects";
import {
  soundPokerShuffle, soundPokerCardDeal, soundPokerHoldToggle, soundPokerDraw,
  soundPokerWinJacks, soundPokerWinMedium, soundPokerWinBig, soundPokerWinRoyal,
  soundPokerLose,
} from "@/hooks/use-sound";

function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("agy_sound_enabled");
  return v === null ? true : v === "true";
}

type Phase = "idle" | "deal" | "hold" | "won" | "lost";
type CardInfo = { rank: string; suit: "♠" | "♥" | "♦" | "♣" };

const PAYTABLE = [
  { name: "Royal Flush",     mult: 800, color: "#ffd23f" },
  { name: "Straight Flush",  mult: 50,  color: "#a855f7" },
  { name: "Four of a Kind",  mult: 25,  color: "#00c2ff" },
  { name: "Full House",      mult: 9,   color: "#4ade80" },
  { name: "Flush",           mult: 6,   color: "#4ade80" },
  { name: "Straight",        mult: 4,   color: "#fbbf24" },
  { name: "Three of a Kind", mult: 3,   color: "#fbbf24" },
  { name: "Two Pair",        mult: 2,   color: "#b1bad3" },
  { name: "Jacks or Better", mult: 1,   color: "#b1bad3" },
];

const fanAngles = [-8, -4, 0, 4, 8];
const fanY      = [8, 2, 0, 2, 8];

function playWinSound(rankName: string) {
  if (!isSoundEnabled()) return;
  const r = rankName.toLowerCase();
  if (r.includes("royal") || r.includes("straight flush")) soundPokerWinRoyal();
  else if (r.includes("four") || r.includes("full") || r.includes("flush") || r.includes("straight")) soundPokerWinBig();
  else if (r.includes("two") || r.includes("three")) soundPokerWinMedium();
  else soundPokerWinJacks();
}

export function VideopokerGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "videopoker-bet");
  const [phase, setPhase] = useState<Phase>("idle");
  const [gameId, setGameId] = useState<string | null>(null);
  const [cards, setCards] = useState<(CardInfo | null)[]>(Array(5).fill(null));
  const [held, setHeld] = useState<boolean[]>(Array(5).fill(false));
  const [handRank, setHandRank] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(0);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [showLose, setShowLose] = useState(false);
  const [dealtIdx, setDealtIdx] = useState<number>(-1);

  const activeAsset = useUiStore((s) => s.activeAsset);
  const updateBalance = useWalletStore((s) => s.updateBalance);
  const refreshWallet = useWalletStore((s) => s.refresh);

  const lastWin = phase === "won" ? true : phase === "lost" ? false : null;
  const profit = lastWin === true ? bet * multiplier - bet : 0;

  const deal = async () => {
    if (loading) return;
    setLoading(true);
    setPhase("deal");
    setCards(Array(5).fill(null));
    setHeld(Array(5).fill(false));
    setHandRank(null);
    setMultiplier(0);
    setShowWin(false);
    setShowLose(false);
    setDealtIdx(-1);
    if (isSoundEnabled()) soundPokerShuffle();
    try {
      const res = await api.post<any>("/api/games/videopoker/start", { betRaw: toRaw(bet), asset: activeAsset });
      setGameId(res.gameId);
      // Stagger card deal sounds + reveal
      const hand = res.hand as (CardInfo | null)[];
      setCards(hand);
      hand.forEach((_, i) => {
        setTimeout(() => {
          setDealtIdx(i);
          if (isSoundEnabled()) soundPokerCardDeal(i);
        }, 120 + i * 110);
      });
      setTimeout(() => { setPhase("hold"); setDealtIdx(-1); }, 120 + 5 * 110 + 50);
      updateBalance(activeAsset, res.balanceAfterRaw);
      refreshWallet();
    } catch (e: any) {
      toast.error(e.message || "Failed to deal");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  };

  const draw = async () => {
    if (loading || !gameId || phase !== "hold") return;
    setLoading(true);
    if (isSoundEnabled()) soundPokerDraw();
    try {
      const res = await api.post<any>("/api/games/videopoker/draw", { gameId, hold: held });
      setCards(res.hand);
      setHandRank(res.rankName);
      setMultiplier(res.multiplier ?? 0);
      setPhase(res.win ? "won" : "lost");
      if (res.win) {
        updateBalance(activeAsset, res.balanceAfterRaw);
        refreshWallet();
        setStreak((s) => s + 1);
        playWinSound(res.rankName);
        setTimeout(() => setShowWin(true), 280);
      } else {
        setStreak(0);
        if (isSoundEnabled()) soundPokerLose();
        setTimeout(() => setShowLose(true), 280);
      }
      onPlayed?.();
    } catch (e: any) {
      toast.error(e.message || "Draw failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleHold = (index: number) => {
    if (phase !== "hold") return;
    const newHeld = [...held];
    newHeld[index] = !newHeld[index];
    setHeld(newHeld);
    if (isSoundEnabled()) soundPokerHoldToggle(newHeld[index]);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
      <GameStyles />
      <GameArena
        gameId="videopoker" win={lastWin} shake={lastWin === false}
        className="p-6 flex flex-col items-center justify-center overflow-hidden relative"
        style={{ minHeight: 380 }}
      >
        {/* Felt texture overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 100%, rgba(0,60,20,0.18) 0%, transparent 65%)",
        }} />
        {/* Center ambient glow when cards visible */}
        {phase !== "idle" && (
          <div style={{
            position: "absolute", bottom: "10%", left: "15%", right: "15%", height: "40%",
            background: "radial-gradient(ellipse at 50% 100%, rgba(255,210,63,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
        )}

        <div className="absolute top-4 left-4 z-20">
          <StreakBadge streak={streak} />
        </div>

        {/* Hand rank display */}
        <div className="h-[72px] mb-6 w-full flex items-center justify-center z-20">
          <AnimatePresence mode="wait">
            {handRank && (
              <motion.div key="rank"
                initial={{ y: -24, opacity: 0, scale: 0.7 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
              >
                <div style={{
                  fontSize: 22, fontWeight: 900, fontFamily: "monospace", letterSpacing: 3,
                  background: lastWin
                    ? "linear-gradient(90deg, #ffd23f, #f59e0b, #ffd23f)"
                    : "linear-gradient(90deg, #6b7280, #9ca3af)",
                  backgroundSize: "300% auto",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  filter: lastWin ? "drop-shadow(0 0 16px rgba(255,210,63,0.8))" : "none",
                  animation: lastWin ? "pokerHandReveal 0.55s ease-out" : "none",
                }}>
                  {handRank.toUpperCase()}
                </div>
              </motion.div>
            )}
            {phase === "deal" && !handRank && (
              <motion.div key="dealing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ fontSize: 11, color: "#b1bad3", fontFamily: "monospace", letterSpacing: 3, textTransform: "uppercase" }}>
                  Dealing cards...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card fan */}
        <div className="flex justify-center items-end gap-1 sm:gap-2 z-10 w-full mb-10" style={{ perspective: "1200px" }}>
          {cards.map((c, i) => {
            const isHeld    = held[i] && phase === "hold";
            const isWinCard = phase === "won";
            const isLoseCard = phase === "lost" && !held[i];
            const justDealt = dealtIdx >= i && phase === "deal";

            return (
              <motion.div
                key={i}
                className="relative flex flex-col items-center"
                onClick={() => toggleHold(i)}
                animate={{
                  rotateZ: c ? fanAngles[i] : 0,
                  y: isHeld ? fanY[i] - 18 : c ? fanY[i] : 0,
                  scale: isHeld ? 1.06 : isLoseCard ? 0.95 : 1,
                  opacity: (phase === "lost" && !isHeld && held.some(h => h)) ? 0.65 : 1,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{
                  animation: justDealt ? "pokerCardDeal 0.42s cubic-bezier(0.22,1,0.36,1)" : "none",
                }}
              >
                {/* HOLD badge */}
                <div className="h-[28px] w-full flex items-center justify-center mb-1.5">
                  <AnimatePresence>
                    {isHeld && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        style={{
                          background: "linear-gradient(135deg, #ffd23f, #f59e0b)",
                          color: "#000", fontSize: 10, fontWeight: 900,
                          padding: "3px 10px", borderRadius: 12,
                          letterSpacing: 2, fontFamily: "monospace",
                          animation: "pokerHoldPulse 1.5s ease-in-out infinite",
                          boxShadow: "0 0 12px rgba(255,210,63,0.7)",
                        }}
                      >
                        HOLD
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Card itself */}
                <div className="scale-[0.82] sm:scale-100 transform-gpu relative"
                  style={{
                    cursor: phase === "hold" ? "pointer" : "default",
                    animation: isWinCard ? "pokerWinGlow 1.8s ease-in-out infinite" : "none",
                    borderRadius: 12,
                  }}
                >
                  <Card3D
                    card={c || undefined}
                    faceDown={!c}
                    lifted={isHeld || isWinCard}
                    delay={i * 0.08}
                  />

                  {/* Hold gold border */}
                  {isHeld && (
                    <motion.div
                      layoutId={"hold-glow-" + i}
                      style={{
                        position: "absolute", inset: 0, borderRadius: 10,
                        border: "2px solid #ffd23f",
                        boxShadow: "0 0 18px rgba(255,210,63,0.6), inset 0 0 8px rgba(255,210,63,0.15)",
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {/* Win sparkle on won cards */}
                  {isWinCard && c && (
                    <div style={{
                      position: "absolute", top: -6, right: -6,
                      fontSize: 14, pointerEvents: "none", zIndex: 5,
                      animation: "pokerHoldPulse 1.2s ease-in-out infinite",
                    }}>✨</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Hold hint */}
        {phase === "hold" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 10, color: "#4a6070", fontFamily: "monospace",
              letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}
          >
            Click cards to hold · Then draw
          </motion.div>
        )}

        {/* Cinematic reveals */}
        <PokerSlowWinReveal
          active={showWin}
          handRank={handRank || ""}
          multiplier={multiplier}
          profit={profit}
          asset={activeAsset}
        />
        <PokerSlowLoseReveal active={showLose} />
        <ConfettiRain active={lastWin === true && showWin} colors={GAME_THEMES.videopoker.particleColors} />
      </GameArena>

      {/* Right panel */}
      <div>
        <BetPanel
          bet={bet} setBet={setBet}
          onBet={phase === "hold" ? draw : deal}
          playing={loading}
          betLabel={loading ? "..." : phase === "hold" ? "Draw" : "Deal"}
          disabled={loading}
        />

        {/* Paytable */}
        <div style={{
          marginTop: 12, borderRadius: 14, padding: 16,
          background: "linear-gradient(160deg, #050e07, #08080e)",
          border: "1px solid rgba(255,210,63,0.15)",
          boxShadow: "0 0 24px rgba(255,210,63,0.06)",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 900, color: "#ffd23f",
            textTransform: "uppercase", letterSpacing: 3,
            marginBottom: 12, fontFamily: "monospace",
            textShadow: "0 0 10px rgba(255,210,63,0.5)",
          }}>Paytable</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {PAYTABLE.map((row) => {
              const isActive = handRank && handRank.toLowerCase().includes(row.name.toLowerCase().split(" ")[0]);
              const isRoyalRow = row.name === "Royal Flush";
              return (
                <div key={row.name} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "5px 8px", borderRadius: 7,
                  background: isActive ? "rgba(255,210,63,0.1)" : "transparent",
                  borderLeft: isActive ? "2px solid " + row.color : "2px solid transparent",
                  transition: "all 0.3s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", background: row.color,
                      boxShadow: isActive ? "0 0 6px " + row.color : "none",
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 11, fontFamily: "monospace",
                      color: isActive ? "#ffffff" : "#6b7a8a",
                      fontWeight: isActive ? 700 : 400,
                      transition: "color 0.3s",
                    }}>{row.name}</span>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 900, fontFamily: "monospace",
                    color: isActive ? row.color : "#3a4d5c",
                    textShadow: isActive ? "0 0 8px " + row.color + "88" : "none",
                    animation: isRoyalRow ? "pokerRoyalShimmer 3s linear infinite" : isActive ? "pokerHoldPulse 1.5s ease-in-out infinite" : "none",
                  }}>{row.mult}×</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui";
import { useWalletStore } from "@/store/wallet";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, DollarSign } from "lucide-react";
import {
  GameStyles, ParticleBurst, ConfettiRain, StreakBadge, GAME_THEMES,
} from "./game-effects";
import {
  HiloBackground3D, HiloPremiumCard3D, HiloSlowReveal,
} from "./hilo-premium";
import {
  soundCardDeal, soundHigherClick, soundLowerClick,
  soundWin, soundLose, soundMultiplierUp,
  soundStreakBonus, soundCashout, soundButtonClick,
} from "./hilo-sounds";
import { SoundToggle } from "./sound-toggle";

type Phase = "idle" | "playing" | "won" | "lost";

export function HiloGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "hilo-bet");
  const [phase, setPhase] = useState<Phase>("idle");
  const [gameId, setGameId] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState<{ rank: string; suit: "♠" | "♥" | "♦" | "♣"; val: number } | null>(null);
  const [history, setHistory] = useState<{ rank: string; suit: "♠" | "♥" | "♦" | "♣" }[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);

  // Slow-reveal state
  const [revealActive, setRevealActive] = useState(false);
  const [revealWin, setRevealWin] = useState<boolean | null>(null);
  const [revealAction, setRevealAction] = useState<"higher" | "lower" | null>(null);
  const [prevMultiplier, setPrevMultiplier] = useState(1);
  const [newMultiplier, setNewMultiplier] = useState(1);

  // Card animation states
  const [cardLifted, setCardLifted] = useState(false);
  const [cardShaking, setCardShaking] = useState(false);
  const [cardCrumbling, setCardCrumbling] = useState(false);

  const activeAsset = useUiStore((s) => s.activeAsset);
  const refreshWallet = useWalletStore((s) => s.refresh);
  const updateBalance = useWalletStore((s) => s.updateBalance);

  const lastWin = phase === "won" ? true : phase === "lost" ? false : null;

  const start = async () => {
    if (loading) return;
    soundButtonClick();
    setLoading(true);
    // Reset states
    setCardLifted(false); setCardShaking(false); setCardCrumbling(false);
    setRevealActive(false); setRevealWin(null);
    try {
      const res = await api.post<any>("/api/games/hilo/start", { betRaw: toRaw(bet), asset: activeAsset });
      setGameId(res.gameId);
      setCurrentCard(res.startCard ?? res.card);
      setHistory([res.startCard ?? res.card]);
      setMultiplier(1);
      setPrevMultiplier(1);
      setNewMultiplier(1);
      setPhase("playing");
      updateBalance(activeAsset, res.balanceAfterRaw);
      refreshWallet();
      soundCardDeal();
    } catch (e: any) {
      toast.error(e.message || "Failed to start game");
    } finally {
      setLoading(false);
    }
  };

  const action = async (act: "higher" | "lower" | "cashout") => {
    if (loading || !gameId || phase !== "playing") return;
    setLoading(true);

    if (act === "higher") soundHigherClick();
    else if (act === "lower") soundLowerClick();
    else if (act === "cashout") soundCashout();

    try {
      const res = await api.post<any>("/api/games/hilo/action", { gameId, action: act });

      if (act === "cashout") {
        // Cashout always wins
        if (res.card) {
          setCurrentCard(res.card);
          setHistory((h) => [...h, res.card].slice(-6));
        }
        toast.success(`🎉 Won ${(bet * multiplier).toFixed(4)} ${activeAsset} (${multiplier.toFixed(2)}x)!`);
        updateBalance(activeAsset, res.balanceAfterRaw);
        refreshWallet();
        setStreak(s => s + 1);
        onPlayed?.();

        // Trigger cashout cinematic
        setRevealWin(true);
        setRevealAction(null);
        setPrevMultiplier(multiplier);
        setNewMultiplier(multiplier);
        setCardLifted(true);
        setRevealActive(true);
        setTimeout(() => {
          setPhase("won");
          setRevealActive(false);
          setCardLifted(false);
        }, 2000);

      } else if (res.status === "won" || res.status === "lost" || res.win === true || res.win === false) {
        // Final round result
        const didWin = res.win === true || res.status === "won";
        const card = res.card;
        if (card) {
          setCurrentCard(card);
          setHistory((h) => [...h, card].slice(-6));
        }
        const nm = res.chainMultiplier ?? res.multiplier ?? multiplier;

        setRevealAction(act as "higher" | "lower");
        setPrevMultiplier(multiplier);
        setNewMultiplier(nm);
        setRevealWin(didWin);
        setRevealActive(true);

        if (didWin) {
          setMultiplier(nm);
          soundWin();
          setCardLifted(true);
          if (streak >= 2) soundStreakBonus();
          // After cinematic
          setTimeout(() => {
            toast.success(`🎉 Won ${(bet * nm).toFixed(4)} ${activeAsset} (${nm.toFixed(2)}x)!`);
            updateBalance(activeAsset, res.balanceAfterRaw);
            refreshWallet();
            setStreak(s => s + 1);
            onPlayed?.();
            setPhase("won");
            setRevealActive(false);
            setCardLifted(false);
          }, 2200);
        } else {
          soundLose();
          setCardShaking(true);
          setTimeout(() => {
            setCardShaking(false);
            setCardCrumbling(true);
          }, 600);
          // After cinematic
          setTimeout(() => {
            setStreak(0);
            onPlayed?.();
            setPhase("lost");
            setRevealActive(false);
            setCardCrumbling(false);
          }, 1900);
        }

      } else {
        // Continuing — correct guess, next card
        const card = res.card;
        const nm = res.chainMultiplier ?? res.multiplier ?? multiplier;
        setCurrentCard(card);
        setHistory((h) => [...h, card].slice(-6));
        setMultiplier(nm);
        soundCardDeal();
        soundMultiplierUp();
      }
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameStyles />

      {/* ── Arena ── */}
      <div
        style={{
          background: GAME_THEMES.hilo.arenaBg,
          borderRadius: 16,
          border: lastWin === true
            ? "2px solid rgba(255,215,0,0.65)"
            : lastWin === false
            ? "2px solid rgba(255,40,40,0.65)"
            : "2px solid rgba(255,45,219,0.35)",
          minHeight: 380,
          position: "relative",
          overflow: "hidden",
          animation: lastWin === false ? "gfxShake 0.55s ease-out" : "none",
          transition: "border-color 0.5s ease",
          boxShadow: lastWin === true
            ? "0 0 60px rgba(255,215,0,0.25), inset 0 0 80px rgba(255,215,0,0.08)"
            : lastWin === false
            ? "0 0 60px rgba(255,40,40,0.25), inset 0 0 80px rgba(255,40,40,0.08)"
            : "0 0 40px rgba(255,45,219,0.15)",
        }}
        className="p-6 flex flex-col items-center justify-center"
      >
        {/* Animated arena background */}
        <HiloBackground3D streak={streak} />

        {/* Arena glow overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: GAME_THEMES.hilo.arenaGlow,
          pointerEvents: "none", transition: "all 0.6s ease",
        }} />

        {/* Win/lose inner glow */}
        {lastWin !== null && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
            boxShadow: `inset 0 0 100px ${lastWin ? GAME_THEMES.hilo.winGlow : GAME_THEMES.hilo.loseGlow}`,
            transition: "box-shadow 0.5s ease",
          }} />
        )}

        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
          {/* History cards */}
          <div className="flex gap-1.5 items-end">
            {history.map((c, i) => (
              <div
                key={i}
                style={{
                  transform: "scale(0.55)",
                  transformOrigin: "bottom left",
                  animation: i === history.length - 1 ? "hiloHistorySlide 0.35s ease-out" : "none",
                }}
              >
                <HiloPremiumCard3D card={c as any} />
              </div>
            ))}
          </div>

          {/* Right: streak + multiplier + mute */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <StreakBadge streak={streak} />
              <SoundToggle />
            </div>
            {/* Neon multiplier */}
            <div
              style={{
                fontSize: 22, fontWeight: 900,
                fontFamily: "'Orbitron', monospace",
                letterSpacing: 2,
                padding: "4px 14px",
                background: "rgba(10,0,20,0.8)",
                borderRadius: 12,
                border: multiplier > 1
                  ? "1.5px solid rgba(255,215,0,0.4)"
                  : "1.5px solid rgba(47,69,83,0.7)",
                backdropFilter: "blur(8px)",
                animation: multiplier > 1 ? "hiloArenaBreath 2s ease-in-out infinite" : "none",
              }}
            >
              <span style={{
                background: multiplier > 1
                  ? "linear-gradient(90deg, #ffd700, #ff2ddb, #00eaff)"
                  : "linear-gradient(90deg, #b1bad3, #ffffff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: multiplier > 1 ? "drop-shadow(0 0 8px rgba(255,215,0,0.6))" : "none",
                display: "inline-block",
              }}>
                Mult: {multiplier.toFixed(2)}×
              </span>
            </div>
          </div>
        </div>

        {/* Deck stack */}
        <div className="absolute top-8 right-14 hidden md:block" style={{ zIndex: 1 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              position: "absolute", top: i * -5, right: i * -5, zIndex: -i,
              opacity: 1 - i * 0.15,
            }}>
              <HiloPremiumCard3D faceDown />
            </div>
          ))}
        </div>

        {/* Particles on win */}
        <ParticleBurst active={lastWin === true} colors={GAME_THEMES.hilo.particleColors} />
        <ConfettiRain active={lastWin === true} colors={GAME_THEMES.hilo.particleColors} />

        {/* Main card */}
        <div className="relative mt-12 mb-8 z-10 w-[170px] h-[220px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {currentCard && (
              <motion.div
                key={currentCard.rank + currentCard.suit + history.length}
                initial={{ x: 120, y: -120, rotateZ: 25, opacity: 0 }}
                animate={{ x: 0, y: 0, rotateZ: 0, opacity: 1 }}
                exit={{ x: -120, y: 120, rotateZ: -25, opacity: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className="absolute"
              >
                <div className="scale-[1.6] transform-gpu">
                  <HiloPremiumCard3D
                    card={currentCard}
                    lifted={cardLifted}
                    shaking={cardShaking}
                    crumbling={cardCrumbling}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls / result */}
        <div className="h-[90px] z-20 w-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            {phase === "playing" ? (
              <motion.div
                key="controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-5"
              >
                {/* Higher */}
                <Button
                  id="hilo-higher-btn"
                  onClick={() => action("higher")}
                  disabled={loading || revealActive}
                  className="hilo-btn-higher h-14 px-8 text-lg font-black text-white rounded-xl transition-all"
                  style={{
                    background: "linear-gradient(135deg, #0f9e42 0%, #16c455 50%, #00ff7a 100%)",
                    boxShadow: loading || revealActive
                      ? "none"
                      : "0 8px 0 #0a6b2d, 0 0 20px rgba(22,196,85,0.5)",
                    border: "2px solid rgba(0,255,122,0.35)",
                    transform: "translateY(0)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => {
                    if (!loading && !revealActive) {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 0 #0a6b2d, 0 0 35px rgba(22,196,85,0.75)";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 0 #0a6b2d, 0 0 20px rgba(22,196,85,0.5)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                  onMouseDown={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 0 #0a6b2d, 0 0 20px rgba(22,196,85,0.5)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(4px)";
                  }}
                  onMouseUp={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 0 #0a6b2d, 0 0 35px rgba(22,196,85,0.75)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  }}
                >
                  Higher <ChevronUp className="ml-2 w-6 h-6" />
                </Button>

                {/* Lower */}
                <Button
                  id="hilo-lower-btn"
                  onClick={() => action("lower")}
                  disabled={loading || revealActive}
                  className="hilo-btn-lower h-14 px-8 text-lg font-black text-white rounded-xl transition-all"
                  style={{
                    background: "linear-gradient(135deg, #cc1a1a 0%, #ef4444 50%, #ff6b6b 100%)",
                    boxShadow: loading || revealActive
                      ? "none"
                      : "0 8px 0 #8b0e0e, 0 0 20px rgba(239,68,68,0.5)",
                    border: "2px solid rgba(255,107,107,0.35)",
                    transform: "translateY(0)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => {
                    if (!loading && !revealActive) {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 0 #8b0e0e, 0 0 35px rgba(239,68,68,0.75)";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 0 #8b0e0e, 0 0 20px rgba(239,68,68,0.5)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                  onMouseDown={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 0 #8b0e0e, 0 0 20px rgba(239,68,68,0.5)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(4px)";
                  }}
                  onMouseUp={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 0 #8b0e0e, 0 0 35px rgba(239,68,68,0.75)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  }}
                >
                  Lower <ChevronDown className="ml-2 w-6 h-6" />
                </Button>
              </motion.div>
            ) : (phase === "won" || phase === "lost") ? (
              <motion.div key="result-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{
                  textAlign: "center",
                  fontSize: 13, color: "#b1bad3", fontWeight: 600,
                  marginTop: 8,
                }}>
                  {phase === "won" ? "Place a new bet to play again" : "Try again!"}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Slow-reveal cinematic overlay */}
        <HiloSlowReveal
          active={revealActive}
          win={revealWin}
          action={revealAction}
          prevMultiplier={prevMultiplier}
          newMultiplier={newMultiplier}
        />
      </div>

      {/* ── Bet Panel ── */}
      <div>
        <BetPanel
          bet={bet}
          setBet={setBet}
          onBet={start}
          playing={phase === "playing"}
          betLabel={phase === "playing" ? "Playing..." : "Place Bet"}
          disabled={loading}
        >
          {phase === "playing" && (
            <Button
              id="hilo-cashout-btn"
              onClick={() => action("cashout")}
              disabled={loading || revealActive || history.length <= 1}
              className="w-full mt-4 h-14 text-white text-base font-black rounded-xl relative overflow-hidden btn-shimmer-sweep"
              style={{
                background: "linear-gradient(135deg, #ff2ddb 0%, #a855f7 50%, #6f00ff 100%)",
                boxShadow: loading || revealActive || history.length <= 1
                  ? "none"
                  : "0 4px 0 #6b0066, 0 0 24px rgba(255,45,219,0.45)",
                border: "2px solid rgba(255,45,219,0.3)",
                transition: "all 0.2s ease",
              }}
            >
              <DollarSign className="inline w-4 h-4 mr-1" />
              Cash Out {(bet * multiplier).toFixed(4)}
            </Button>
          )}
        </BetPanel>
      </div>
    </div>
  );
}

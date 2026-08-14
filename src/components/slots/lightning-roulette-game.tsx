"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiveDealerShell } from "./live-dealer-shell";
import { BetPanel, useBetAmount, toRaw } from "@/components/games/bet-panel";
import { useGame } from "@/hooks/use-slot-game";
import { useUiStore } from "@/store/ui";

const NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0-36
const RED = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BET_TYPES = ["Red", "Black", "Even", "Odd", "1-18", "19-36"];

function getColor(n: number): string {
  if (n === 0) return "#16a34a";
  return RED.includes(n) ? "#dc2626" : "#1a1a1a";
}

function buildWheel(): number[] {
  // European roulette wheel order
  return [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
}

const WHEEL_NUMS = buildWheel();

export function LightningRouletteGame() {
  const [bet, setBet] = useBetAmount(1, "lightning-roulette-bet");
  const [spinning, setSpinning] = useState(false);
  const [betType, setBetType] = useState("Red");
  const [result, setResult] = useState<number | null>(null);
  const [lightningNums, setLightningNums] = useState<Map<number, number>>(new Map());
  const [speechText, setSpeechText] = useState("Welcome to Lightning Roulette! Place your bets!");
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [isDealing, setIsDealing] = useState(false);
  const [wheelRot, setWheelRot] = useState(0);
  const rotRef = useRef(0);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const handleSpin = useCallback(async () => {
    if (spinning || playing) return;
    setSpinning(true);
    setLightningNums(new Map());
    setResult(null);
    setLastWin(null);
    setSpeechText("No more bets! The ball is rolling!");
    setIsDealing(true);

    // Lightning strike phase
    const lNums = new Map<number, number>();
    const numLightning = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numLightning; i++) {
      const n = Math.floor(Math.random() * 36) + 1;
      lNums.set(n, [50, 100, 200, 500][Math.floor(Math.random() * 4)]);
    }
    setLightningNums(lNums);
    setSpeechText(`⚡ ${numLightning} number${numLightning > 1 ? "s" : ""} struck by lightning!`);

    await new Promise<void>((res) => setTimeout(res, 1500));

    const gameResult = await play("roulette", { betType }, toRaw(bet));
    const won = gameResult?.bet?.win ?? false;
    const mult = gameResult?.bet?.multiplier ?? 0;
    const outcome = (gameResult?.bet?.outcome as Record<string, unknown>);
    const num = typeof outcome?.number === "number" ? outcome.number : Math.floor(Math.random() * 37);

    // Animate wheel
    const extraSpins = 4 + Math.floor(Math.random() * 3);
    const targetRot = rotRef.current + extraSpins * 360 + (num / 37) * 360;
    rotRef.current = targetRot;
    setWheelRot(targetRot);

    setSpeechText("The ball is deciding...");
    await new Promise<void>((res) => setTimeout(res, 3200));
    setSpinning(false);
    setIsDealing(false);
    setResult(num);

    const isLightning = lNums.has(num);
    const lMult = lNums.get(num) ?? 0;

    if (won) {
      const finalMult = isLightning ? lMult : mult;
      setLastWin(finalMult);
      if (isLightning) {
        setSpeechText(`⚡ LIGHTNING STRIKE on ${num}! ${lMult}× multiplier!`);
      } else {
        setSpeechText(`Congratulations! ${num} wins!`);
      }
    } else {
      setSpeechText(`${num}. Better luck next time!`);
    }
  }, [spinning, playing, play, bet, betType]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="min-h-[520px]">
        <LiveDealerShell dealerName="Sofia" dealerGender="female" speechText={speechText} isDealing={isDealing}>
          <div className="flex flex-col items-center gap-4">
            {/* Roulette Wheel (overhead view) */}
            <div style={{
              position: "relative", width: 240, height: 120, overflow: "hidden",
            }}>
              <div style={{
                width: 240, height: 240, borderRadius: "50%",
                background: "conic-gradient(from 0deg, " +
                  WHEEL_NUMS.map((n, i) =>
                    `${getColor(n)} ${(i / 37) * 360}deg ${((i + 1) / 37) * 360}deg`
                  ).join(", ") + ")",
                border: "4px solid #8B6914",
                transform: `perspective(300px) rotateX(70deg) rotate(${wheelRot}deg)`,
                transition: spinning
                  ? `transform 3s cubic-bezier(0.1,0.5,0.2,1)`
                  : "transform 0.3s ease",
                position: "absolute", top: 0, left: 0,
                boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
              }} />

              {/* Ball indicator */}
              {result !== null && !spinning && (
                <div style={{
                  position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
                  width: 12, height: 12, borderRadius: "50%",
                  background: "#fff", boxShadow: "0 0 8px rgba(255,255,255,0.8)",
                  zIndex: 5,
                }} />
              )}
            </div>

            {/* Lightning numbers display */}
            {lightningNums.size > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {[...lightningNums.entries()].map(([n, m]) => (
                  <motion.div key={n}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{
                      background: "rgba(59,130,246,0.2)", border: "2px solid #3b82f6",
                      borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 900,
                      color: "#93c5fd",
                      boxShadow: "0 0 16px rgba(59,130,246,0.4)",
                      animation: "lightningFlash 0.8s ease-in-out",
                    }}>
                    ⚡ {n} → {m}×
                  </motion.div>
                ))}
              </div>
            )}

            {/* Bet type selector */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {BET_TYPES.map(t => (
                <button key={t} onClick={() => !spinning && setBetType(t)} style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: betType === t ? "#1475e1" : "#0f212e",
                  border: `1px solid ${betType === t ? "#1475e1" : "#2f4553"}`,
                  color: betType === t ? "#fff" : "#b1bad3",
                  cursor: "pointer", transition: "all 0.15s",
                }}>{t}</button>
              ))}
            </div>

            {/* Number grid (condensed) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 3, maxWidth: 320 }}>
              {Array.from({ length: 37 }, (_, i) => {
                const isLightning = lightningNums.has(i);
                const lMult = lightningNums.get(i);
                const isResult = result === i && !spinning;
                return (
                  <div key={i} style={{
                    background: isResult ? "#00c2ff" : isLightning ? "rgba(59,130,246,0.3)" : getColor(i),
                    border: `1px solid ${isResult ? "#00c2ff" : isLightning ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 4, aspectRatio: "1",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: "#fff",
                    position: "relative",
                    boxShadow: isResult ? "0 0 12px #00c2ff" : isLightning ? "0 0 8px rgba(59,130,246,0.6)" : "none",
                    transition: "all 0.3s",
                  }}>
                    {i}
                    {isLightning && (
                      <div style={{ position: "absolute", top: -2, right: -2, fontSize: 7, color: "#60a5fa" }}>⚡</div>
                    )}
                  </div>
                );
              })}
            </div>

            <AnimatePresence>
              {lastWin !== null && lastWin > 0 && (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                  style={{
                    background: "rgba(0,194,255,0.1)", border: "2px solid #00c2ff",
                    borderRadius: 12, padding: "10px 20px", textAlign: "center",
                  }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#00c2ff" }}>
                    ⚡ {lastWin.toFixed(0)}× WIN!
                  </div>
                  <div style={{ fontSize: 12, color: "#b1bad3" }}>
                    +{(bet * lastWin).toFixed(4)} {activeAsset}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </LiveDealerShell>
      </div>

      <BetPanel bet={bet} setBet={setBet} onBet={handleSpin} playing={playing || spinning} betLabel={spinning ? "Spinning…" : "⚡ Place Bet & Spin!"}>
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-[#b1bad3] uppercase">Bet on:</div>
          <div className="text-sm font-bold text-white">{betType}</div>
          <div className="text-[10px] text-[#b1bad3] bg-[#0f212e] rounded-md p-2">
            Lightning multipliers: 50× – 500× on struck numbers. Regular win pays 2×.
          </div>
        </div>
      </BetPanel>
    </div>
  );
}

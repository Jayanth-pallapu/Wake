"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LiveDealerShell } from "./live-dealer-shell";
import { BetPanel, useBetAmount, toRaw } from "@/components/games/bet-panel";
import { useGame } from "@/hooks/use-slot-game";
import { useUiStore } from "@/store/ui";

const SEGMENTS = [
  { label: "1", color: "#fbbf24", value: 1, type: "money" },
  { label: "2", color: "#60a5fa", value: 2, type: "money" },
  { label: "5", color: "#34d399", value: 5, type: "money" },
  { label: "10", color: "#f87171", value: 10, type: "money" },
  { label: "1", color: "#fbbf24", value: 1, type: "money" },
  { label: "2", color: "#60a5fa", value: 2, type: "money" },
  { label: "CASH HUNT", color: "#a78bfa", value: 0, type: "bonus" },
  { label: "5", color: "#34d399", value: 5, type: "money" },
  { label: "2", color: "#60a5fa", value: 2, type: "money" },
  { label: "1", color: "#fbbf24", value: 1, type: "money" },
  { label: "CRAZY TIME", color: "#ec4899", value: 0, type: "bonus" },
  { label: "2", color: "#60a5fa", value: 2, type: "money" },
  { label: "1", color: "#fbbf24", value: 1, type: "money" },
  { label: "10", color: "#f87171", value: 10, type: "money" },
  { label: "2", color: "#60a5fa", value: 2, type: "money" },
  { label: "PACHINKO", color: "#f97316", value: 0, type: "bonus" },
  { label: "1", color: "#fbbf24", value: 1, type: "money" },
  { label: "2", color: "#60a5fa", value: 2, type: "money" },
  { label: "1", color: "#fbbf24", value: 1, type: "money" },
  { label: "5", color: "#34d399", value: 5, type: "money" },
  { label: "1", color: "#fbbf24", value: 1, type: "money" },
  { label: "2", color: "#60a5fa", value: 2, type: "money" },
  { label: "COIN FLIP", color: "#38bdf8", value: 0, type: "bonus" },
  { label: "1", color: "#fbbf24", value: 1, type: "money" },
];

const SEG_COUNT = SEGMENTS.length;
const SEG_DEG = 360 / SEG_COUNT;

export function CrazyTimeGame() {
  const [bet, setBet] = useBetAmount(1, "crazy-time-bet");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [landedIdx, setLandedIdx] = useState<number | null>(null);
  const [speechText, setSpeechText] = useState("Welcome! Place your bets!");
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [isDealing, setIsDealing] = useState(false);
  const totalRotRef = useRef(0);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const handleSpin = useCallback(async () => {
    if (spinning || playing) return;
    setSpinning(true);
    setLandedIdx(null);
    setLastWin(null);
    setSpeechText("No more bets! Wheel is spinning!");
    setIsDealing(true);

    const result = await play("crazy-time", {}, toRaw(bet));
    const won = result?.bet?.win ?? false;
    const mult = result?.bet?.multiplier ?? 0;

    // Pick a random landing segment
    const targetIdx = Math.floor(Math.random() * SEG_COUNT);
    const extraSpins = 3 + Math.floor(Math.random() * 3);
    const targetDeg = totalRotRef.current + extraSpins * 360 + (SEG_COUNT - targetIdx) * SEG_DEG;
    totalRotRef.current = targetDeg;

    setRotation(targetDeg);

    await new Promise<void>((res) => setTimeout(res, 3500));
    setSpinning(false);
    setIsDealing(false);
    setLandedIdx(targetIdx);

    const seg = SEGMENTS[targetIdx];
    if (seg.type === "bonus") {
      setSpeechText(`🎉 BONUS GAME! ${seg.label}!`);
      setLastWin(won ? mult * 10 : 0);
    } else {
      if (won) {
        setSpeechText(`Congratulations! ${seg.value}× WIN!`);
        setLastWin(mult);
      } else {
        setSpeechText("Better luck next time!");
        setLastWin(0);
      }
    }
  }, [spinning, playing, play, bet]);

  const landed = landedIdx !== null ? SEGMENTS[landedIdx] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="min-h-[500px]">
        <LiveDealerShell dealerName="Alex the Host" dealerGender="male" speechText={speechText} isDealing={isDealing}>
          <div className="flex flex-col items-center gap-4">
            {/* Wheel */}
            <div style={{ position: "relative", width: 280, height: 280 }}>
              {/* Arrow pointer */}
              <div style={{
                position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                width: 0, height: 0, borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent", borderTop: "20px solid #ffd700",
                zIndex: 10, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
              }} />

              <div style={{
                width: 280, height: 280, borderRadius: "50%",
                border: "4px solid #2f4553",
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? "transform 3s cubic-bezier(0.1, 0.5, 0.3, 1)"
                  : "transform 0.3s ease",
                position: "relative", overflow: "hidden",
                boxShadow: "0 0 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)",
              }}>
                {SEGMENTS.map((seg, i) => {
                  const angle = i * SEG_DEG;
                  const rad = (angle - SEG_DEG / 2) * Math.PI / 180;
                  const labelR = 100;
                  const lx = 140 + labelR * Math.sin(rad);
                  const ly = 140 - labelR * Math.cos(rad);
                  return (
                    <div key={i}>
                      {/* Segment slice */}
                      <div style={{
                        position: "absolute", width: "50%", height: "50%",
                        top: 0, right: 0, transformOrigin: "0% 100%",
                        transform: `rotate(${angle}deg)`,
                        background: seg.color,
                        clipPath: `polygon(0 0, ${Math.tan(SEG_DEG * Math.PI / 180) * 100}% 0, 0 100%)`,
                        opacity: landedIdx === i ? 1 : 0.85,
                      }} />
                      {/* Label */}
                      <div style={{
                        position: "absolute", left: lx - 18, top: ly - 10, width: 36,
                        fontSize: seg.type === "bonus" ? 7 : 10,
                        fontWeight: 900, color: "#fff", textAlign: "center",
                        textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                        transform: `rotate(${angle}deg)`,
                        pointerEvents: "none",
                      }}>
                        {seg.label}
                      </div>
                    </div>
                  );
                })}

                {/* Center cap */}
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: 50, height: 50, borderRadius: "50%",
                  background: "linear-gradient(135deg, #1a2c38, #0f212e)",
                  border: "3px solid #2f4553",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, zIndex: 5,
                }}>🎡</div>
              </div>
            </div>

            {/* Result */}
            <AnimatePresence>
              {landed && !spinning && (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                  style={{
                    background: landed.type === "bonus" ? `${landed.color}33` : "rgba(0,194,255,0.1)",
                    border: `2px solid ${landed.type === "bonus" ? landed.color : "#00c2ff"}`,
                    borderRadius: 12, padding: "10px 20px", textAlign: "center",
                  }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: landed.color }}>
                    {landed.type === "bonus" ? `🎉 BONUS: ${landed.label}!` : `${landed.value}×`}
                  </div>
                  {lastWin !== null && lastWin > 0 && (
                    <div style={{ fontSize: 13, color: "#00c2ff", fontWeight: 700 }}>
                      Won: {(bet * lastWin).toFixed(4)} {activeAsset}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </LiveDealerShell>
      </div>

      <BetPanel bet={bet} setBet={setBet} onBet={handleSpin} playing={playing || spinning} betLabel={spinning ? "Spinning…" : "🎡 Spin!"}>
        <div className="space-y-1">
          <div className="text-[10px] text-[#b1bad3] bg-[#0f212e] rounded-md p-2">
            <div className="font-bold text-white mb-1">Segment Odds</div>
            <div className="flex justify-between"><span>1×</span><span className="text-yellow-400">×1</span></div>
            <div className="flex justify-between"><span>2×</span><span className="text-blue-400">×2</span></div>
            <div className="flex justify-between"><span>5×</span><span className="text-[#00c2ff]">×5</span></div>
            <div className="flex justify-between"><span>10×</span><span className="text-red-400">×10</span></div>
            <div className="flex justify-between"><span>BONUS</span><span className="text-pink-400">up to 20,000×</span></div>
          </div>
        </div>
      </BetPanel>
    </div>
  );
}

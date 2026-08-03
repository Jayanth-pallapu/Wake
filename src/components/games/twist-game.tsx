"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";

const segments = [
  { mult: 0, color: "#94a3b8", weight: 50 },
  { mult: 1.2, color: "#3b82f6", weight: 20 },
  { mult: 2, color: "#14b8a6", weight: 15 },
  { mult: 5, color: "#eab308", weight: 7 },
  { mult: 10, color: "#f97316", weight: 4 },
  { mult: 50, color: "#ec4899", weight: 2 },
  { mult: 200, color: "#a855f7", weight: 1.2 },
  { mult: 1000, color: "#06b6d4", weight: 0.6 },
  { mult: 1000000, color: "#ef4444", weight: 0.2 },
];

export function TwistGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "twist-bet");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const { play } = useGame();

  const handleBet = async () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const res = await play("twist", {}, toRaw(bet));
    if (res) {
      const mult = res.bet.outcome.multiplier as number;
      const targetSegIndex = segments.findIndex(s => s.mult === mult);
      
      // Calculate rotation to land on the correct segment
      // (This is visual only, result is already decided)
      const baseRot = rotation % 360;
      const segAngle = 360 / segments.length;
      const targetAngle = 360 - (targetSegIndex * segAngle) - (segAngle / 2); // Center of segment
      const newRotation = baseRot + 360 * 5 + (targetAngle - baseRot); // Spin 5 times + land
      
      setRotation(newRotation);
      
      setTimeout(() => {
        setResult(mult);
        setSpinning(false);
        onPlayed?.();
      }, 2000);
    } else {
      setSpinning(false);
    }
  };

  // Generate conic gradient for the wheel based on equal segments (simplified visual)
  const conicGrad = segments.map((s, i) => {
    const start = (i * 360) / segments.length;
    const end = ((i + 1) * 360) / segments.length;
    return `${s.color} ${start}deg ${end}deg`;
  }).join(", ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-6 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
        {/* The pointer */}
        <div className="absolute top-[20px] z-10 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white drop-shadow-lg" />
        
        {/* The wheel */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full border-[10px] border-[#1a2c38] shadow-2xl relative"
          style={{ background: `conic-gradient(${conicGrad})` }}
        >
          {/* Inner circle */}
          <div className="absolute inset-0 m-auto w-[60px] h-[60px] rounded-full bg-[#1a2c38] shadow-inner" />
          
          {/* Labels */}
          {segments.map((s, i) => {
            const angle = (i * 360) / segments.length + (360 / segments.length / 2);
            return (
              <div 
                key={i} 
                className="absolute inset-0 w-full h-full text-center font-bold text-white drop-shadow-md text-sm sm:text-lg"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div className="pt-4">{s.mult}×</div>
              </div>
            );
          })}
        </motion.div>

        <AnimatePresence>
          {result !== null && !spinning && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`absolute bottom-10 px-8 py-3 rounded-full text-3xl font-black shadow-2xl ${result >= 2 ? "bg-[#00e701] text-black" : "bg-[#2f4553] text-white"}`}
              style={{ boxShadow: result >= 50 ? "0 0 50px #ec4899" : "" }}
            >
              {result}×
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={spinning} betLabel="Spin Wheel" />
      </div>
    </div>
  );
}

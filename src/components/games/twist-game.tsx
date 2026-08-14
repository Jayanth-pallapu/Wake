"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { 
  GameArena, GameStyles, ParticleBurst, ConfettiRain, 
  WinBanner, StreakBadge, GAME_THEMES 
} from "./game-effects";

const segments = [
  { mult: 0, color: "#475569", weight: 50 },
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
  const [streak, setStreak] = useState(0);
  const { play } = useGame();

  const lastWin = result !== null ? result >= 1.2 : null;

  const handleBet = async () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const res = await play("twist", {}, toRaw(bet));
    if (res) {
      const mult = res.bet.outcome.multiplier as number;
      const targetSegIndex = segments.findIndex(s => s.mult === mult);
      
      const baseRot = rotation % 360;
      const segAngle = 360 / segments.length;
      const targetAngle = 360 - (targetSegIndex * segAngle) - (segAngle / 2);
      const newRotation = baseRot + 360 * 5 + (targetAngle - baseRot);
      
      setRotation(newRotation);
      
      setTimeout(() => {
        setResult(mult);
        setSpinning(false);
        if (mult >= 1.2) setStreak(s => s + 1);
        else setStreak(0);
        onPlayed?.();
      }, 2000);
    } else {
      setSpinning(false);
    }
  };

  const conicGrad = segments.map((s, i) => {
    const start = (i * 360) / segments.length;
    const end = ((i + 1) * 360) / segments.length;
    return `${s.color} ${start}deg ${end}deg`;
  }).join(", ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameStyles />
      <GameArena gameId="twist" win={lastWin} shake={lastWin === false} className="p-6 flex flex-col items-center justify-center overflow-hidden">
        
        <div className="absolute top-4 left-4 z-30">
          <StreakBadge streak={streak} />
        </div>

        <ParticleBurst active={lastWin === true} colors={GAME_THEMES.twist.particleColors} />
        <ConfettiRain active={lastWin === true} colors={GAME_THEMES.twist.particleColors} />

        {/* Warp tunnel background rings */}
        {spinning && (
          <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className="absolute rounded-full border border-[#06b6d4]"
                style={{
                  width: `${i * 30}%`, height: `${i * 30}%`,
                  animation: `gfxExpand ${1 + i * 0.5}s infinite ease-out`
                }}
              />
            ))}
          </div>
        )}

        <div className="relative flex flex-col items-center z-10 mt-8">
          <div className="absolute -top-[10px] z-20 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-white drop-shadow-[0_0_10px_white]" />
          
          <div style={{ perspective: '800px' }}>
            <div style={{ transform: 'rotateX(15deg)', transformStyle: 'preserve-3d' }}>
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full relative"
                style={{ 
                  background: `conic-gradient(${conicGrad})`,
                  border: '15px solid #0f172a',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,0,0,0.5)'
                }}
              >
                <div className="absolute inset-0 m-auto w-[80px] h-[80px] rounded-full bg-[#0f172a] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border-4 border-[#1e293b]" />
                
                {segments.map((s, i) => {
                  const angle = (i * 360) / segments.length + (360 / segments.length / 2);
                  const isWinningSeg = result === s.mult;
                  return (
                    <div 
                      key={i} 
                      className="absolute inset-0 w-full h-full text-center font-black text-white text-sm sm:text-lg"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <motion.div 
                        className="pt-6 origin-top"
                        animate={isWinningSeg && !spinning ? { scale: 1.4, filter: 'drop-shadow(0 0 10px white)' } : { scale: 1 }}
                      >
                        {s.mult}×
                      </motion.div>
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>

        <div className="h-[60px] mt-8 w-full flex items-center justify-center">
          <AnimatePresence>
            {result !== null && !spinning && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className={`px-8 py-3 rounded-2xl text-3xl font-black shadow-[0_0_30px_rgba(0,0,0,0.5)] border-2 ${lastWin ? "bg-[#06b6d4] text-black border-cyan-300" : "bg-[#1e293b] text-[#94a3b8] border-[#334155]"}`}
              >
                {result}×
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GameArena>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={spinning} betLabel="Spin Wheel">
          <AnimatePresence>
            {lastWin !== null && !spinning && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <WinBanner win={lastWin} />
              </motion.div>
            )}
          </AnimatePresence>
        </BetPanel>
      </div>
    </div>
  );
}

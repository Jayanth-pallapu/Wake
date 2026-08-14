"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { useUiStore } from "@/store/ui";
import { 
  GameArena, GameStyles, ParticleBurst, ConfettiRain, 
  WinBanner, StreakBadge, NeonMultiplier, GAME_THEMES 
} from "./game-effects";

type BetType = "number" | "color" | "evenodd" | "half" | "dozen";
type BetSelection = { type: BetType; value: string | number };

export function RouletteGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "roulette-bet");
  const [selection, setSelection] = useState<BetSelection | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [win, setWin] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const { play } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

  const getNumberColor = (n: number) => {
    if (n === 0) return "#22c55e";
    return redNumbers.includes(n) ? "#ef4444" : "#1e293b";
  };
  
  const getNumberBgClass = (n: number) => {
    if (n === 0) return "bg-[#22c55e]";
    return redNumbers.includes(n) ? "bg-[#ef4444]" : "bg-[#1e293b]";
  };

  const handleBet = async () => {
    if (spinning || !selection) return;
    setSpinning(true);
    setResult(null);
    setWin(null);

    const res = await play("roulette", { betType: selection.type, betValue: selection.value }, toRaw(bet));
    
    setTimeout(() => {
      setSpinning(false);
      if (res) {
        setResult(res.bet.outcome.number as number);
        setWin(res.bet.win);
        if (res.bet.win) setStreak(s => s + 1);
        else setStreak(0);
        onPlayed?.();
      }
    }, 2000);
  };

  const isSelected = (type: BetType, val: string | number) => selection?.type === type && selection?.value === val;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
      <GameStyles />
      <GameArena gameId="roulette" win={win} shake={win === false} className="p-6 flex flex-col lg:flex-row items-center gap-8 overflow-visible">
        
        <div className="absolute top-4 left-4 z-30">
          <StreakBadge streak={streak} />
        </div>

        <ParticleBurst active={win === true} colors={GAME_THEMES.roulette.particleColors} />
        <ConfettiRain active={win === true} colors={GAME_THEMES.roulette.particleColors} />

        {/* Betting Table */}
        <div className="flex-1 w-full max-w-lg select-none z-10">
          <div className="flex gap-1 mb-1">
            <div 
              className={`flex-1 aspect-[2/5] flex items-center justify-center font-black text-white rounded-l-xl cursor-pointer transition-all shadow-md hover:brightness-110 ${getNumberBgClass(0)} ${isSelected("number", 0) ? "ring-4 ring-[#ffd23f] scale-105 z-10" : ""}`}
              onClick={() => setSelection({ type: "number", value: 0 })}
            >
              0
            </div>
            <div className="grid grid-cols-12 grid-rows-3 gap-1 flex-[12]">
              {Array.from({ length: 36 }).map((_, i) => {
                const col = Math.floor(i / 3);
                const row = 2 - (i % 3);
                const displayN = col * 3 + row + 1;
                
                return (
                  <div
                    key={displayN}
                    className={`flex items-center justify-center font-bold text-white cursor-pointer transition-all shadow-md rounded hover:brightness-110 ${getNumberBgClass(displayN)} ${isSelected("number", displayN) ? "ring-2 ring-[#ffd23f] scale-110 z-10" : ""}`}
                    onClick={() => setSelection({ type: "number", value: displayN })}
                  >
                    {displayN}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 mb-1">
            {[1, 2, 3].map(d => (
              <div 
                key={d} 
                className={`h-12 flex items-center justify-center font-black rounded cursor-pointer transition-all bg-[#1a2c38] shadow-md hover:bg-[#2f4553] ${isSelected("dozen", d) ? "ring-2 ring-[#ffd23f] text-white bg-[#2f4553]" : "text-[#b1bad3]"}`} 
                onClick={() => setSelection({ type: "dozen", value: d })}
              >
                {d === 1 ? "1st 12" : d === 2 ? "2nd 12" : "3rd 12"}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-6 gap-1">
            <div className={`h-12 flex items-center justify-center text-sm font-black rounded cursor-pointer transition-all bg-[#1a2c38] shadow-md hover:bg-[#2f4553] ${isSelected("half", "low") ? "ring-2 ring-[#ffd23f] text-white bg-[#2f4553]" : "text-[#b1bad3]"}`} onClick={() => setSelection({ type: "half", value: "low" })}>1-18</div>
            <div className={`h-12 flex items-center justify-center text-sm font-black rounded cursor-pointer transition-all bg-[#1a2c38] shadow-md hover:bg-[#2f4553] ${isSelected("evenodd", "even") ? "ring-2 ring-[#ffd23f] text-white bg-[#2f4553]" : "text-[#b1bad3]"}`} onClick={() => setSelection({ type: "evenodd", value: "even" })}>EVEN</div>
            <div className={`h-12 flex items-center justify-center font-black rounded cursor-pointer transition-all bg-[#ef4444] shadow-md hover:brightness-110 ${isSelected("color", "red") ? "ring-2 ring-[#ffd23f] text-white" : "text-white"}`} onClick={() => setSelection({ type: "color", value: "red" })}>RED</div>
            <div className={`h-12 flex items-center justify-center font-black rounded cursor-pointer transition-all bg-[#1e293b] shadow-md hover:brightness-110 ${isSelected("color", "black") ? "ring-2 ring-[#ffd23f] text-white" : "text-white"}`} onClick={() => setSelection({ type: "color", value: "black" })}>BLACK</div>
            <div className={`h-12 flex items-center justify-center text-sm font-black rounded cursor-pointer transition-all bg-[#1a2c38] shadow-md hover:bg-[#2f4553] ${isSelected("evenodd", "odd") ? "ring-2 ring-[#ffd23f] text-white bg-[#2f4553]" : "text-[#b1bad3]"}`} onClick={() => setSelection({ type: "evenodd", value: "odd" })}>ODD</div>
            <div className={`h-12 flex items-center justify-center text-sm font-black rounded cursor-pointer transition-all bg-[#1a2c38] shadow-md hover:bg-[#2f4553] ${isSelected("half", "high") ? "ring-2 ring-[#ffd23f] text-white bg-[#2f4553]" : "text-[#b1bad3]"}`} onClick={() => setSelection({ type: "half", value: "high" })}>19-36</div>
          </div>
        </div>

        {/* 3D Wheel / Result */}
        <div className="relative z-10 w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] flex items-center justify-center flex-col mt-8 lg:mt-0">
          <div style={{ perspective: '600px', width: '100%', height: '100%' }}>
            <motion.div 
              className="w-full h-full rounded-full relative"
              style={{ 
                transform: 'rotateX(18deg)', 
                transformStyle: 'preserve-3d',
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                background: 'radial-gradient(ellipse at center, #2f4553 0%, #1a2c38 100%)',
                border: '12px solid #ffd23f'
              }}
              animate={spinning ? { rotateZ: 360 * 5 } : { rotateZ: 0 }}
              transition={spinning ? { duration: 2, ease: "easeOut" } : { duration: 0 }}
            >
              {/* Inner wheel markings placeholder */}
              <div className="absolute inset-4 rounded-full border-4 border-dashed border-[#ffd23f]/30" />
              
              {/* Ball */}
              {spinning && (
                <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2" style={{ animation: 'gfxSpin 0.5s linear infinite reverse' }}>
                  <div className="w-4 h-4 bg-white rounded-full absolute top-2 left-1/2 -translate-x-1/2 shadow-[0_0_10px_white]" />
                </div>
              )}
            </motion.div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none transform-gpu -translate-y-10">
            <AnimatePresence>
              {result !== null && !spinning && (
                <motion.div
                  initial={{ scale: 0, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="rounded-full w-28 h-28 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)] border-4 border-[#ffd23f]"
                  style={{ background: getNumberColor(result) }}
                >
                  <NeonMultiplier value={result.toString()} color="#ffffff" size="lg" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </GameArena>

      <div>
        <BetPanel 
          bet={bet} 
          setBet={setBet} 
          onBet={handleBet} 
          playing={spinning} 
          betLabel={!selection ? "Select Bet" : "Spin"} 
          disabled={!selection || spinning} 
        >
          <AnimatePresence>
            {win !== null && !spinning && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <WinBanner win={win} />
              </motion.div>
            )}
          </AnimatePresence>
        </BetPanel>
      </div>
    </div>
  );
}

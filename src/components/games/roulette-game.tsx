"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { useUiStore } from "@/store/ui";

type BetType = "number" | "color" | "evenodd" | "half" | "dozen";
type BetSelection = { type: BetType; value: string | number };

export function RouletteGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "roulette-bet");
  const [selection, setSelection] = useState<BetSelection | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [win, setWin] = useState<boolean | null>(null);
  const { play } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

  const getNumberColor = (n: number) => {
    if (n === 0) return "bg-green-500";
    return redNumbers.includes(n) ? "bg-red-500" : "bg-[#1a2c38]";
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
        onPlayed?.();
      }
    }, 2000);
  };

  const isSelected = (type: BetType, val: string | number) => selection?.type === type && selection?.value === val;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-6 min-h-[450px] flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden">
        {/* Betting Table */}
        <div className="flex-1 w-full max-w-lg select-none">
          <div className="flex gap-1 mb-1">
            <div 
              className={`flex-1 aspect-[2/5] flex items-center justify-center font-bold text-white border-2 rounded-l-lg cursor-pointer transition-colors ${getNumberColor(0)} ${isSelected("number", 0) ? "border-yellow-400" : "border-transparent"}`}
              onClick={() => setSelection({ type: "number", value: 0 })}
            >
              0
            </div>
            <div className="grid grid-cols-12 grid-rows-3 gap-1 flex-[12]">
              {Array.from({ length: 36 }).map((_, i) => {
                const n = i + 1;
                // arrange in columns like real roulette
                const col = Math.floor(i / 3);
                const row = 2 - (i % 3);
                const displayN = col * 3 + row + 1;
                
                return (
                  <div
                    key={displayN}
                    className={`flex items-center justify-center font-bold text-white border-2 cursor-pointer transition-colors ${getNumberColor(displayN)} ${isSelected("number", displayN) ? "border-yellow-400 z-10" : "border-transparent hover:border-white/20"}`}
                    onClick={() => setSelection({ type: "number", value: displayN })}
                  >
                    {displayN}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 mb-1">
            <div className={`h-10 flex items-center justify-center font-bold text-[#b1bad3] border-2 cursor-pointer transition-colors bg-transparent border-[#2f4553] hover:bg-[#2f4553] ${isSelected("dozen", 1) ? "!border-yellow-400 text-white" : ""}`} onClick={() => setSelection({ type: "dozen", value: 1 })}>1st 12</div>
            <div className={`h-10 flex items-center justify-center font-bold text-[#b1bad3] border-2 cursor-pointer transition-colors bg-transparent border-[#2f4553] hover:bg-[#2f4553] ${isSelected("dozen", 2) ? "!border-yellow-400 text-white" : ""}`} onClick={() => setSelection({ type: "dozen", value: 2 })}>2nd 12</div>
            <div className={`h-10 flex items-center justify-center font-bold text-[#b1bad3] border-2 cursor-pointer transition-colors bg-transparent border-[#2f4553] hover:bg-[#2f4553] ${isSelected("dozen", 3) ? "!border-yellow-400 text-white" : ""}`} onClick={() => setSelection({ type: "dozen", value: 3 })}>3rd 12</div>
          </div>

          <div className="grid grid-cols-6 gap-1">
            <div className={`h-10 flex items-center justify-center text-sm font-bold text-[#b1bad3] border-2 cursor-pointer transition-colors bg-transparent border-[#2f4553] hover:bg-[#2f4553] ${isSelected("half", "low") ? "!border-yellow-400 text-white" : ""}`} onClick={() => setSelection({ type: "half", value: "low" })}>1-18</div>
            <div className={`h-10 flex items-center justify-center text-sm font-bold text-[#b1bad3] border-2 cursor-pointer transition-colors bg-transparent border-[#2f4553] hover:bg-[#2f4553] ${isSelected("evenodd", "even") ? "!border-yellow-400 text-white" : ""}`} onClick={() => setSelection({ type: "evenodd", value: "even" })}>EVEN</div>
            <div className={`h-10 flex items-center justify-center font-bold text-red-500 border-2 cursor-pointer transition-colors bg-transparent border-[#2f4553] hover:bg-[#2f4553] ${isSelected("color", "red") ? "!border-yellow-400" : ""}`} onClick={() => setSelection({ type: "color", value: "red" })}>RED</div>
            <div className={`h-10 flex items-center justify-center font-bold text-gray-400 border-2 cursor-pointer transition-colors bg-transparent border-[#2f4553] hover:bg-[#2f4553] ${isSelected("color", "black") ? "!border-yellow-400" : ""}`} onClick={() => setSelection({ type: "color", value: "black" })}>BLACK</div>
            <div className={`h-10 flex items-center justify-center text-sm font-bold text-[#b1bad3] border-2 cursor-pointer transition-colors bg-transparent border-[#2f4553] hover:bg-[#2f4553] ${isSelected("evenodd", "odd") ? "!border-yellow-400 text-white" : ""}`} onClick={() => setSelection({ type: "evenodd", value: "odd" })}>ODD</div>
            <div className={`h-10 flex items-center justify-center text-sm font-bold text-[#b1bad3] border-2 cursor-pointer transition-colors bg-transparent border-[#2f4553] hover:bg-[#2f4553] ${isSelected("half", "high") ? "!border-yellow-400 text-white" : ""}`} onClick={() => setSelection({ type: "half", value: "high" })}>19-36</div>
          </div>
        </div>

        {/* Wheel / Result */}
        <div className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] relative rounded-full border-8 border-[#1a2c38] shadow-2xl flex items-center justify-center bg-[#2f4553]">
          <motion.div 
            animate={spinning ? { rotate: 360 * 5 } : { rotate: 0 }}
            transition={spinning ? { duration: 2, ease: "easeOut" } : { duration: 0 }}
            className="absolute inset-0 rounded-full border-4 border-dashed border-[#1a2c38] opacity-20"
          />
          <AnimatePresence>
            {result !== null && !spinning && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl font-black text-white shadow-inner ${getNumberColor(result)}`}
              >
                {result}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div>
        <BetPanel 
          bet={bet} 
          setBet={setBet} 
          onBet={handleBet} 
          playing={spinning} 
          betLabel={!selection ? "Select Bet" : "Spin"} 
          disabled={!selection || spinning} 
        >
          {win !== null && !spinning && (
            <div className={`mt-4 text-center font-bold p-3 rounded-md ${win ? "bg-[#00e701]/20 text-[#00e701]" : "bg-[#ff5c5c]/20 text-[#ff5c5c]"}`}>
              {win ? "YOU WON!" : "YOU LOST"}
            </div>
          )}
        </BetPanel>
      </div>
    </div>
  );
}

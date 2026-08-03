"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui";

export function CoinflipGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "coinflip-bet");
  const [pick, setPick] = useState<"heads" | "tails">("heads");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [win, setWin] = useState<boolean | null>(null);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const handleBet = async () => {
    if (flipping || playing) return;
    setFlipping(true);
    setResult(null);
    setWin(null);

    const res = await play("coinflip", { pick }, toRaw(bet));
    
    // Simulate spin duration
    setTimeout(() => {
      setFlipping(false);
      if (res) {
        const out = res.bet.outcome.result as "heads" | "tails";
        setResult(out);
        setWin(res.bet.win);
        onPlayed?.();
      }
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-6 min-h-[400px] flex flex-col items-center justify-center relative">
        <div className="mb-12 relative w-[200px] h-[200px] perspective-1000">
          <motion.div
            animate={flipping ? { rotateY: 360 * 5 } : result ? { rotateY: result === "heads" ? 0 : 180 } : { rotateY: 0 }}
            transition={flipping ? { duration: 1.5, ease: "linear" } : { type: "spring", stiffness: 200, damping: 20 }}
            className="w-full h-full relative preserve-3d"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Heads */}
            <div className="absolute inset-0 rounded-full border-[8px] border-[#eab308] bg-gradient-to-br from-[#fef08a] to-[#ca8a04] flex items-center justify-center backface-hidden shadow-2xl">
              <span className="text-6xl font-black text-[#854d0e]">H</span>
              <div className="absolute top-4 text-[#854d0e]">👑</div>
            </div>
            {/* Tails */}
            <div className="absolute inset-0 rounded-full border-[8px] border-[#94a3b8] bg-gradient-to-br from-[#e2e8f0] to-[#64748b] flex items-center justify-center backface-hidden shadow-2xl" style={{ transform: "rotateY(180deg)" }}>
              <span className="text-6xl font-black text-[#334155]">T</span>
              <div className="absolute top-4 text-[#334155]">🛡️</div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {result && !flipping && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-3xl font-black ${win ? "text-[#00e701]" : "text-[#ff5c5c]"}`}
            >
              {result.toUpperCase()}!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={playing || flipping} betLabel="Flip Coin">
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              className={`flex-1 h-12 font-bold ${pick === "heads" ? "bg-[#eab308] text-black border-[#eab308]" : "bg-transparent text-[#b1bad3] border-[#2f4553]"}`}
              onClick={() => setPick("heads")}
              disabled={playing || flipping}
            >
              Heads
            </Button>
            <Button
              variant="outline"
              className={`flex-1 h-12 font-bold ${pick === "tails" ? "bg-[#94a3b8] text-black border-[#94a3b8]" : "bg-transparent text-[#b1bad3] border-[#2f4553]"}`}
              onClick={() => setPick("tails")}
              disabled={playing || flipping}
            >
              Tails
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs bg-[#0f212e] rounded-md p-2">
            <span className="text-[#b1bad3]">Payout</span>
            <span className="font-bold text-white tabular-nums">1.96×</span>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

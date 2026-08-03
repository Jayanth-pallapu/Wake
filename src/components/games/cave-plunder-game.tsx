"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useUiStore } from "@/store/ui";
import { useWalletStore } from "@/store/wallet";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const LEVELS = [1, 2, 3, 5, 10, 25, 100, 1000];
const COLUMNS = [
  { id: "book", color: "#3b82f6", name: "Book" },
  { id: "amulet", color: "#14b8a6", name: "Amulet" },
  { id: "cross", color: "#eab308", name: "Cross" },
];

export function CavePlunderGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "cave-bet");
  const [gameId, setGameId] = useState<string | null>(null);
  const [levels, setLevels] = useState({ book: 0, amulet: 0, cross: 0 });
  const [spinning, setSpinning] = useState(false);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [totalPayout, setTotalPayout] = useState(0);
  const [loading, setLoading] = useState(false);

  const activeAsset = useUiStore((s) => s.activeAsset);
  const updateBalance = useWalletStore((s) => s.updateBalance);
  const refreshWallet = useWalletStore((s) => s.refresh);

  const start = async () => {
    if (loading || spinning) return;
    setLoading(true);
    try {
      const res = await api.post<any>("/api/games/cave/start", { betRaw: toRaw(bet), asset: activeAsset });
      setGameId(res.gameId);
      setLevels({ book: 0, amulet: 0, cross: 0 });
      setTotalPayout(0);
      updateBalance(activeAsset, res.balanceAfterRaw);
      refreshWallet();
    } catch (e: any) {
      toast.error(e.message || "Failed to start");
    } finally {
      setLoading(false);
    }
  };

  const spin = async () => {
    if (!gameId || loading || spinning) return;
    setSpinning(true);
    try {
      const res = await api.post<any>("/api/games/cave/spin", { gameId });
      setActiveColumns(res.spinResult.columns); // Columns that advanced
      
      // Simulate spin delay
      setTimeout(() => {
        setLevels(res.levels);
        setTotalPayout(res.currentPayout);
        setActiveColumns([]);
        setSpinning(false);
        
        if (res.status === "lost") {
          toast.error("You lost all progress!");
          setGameId(null);
          onPlayed?.();
        }
      }, 1000);
    } catch (e: any) {
      toast.error(e.message || "Spin failed");
      setSpinning(false);
    }
  };

  const cashout = async () => {
    if (!gameId || loading || spinning || totalPayout <= 0) return;
    setLoading(true);
    try {
      const res = await api.post<any>("/api/games/cave/cashout", { gameId });
      toast.success(`🎉 Cashed out ${res.payout} ${activeAsset}!`);
      updateBalance(activeAsset, res.balanceAfterRaw);
      refreshWallet();
      setGameId(null);
      onPlayed?.();
    } catch (e: any) {
      toast.error(e.message || "Cashout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-6 min-h-[500px] flex flex-col items-center justify-center relative">
        <div className="text-2xl font-black text-[#00e701] mb-8">
          Total Payout: {totalPayout.toFixed(4)} {activeAsset}
        </div>

        <div className="flex gap-4 sm:gap-12">
          {COLUMNS.map((col) => {
            const currentLvl = levels[col.id as keyof typeof levels];
            const isActive = activeColumns.includes(col.id);

            return (
              <div key={col.id} className="flex flex-col items-center gap-2">
                <div className="text-[#b1bad3] font-bold uppercase text-xs mb-2">{col.name}</div>
                {/* Levels bottom to top */}
                {[...LEVELS].reverse().map((mult, i) => {
                  const levelIndex = LEVELS.length - 1 - i;
                  const isReached = currentLvl > levelIndex;
                  const isCurrent = currentLvl === levelIndex;
                  
                  return (
                    <motion.div
                      key={levelIndex}
                      animate={spinning && isActive && isCurrent ? { scale: [1, 1.2, 1], backgroundColor: ["#2f4553", col.color, "#2f4553"] } : {}}
                      transition={{ duration: 0.5, repeat: spinning ? Infinity : 0 }}
                      className={`w-16 sm:w-24 h-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base border-2 ${
                        isReached ? `bg-[${col.color}]/20 text-[${col.color}] border-[${col.color}]` :
                        isCurrent ? `bg-[${col.color}] text-white border-[${col.color}] shadow-[0_0_15px_${col.color}]` :
                        "bg-[#1a2c38] text-[#b1bad3] border-[#2f4553]"
                      }`}
                    >
                      {mult}×
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <BetPanel
          bet={bet}
          setBet={setBet}
          onBet={!gameId ? start : spin}
          playing={spinning || loading}
          betLabel={!gameId ? "Start Game" : "SPIN"}
          disabled={loading || spinning}
        >
          {gameId && (
            <Button
              onClick={cashout}
              disabled={loading || spinning || totalPayout <= 0}
              className="w-full mt-4 h-12 bg-[#00e701] hover:bg-[#00e701]/80 text-black font-bold"
            >
              CASH OUT ({totalPayout.toFixed(4)})
            </Button>
          )}
        </BetPanel>
      </div>
    </div>
  );
}

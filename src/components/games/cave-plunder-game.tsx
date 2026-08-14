"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useUiStore } from "@/store/ui";
import { useWalletStore } from "@/store/wallet";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  GameArena, GameStyles, ParticleBurst, ConfettiRain, 
  WinBanner, StreakBadge, NeonMultiplier, GAME_THEMES 
} from "./game-effects";

const LEVELS = [1, 2, 3, 5, 10, 25, 100, 1000];
const COLUMNS = [
  { id: "book", color: "#3b82f6", name: "Sapphire" },
  { id: "amulet", color: "#14b8a6", name: "Emerald" },
  { id: "cross", color: "#eab308", name: "Diamond" },
];

export function CavePlunderGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "cave-bet");
  const [gameId, setGameId] = useState<string | null>(null);
  const [levels, setLevels] = useState({ book: 0, amulet: 0, cross: 0 });
  const [spinning, setSpinning] = useState(false);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [totalPayout, setTotalPayout] = useState(0);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastWin, setLastWin] = useState<boolean | null>(null);

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
      setLastWin(null);
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
    setLastWin(null);
    try {
      const res = await api.post<any>("/api/games/cave/spin", { gameId });
      setActiveColumns(res.spinResult.columns);
      
      setTimeout(() => {
        setLevels(res.levels);
        setTotalPayout(res.currentPayout);
        setActiveColumns([]);
        setSpinning(false);
        
        if (res.status === "lost") {
          toast.error("You hit a trap and lost all progress! 💀");
          setGameId(null);
          setLastWin(false);
          setStreak(0);
          onPlayed?.();
        }
      }, 1200);
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
      setLastWin(true);
      setStreak(s => s + 1);
      onPlayed?.();
    } catch (e: any) {
      toast.error(e.message || "Cashout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameStyles />
      <GameArena gameId="cave-plunder" win={lastWin} shake={lastWin === false} className="p-6 flex flex-col items-center justify-center relative overflow-hidden" minHeight={550}>
        
        {/* Cave decorations */}
        <div className="absolute top-0 w-full flex justify-around pointer-events-none opacity-80">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[60px] border-t-[#1a1525]" style={{ transform: `scaleY(${1 + Math.random()})`, borderTopColor: i%2===0 ? '#2d2438' : '#1a1525' }} />
          ))}
        </div>
        
        <div className="absolute top-0 w-full h-full pointer-events-none">
          {[1,2,3].map(i => (
             <div key={i} className="absolute w-1.5 h-3 bg-blue-300/40 rounded-full" style={{ left: `${20*i + 15}%`, animation: `gfxParticle${i} 2s infinite linear ${i*0.5}s` }} />
          ))}
        </div>

        <div className="absolute top-4 left-4 z-30">
          <StreakBadge streak={streak} />
        </div>

        <ParticleBurst active={lastWin === true} colors={GAME_THEMES["cave-plunder"].particleColors} />
        <ConfettiRain active={lastWin === true} colors={GAME_THEMES["cave-plunder"].particleColors} />

        <div className="absolute top-6 right-6 z-20">
          <div className="text-sm font-black text-[#a78bfa] uppercase tracking-widest mb-1">Total Payout</div>
          <NeonMultiplier value={totalPayout.toFixed(4)} color="#f59e0b" size="md" />
        </div>

        <div style={{ perspective: '1000px' }} className="mt-16 z-10">
          <div style={{ transform: 'rotateX(15deg)', transformStyle: 'preserve-3d' }}>
            <div className="flex gap-4 sm:gap-12 bg-[#1a1525]/50 p-6 rounded-3xl border border-[#3b2d4a]">
              {COLUMNS.map((col) => {
                const currentLvl = levels[col.id as keyof typeof levels];
                const isActive = activeColumns.includes(col.id);

                return (
                  <div key={col.id} className="flex flex-col items-center gap-3">
                    <div className="text-[#a78bfa] font-black uppercase text-xs tracking-widest mb-2 drop-shadow-md">{col.name}</div>
                    {[...LEVELS].reverse().map((mult, i) => {
                      const levelIndex = LEVELS.length - 1 - i;
                      const isReached = currentLvl > levelIndex;
                      const isCurrent = currentLvl === levelIndex;
                      
                      return (
                        <div key={levelIndex} className="relative w-16 sm:w-24 h-12" style={{ transformStyle: 'preserve-3d' }}>
                          <motion.div
                            animate={spinning && isActive && isCurrent ? { rotateY: 180 } : { rotateY: 0 }}
                            transition={{ duration: 0.6, type: "spring" }}
                            className="w-full h-full absolute inset-0 preserve-3d"
                          >
                            {/* Chest Front (Closed) */}
                            <div 
                              className={`absolute inset-0 rounded-xl flex items-center justify-center font-black text-sm sm:text-base border-2 backface-hidden transition-all shadow-[0_4px_0_rgba(0,0,0,0.5)] ${
                                isReached ? `bg-[${col.color}]/10 text-[${col.color}] border-[${col.color}]/50 opacity-50` :
                                isCurrent ? `bg-gradient-to-b from-[#78350f] to-[#451a03] text-[#fde68a] border-[#b45309]` :
                                "bg-[#1f1624] text-[#4c3a57] border-[#2d2438]"
                              }`}
                            >
                              {isCurrent ? "🔒 " + mult + "×" : mult + "×"}
                            </div>
                            
                            {/* Chest Open (Gem or Trap) */}
                            <div 
                              className="absolute inset-0 rounded-xl flex items-center justify-center text-2xl backface-hidden border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.5)] bg-gradient-to-br from-white/20 to-transparent backdrop-blur-sm"
                              style={{ transform: 'rotateY(180deg)' }}
                            >
                              {isActive && isCurrent ? "💎" : "💀"}
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </GameArena>

      <div>
        <BetPanel
          bet={bet}
          setBet={setBet}
          onBet={!gameId ? start : spin}
          playing={spinning || loading}
          betLabel={!gameId ? "Start Plunder" : "OPEN CHESTS"}
          disabled={loading || spinning}
        >
          <AnimatePresence>
            {gameId && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Button
                  onClick={cashout}
                  disabled={loading || spinning || totalPayout <= 0}
                  className="w-full mt-4 h-14 bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#d97706] hover:to-[#b45309] text-white text-lg font-black shadow-[0_4px_0_#92400e] hover:shadow-[0_2px_0_#92400e] hover:translate-y-[2px] transition-all rounded-xl"
                >
                  ESCAPE WITH {totalPayout.toFixed(4)}
                </Button>
              </motion.div>
            )}
            {!gameId && lastWin !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <WinBanner win={lastWin} />
              </motion.div>
            )}
          </AnimatePresence>
        </BetPanel>
      </div>
    </div>
  );
}

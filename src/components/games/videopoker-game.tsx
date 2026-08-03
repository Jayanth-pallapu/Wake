"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useUiStore } from "@/store/ui";
import { useWalletStore } from "@/store/wallet";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "deal" | "hold" | "won" | "lost";
type CardInfo = { rank: string; suit: string };

export function VideopokerGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "videopoker-bet");
  const [phase, setPhase] = useState<Phase>("idle");
  const [gameId, setGameId] = useState<string | null>(null);
  const [cards, setCards] = useState<(CardInfo | null)[]>(Array(5).fill(null));
  const [held, setHeld] = useState<boolean[]>(Array(5).fill(false));
  const [handRank, setHandRank] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const activeAsset = useUiStore((s) => s.activeAsset);
  const updateBalance = useWalletStore((s) => s.updateBalance);
  const refreshWallet = useWalletStore((s) => s.refresh);

  const getCardColor = (suit: string) => (suit === "♥" || suit === "♦" ? "text-red-500" : "text-slate-800");

  const deal = async () => {
    if (loading) return;
    setLoading(true);
    setPhase("deal");
    setCards(Array(5).fill(null));
    setHeld(Array(5).fill(false));
    setHandRank(null);
    try {
      const res = await api.post<any>("/api/games/videopoker/start", { betRaw: toRaw(bet), asset: activeAsset });
      setGameId(res.gameId);
      setCards(res.hand);
      setPhase("hold");
      updateBalance(activeAsset, res.balanceAfterRaw);
      refreshWallet();
    } catch (e: any) {
      toast.error(e.message || "Failed to deal");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  };

  const draw = async () => {
    if (loading || !gameId || phase !== "hold") return;
    setLoading(true);
    try {
      const res = await api.post<any>("/api/games/videopoker/draw", { gameId, hold: held });
      setCards(res.hand);
      setHandRank(res.rankName);
      setPhase(res.win ? "won" : "lost");
      if (res.win) {
        toast.success(`🎉 Won ${(bet * res.multiplier).toFixed(4)} ${activeAsset} (${res.multiplier}x)!`);
        updateBalance(activeAsset, res.balanceAfterRaw);
        refreshWallet();
      }
      onPlayed?.();
    } catch (e: any) {
      toast.error(e.message || "Draw failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleHold = (index: number) => {
    if (phase !== "hold") return;
    const newHeld = [...held];
    newHeld[index] = !newHeld[index];
    setHeld(newHeld);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-6 min-h-[400px] flex flex-col items-center justify-center relative">
        {handRank && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`absolute top-6 px-6 py-2 rounded-full text-xl font-black shadow-lg ${phase === "won" ? "bg-[#00e701] text-black" : "bg-[#2f4553] text-[#b1bad3]"}`}
          >
            {handRank}
          </motion.div>
        )}

        <div className="flex gap-2 sm:gap-4 mt-12 mb-8">
          {cards.map((c, i) => (
            <div key={i} className="flex flex-col items-center cursor-pointer" onClick={() => toggleHold(i)}>
              <div className="text-xs font-bold text-[#b1bad3] mb-2 h-4">
                {held[i] && phase === "hold" && "HOLD"}
              </div>
              <motion.div
                initial={false}
                animate={c ? { rotateY: 0 } : { rotateY: 180 }}
                transition={{ duration: 0.3 }}
                className={`relative w-[70px] sm:w-[100px] h-[100px] sm:h-[140px] rounded-lg sm:rounded-xl shadow-lg border-2 flex flex-col items-center justify-center preserve-3d ${held[i] ? "border-[#00e701] -translate-y-4" : "border-transparent"}`}
                style={{ backgroundColor: c ? "white" : "#2f4553" }}
              >
                {c && (
                  <>
                    <div className={`absolute top-1 sm:top-2 left-1 sm:left-2 text-sm sm:text-xl font-bold ${getCardColor(c.suit)}`}>{c.rank}</div>
                    <div className={`text-3xl sm:text-5xl ${getCardColor(c.suit)}`}>{c.suit}</div>
                    <div className={`absolute bottom-1 sm:bottom-2 right-1 sm:right-2 text-sm sm:text-xl font-bold rotate-180 ${getCardColor(c.suit)}`}>{c.rank}</div>
                  </>
                )}
                {!c && <div className="absolute inset-0 bg-[#213743] rounded-lg" />}
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <BetPanel
          bet={bet}
          setBet={setBet}
          onBet={phase === "hold" ? draw : deal}
          playing={loading}
          betLabel={phase === "hold" ? "Draw" : "Deal"}
          disabled={loading}
        />
        <div className="mt-4 bg-[#0f212e] rounded-lg p-4">
          <div className="text-xs font-bold text-[#b1bad3] uppercase mb-2">Paytable</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-white"><span>Royal Flush</span><span className="text-[#00e701]">800×</span></div>
            <div className="flex justify-between text-[#b1bad3]"><span>Straight Flush</span><span>50×</span></div>
            <div className="flex justify-between text-[#b1bad3]"><span>Four of a Kind</span><span>25×</span></div>
            <div className="flex justify-between text-[#b1bad3]"><span>Full House</span><span>9×</span></div>
            <div className="flex justify-between text-[#b1bad3]"><span>Flush</span><span>6×</span></div>
            <div className="flex justify-between text-[#b1bad3]"><span>Straight</span><span>4×</span></div>
            <div className="flex justify-between text-[#b1bad3]"><span>Three of a Kind</span><span>3×</span></div>
            <div className="flex justify-between text-[#b1bad3]"><span>Two Pair</span><span>2×</span></div>
            <div className="flex justify-between text-[#b1bad3]"><span>Jacks or Better</span><span>1×</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

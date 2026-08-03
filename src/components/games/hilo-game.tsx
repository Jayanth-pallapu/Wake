"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui";
import { useWalletStore } from "@/store/wallet";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { ChevronUp, ChevronDown } from "lucide-react";

type Phase = "idle" | "playing" | "won" | "lost";

export function HiloGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "hilo-bet");
  const [phase, setPhase] = useState<Phase>("idle");
  const [gameId, setGameId] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState<{ rank: string; suit: string; val: number } | null>(null);
  const [history, setHistory] = useState<{ rank: string; suit: string }[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);
  const activeAsset = useUiStore((s) => s.activeAsset);
  const refreshWallet = useWalletStore((s) => s.refresh);
  const updateBalance = useWalletStore((s) => s.updateBalance);

  const getCardColor = (suit: string) => (suit === "♥" || suit === "♦" ? "text-red-500" : "text-slate-800");

  const start = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post<any>("/api/games/hilo/start", { betRaw: toRaw(bet), asset: activeAsset });
      setGameId(res.gameId);
      setCurrentCard(res.startCard);
      setHistory([res.startCard]);
      setMultiplier(1);
      setPhase("playing");
      updateBalance(activeAsset, res.balanceAfterRaw);
      refreshWallet();
    } catch (e: any) {
      toast.error(e.message || "Failed to start game");
    } finally {
      setLoading(false);
    }
  };

  const action = async (act: "higher" | "lower" | "cashout") => {
    if (loading || !gameId || phase !== "playing") return;
    setLoading(true);
    try {
      const res = await api.post<any>("/api/games/hilo/action", { gameId, action: act });
      if (act === "cashout" || res.status === "won" || res.status === "lost") {
        setPhase(res.status || (act === "cashout" ? "won" : "lost"));
        if (res.card) {
          setCurrentCard(res.card);
          setHistory((h) => [...h, res.card].slice(-6));
        }
        if (res.status === "won" || act === "cashout") {
          toast.success(`🎉 Won ${(bet * res.multiplier).toFixed(4)} ${activeAsset} (${res.multiplier.toFixed(2)}x)!`);
          updateBalance(activeAsset, res.balanceAfterRaw);
          refreshWallet();
        }
        onPlayed?.();
      } else {
        setCurrentCard(res.card);
        setHistory((h) => [...h, res.card].slice(-6));
        setMultiplier(res.multiplier);
      }
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-6 min-h-[400px] flex flex-col items-center justify-center relative">
        <div className="absolute top-4 left-4 flex gap-1">
          {history.map((c, i) => (
            <div key={i} className="w-8 h-12 bg-white rounded flex items-center justify-center text-xs font-bold shadow">
              <span className={getCardColor(c.suit)}>{c.rank}{c.suit}</span>
            </div>
          ))}
        </div>
        
        <div className="text-xl font-bold text-[#b1bad3] mb-4">
          Multiplier: <span className="text-[#00e701]">{multiplier.toFixed(2)}×</span>
        </div>

        <div className="relative w-[140px] h-[200px] mb-8 perspective-1000">
          <AnimatePresence mode="popLayout">
            {currentCard && (
              <motion.div
                key={currentCard.rank + currentCard.suit + history.length}
                initial={{ rotateY: 90, scale: 0.8, opacity: 0 }}
                animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                exit={{ rotateY: -90, scale: 0.8, opacity: 0 }}
                className="absolute inset-0 bg-white rounded-xl shadow-xl flex flex-col items-center justify-center border-4 border-slate-100"
              >
                <div className={`absolute top-2 left-2 text-xl font-bold ${getCardColor(currentCard.suit)}`}>
                  {currentCard.rank}
                </div>
                <div className={`text-6xl ${getCardColor(currentCard.suit)}`}>
                  {currentCard.suit}
                </div>
                <div className={`absolute bottom-2 right-2 text-xl font-bold rotate-180 ${getCardColor(currentCard.suit)}`}>
                  {currentCard.rank}
                </div>
              </motion.div>
            )}
            {!currentCard && (
              <div className="absolute inset-0 bg-[#2f4553] rounded-xl shadow-xl flex items-center justify-center border-4 border-[#1a2c38]">
                <div className="w-16 h-16 rounded-full bg-[#1a2c38] opacity-50" />
              </div>
            )}
          </AnimatePresence>
        </div>

        {phase === "playing" && (
          <div className="flex gap-4">
            <Button onClick={() => action("higher")} disabled={loading} className="bg-[#1475e1] hover:bg-[#1475e1]/80 h-12 px-6">
              Higher <ChevronUp className="ml-2 w-5 h-5" />
            </Button>
            <Button onClick={() => action("lower")} disabled={loading} className="bg-[#ff5c5c] hover:bg-[#ff5c5c]/80 h-12 px-6">
              Lower <ChevronDown className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}
        {(phase === "won" || phase === "lost") && (
          <div className={`text-2xl font-bold ${phase === "won" ? "text-[#00e701]" : "text-[#ff5c5c]"}`}>
            {phase === "won" ? "YOU WON!" : "YOU LOST!"}
          </div>
        )}
      </div>

      <div>
        <BetPanel
          bet={bet}
          setBet={setBet}
          onBet={start}
          playing={phase === "playing"}
          betLabel={phase === "playing" ? "Playing..." : "Place Bet"}
          disabled={loading}
        >
          {phase === "playing" && (
            <Button
              onClick={() => action("cashout")}
              disabled={loading || history.length <= 1}
              className="w-full mt-4 h-12 bg-[#00e701] hover:bg-[#00e701]/80 text-black font-bold"
            >
              Cash Out {(bet * multiplier).toFixed(4)}
            </Button>
          )}
        </BetPanel>
      </div>
    </div>
  );
}

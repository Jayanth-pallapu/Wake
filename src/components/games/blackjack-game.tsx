"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useUiStore } from "@/store/ui";
import { useWalletStore } from "@/store/wallet";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "playing" | "dealerTurn" | "ended";
type CardInfo = { rank: string; suit: string };

export function BlackjackGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "blackjack-bet");
  const [phase, setPhase] = useState<Phase>("idle");
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerHand, setPlayerHand] = useState<CardInfo[]>([]);
  const [dealerHand, setDealerHand] = useState<CardInfo[]>([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const activeAsset = useUiStore((s) => s.activeAsset);
  const updateBalance = useWalletStore((s) => s.updateBalance);
  const refreshWallet = useWalletStore((s) => s.refresh);

  const getCardColor = (suit: string) => (suit === "♥" || suit === "♦" ? "text-red-500" : "text-slate-800");

  const start = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post<any>("/api/games/blackjack/start", { betRaw: toRaw(bet), asset: activeAsset });
      setGameId(res.gameId);
      setPlayerHand(res.playerHand);
      setDealerHand(res.dealerHand);
      setPlayerTotal(res.playerTotal);
      setDealerTotal(res.dealerTotal);
      setResult(res.result);
      setPhase(res.status === "playing" ? "playing" : "ended");
      
      updateBalance(activeAsset, res.balanceAfterRaw);
      refreshWallet();
      
      if (res.status === "ended") {
        handleEnd(res);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to start game");
    } finally {
      setLoading(false);
    }
  };

  const action = async (act: "hit" | "stand" | "double") => {
    if (loading || !gameId || phase !== "playing") return;
    setLoading(true);
    try {
      const res = await api.post<any>("/api/games/blackjack/action", { gameId, action: act });
      setPlayerHand(res.playerHand);
      setDealerHand(res.dealerHand);
      setPlayerTotal(res.playerTotal);
      setDealerTotal(res.dealerTotal);
      setResult(res.result);
      
      if (res.status === "ended") {
        setPhase("ended");
        handleEnd(res);
      } else {
        setPhase("playing");
      }
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = (res: any) => {
    if (res.win) {
      toast.success(`🎉 Won ${res.payout} ${activeAsset}!`);
      updateBalance(activeAsset, res.balanceAfterRaw);
      refreshWallet();
    }
    onPlayed?.();
  };

  const CardRow = ({ cards, total, label, hideSecond }: { cards: CardInfo[]; total: number; label: string; hideSecond?: boolean }) => (
    <div className="flex flex-col items-center">
      <div className="text-[#b1bad3] font-bold mb-2 uppercase text-xs">{label} - {hideSecond ? "?" : total}</div>
      <div className="flex gap-2 relative h-[95px] justify-center">
        {cards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-[70px] h-[95px] rounded-lg shadow-md border-2 bg-white flex flex-col items-center justify-center relative"
            style={{ 
              marginLeft: i > 0 ? "-30px" : "0", 
              backgroundColor: hideSecond && i === 1 ? "#2f4553" : "white" 
            }}
          >
            {!(hideSecond && i === 1) && (
              <>
                <div className={`absolute top-1 left-1 text-xs font-bold ${getCardColor(c.suit)}`}>{c.rank}</div>
                <div className={`text-2xl ${getCardColor(c.suit)}`}>{c.suit}</div>
                <div className={`absolute bottom-1 right-1 text-xs font-bold rotate-180 ${getCardColor(c.suit)}`}>{c.rank}</div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-6 min-h-[450px] flex flex-col items-center justify-between relative">
        {phase === "ended" && result && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-8 py-3 rounded-full text-2xl font-black uppercase shadow-2xl bg-[#1a2c38] text-white border-2 border-[#2f4553]">
            {result}
          </div>
        )}

        <div className="w-full flex-1 flex flex-col justify-around py-8">
          <CardRow cards={dealerHand} total={dealerTotal} label="Dealer" hideSecond={phase === "playing" && dealerHand.length === 2} />
          <CardRow cards={playerHand} total={playerTotal} label="Player" />
        </div>
      </div>

      <div>
        <BetPanel
          bet={bet}
          setBet={setBet}
          onBet={start}
          playing={phase === "playing" || loading}
          betLabel={phase === "playing" ? "Playing" : "Deal"}
          disabled={loading || phase === "playing"}
        >
          {phase === "playing" && (
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex gap-2">
                <Button onClick={() => action("hit")} disabled={loading} className="flex-1 bg-[#00e701] hover:bg-[#00e701]/80 text-black font-bold">
                  HIT
                </Button>
                <Button onClick={() => action("stand")} disabled={loading} className="flex-1 bg-[#ff5c5c] hover:bg-[#ff5c5c]/80 font-bold">
                  STAND
                </Button>
              </div>
              <Button onClick={() => action("double")} disabled={loading || playerHand.length > 2} className="w-full bg-[#1475e1] hover:bg-[#1475e1]/80 font-bold">
                DOUBLE DOWN
              </Button>
            </div>
          )}
        </BetPanel>
      </div>
    </div>
  );
}

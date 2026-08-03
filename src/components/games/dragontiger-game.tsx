"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";

type Selection = "dragon" | "tie" | "tiger";
type CardInfo = { rank: string; suit: string };

export function DragontigerGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "dragontiger-bet");
  const [selection, setSelection] = useState<Selection>("dragon");
  const [playing, setPlaying] = useState(false);
  const [dragonCard, setDragonCard] = useState<CardInfo | null>(null);
  const [tigerCard, setTigerCard] = useState<CardInfo | null>(null);
  const [winner, setWinner] = useState<Selection | null>(null);
  const { play } = useGame();

  const getCardColor = (suit: string) => (suit === "♥" || suit === "♦" ? "text-red-500" : "text-slate-800");

  const handleBet = async () => {
    if (playing) return;
    setPlaying(true);
    setDragonCard(null);
    setTigerCard(null);
    setWinner(null);

    const res = await play("dragontiger", { bet: selection }, toRaw(bet));
    if (res) {
      setTimeout(() => {
        setDragonCard(res.bet.outcome.dragonCard as CardInfo);
        setTigerCard(res.bet.outcome.tigerCard as CardInfo);
        setWinner(res.bet.outcome.winner as Selection);
        setPlaying(false);
        onPlayed?.();
      }, 1000);
    } else {
      setPlaying(false);
    }
  };

  const CardView = ({ card }: { card: CardInfo | null }) => (
    <div className="w-[120px] h-[170px] relative perspective-1000">
      <motion.div
        animate={card ? { rotateY: 0 } : { rotateY: 180 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full preserve-3d"
      >
        <div className="absolute inset-0 bg-[#2f4553] rounded-xl border-4 border-[#1a2c38] backface-hidden" style={{ transform: "rotateY(180deg)" }} />
        {card && (
          <div className="absolute inset-0 bg-white rounded-xl border-4 border-slate-200 flex flex-col items-center justify-center backface-hidden">
            <div className={`absolute top-2 left-2 text-lg font-bold ${getCardColor(card.suit)}`}>{card.rank}</div>
            <div className={`text-5xl ${getCardColor(card.suit)}`}>{card.suit}</div>
            <div className={`absolute bottom-2 right-2 text-lg font-bold rotate-180 ${getCardColor(card.suit)}`}>{card.rank}</div>
          </div>
        )}
      </motion.div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-6 min-h-[400px] flex flex-col items-center justify-center relative">
        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-8 px-6 py-2 rounded-full bg-[#ffd23f] text-black text-2xl font-black shadow-lg uppercase z-10"
            >
              {winner === "tie" ? "TIE!" : `${winner} WINS!`}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-16 items-center">
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-4 font-black text-red-500 tracking-wider">DRAGON 🐉</div>
            <CardView card={dragonCard} />
          </div>
          <div className="text-4xl font-black text-[#2f4553]">VS</div>
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-4 font-black text-yellow-500 tracking-wider">TIGER 🐅</div>
            <CardView card={tigerCard} />
          </div>
        </div>
      </div>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={playing} betLabel="Place Bet">
          <div className="flex flex-col gap-2 mb-4">
            <Button
              variant="outline"
              className={`h-12 font-bold ${selection === "dragon" ? "bg-red-500/20 text-red-500 border-red-500" : "bg-transparent text-[#b1bad3] border-[#2f4553]"}`}
              onClick={() => setSelection("dragon")}
              disabled={playing}
            >
              DRAGON 🐉 (1.95×)
            </Button>
            <Button
              variant="outline"
              className={`h-10 font-bold ${selection === "tie" ? "bg-green-500/20 text-green-500 border-green-500" : "bg-transparent text-[#b1bad3] border-[#2f4553]"}`}
              onClick={() => setSelection("tie")}
              disabled={playing}
            >
              TIE (8.00×)
            </Button>
            <Button
              variant="outline"
              className={`h-12 font-bold ${selection === "tiger" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500" : "bg-transparent text-[#b1bad3] border-[#2f4553]"}`}
              onClick={() => setSelection("tiger")}
              disabled={playing}
            >
              TIGER 🐅 (1.95×)
            </Button>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

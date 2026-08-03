"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";

type Selection = "player" | "tie" | "banker";
type CardInfo = { rank: string; suit: string };

export function BaccaratGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "baccarat-bet");
  const [selection, setSelection] = useState<Selection>("player");
  const [playing, setPlaying] = useState(false);
  const [playerCards, setPlayerCards] = useState<CardInfo[]>([]);
  const [bankerCards, setBankerCards] = useState<CardInfo[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [bankerScore, setBankerScore] = useState(0);
  const [winner, setWinner] = useState<Selection | null>(null);
  const [history, setHistory] = useState<Selection[]>([]);
  const { play } = useGame();

  const getCardColor = (suit: string) => (suit === "♥" || suit === "♦" ? "text-red-500" : "text-slate-800");

  const handleBet = async () => {
    if (playing) return;
    setPlaying(true);
    setPlayerCards([]);
    setBankerCards([]);
    setWinner(null);

    const res = await play("baccarat", { bet: selection }, toRaw(bet));
    if (res) {
      setTimeout(() => {
        const out = res.bet.outcome;
        setPlayerCards(out.playerCards as CardInfo[]);
        setBankerCards(out.bankerCards as CardInfo[]);
        setPlayerScore(out.playerScore as number);
        setBankerScore(out.bankerScore as number);
        const w = out.winner as Selection;
        setWinner(w);
        setHistory((h) => [...h, w].slice(-8));
        setPlaying(false);
        onPlayed?.();
      }, 1000);
    } else {
      setPlaying(false);
    }
  };

  const CardStack = ({ cards }: { cards: CardInfo[] }) => (
    <div className="flex gap-2 min-h-[140px] justify-center relative">
      {cards.map((c, i) => (
        <motion.div
          key={i}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.2 }}
          className="w-[90px] h-[130px] bg-white rounded-xl shadow-lg border-2 border-slate-200 flex flex-col items-center justify-center relative"
        >
          <div className={`absolute top-2 left-2 text-sm font-bold ${getCardColor(c.suit)}`}>{c.rank}</div>
          <div className={`text-4xl ${getCardColor(c.suit)}`}>{c.suit}</div>
          <div className={`absolute bottom-2 right-2 text-sm font-bold rotate-180 ${getCardColor(c.suit)}`}>{c.rank}</div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-6 min-h-[450px] flex flex-col justify-between relative">
        <div className="absolute top-4 right-4 flex gap-1">
          {history.map((w, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${w === "player" ? "bg-blue-500" : w === "banker" ? "bg-red-500" : "bg-green-500"}`}
              title={w}
            />
          ))}
        </div>

        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-8 py-2 rounded-full text-2xl font-black shadow-xl uppercase border-2 ${
                winner === "player" ? "bg-blue-500/20 text-blue-500 border-blue-500" :
                winner === "banker" ? "bg-red-500/20 text-red-500 border-red-500" :
                "bg-green-500/20 text-green-500 border-green-500"
              }`}
            >
              {winner === "tie" ? "TIE" : `${winner} WINS`}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 grid grid-cols-2 gap-8 items-center mt-8">
          <div className="flex flex-col items-center">
            <div className="text-xl font-bold text-blue-500 mb-6 tracking-wider">PLAYER</div>
            <CardStack cards={playerCards} />
            <div className="mt-6 text-3xl font-bold text-white bg-[#1a2c38] w-12 h-12 flex items-center justify-center rounded-full border-2 border-blue-500">{playerScore}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xl font-bold text-red-500 mb-6 tracking-wider">BANKER</div>
            <CardStack cards={bankerCards} />
            <div className="mt-6 text-3xl font-bold text-white bg-[#1a2c38] w-12 h-12 flex items-center justify-center rounded-full border-2 border-red-500">{bankerScore}</div>
          </div>
        </div>
      </div>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={playing} betLabel="Deal">
          <div className="flex flex-col gap-2 mb-4">
            <Button
              variant="outline"
              className={`h-12 font-bold ${selection === "player" ? "bg-blue-500/20 text-blue-500 border-blue-500" : "bg-transparent text-[#b1bad3] border-[#2f4553]"}`}
              onClick={() => setSelection("player")}
              disabled={playing}
            >
              PLAYER (1.95×)
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
              className={`h-12 font-bold ${selection === "banker" ? "bg-red-500/20 text-red-500 border-red-500" : "bg-transparent text-[#b1bad3] border-[#2f4553]"}`}
              onClick={() => setSelection("banker")}
              disabled={playing}
            >
              BANKER (1.90×)
            </Button>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

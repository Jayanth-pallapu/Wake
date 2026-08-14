"use client";
import { useState } from "react";
import { BetPanel, useBetAmount, toRaw } from "@/components/games/bet-panel";
import { useGame } from "@/hooks/use-slot-game";
import { SlotReel } from "./slot-reel";

const SYMBOLS = ['🎣','🐟','🦈','🎖','💰','🪙','🃏','⚡'];

export function BigBassBonanzaGame() {
  const [bet, setBet] = useBetAmount(10, "big-bass-bonanza-bet");
  const { play, playing } = useGame();
  const [spinning, setSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [finalSymbols, setFinalSymbols] = useState<string[]>(Array(5).fill(SYMBOLS[0]));

  const onSpin = async () => {
    if (spinning || playing) return;
    setWinAmount(null);
    setSpinning(true);

    const result = await play("big-bass-bonanza", {}, toRaw(bet));

    const newSymbols = Array.from({ length: 5 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    if (result && result.bet.win) {
      const winSym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      newSymbols[0] = winSym;
      newSymbols[1] = winSym;
      newSymbols[2] = winSym;
    }

    setTimeout(() => {
      setFinalSymbols(newSymbols);
    }, 500);

    setTimeout(() => {
      setSpinning(false);
      if (result?.bet.win) {
        setWinAmount(result.bet.payout);
      }
    }, 500 + (5 * 300));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="relative flex flex-col items-center justify-center p-8 bg-gradient-to-b from-cyan-800 to-blue-900 rounded-xl border border-[#2f4553] min-h-[400px] overflow-hidden">
        {winAmount && !spinning && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 backdrop-blur-sm pointer-events-none animate-in fade-in zoom-in duration-300">
            <div className="text-center drop-shadow-[0_0_20px_rgba(255,215,0,0.8)] bg-black/60 px-8 py-4 rounded-3xl border-2 border-yellow-400">
              <div className="text-4xl font-black text-yellow-400 mb-2">WINNER!</div>
              <div className="text-3xl font-bold text-white">+{winAmount.toFixed(4)}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 z-10 w-full max-w-2xl px-4 p-6 bg-black/40 rounded-xl border-4 border-black/60 shadow-[0_0_30px_rgba(0,0,0,0.5)_inset]">
          {finalSymbols.map((sym, i) => (
            <div key={i} className="flex-1">
              <SlotReel
                symbols={SYMBOLS}
                finalSymbol={sym}
                spinning={spinning}
                delay={500 + (i * 300)}
                size={54}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1a2c38] p-4 rounded-xl border border-[#2f4553]">
        <BetPanel
          bet={bet}
          setBet={setBet}
          onBet={onSpin}
          playing={playing || spinning}
          betLabel={spinning ? "SPINNING..." : "SPIN"}
        />
      </div>
    </div>
  );
}

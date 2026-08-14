"use client";
import { useState, useEffect } from "react";
import { BetPanel, useBetAmount, toRaw } from "@/components/games/bet-panel";
import { useGame } from "@/hooks/use-slot-game";
import { useUiStore } from "@/store/ui";

const SYMBOLS = ['🧁','🍰','🍩','🍫','🍬','🍭','⭐','💎'];

export function SugarRushGame() {
  const [bet, setBet] = useBetAmount(10, "sugar-rush-bet");
  const { play, playing } = useGame();
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState<string[][]>([]);
  const [winAmount, setWinAmount] = useState<number | null>(null);

  useEffect(() => {
    const initGrid = Array.from({ length: 7 }, () =>
      Array.from({ length: 7 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
    );
    setGrid(initGrid);
  }, []);

  const onSpin = async () => {
    if (spinning || playing) return;
    setWinAmount(null);
    setSpinning(true);
    
    let shuffleInterval = setInterval(() => {
      setGrid(Array.from({ length: 7 }, () =>
        Array.from({ length: 7 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
      ));
    }, 150);

    const result = await play("sugar-rush", {}, toRaw(bet));

    setTimeout(() => {
      clearInterval(shuffleInterval);
      setSpinning(false);
      
      if (result) {
        const finalGrid = Array.from({ length: 7 }, () =>
          Array.from({ length: 7 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
        );
        
        if (result.bet.win) {
          const winSym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          for(let r=0; r<7; r++) {
             for(let c=0; c<7; c++) {
                if (Math.random() > 0.6) finalGrid[r][c] = winSym;
             }
          }
          setWinAmount(result.bet.payout);
        }
        setGrid(finalGrid);
      }
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-fuchsia-500/80 to-purple-800/80 rounded-xl border border-[#2f4553] min-h-[400px] overflow-hidden">
        {winAmount && !spinning && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm pointer-events-none animate-in fade-in zoom-in duration-300">
            <div className="text-center drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">
              <div className="text-5xl font-black text-yellow-400 mb-2">BIG WIN!</div>
              <div className="text-4xl font-bold text-white">+{winAmount.toFixed(4)}</div>
            </div>
          </div>
        )}

        <div className="grid gap-1 z-10" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
          {grid.map((row, rIdx) =>
            row.map((sym, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`w-10 h-10 md:w-14 md:h-14 bg-black/40 backdrop-blur-md rounded-lg flex items-center justify-center text-2xl md:text-3xl shadow-inner border border-white/10 ${spinning ? 'animate-pulse' : 'transition-transform hover:scale-110'}`}
              >
                {sym}
              </div>
            ))
          )}
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

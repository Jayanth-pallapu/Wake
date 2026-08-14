"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import { 
  GameArena, GameStyles, Card3D, ParticleBurst, ConfettiRain, 
  WinBanner, StreakBadge, NeonMultiplier, GAME_THEMES 
} from "./game-effects";

type Selection = "player" | "tie" | "banker";
type CardInfo = { rank: string; suit: "♠" | "♥" | "♦" | "♣" };

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
  const [streak, setStreak] = useState(0);
  const { play } = useGame();

  const lastWin = winner ? (winner === selection || (winner === "tie" && selection === "tie") ? true : false) : null;
  const isNatural = (playerScore === 8 || playerScore === 9 || bankerScore === 8 || bankerScore === 9) && winner !== null;

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
        
        if (w === selection || (w === "tie" && selection === "tie")) {
          setStreak(s => s + 1);
        } else {
          setStreak(0);
        }
        
        setPlaying(false);
        onPlayed?.();
      }, 1000);
    } else {
      setPlaying(false);
    }
  };

  const CardStack = ({ cards, isWinner }: { cards: CardInfo[]; isWinner: boolean }) => (
    <div className="flex justify-center h-[120px]" style={{ perspective: '800px' }}>
      {cards.map((c, i) => (
        <div key={i} className="relative" style={{ marginLeft: i > 0 ? "-30px" : "0", zIndex: i }}>
          <Card3D 
            card={c} 
            lifted={isWinner && lastWin === true} 
            delay={i * 0.15}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameStyles />
      <GameArena gameId="baccarat" win={lastWin} shake={lastWin === false} className="p-6 overflow-hidden">
        
        <div className="absolute top-4 left-4 z-30">
          <StreakBadge streak={streak} />
        </div>

        <div className="absolute top-4 right-4 flex gap-1 z-30 bg-[#120810]/80 p-2 rounded-xl border border-[#2f4553]">
          {history.map((w, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full shadow-inner ${w === "player" ? "bg-blue-500" : w === "banker" ? "bg-red-500" : "bg-green-500"}`}
              title={w}
            />
          ))}
        </div>

        <ParticleBurst active={lastWin === true} colors={GAME_THEMES.baccarat.particleColors} />
        <ConfettiRain active={lastWin === true} colors={GAME_THEMES.baccarat.particleColors} />

        {isNatural && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
            <NeonMultiplier value="NATURAL!" color="#ffd23f" size="md" />
          </div>
        )}

        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch mt-12 h-full z-10 relative">
          
          {/* Player Zone */}
          <div className={`rounded-2xl p-6 flex flex-col items-center justify-between transition-all duration-500 ${winner === "player" ? "scale-[1.02] shadow-[0_0_40px_rgba(59,130,246,0.3)] border-2 border-blue-500/50" : "border-2 border-transparent"}`} style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b)' }}>
            <div className="text-2xl font-black text-blue-500 tracking-widest drop-shadow-[0_0_10px_#3b82f6]">PLAYER</div>
            <CardStack cards={playerCards} isWinner={winner === "player"} />
            <div className="text-5xl font-black text-white bg-blue-900/50 w-20 h-20 flex items-center justify-center rounded-full border-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              {playerScore}
            </div>
          </div>

          {/* Tie Divider */}
          <div className="flex flex-col items-center justify-center relative">
            <div className={`h-full w-24 rounded-full flex items-center justify-center transition-all ${winner === "tie" ? "bg-green-900/40 shadow-[0_0_30px_rgba(34,197,94,0.3)] border-2 border-green-500/50" : ""}`} style={{ background: winner === "tie" ? 'linear-gradient(135deg,#0f1a0f,#14532d)' : 'transparent' }}>
              <div className="text-xl font-black text-green-500 rotate-90 tracking-widest">TIE</div>
            </div>
          </div>

          {/* Banker Zone */}
          <div className={`rounded-2xl p-6 flex flex-col items-center justify-between transition-all duration-500 ${winner === "banker" ? "scale-[1.02] shadow-[0_0_40px_rgba(239,68,68,0.3)] border-2 border-red-500/50" : "border-2 border-transparent"}`} style={{ background: 'linear-gradient(135deg,#1a0f1a,#4c1d95)' }}>
            <div className="text-2xl font-black text-red-500 tracking-widest drop-shadow-[0_0_10px_#ef4444]">BANKER</div>
            <CardStack cards={bankerCards} isWinner={winner === "banker"} />
            <div className="text-5xl font-black text-white bg-red-900/50 w-20 h-20 flex items-center justify-center rounded-full border-4 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              {bankerScore}
            </div>
          </div>

        </div>
      </GameArena>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={playing} betLabel="Deal">
          <div className="flex flex-col gap-3 mb-4">
            <Button
              variant="outline"
              className={`h-14 text-lg font-black tracking-wider transition-all ${selection === "player" ? "bg-blue-500/20 text-blue-500 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-[#1a2c38] text-[#b1bad3] border-[#2f4553] hover:border-blue-500/50"}`}
              onClick={() => setSelection("player")}
              disabled={playing}
            >
              PLAYER (1.95×)
            </Button>
            <Button
              variant="outline"
              className={`h-12 text-md font-black tracking-wider transition-all ${selection === "tie" ? "bg-green-500/20 text-green-400 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "bg-[#1a2c38] text-[#b1bad3] border-[#2f4553] hover:border-green-500/50"}`}
              onClick={() => setSelection("tie")}
              disabled={playing}
            >
              TIE (8.00×)
            </Button>
            <Button
              variant="outline"
              className={`h-14 text-lg font-black tracking-wider transition-all ${selection === "banker" ? "bg-red-500/20 text-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-[#1a2c38] text-[#b1bad3] border-[#2f4553] hover:border-red-500/50"}`}
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

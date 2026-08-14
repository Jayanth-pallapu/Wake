"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { 
  GameArena, GameStyles, ParticleBurst, WinBanner, StreakBadge, NeonMultiplier, GAME_THEMES 
} from "./game-effects";

export function FastcrashGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "fastcrash-bet");
  const [target, setTarget] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [displayMult, setDisplayMult] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [win, setWin] = useState<boolean | null>(null);
  const [history, setHistory] = useState<{ cp: number; won: boolean }[]>([]);
  const [streak, setStreak] = useState(0);
  const { play } = useGame();

  const handleBet = async () => {
    if (playing || target < 1.01) return;
    setPlaying(true);
    setCrashPoint(null);
    setWin(null);
    setDisplayMult(1.00);

    const res = await play("fastcrash", { target }, toRaw(bet));
    if (!res) {
      setPlaying(false);
      return;
    }

    const cp = res.bet.outcome.crashPoint as number;
    const isWin = res.bet.win;
    const endVal = isWin ? target : cp;

    const duration = 700;
    const start = performance.now();
    
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // Easing out cubic
      const easedT = 1 - Math.pow(1 - t, 3);
      setDisplayMult(1 + (endVal - 1) * easedT);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setCrashPoint(cp);
        setWin(isWin);
        setHistory((h) => [{ cp, won: isWin }, ...h].slice(0, 15));
        if (isWin) setStreak(s => s + 1);
        else setStreak(0);
        setPlaying(false);
        onPlayed?.();
      }
    };
    requestAnimationFrame(animate);
  };

  const isCrashed = win === false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <GameStyles />
      <GameArena gameId="fastcrash" win={win} shake={isCrashed} minHeight={320} className="p-6 flex flex-col items-center justify-center">
        
        <div className="absolute top-4 left-4 z-30">
          <StreakBadge streak={streak} />
        </div>

        <div className="absolute top-4 right-4 flex gap-1.5 flex-wrap w-2/3 justify-end z-20">
          {history.map((h, i) => (
            <div key={i} className={`text-xs px-2.5 py-1 rounded-md font-black shadow-sm ${h.won ? "bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30" : "bg-[#ff5c5c]/20 text-[#ff5c5c] border border-[#ff5c5c]/30"}`}>
              {h.cp.toFixed(2)}×
            </div>
          ))}
        </div>

        {/* Speed lines */}
        {playing && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
            {[20, 40, 60, 80].map((top, i) => (
              <div 
                key={i} 
                className="absolute h-1 bg-[#00ff88] blur-sm rounded-full"
                style={{ 
                  top: `${top}%`, 
                  width: `${50 + Math.random() * 100}px`,
                  animation: `gfxParticle0 ${0.2 + Math.random() * 0.3}s linear infinite`,
                  left: '100%'
                }} 
              />
            ))}
          </div>
        )}

        <ParticleBurst active={win === true || isCrashed} colors={GAME_THEMES.fastcrash.particleColors} />

        <div className="relative z-10 flex flex-col items-center">
          {/* Lightning Bolt */}
          <motion.svg 
            width="120" height="120" viewBox="0 0 24 24" fill="none" 
            stroke={isCrashed ? "#ff5c5c" : "#00ff88"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ 
              filter: `drop-shadow(0 0 15px ${isCrashed ? '#ff5c5c' : '#00ff88'})`,
              animation: playing ? 'gfxFlicker 0.2s infinite' : 'none'
            }}
            animate={isCrashed ? { rotate: [0, -20, 20, 0], scale: [1, 1.2, 0.8, 1], opacity: [1, 0.5, 0] } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={isCrashed ? "#ff5c5c" : "#00ff88"} fillOpacity="0.2" />
          </motion.svg>

          <NeonMultiplier value={displayMult.toFixed(2) + "×"} color={win === true ? "#00ff88" : win === false ? "#ff5c5c" : "#ffffff"} size="lg" />
          
          <div className="h-10 mt-2">
            {win !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`text-xl font-black uppercase tracking-widest ${win ? "text-[#00ff88]" : "text-[#ff5c5c]"}`}>
                {win ? `CASHED OUT AT ${target.toFixed(2)}×` : `CRASHED AT ${crashPoint?.toFixed(2)}×`}
              </motion.div>
            )}
          </div>
        </div>
      </GameArena>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={playing} betLabel="Play" disabled={target < 1.01}>
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#b1bad3] bg-[#0a1410] p-3 rounded-lg border border-[#00ff88]/20">
              <span>Auto Cashout</span>
              <span className="text-[#00ff88] text-lg">{target.toFixed(2)}×</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1.5, 2, 3, 5, 10, 100].map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  disabled={playing}
                  className={`py-3 text-sm font-black rounded-lg transition-all ${target === t ? "bg-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.4)]" : "bg-[#1a2c38] text-[#b1bad3] hover:bg-[#2f4553] hover:text-white border border-[#2f4553]"}`}
                >
                  {t}×
                </button>
              ))}
            </div>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

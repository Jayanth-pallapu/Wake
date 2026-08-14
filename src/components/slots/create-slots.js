const fs = require('fs');
const path = require('path');

const dir = path.join('d:', 'Wake', 'src', 'components', 'slots');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const files = {};

files['slot-reel.tsx'] = `"use client";
import { useEffect, useState } from "react";

interface SlotReelProps {
  symbols: string[];
  finalSymbol: string;
  spinning: boolean;
  delay?: number;
  size?: number;
}

export function SlotReel({ symbols, finalSymbol, spinning, delay = 0, size = 48 }: SlotReelProps) {
  const [stopped, setStopped] = useState(!spinning);

  useEffect(() => {
    if (spinning) {
      setStopped(false);
      const timer = setTimeout(() => {
        setStopped(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setStopped(true);
    }
  }, [spinning, delay]);

  const strip = Array(15).fill(symbols).flat();

  return (
    <div className="relative overflow-hidden w-full h-[180px] bg-[#0f212e]/80 border border-[#2f4553] rounded-md flex flex-col items-center">
      <div className="absolute inset-x-0 h-1/3 border-y-2 border-[#1475e1]/30 top-1/3 bg-white/5 pointer-events-none z-10 shadow-[0_0_15px_rgba(20,117,225,0.2)_inset]" />
      <div
        className="flex flex-col items-center w-full will-change-transform"
        style={{
          fontSize: size,
          animation: spinning && !stopped ? \`spin-reel 0.15s linear infinite\` : 'none',
        }}
      >
        {stopped ? (
          <>
            <div className="h-[60px] flex items-center justify-center opacity-50">{symbols[Math.floor(Math.random() * symbols.length)]}</div>
            <div className="h-[60px] flex items-center justify-center filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] scale-110">{finalSymbol}</div>
            <div className="h-[60px] flex items-center justify-center opacity-50">{symbols[Math.floor(Math.random() * symbols.length)]}</div>
          </>
        ) : (
          strip.map((sym, i) => (
            <div key={i} className="h-[60px] flex items-center justify-center filter blur-[1px]">
              {sym}
            </div>
          ))
        )}
      </div>
      <style>{`
        @keyframes spin-reel {
          0% { transform: translateY(0); }
          100% { transform: translateY(-33.33%); }
        }
      `}</style>
    </div>
  );
}
`;

files['live-dealer-shell.tsx'] = `"use client";

interface LiveDealerShellProps {
  dealerName: string;
  speechText: string;
  isDealing: boolean;
  children: React.ReactNode;
}

export function LiveDealerShell({ dealerName, speechText, isDealing, children }: LiveDealerShellProps) {
  return (
    <div className="relative flex flex-col items-center w-full bg-[#0f212e] rounded-xl overflow-hidden border border-[#2f4553]">
      <div className="relative w-full h-[200px] bg-gradient-to-b from-[#1a2c38] to-[#0f212e] flex flex-col items-center justify-end overflow-hidden pt-4">
        {/* Dealer Speech Bubble */}
        <div className={\`absolute top-4 transition-opacity duration-300 \${speechText ? 'opacity-100' : 'opacity-0'} z-50\`}>
          <div className="relative bg-white text-black px-4 py-2 rounded-2xl font-semibold text-sm drop-shadow-lg max-w-[200px] text-center">
            {speechText}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-x-8 border-x-transparent border-t-8 border-t-white" />
          </div>
        </div>
        
        {/* Dealer Avatar */}
        <div className="relative z-10 mb-[-10px]">
          <svg width="120" height="150" viewBox="0 0 120 150" className="drop-shadow-2xl" style={{ animation: "breathe 4s ease-in-out infinite" }}>
            <path d="M20 150 C20 90, 100 90, 100 150 Z" fill="#1e1e1e" />
            <path d="M45 90 L75 90 L60 120 Z" fill="#ffffff" />
            <path d="M50 100 L70 100 L60 110 Z" fill="#e70000" />
            <path d="M50 110 L70 110 L60 100 Z" fill="#e70000" />
            <circle cx="60" cy="105" r="3" fill="#880000" />
            <circle cx="60" cy="50" r="35" fill="#f5d0b5" />
            <circle cx="48" cy="45" r="4" fill="#000" />
            <circle cx="72" cy="45" r="4" fill="#000" />
            <path d="M45 60 Q60 70 75 60" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M25 50 Q60 10 95 50 Q60 20 25 50" fill="#3b2b1a" />
            <g style={{ transformOrigin: "30px 100px", animation: isDealing ? "deal 1s ease-in-out infinite alternate" : "none" }}>
              <rect x="15" y="90" width="15" height="60" rx="7" fill="#1e1e1e" transform="rotate(20 30 100)" />
              <circle cx="10" cy="145" r="10" fill="#f5d0b5" />
            </g>
            <g style={{ transformOrigin: "90px 100px", animation: isDealing ? "deal-right 1.2s ease-in-out infinite alternate" : "none" }}>
              <rect x="90" y="90" width="15" height="60" rx="7" fill="#1e1e1e" transform="rotate(-20 90 100)" />
              <circle cx="110" cy="145" r="10" fill="#f5d0b5" />
            </g>
          </svg>
        </div>

        {/* Table Edge */}
        <div className="absolute bottom-0 w-full h-[20px] bg-gradient-to-r from-[#003300] via-[#005500] to-[#003300] border-t-4 border-[#ffb700] z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]" />
        
        {/* Name Tag */}
        <div className="absolute bottom-1 right-4 z-30 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white/80 border border-white/10 uppercase tracking-widest">
          {dealerName}
        </div>
      </div>
      
      {/* Game Content */}
      <div className="w-full relative min-h-[300px]">
        {children}
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.02) translateY(-2px); }
        }
        @keyframes deal {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(45deg); }
        }
        @keyframes deal-right {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-45deg); }
        }
      `}</style>
    </div>
  );
}
`;

function getClusterTemplate(id, name, symbols, rows, cols, colors, themeClass) {
  return `"use client";
import { useState, useEffect } from "react";
import { BetPanel, useBetAmount, toRaw } from "@/components/games/bet-panel";
import { useGame } from "@/hooks/use-game";
import { useUiStore } from "@/store/ui";

const SYMBOLS = ${JSON.stringify(symbols)};

export function ${name.replace(/\s+/g, '')}Game() {
  const [bet, setBet] = useBetAmount(10, "${id}-bet");
  const { play, playing, lastResult } = useGame();
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState<string[][]>([]);
  const [winAmount, setWinAmount] = useState<number | null>(null);

  // Initialize random grid
  useEffect(() => {
    const initGrid = Array.from({ length: ${rows} }, () =>
      Array.from({ length: ${cols} }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
    );
    setGrid(initGrid);
  }, []);

  const onSpin = async () => {
    if (spinning || playing) return;
    setWinAmount(null);
    setSpinning(true);

    const asset = useUiStore.getState().activeAsset;
    
    // Simulate spin visual delay
    let shuffleInterval = setInterval(() => {
      setGrid(Array.from({ length: ${rows} }, () =>
        Array.from({ length: ${cols} }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
      ));
    }, 150);

    const result = await play("${id}", {}, toRaw(bet));

    setTimeout(() => {
      clearInterval(shuffleInterval);
      setSpinning(false);
      
      if (result) {
        // Construct final grid
        const finalGrid = Array.from({ length: ${rows} }, () =>
          Array.from({ length: ${cols} }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
        );
        
        if (result.bet.win) {
          // Force a win cluster visually
          const winSym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          for(let r=0; r<${rows}; r++) {
             for(let c=0; c<${cols}; c++) {
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
      {/* Game Screen */}
      <div className="relative flex flex-col items-center justify-center p-8 bg-gradient-to-br ${colors} rounded-xl border border-[#2f4553] min-h-[400px] overflow-hidden ${themeClass}">
        {/* Win Overlay */}
        {winAmount && !spinning && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm pointer-events-none animate-in fade-in zoom-in duration-300">
            <div className="text-center drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">
              <div className="text-5xl font-black text-yellow-400 mb-2">BIG WIN!</div>
              <div className="text-4xl font-bold text-white">+{winAmount.toFixed(4)}</div>
            </div>
          </div>
        )}

        <div className="grid gap-2 z-10" style={{ gridTemplateColumns: "repeat(${cols}, minmax(0, 1fr))" }}>
          {grid.map((row, rIdx) =>
            row.map((sym, cIdx) => (
              <div
                key={\`\${rIdx}-\${cIdx}\`}
                className={\`w-12 h-12 md:w-16 md:h-16 bg-black/40 backdrop-blur-md rounded-lg flex items-center justify-center text-3xl md:text-4xl shadow-inner border border-white/10 \${spinning ? 'animate-pulse' : 'transition-transform hover:scale-110'}\`}
              >
                {sym}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Controls */}
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
`;
}

function getReelTemplate(id, name, symbols, rows, cols, colors) {
  return `"use client";
import { useState } from "react";
import { BetPanel, useBetAmount, toRaw } from "@/components/games/bet-panel";
import { useGame } from "@/hooks/use-game";
import { SlotReel } from "./slot-reel";

const SYMBOLS = ${JSON.stringify(symbols)};

export function ${name.replace(/\s+/g, '')}Game() {
  const [bet, setBet] = useBetAmount(10, "${id}-bet");
  const { play, playing, lastResult } = useGame();
  const [spinning, setSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [finalSymbols, setFinalSymbols] = useState<string[]>(Array(${cols}).fill(SYMBOLS[0]));

  const onSpin = async () => {
    if (spinning || playing) return;
    setWinAmount(null);
    setSpinning(true);

    const result = await play("${id}", {}, toRaw(bet));

    // Calculate final symbols
    const newSymbols = Array.from({ length: ${cols} }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    if (result && result.bet.win) {
      // Force a match on first 3 reels minimum
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
    }, 500 + (${cols} * 300));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      {/* Game Screen */}
      <div className="relative flex flex-col items-center justify-center p-8 bg-gradient-to-b ${colors} rounded-xl border border-[#2f4553] min-h-[400px] overflow-hidden">
        {/* Win Overlay */}
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

      {/* Controls */}
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
`;
}

function getLiveTemplate(id, name, dealer, colors) {
  return `"use client";
import { useState, useEffect } from "react";
import { BetPanel, useBetAmount, toRaw } from "@/components/games/bet-panel";
import { useGame } from "@/hooks/use-game";
import { LiveDealerShell } from "./live-dealer-shell";

export function ${name.replace(/\s+/g, '')}Game() {
  const [bet, setBet] = useBetAmount(10, "${id}-bet");
  const { play, playing } = useGame();
  const [spinning, setSpinning] = useState(false);
  const [speech, setSpeech] = useState("Place your bets!");
  const [winAmount, setWinAmount] = useState<number | null>(null);

  const onBet = async () => {
    if (spinning || playing) return;
    setWinAmount(null);
    setSpinning(true);
    setSpeech("No more bets!");

    const result = await play("${id === 'lightning-roulette' ? 'roulette' : id}", {}, toRaw(bet));

    setTimeout(() => {
      setSpinning(false);
      if (result?.bet.win) {
        setSpeech("Congratulations!");
        setWinAmount(result.bet.payout);
      } else {
        setSpeech("Better luck next time!");
      }
      
      setTimeout(() => {
        setSpeech("Place your bets!");
      }, 4000);
    }, 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      {/* Game Screen */}
      <div className="min-h-[400px]">
        <LiveDealerShell dealerName="${dealer}" speechText={speech} isDealing={spinning}>
          <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-r ${colors} rounded-lg border border-white/10 overflow-hidden p-6">
             {winAmount && !spinning ? (
               <div className="text-center animate-in zoom-in duration-500 bg-black/60 p-8 rounded-full border-4 border-yellow-400 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">
                  <h2 className="text-4xl font-black text-yellow-400 mb-2">YOU WON</h2>
                  <p className="text-3xl font-bold text-white">+{winAmount.toFixed(4)}</p>
               </div>
             ) : (
               <div className={\`w-64 h-64 rounded-full border-8 border-white/20 flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(255,255,255,0.1)_inset] \${spinning ? 'animate-spin' : ''}\`}>
                 ${id === 'lightning-roulette' ? '⚡🎰' : '🎡✨'}
               </div>
             )}
          </div>
        </LiveDealerShell>
      </div>

      {/* Controls */}
      <div className="bg-[#1a2c38] p-4 rounded-xl border border-[#2f4553]">
        <BetPanel
          bet={bet}
          setBet={setBet}
          onBet={onBet}
          playing={playing || spinning}
          betLabel={spinning ? "IN PROGRESS..." : "PLACE BET"}
        />
      </div>
    </div>
  );
}
`;
}

// 1. Sweet Bonanza
files['sweet-bonanza-game.tsx'] = getClusterTemplate("sweet-bonanza", "Sweet Bonanza", ['🍬','🍭','🍇','🍋','🍑','🍎','💎','♥'], 5, 6, "from-pink-400/80 to-rose-600/80", "");
// 2. Gates of Olympus
files['gates-of-olympus-game.tsx'] = getClusterTemplate("gates-of-olympus", "Gates of Olympus", ['⚡','💎','💍','🏺','🔮','🦉','♦','⚜'], 5, 6, "from-blue-600/80 to-indigo-900/80", "");
// 3. Sugar Rush
files['sugar-rush-game.tsx'] = getClusterTemplate("sugar-rush", "Sugar Rush", ['🧁','🍰','🍩','🍫','🍬','🍭','⭐','💎'], 7, 7, "from-fuchsia-500/80 to-purple-800/80", "");
// 4. Fruit Party
files['fruit-party-game.tsx'] = getClusterTemplate("fruit-party", "Fruit Party", ['🍓','🍇','🍋','🍊','🍑','🍎','⭐','💎'], 7, 7, "from-red-500/80 to-orange-600/80", "");

// 5. Big Bass Bonanza
files['big-bass-bonanza-game.tsx'] = getReelTemplate("big-bass-bonanza", "Big Bass Bonanza", ['🎣','🐟','🦈','🎖','💰','🪙','🃏','⚡'], 3, 5, "from-cyan-800 to-blue-900");
// 6. Book of Dead
files['book-of-dead-game.tsx'] = getReelTemplate("book-of-dead", "Book of Dead", ['📖','🦅','🐺','🐞','⚡','💎','🃏','🎭'], 3, 5, "from-amber-800 to-orange-950");
// 7. Wanted Dead
files['wanted-dead-game.tsx'] = getReelTemplate("wanted-dead", "Wanted Dead", ['🤠','🌵','💀','🔫','🎯','💰','⭐','🃏'], 3, 5, "from-orange-800 to-red-950");
// 8. Dog House
files['dog-house-game.tsx'] = getReelTemplate("dog-house", "Dog House", ['🐶','🐾','🦴','🏠','🎾','🌟','💎','⭐'], 3, 5, "from-emerald-700 to-green-900");
// 9. Money Train
files['money-train-game.tsx'] = getReelTemplate("money-train", "Money Train", ['🚂','💰','🎯','💣','⚡','🔒','💎','⭐'], 4, 5, "from-slate-700 to-slate-900");
// 10. Wild West Gold
files['wild-west-gold-game.tsx'] = getReelTemplate("wild-west-gold", "Wild West Gold", ['🌵','💰','⭐','🐎','🔫','🎯','💎','🃏'], 4, 5, "from-lime-800 to-emerald-950");

// 11. Crazy Time
files['crazy-time-game.tsx'] = getLiveTemplate("crazy-time", "Crazy Time", "Alex the Host", "from-fuchsia-600/40 to-purple-900/40");
// 12. Lightning Roulette
files['lightning-roulette-game.tsx'] = getLiveTemplate("lightning-roulette", "Lightning Roulette", "Sofia", "from-yellow-600/40 to-amber-900/40");


for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(dir, filename), content);
}
console.log("All slots created successfully!");

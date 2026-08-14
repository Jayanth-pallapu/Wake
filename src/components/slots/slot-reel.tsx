"use client";
import { useEffect, useState, useMemo } from "react";

interface SlotReelProps {
  symbols: string[];
  finalSymbol: string;
  spinning: boolean;
  delay?: number;
  size?: number;
  highlight?: boolean;
}

export function SlotReel({ symbols, finalSymbol, spinning, delay = 0, size = 48, highlight = false }: SlotReelProps) {
  const [stopped, setStopped] = useState(!spinning);

  // Stable ghost symbols — computed once, not on every render (avoids hydration mismatch)
  const [ghostAbove] = useState(() => symbols[Math.floor(Math.random() * symbols.length)]);
  const [ghostBelow] = useState(() => symbols[Math.floor(Math.random() * symbols.length)]);

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

  const strip = useMemo(() => Array(15).fill(symbols).flat(), [symbols]);

  return (
    <div
      className="relative overflow-hidden w-full h-[180px] bg-[#0f212e]/80 rounded-md flex flex-col items-center"
      style={{
        border: highlight ? "2px solid #00c2ff" : "1px solid #2f4553",
        boxShadow: highlight ? "0 0 16px rgba(0,194,255,0.35)" : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      <div className="absolute inset-x-0 h-1/3 border-y-2 border-[#1475e1]/30 top-1/3 bg-white/5 pointer-events-none z-10 shadow-[0_0_15px_rgba(20,117,225,0.2)_inset]" />
      <div
        className="flex flex-col items-center w-full will-change-transform"
        style={{
          fontSize: size,
          animation: spinning && !stopped ? `spin-reel 0.15s linear infinite` : "none",
        }}
      >
        {stopped ? (
          <>
            <div className="h-[60px] flex items-center justify-center opacity-50">{ghostAbove}</div>
            <div className="h-[60px] flex items-center justify-center filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] scale-110">{finalSymbol}</div>
            <div className="h-[60px] flex items-center justify-center opacity-50">{ghostBelow}</div>
          </>
        ) : (
          strip.map((sym, i) => (
            <div key={`strip-${i}`} className="h-[60px] flex items-center justify-center filter blur-[1px]">
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

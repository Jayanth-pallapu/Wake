"use client";
import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string; // ISO string
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function CountdownTimer({ targetDate, label = "Closes in", size = "md" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });

  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0, expired: true }); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const glowStyle = {
    textShadow: "0 0 12px rgba(0,194,255,0.6), 0 0 24px rgba(0,194,255,0.3)",
  };

  const isSmall = size === "sm";
  const isLarge = size === "lg";
  const digitCls = isLarge ? "text-3xl sm:text-4xl" : isSmall ? "text-lg" : "text-2xl";
  const labelCls = isSmall ? "text-[9px]" : "text-[10px]";

  if (timeLeft.expired) {
    return <span className={`font-bold text-[#ff5c5c] ${digitCls}`}>Closed</span>;
  }

  const units = timeLeft.d > 0
    ? [{ v: timeLeft.d, l: "D" }, { v: timeLeft.h, l: "H" }, { v: timeLeft.m, l: "M" }, { v: timeLeft.s, l: "S" }]
    : [{ v: timeLeft.h, l: "H" }, { v: timeLeft.m, l: "M" }, { v: timeLeft.s, l: "S" }];

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-[#b1bad3] ${isSmall ? 'text-[9px]' : 'text-[10px]'} uppercase tracking-widest`}>{label}</span>
      <div className="flex items-center gap-1">
        {units.map((u, i) => (
          <div key={u.l} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <span
                className={`font-black tabular-nums text-[#00c2ff] ${digitCls}`}
                style={glowStyle}
              >
                {String(u.v).padStart(2, "0")}
              </span>
              <span className={`text-[#b1bad3] ${labelCls} uppercase`}>{u.l}</span>
            </div>
            {i < units.length - 1 && (
              <span className={`font-black text-[#00c2ff]/60 ${digitCls} mb-3`}>:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

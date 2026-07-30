"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { WHEEL_CONFIG, type WheelRisk } from "@/lib/provably-fair";
import { useUiStore } from "@/store/ui";

export function WheelGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "wheel-bet");
  const [risk, setRisk] = useState<WheelRisk>("medium");
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ segment: number; multiplier: number } | null>(null);
  const [spinning, setSpinning] = useState(false);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);
  const cfg = WHEEL_CONFIG[risk];
  const segments = cfg.segments;
  const segAngle = 360 / segments;

  const segmentColor = (mult: number) =>
    mult >= 10 ? "#ff5cb1" :
    mult >= 3 ? "#ffd23f" :
    mult >= 1.5 ? "#00e701" :
    mult >= 1 ? "#1475e1" :
    mult > 0 ? "#55657a" : "#2f4553";

  const handleBet = async () => {
    setSpinning(true);
    setResult(null);
    const res = await play("wheel", { risk }, toRaw(bet));
    if (res) {
      const segment = res.bet.outcome.segment as number;
      const multiplier = res.bet.outcome.multiplier as number;
      // animate: rotate so that the pointer (top, 0deg) lands on segment center
      // segment i center is at angle i*segAngle (clockwise from top). We want pointer at top → wheel rotates -centerAngle plus full spins.
      const targetAngle = segment * segAngle + segAngle / 2;
      const spins = 5 * 360;
      const finalRotation = rotation - (rotation % 360) + spins + (360 - targetAngle);
      setRotation(finalRotation);
      setTimeout(() => {
        setResult({ segment, multiplier });
        setSpinning(false);
        onPlayed?.();
      }, 3200);
    } else {
      setSpinning(false);
    }
  };

  const radius = 130;
  const cx = 150, cy = 150;

  // build segment paths
  const segPaths = Array.from({ length: segments }).map((_, i) => {
    const startAngle = i * segAngle - 90 - segAngle / 2; // center segment 0 at top
    const endAngle = startAngle + segAngle;
    const rad = (a: number) => (a * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(rad(startAngle));
    const y1 = cy + radius * Math.sin(rad(startAngle));
    const x2 = cx + radius * Math.cos(rad(endAngle));
    const y2 = cy + radius * Math.sin(rad(endAngle));
    const largeArc = segAngle > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const midAngle = startAngle + segAngle / 2;
    const labelX = cx + (radius * 0.65) * Math.cos(rad(midAngle));
    const labelY = cy + (radius * 0.65) * Math.sin(rad(midAngle));
    return { path, labelX, labelY, mult: cfg.multipliers[i] };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-4 min-h-[340px] flex flex-col items-center justify-center">
        <div className="relative">
          {/* pointer */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-10 w-0 h-0 border-l-8 border-r-8 border-t-[14px] border-l-transparent border-r-transparent border-t-[#00e701]" />
          <motion.svg
            viewBox="0 0 300 300"
            className="w-[280px] h-[280px]"
            animate={{ rotate: rotation }}
            transition={{ duration: spinning ? 3 : 0, ease: spinning ? [0.17, 0.67, 0.12, 0.99] : undefined }}
          >
            {segPaths.map((s, i) => (
              <g key={i}>
                <path d={s.path} fill={segmentColor(s.mult)} stroke="#0f212e" strokeWidth="1" opacity={result && result.segment === i ? 1 : 0.85} />
                <text x={s.labelX} y={s.labelY} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="bold" fill="#0f212e">
                  {s.mult > 0 ? `${s.mult}×` : "0"}
                </text>
              </g>
            ))}
            <circle cx={cx} cy={cy} r="18" fill="#0f212e" stroke="#2f4553" strokeWidth="2" />
            <circle cx={cx} cy={cy} r="6" fill="#00e701" />
          </motion.svg>
        </div>
        {result && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`mt-4 text-2xl font-black ${result.multiplier > 0 ? "text-[#00e701]" : "text-[#ff5c5c]"}`}
          >
            {result.multiplier > 0 ? `🎉 ${result.multiplier}× — won ${(bet * result.multiplier).toFixed(4)} ${activeAsset}` : "Missed — 0×"}
          </motion.div>
        )}
      </div>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={playing || spinning} betLabel={spinning ? "Spinning…" : "Spin Wheel"}>
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Risk</div>
            <ToggleGroup type="single" value={risk} onValueChange={(v) => v && setRisk(v as WheelRisk)}
              className="grid grid-cols-3 gap-1 bg-[#0f212e] rounded-md p-1">
              <ToggleGroupItem value="low" className="data-[state=on]:bg-[#213743] data-[state=on]:text-[#00e701] text-[#b1bad3] text-xs h-8">Low</ToggleGroupItem>
              <ToggleGroupItem value="medium" className="data-[state=on]:bg-[#213743] data-[state=on]:text-[#ffd23f] text-[#b1bad3] text-xs h-8">Medium</ToggleGroupItem>
              <ToggleGroupItem value="high" className="data-[state=on]:bg-[#213743] data-[state=on]:text-[#ff5cb1] text-[#b1bad3] text-xs h-8">High</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="text-[10px] text-[#b1bad3]">
            Max payout: <span className="font-bold text-white">{Math.max(...cfg.multipliers)}×</span> · {segments} segments
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

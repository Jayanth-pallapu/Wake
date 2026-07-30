"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PLINKO_MULTIPLIERS, type PlinkoRisk } from "@/lib/provably-fair";
import { useUiStore } from "@/store/ui";

const ROWS = 16;

export function PlinkoGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "plinko-bet");
  const [risk, setRisk] = useState<PlinkoRisk>("medium");
  const [ball, setBall] = useState<{ directions: number[]; bucket: number; multiplier: number } | null>(null);
  const [animStep, setAnimStep] = useState<number>(-1);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);
  const table = PLINKO_MULTIPLIERS[risk];

  const handleBet = async () => {
    const result = await play("plinko", { risk }, toRaw(bet));
    if (result) {
      const dirs = result.bet.outcome.directions as number[];
      const bucket = result.bet.outcome.bucket as number;
      const mult = result.bet.outcome.multiplier as number;
      setBall({ directions: dirs, bucket, multiplier: mult });
      setAnimStep(-1);
      // animate step by step
      for (let i = 0; i <= dirs.length; i++) {
        await new Promise((r) => setTimeout(r, 90));
        setAnimStep(i);
      }
      onPlayed?.();
    }
  };

  // Geometry
  const W = 560;
  const H = 420;
  const padX = 40;
  const padTop = 30;
  const padBottom = 60;
  const rowGap = (H - padTop - padBottom) / ROWS;
  const pegRadius = 3;

  // pegs positions
  const pegs: { x: number; y: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    const count = r + 3; // rows have 3..18 pegs
    const y = padTop + r * rowGap + rowGap / 2;
    const totalWidth = W - padX * 2;
    const gap = totalWidth / (count - 1);
    const startX = padX;
    for (let c = 0; c < count; c++) {
      pegs.push({ x: startX + c * gap, y });
    }
  }

  // ball position based on animStep
  let ballX = W / 2;
  let ballY = padTop - 10;
  if (ball && animStep >= 0) {
    const steps = Math.min(animStep, ball.directions.length);
    let pos = 0;
    for (let i = 0; i < steps; i++) {
      pos += ball.directions[i] === 1 ? 1 : -1;
    }
    // bucket center at row `steps`
    const r = steps;
    const count = r + 3;
    const totalWidth = W - padX * 2;
    const gap = totalWidth / (count - 1);
    const startX = padX;
    // index within row = count/2 + pos (centered)
    const idx = Math.floor((count - 1) / 2) + pos;
    ballX = startX + Math.max(0, Math.min(count - 1, idx)) * gap;
    ballY = padTop + r * rowGap + rowGap / 2;
  }
  const ballFinalY = animStep >= ROWS ? H - padBottom + 10 : ballY;

  // buckets (17)
  const bucketCount = ROWS + 1;
  const bucketGap = (W - padX * 2) / bucketCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-2 min-h-[440px] flex flex-col items-center">
        <div className="text-[10px] uppercase tracking-wider text-[#b1bad3] mb-1">
          {ball && animStep >= ROWS ? `Landed on ${ball.multiplier}× — won ${(bet * ball.multiplier).toFixed(4)} ${activeAsset}` : "Drop the ball"}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[600px]">
          {/* pegs */}
          {pegs.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={pegRadius} fill="#2f4553" />
          ))}
          {/* buckets */}
          {Array.from({ length: bucketCount }).map((_, i) => {
            const x = padX + i * bucketGap;
            const m = table[i];
            const color =
              m >= 10 ? "#ff5cb1" :
              m >= 3 ? "#ffd23f" :
              m >= 1.5 ? "#00e701" :
              m >= 1 ? "#1475e1" :
              m >= 0.3 ? "#55657a" : "#ff5c5c";
            const active = ball && animStep >= ROWS && ball.bucket === i;
            return (
              <g key={i}>
                <rect
                  x={x - bucketGap / 2 + 2}
                  y={H - padBottom + 4}
                  width={bucketGap - 4}
                  height={padBottom - 8}
                  rx={4}
                  fill={active ? color : "#1a2c38"}
                  stroke={color}
                  strokeWidth="1"
                  opacity={active ? 1 : 0.6}
                />
                <text
                  x={x}
                  y={H - padBottom / 2 + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill={active ? "#0f212e" : color}
                >
                  {m}×
                </text>
              </g>
            );
          })}
          {/* ball */}
          {ball && (
            <motion.circle
              animate={{ cx: ballX, cy: animStep >= ROWS ? ballFinalY : ballY }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              r="6"
              fill="#ffffff"
              stroke="#00e701"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={playing || (animStep >= 0 && animStep < ROWS)} betLabel={playing ? "Dropping…" : "Drop Ball"}>
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Risk</div>
            <ToggleGroup
              type="single"
              value={risk}
              onValueChange={(v) => v && setRisk(v as PlinkoRisk)}
              className="grid grid-cols-3 gap-1 bg-[#0f212e] rounded-md p-1"
            >
              <ToggleGroupItem value="low" className="data-[state=on]:bg-[#213743] data-[state=on]:text-[#00e701] text-[#b1bad3] text-xs h-8">Low</ToggleGroupItem>
              <ToggleGroupItem value="medium" className="data-[state=on]:bg-[#213743] data-[state=on]:text-[#ffd23f] text-[#b1bad3] text-xs h-8">Medium</ToggleGroupItem>
              <ToggleGroupItem value="high" className="data-[state=on]:bg-[#213743] data-[state=on]:text-[#ff5cb1] text-[#b1bad3] text-xs h-8">High</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="text-[10px] text-[#b1bad3]">
            Max payout: <span className="font-bold text-white">{Math.max(...table)}×</span> · {ROWS} rows
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

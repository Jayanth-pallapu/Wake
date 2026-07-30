"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { useUiStore } from "@/store/ui";

export function DiceGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "dice-bet");
  const [target, setTarget] = useState(50);
  const [direction, setDirection] = useState<"under" | "over">("under");
  const [roll, setRoll] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const winProb = direction === "under" ? target / 100 : (100 - target) / 100;
  const multiplier = winProb > 0 ? Math.floor((0.99 / winProb) * 100) / 100 : 0;
  const profit = bet * multiplier - bet;

  const handleBet = async () => {
    const result = await play("dice", { target, direction }, toRaw(bet));
    if (result) {
      const r = result.bet.outcome.roll as number;
      setRoll(r);
      setLastWin(result.bet.win);
      onPlayed?.();
      setTimeout(() => setRoll(null), 2000);
    }
  };

  // slider position percentage
  const sliderPct = target;
  const rollPct = roll !== null ? roll : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      {/* Canvas: dice slider */}
      <div className="bg-[#0f212e] rounded-lg p-6 min-h-[320px] flex flex-col justify-center">
        {/* Multiplier display */}
        <div className="text-center mb-6">
          <div className="text-[10px] uppercase tracking-wider text-[#b1bad3] mb-1">Payout Multiplier</div>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={multiplier.toFixed(2)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-5xl font-black tabular-nums ${lastWin === false ? "text-[#ff5c5c]" : lastWin === true ? "text-[#00e701]" : "text-white"}`}
            >
              {multiplier.toFixed(2)}×
            </motion.div>
          </AnimatePresence>
          <div className="text-xs text-[#b1bad3] mt-1">
            {direction === "under" ? `Roll under ${target}` : `Roll over ${target}`} to win · {(winProb * 100).toFixed(2)}% chance
          </div>
        </div>

        {/* Slider track */}
        <div className="relative px-2 mb-2">
          <div className="h-3 rounded-full bg-[#1a2c38] overflow-hidden relative">
            {/* win region */}
            <div
              className={`absolute h-full ${direction === "under" ? "left-0 bg-[#00e701]" : "right-0 bg-[#00e701]"}`}
              style={{ width: `${direction === "under" ? sliderPct : 100 - sliderPct}%` }}
            />
            {/* threshold marker */}
            <div
              className="absolute h-full w-0.5 bg-white"
              style={{ left: `${sliderPct}%`, transform: "translateX(-50%)" }}
            />
            {/* roll marker */}
            {rollPct !== null && (
              <motion.div
                initial={{ left: "50%", scale: 0.5, opacity: 0 }}
                animate={{ left: `${rollPct}%`, scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg z-10"
                style={{ backgroundColor: lastWin ? "#00e701" : "#ff5c5c" }}
              />
            )}
          </div>
          {/* number ticks */}
          <div className="flex justify-between mt-2 text-[10px] text-[#b1bad3] tabular-nums">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>

        {/* Roll result big number */}
        <AnimatePresence>
          {rollPct !== null && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className={`text-center text-2xl font-bold tabular-nums mt-4 ${lastWin ? "text-[#00e701]" : "text-[#ff5c5c]"}`}
            >
              Rolled: {rollPct.toFixed(2)} {lastWin ? "✓ WIN" : "✗ LOSS"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={playing} betLabel="Roll Dice">
          {/* Target + direction */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Target</Label>
              <span className="text-xs font-bold text-white tabular-nums">{target.toFixed(2)}</span>
            </div>
            <Slider
              value={[target]}
              min={2}
              max={98}
              step={0.01}
              onValueChange={(v) => setTarget(v[0])}
              className="[&_[role=slider]]:bg-[#00e701] [&_[role=slider]]:border-[#0a1f12] [&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
            />
          </div>
          <ToggleGroup
            type="single"
            value={direction}
            onValueChange={(v) => v && setDirection(v as "under" | "over")}
            className="grid grid-cols-2 gap-1 bg-[#0f212e] rounded-md p-1"
          >
            <ToggleGroupItem value="under" className="data-[state=on]:bg-[#213743] data-[state=on]:text-white text-[#b1bad3] text-xs h-8">
              Roll Under
            </ToggleGroupItem>
            <ToggleGroupItem value="over" className="data-[state=on]:bg-[#213743] data-[state=on]:text-white text-[#b1bad3] text-xs h-8">
              Roll Over
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="flex items-center justify-between text-xs bg-[#0f212e] rounded-md p-2">
            <span className="text-[#b1bad3]">Profit on win</span>
            <span className="font-bold text-[#00e701] tabular-nums">
              +{profit.toFixed(6)} {activeAsset}
            </span>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

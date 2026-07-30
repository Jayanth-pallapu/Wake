"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BetPanel, toRaw, useBetAmount } from "./bet-panel";
import { useGame } from "@/hooks/use-game";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUiStore } from "@/store/ui";
import { TrendingUp } from "lucide-react";

export function LimboGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "limbo-bet");
  const [target, setTarget] = useState(2);
  const [rolled, setRolled] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);
  const { play, playing } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);

  const profit = bet * target - bet;

  const handleBet = async () => {
    if (target < 1.01) return;
    const result = await play("limbo", { target }, toRaw(bet));
    if (result) {
      setRolled(result.bet.outcome.rolled as number);
      setLastWin(result.bet.win);
      onPlayed?.();
      setTimeout(() => setRolled(null), 2500);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      <div className="bg-[#0f212e] rounded-lg p-6 min-h-[320px] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="text-[10px] uppercase tracking-wider text-[#b1bad3] mb-2">Result Multiplier</div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={rolled ?? "idle"}
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`text-6xl sm:text-7xl font-black tabular-nums ${lastWin === false ? "text-[#ff5c5c]" : lastWin === true ? "text-[#00e701]" : "text-white"}`}
          >
            {rolled !== null ? `${rolled.toFixed(2)}×` : "—"}
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 text-sm text-[#b1bad3]">
          {rolled !== null
            ? lastWin
              ? `🎉 Hit target ${target}× — won ${(bet * target).toFixed(4)} ${activeAsset}`
              : `Bust — target was ${target}×`
            : `Target: ${target}× · roll ≥ target to win`}
        </div>
        <TrendingUp className="absolute bottom-4 right-4 w-16 h-16 text-[#1475e1]/10" />
      </div>

      <div>
        <BetPanel bet={bet} setBet={setBet} onBet={handleBet} playing={playing} betLabel="Roll Limbo" disabled={target < 1.01}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Target Multiplier</Label>
              <span className="text-xs font-bold text-[#00e701] tabular-nums">{target.toFixed(2)}×</span>
            </div>
            <Input
              type="number"
              value={target}
              onChange={(e) => setTarget(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
              min={1.01}
              step="0.01"
              className="bg-[#0f212e] border-[#2f4553] text-white h-10 tabular-nums"
            />
            <div className="flex gap-1">
              {[2, 5, 10, 100].map((m) => (
                <button
                  key={m}
                  onClick={() => setTarget(m)}
                  className="flex-1 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white transition-colors"
                >
                  {m}×
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs bg-[#0f212e] rounded-md p-2">
            <span className="text-[#b1bad3]">Profit on win</span>
            <span className="font-bold text-[#00e701] tabular-nums">+{profit.toFixed(6)} {activeAsset}</span>
          </div>
        </BetPanel>
      </div>
    </div>
  );
}

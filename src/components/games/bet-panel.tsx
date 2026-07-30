"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";
import { useUiStore } from "@/store/ui";
import { useWalletStore } from "@/store/wallet";
import { ASSETS } from "@/lib/constants";

interface BetPanelProps {
  bet: number;
  setBet: (n: number) => void;
  onBet: () => void;
  playing: boolean;
  betLabel?: string;
  disabled?: boolean;
  children?: React.ReactNode; // game-specific controls
}

export function BetPanel({ bet, setBet, onBet, playing, betLabel = "Bet", disabled, children }: BetPanelProps) {
  const { activeAsset, setActiveAsset } = useUiStore();
  const wallets = useWalletStore((s) => s.wallets);
  const wallet = wallets.find((w) => w.asset === activeAsset) || wallets[0];

  const setBetSafe = (n: number) => {
    if (!isFinite(n) || n < 0) n = 0;
    setBet(Math.round(n * 1e8) / 1e8);
  };

  const half = () => setBetSafe(bet / 2);
  const double = () => setBetSafe(bet * 2);
  const max = () => setBetSafe(wallet?.balance || 0);

  return (
    <div className="space-y-3">
      {/* Bet amount + asset */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Bet Amount</Label>
          <div className="relative">
            <Input
              type="number"
              value={bet}
              onChange={(e) => setBetSafe(parseFloat(e.target.value) || 0)}
              min={0}
              step="0.00000001"
              className="bg-[#0f212e] border-[#2f4553] text-white pr-16 h-10 tabular-nums"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
              <QuickBtn onClick={half}>½</QuickBtn>
              <QuickBtn onClick={double}>2×</QuickBtn>
              <QuickBtn onClick={max}>Max</QuickBtn>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Currency</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-[#0f212e] border-[#2f4553] text-white hover:bg-[#213743] h-10 px-3 min-w-[90px]">
                <span className={wallet?.color}>{wallet?.icon}</span>
                <span className="ml-1 font-semibold">{activeAsset}</span>
                <ChevronDown className="w-3 h-3 ml-1 text-[#b1bad3]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1a2c38] border-[#2f4553] max-h-72 overflow-y-auto">
              {wallets.map((w) => (
                <DropdownMenuItem
                  key={w.asset}
                  onClick={() => setActiveAsset(w.asset)}
                  className="cursor-pointer hover:bg-[#213743] text-white"
                >
                  <span className={`text-lg ${w.color} mr-2`}>{w.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm">{w.asset}</div>
                    <div className="text-[10px] text-[#b1bad3]">{w.balance.toFixed(4)}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Profit on win (computed by parent via children) */}
      {children}

      {/* Balance */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#b1bad3]">Balance</span>
        <span className={`font-bold tabular-nums ${wallet?.color}`}>
          {wallet?.icon} {wallet?.balance.toFixed(6) || "0.000000"}
        </span>
      </div>

      {/* Bet button */}
      <Button
        onClick={onBet}
        disabled={playing || disabled || bet <= 0}
        className="w-full bg-[#00e701] hover:bg-[#00c701] text-[#0a1f12] font-black h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
      >
        {playing ? <Loader2 className="w-5 h-5 animate-spin" /> : betLabel}
      </Button>
    </div>
  );
}

function QuickBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-1.5 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] hover:text-white transition-colors"
    >
      {children}
    </button>
  );
}

/** Convert a display number to raw 1e8 string. */
export function toRaw(n: number): string {
  return BigInt(Math.round(n * 1e8)).toString();
}

/** Hook for bet amount state with persistence per game. */
export function useBetAmount(initial: number, storageKey?: string) {
  const [bet, setBet] = useState(() => {
    if (storageKey && typeof window !== "undefined") {
      const v = localStorage.getItem(storageKey);
      if (v) return parseFloat(v);
    }
    return initial;
  });
  const set = useCallback(
    (n: number) => {
      if (storageKey && typeof window !== "undefined") {
        localStorage.setItem(storageKey, String(n));
      }
      setBet(n);
    },
    [storageKey]
  );
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      localStorage.setItem(storageKey, String(bet));
    }
  }, [bet, storageKey]);
  return [bet, set] as const;
}

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
import { ChevronDown } from "lucide-react";
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
      <button
        onClick={onBet}
        disabled={playing || disabled || bet <= 0}
        className="btn-shimmer-sweep w-full text-white font-black h-12 text-base rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-transform relative overflow-hidden"
        style={{
          background: playing || disabled || bet <= 0
            ? "#1a2c38"
            : "linear-gradient(135deg, #00c2ff 0%, #0055cc 40%, #7c3aed 80%, #ff5cb1 100%)",
          boxShadow: playing || disabled || bet <= 0
            ? "none"
            : "0 0 20px rgba(0,194,255,0.35), 0 4px 16px rgba(124,58,237,0.3)",
          border: "none",
          fontFamily: "'Orbitron', monospace",
          letterSpacing: 1.5,
          transition: "box-shadow 0.3s, transform 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!(playing || disabled || bet <= 0)) {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 35px rgba(0,194,255,0.55), 0 6px 24px rgba(124,58,237,0.5)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = playing || disabled || bet <= 0
            ? "none"
            : "0 0 20px rgba(0,194,255,0.35), 0 4px 16px rgba(124,58,237,0.3)";
        }}
      >
        {playing ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
              </path>
            </svg>
            {betLabel}
          </span>
        ) : betLabel}
      </button>
    </div>
  );
}

function QuickBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-1.5 py-1 text-[10px] font-bold rounded transition-all duration-200"
      style={{
        background: "rgba(33,55,67,0.8)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(47,69,83,0.8)",
        color: "#b1bad3",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(47,69,83,0.9)";
        (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,194,255,0.4)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 8px rgba(0,194,255,0.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(33,55,67,0.8)";
        (e.currentTarget as HTMLButtonElement).style.color = "#b1bad3";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(47,69,83,0.8)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
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

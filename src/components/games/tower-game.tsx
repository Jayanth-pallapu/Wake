"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBetAmount, toRaw } from "./bet-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWalletStore } from "@/store/wallet";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { DollarSign, Loader2, Crown, Skull, Star } from "lucide-react";
import {
  TOWER_CONFIG,
  towerMultiplier,
  type TowerDifficulty,
} from "@/lib/provably-fair";

interface TowerState {
  gameId: string | null;
  difficulty: TowerDifficulty;
  picks: number[]; // picked column per climbed row
  busted: boolean;
  cashedOut: boolean;
  failAt: number; // -1 if none
  grid: number[][] | null; // revealed at end
  currentMultiplier: number;
  nextMultiplier: number;
}

const COLS = 9;

export function TowerGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "tower-bet");
  const [difficulty, setDifficulty] = useState<TowerDifficulty>("medium");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<TowerState>(() => ({
    gameId: null,
    difficulty: "medium",
    picks: [],
    busted: false,
    cashedOut: false,
    failAt: -1,
    grid: null,
    currentMultiplier: 1,
    nextMultiplier: towerMultiplier("medium", 1),
  }));
  const activeAsset = useUiStore((s) => s.activeAsset);
  const wallet = useWalletStore((s) =>
    s.wallets.find((w) => w.asset === activeAsset)
  );
  const refreshWallet = useWalletStore((s) => s.refresh);
  const user = useAuthStore((s) => s.user);

  const cfg = TOWER_CONFIG[difficulty];
  const rows = cfg.rows;
  const active = !!state.gameId && !state.busted && !state.cashedOut;
  const currentRow = state.picks.length; // next row to climb (0-indexed from bottom)
  const reachedTop = state.picks.length >= rows;

  const startGame = async () => {
    if (!user) {
      useUiStore.getState().setAuthModal(true, "login");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/games/tower/start", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          asset: activeAsset,
          betRaw: toRaw(bet),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Start failed");
        return;
      }
      setState({
        gameId: data.gameId,
        difficulty,
        picks: [],
        busted: false,
        cashedOut: false,
        failAt: -1,
        grid: null,
        currentMultiplier: 1,
        nextMultiplier: data.nextMultiplier,
      });
      refreshWallet();
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  const pickColumn = async (col: number) => {
    if (!state.gameId || busy || !active) return;
    if (state.picks.includes(col) && state.picks.length === currentRow) return;
    setBusy(true);
    try {
      const res = await fetch("/api/games/tower/pick", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: state.gameId, col }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Pick failed");
        return;
      }
      if (data.busted) {
        setState((s) => ({
          ...s,
          busted: true,
          failAt: data.row,
          grid: data.grid,
          picks: data.picks,
        }));
        toast.error(`💥 Wrong tile! Lost ${bet.toFixed(4)} ${activeAsset}`);
        onPlayed?.();
      } else {
        setState((s) => ({
          ...s,
          picks: data.picks,
          currentMultiplier: data.multiplier,
          nextMultiplier: data.nextMultiplier,
        }));
        if (data.reachedTop) {
          // Auto-cashout at the top
          await cashout();
        }
      }
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  const cashout = async () => {
    if (!state.gameId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/games/tower/cashout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: state.gameId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Cashout failed");
        return;
      }
      setState((s) => ({
        ...s,
        cashedOut: true,
        grid: data.grid,
        currentMultiplier: data.multiplier,
      }));
      toast.success(
        `💰 Cashed out ${data.payout.toFixed(4)} ${activeAsset} (${data.multiplier}×)`
      );
      refreshWallet();
      onPlayed?.();
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setState({
      gameId: null,
      difficulty,
      picks: [],
      busted: false,
      cashedOut: false,
      failAt: -1,
      grid: null,
      currentMultiplier: 1,
      nextMultiplier: towerMultiplier(difficulty, 1),
    });
  };

  // change difficulty when idle → update next multiplier preview
  const changeDifficulty = (d: TowerDifficulty) => {
    if (active) return;
    setDifficulty(d);
    setState((s) => ({
      ...s,
      difficulty: d,
      nextMultiplier: towerMultiplier(d, 1),
    }));
  };

  const potentialPayout = bet * state.currentMultiplier;
  const showGrid = state.busted || state.cashedOut;

  // Render tower rows from TOP (highest row) to BOTTOM (row 0 = first climb).
  // Row index 0 is the bottom (first pick). We display reversed so climb goes upward.
  const renderedRows = Array.from({ length: rows }).map((_, i) => {
    const rowIndex = rows - 1 - i; // top row first in display
    return rowIndex;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      {/* Controls */}
      <div className="space-y-3 order-2 lg:order-1">
        {!active ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">
                Bet Amount
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={bet}
                  onChange={(e) =>
                    setBet(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  min={0}
                  step="0.00000001"
                  className="bg-[#0f212e] border-[#2f4553] text-white pr-16 h-10 tabular-nums"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                  <button
                    onClick={() => setBet(bet / 2)}
                    className="px-1.5 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3]"
                  >
                    ½
                  </button>
                  <button
                    onClick={() => setBet(bet * 2)}
                    className="px-1.5 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3]"
                  >
                    2×
                  </button>
                  <button
                    onClick={() => setBet(wallet?.balance || 0)}
                    className="px-1.5 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3]"
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#b1bad3]">Balance</span>
              <span className={`font-bold tabular-nums ${wallet?.color}`}>
                {wallet?.icon} {wallet?.balance.toFixed(6)}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">
                Difficulty
              </Label>
              <ToggleGroup
                type="single"
                value={difficulty}
                onValueChange={(v) => v && changeDifficulty(v as TowerDifficulty)}
                className="grid grid-cols-3 gap-1 bg-[#0f212e] rounded-md p-1"
              >
                <ToggleGroupItem
                  value="easy"
                  className="data-[state=on]:bg-[#213743] data-[state=on]:text-[#00e701] text-[#b1bad3] text-xs h-8"
                >
                  Easy · 4
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="medium"
                  className="data-[state=on]:bg-[#213743] data-[state=on]:text-[#ffd23f] text-[#b1bad3] text-xs h-8"
                >
                  Medium · 3
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="hard"
                  className="data-[state=on]:bg-[#213743] data-[state=on]:text-[#ff5cb1] text-[#b1bad3] text-xs h-8"
                >
                  Hard · 2
                </ToggleGroupItem>
              </ToggleGroup>
              <div className="text-[10px] text-[#b1bad3]">
                Safe tiles per row out of {COLS} columns. {rows} rows to the top.
              </div>
            </div>
            <div className="text-[10px] text-[#b1bad3]">
              First row pays{" "}
              <span className="font-bold text-[#00e701]">
                {towerMultiplier(difficulty, 1).toFixed(2)}×
              </span>{" "}
              · Top pays{" "}
              <span className="font-bold text-[#ffd23f]">
                {towerMultiplier(difficulty, rows).toFixed(2)}×
              </span>
            </div>
            <Button
              onClick={startGame}
              disabled={busy || bet <= 0}
              className="w-full bg-[#00e701] hover:bg-[#00c701] text-[#0a1f12] font-black h-12 active:scale-[0.98] transition-transform"
            >
              {busy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Place Bet"
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="bg-[#0f212e] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bad3]">Rows Climbed</span>
                <span className="font-bold text-[#00e701] tabular-nums">
                  {state.picks.length}/{rows}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bad3]">Current Multiplier</span>
                <span className="font-bold text-white tabular-nums">
                  {state.currentMultiplier.toFixed(2)}×
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bad3]">Next Row</span>
                <span className="font-bold text-[#ffd23f] tabular-nums">
                  {state.nextMultiplier.toFixed(2)}×
                </span>
              </div>
              <div className="border-t border-[#2f4553] pt-2 flex items-center justify-between">
                <span className="text-xs text-[#b1bad3]">Profit on cashout</span>
                <span className="font-bold text-[#00e701] tabular-nums">
                  +{(potentialPayout - bet).toFixed(6)} {activeAsset}
                </span>
              </div>
            </div>
            <Button
              onClick={cashout}
              disabled={busy || state.picks.length < 1}
              className="w-full bg-[#00e701] hover:bg-[#00c701] text-[#0a1f12] font-black h-12 active:scale-[0.98] transition-transform"
            >
              {busy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-1" /> Cash Out{" "}
                  {potentialPayout.toFixed(4)}
                </>
              )}
            </Button>
          </>
        )}

        {(state.busted || state.cashedOut) && (
          <Button
            onClick={reset}
            variant="outline"
            className="w-full bg-transparent border-[#2f4553] text-white hover:bg-[#213743] h-10"
          >
            New Game
          </Button>
        )}
      </div>

      {/* Tower grid */}
      <div className="order-1 lg:order-2 bg-[#0f212e] rounded-lg p-3 sm:p-4 min-h-[420px] overflow-x-auto">
        <div className="flex flex-col gap-1.5 min-w-[480px]">
          {/* Top crown indicator */}
          <div className="flex items-center justify-center mb-1">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                reachedTop && state.cashedOut
                  ? "bg-[#ffd23f]/20 text-[#ffd23f]"
                  : "bg-[#213743] text-[#b1bad3]"
              }`}
            >
              <Crown className="w-3 h-3" />
              Top · {towerMultiplier(difficulty, rows).toFixed(2)}×
            </div>
          </div>

          {renderedRows.map((rowIdx) => {
            const climbed = rowIdx < state.picks.length; // this row has been passed
            const isCurrent = active && rowIdx === state.picks.length;
            const pickedCol = climbed ? state.picks[rowIdx] : -1;
            const safeCols = state.grid ? state.grid[rowIdx] : null;
            const isFailRow = state.busted && rowIdx === state.failAt;
            return (
              <div key={rowIdx} className="flex items-center gap-1.5">
                <div className="w-9 shrink-0 text-right">
                  <span
                    className={`text-[10px] font-bold tabular-nums ${
                      climbed && !isFailRow
                        ? "text-[#00e701]"
                        : isFailRow
                        ? "text-[#ff5c5c]"
                        : "text-[#55657a]"
                    }`}
                  >
                    {towerMultiplier(difficulty, rowIdx + 1).toFixed(2)}×
                  </span>
                </div>
                <div className="grid grid-cols-9 gap-1 flex-1">
                  {Array.from({ length: COLS }).map((_, col) => {
                    const isPicked = climbed && pickedCol === col;
                    const isSafeReveal =
                      showGrid && safeCols ? safeCols.includes(col) : false;
                    const isFailPick = isFailRow && pickedCol === col;
                    const isCurrentRow = isCurrent;
                    return (
                      <button
                        key={col}
                        onClick={() => isCurrentRow && pickColumn(col)}
                        disabled={!isCurrentRow || busy}
                        className={`relative h-9 rounded-md flex items-center justify-center transition-all ${
                          isPicked && !isFailPick
                            ? "bg-[#00e701]/20 border-2 border-[#00e701]"
                            : isFailPick
                            ? "bg-[#ff5c5c]/20 border-2 border-[#ff5c5c]"
                            : isSafeReveal
                            ? "bg-[#213743] border-2 border-[#2f4553] opacity-60"
                            : isCurrentRow
                            ? "bg-[#1a2c38] border-2 border-[#2f4553] hover:border-[#00e701]/60 hover:bg-[#213743] cursor-pointer animate-pulse"
                            : "bg-[#1a2c38] border-2 border-[#2f4553] opacity-50"
                        }`}
                      >
                        <AnimatePresence>
                          {isPicked && !isFailPick && (
                            <motion.div
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <Star
                                className="w-4 h-4 text-[#00e701]"
                                fill="#00e701"
                              />
                            </motion.div>
                          )}
                          {isFailPick && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <Skull className="w-4 h-4 text-[#ff5c5c]" />
                            </motion.div>
                          )}
                          {isSafeReveal && !isPicked && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.05 }}
                            >
                              <Star className="w-3.5 h-3.5 text-[#55657a]" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* Base */}
          <div className="flex items-center justify-center mt-1">
            <div className="text-[10px] text-[#55657a] uppercase tracking-wider">
              Base · Start
            </div>
          </div>
        </div>

        {/* Result banner */}
        <AnimatePresence>
          {state.cashedOut && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-3 text-center text-xl font-black text-[#00e701]"
            >
              🏆 Cashed out {state.currentMultiplier.toFixed(2)}× — won{" "}
              {potentialPayout.toFixed(4)} {activeAsset}
            </motion.div>
          )}
          {state.busted && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-3 text-center text-xl font-black text-[#ff5c5c]"
            >
              💥 Busted at row {state.failAt + 1} — lost {bet.toFixed(4)}{" "}
              {activeAsset}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBetAmount, toRaw } from "./bet-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/store/wallet";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { Loader2, Crown } from "lucide-react";
import { TOWER_CONFIG, towerMultiplier, type TowerDifficulty } from "@/lib/provably-fair";
import {
  GameArena, GameStyles, ConfettiRain, GAME_THEMES, StreakBadge, ProgressBar,
  TowerSlowWinReveal, TowerSlowLoseReveal,
} from "./game-effects";
import {
  soundTowerBetStart,
  soundTowerStep,
  soundTowerHighStep,
  soundTowerCashoutStart,
  soundTowerWinFanfare,
  soundTowerWinShimmer,
  soundTowerBust,
} from "@/hooks/use-sound";

function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("agy_sound_enabled");
  return v === null ? true : v === "true";
}

interface TowerState {
  gameId: string | null;
  difficulty: TowerDifficulty;
  picks: number[];
  busted: boolean;
  cashedOut: boolean;
  failAt: number;
  grid: number[][] | null;
  currentMultiplier: number;
  nextMultiplier: number;
}

const COLS = 9;

const DIFF_COLORS: Record<TowerDifficulty, { border: string; glow: string; text: string }> = {
  easy:   { border: "rgba(0,194,255,0.55)",   glow: "rgba(0,194,255,0.2)",   text: "#00c2ff" },
  medium: { border: "rgba(245,158,11,0.55)",  glow: "rgba(245,158,11,0.2)",  text: "#f59e0b" },
  hard:   { border: "rgba(255,92,177,0.55)",  glow: "rgba(255,92,177,0.2)",  text: "#ff5cb1" },
};

export function TowerGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "tower-bet");
  const [difficulty, setDifficulty] = useState<TowerDifficulty>("medium");
  const [busy, setBusy] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [showLose, setShowLose] = useState(false);
  const [state, setState] = useState<TowerState>(() => ({
    gameId: null, difficulty: "medium", picks: [],
    busted: false, cashedOut: false, failAt: -1, grid: null,
    currentMultiplier: 1, nextMultiplier: towerMultiplier("medium", 1),
  }));

  const activeAsset = useUiStore((s) => s.activeAsset);
  const wallet = useWalletStore((s) => s.wallets.find((w) => w.asset === activeAsset));
  const refreshWallet = useWalletStore((s) => s.refresh);
  const user = useAuthStore((s) => s.user);

  const cfg = TOWER_CONFIG[difficulty];
  const rows = cfg.rows;
  const active = !!state.gameId && !state.busted && !state.cashedOut;
  const currentRow = state.picks.length;
  const reachedTop = state.picks.length >= rows;
  const showGrid = state.busted || state.cashedOut;
  const potentialPayout = bet * state.currentMultiplier;
  const profit = potentialPayout - bet;

  const startGame = async () => {
    if (!user) { useUiStore.getState().setAuthModal(true, "login"); return; }
    setBusy(true);
    setShowWin(false);
    setShowLose(false);
    try {
      const res = await fetch("/api/games/tower/start", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty, asset: activeAsset, betRaw: toRaw(bet) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Start failed"); return; }
      setState({
        gameId: data.gameId, difficulty, picks: [], busted: false, cashedOut: false,
        failAt: -1, grid: null, currentMultiplier: 1, nextMultiplier: data.nextMultiplier,
      });
      refreshWallet();
      if (isSoundEnabled()) soundTowerBetStart();
    } catch { toast.error("Network error"); }
    finally { setBusy(false); }
  };

  const pickColumn = async (col: number) => {
    if (!state.gameId || busy || !active) return;
    setBusy(true);
    try {
      const res = await fetch("/api/games/tower/pick", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: state.gameId, col }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Pick failed"); return; }
      if (data.busted) {
        setState((s) => ({ ...s, busted: true, failAt: data.row, grid: data.grid, picks: data.picks }));
        setStreak(0);
        onPlayed?.();
        if (isSoundEnabled()) soundTowerBust();
        await new Promise((r) => setTimeout(r, 300));
        setShowLose(true);
      } else {
        const newMult = data.multiplier as number;
        const newRow = (data.picks as number[]).length;
        setState((s) => ({ ...s, picks: data.picks, currentMultiplier: newMult, nextMultiplier: data.nextMultiplier }));
        if (isSoundEnabled()) {
          soundTowerStep(newRow - 1, rows);
          if (newRow > rows / 2) soundTowerHighStep(newMult);
        }
        if (data.reachedTop) { await cashout(); }
      }
    } catch { toast.error("Network error"); }
    finally { setBusy(false); }
  };

  const cashout = async () => {
    if (!state.gameId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/games/tower/cashout", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: state.gameId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Cashout failed"); return; }
      setState((s) => ({ ...s, cashedOut: true, grid: data.grid, currentMultiplier: data.multiplier }));
      setStreak((s) => s + 1);
      refreshWallet();
      onPlayed?.();
      if (isSoundEnabled()) {
        soundTowerCashoutStart();
        setTimeout(() => soundTowerWinFanfare(data.multiplier), 350);
        setTimeout(() => soundTowerWinShimmer(), 2900);
      }
      await new Promise((r) => setTimeout(r, 200));
      setShowWin(true);
    } catch { toast.error("Network error"); }
    finally { setBusy(false); }
  };

  const reset = () => {
    setShowWin(false);
    setShowLose(false);
    setState({
      gameId: null, difficulty, picks: [], busted: false, cashedOut: false,
      failAt: -1, grid: null, currentMultiplier: 1, nextMultiplier: towerMultiplier(difficulty, 1),
    });
  };

  const changeDifficulty = (d: TowerDifficulty) => {
    if (active) return;
    setDifficulty(d);
    setState((s) => ({ ...s, difficulty: d, nextMultiplier: towerMultiplier(d, 1) }));
  };

  const renderedRows = Array.from({ length: rows }).map((_, i) => rows - 1 - i);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      {/* ── Left panel ── */}
      <div className="space-y-3 order-2 lg:order-1">
        {!active ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Bet Amount</Label>
              <div className="relative">
                <Input type="number" value={bet}
                  onChange={(e) => setBet(Math.max(0, parseFloat(e.target.value) || 0))}
                  min={0} step="0.00000001"
                  className="bg-[#0f212e] border-[#2f4553] text-white pr-16 h-10 tabular-nums"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                  {[["½", () => setBet(bet / 2)], ["2×", () => setBet(bet * 2)], ["Max", () => setBet(wallet?.balance || 0)]].map(([label, fn]) => (
                    <button key={String(label)} onClick={fn as () => void}
                      className="px-1.5 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3]">
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#b1bad3]">Balance</span>
              <span className={"font-bold tabular-nums " + (wallet?.color || "")}>
                {wallet?.icon} {wallet?.balance.toFixed(6)}
              </span>
            </div>

            {/* Difficulty buttons */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Difficulty</Label>
              <div className="grid grid-cols-3 gap-1">
                {(["easy", "medium", "hard"] as TowerDifficulty[]).map((d) => {
                  const dc = DIFF_COLORS[d];
                  const safePer = TOWER_CONFIG[d].safePerRow;
                  return (
                    <button key={d} onClick={() => changeDifficulty(d)}
                      style={{
                        padding: "8px 4px", borderRadius: 8, fontWeight: 700, fontSize: 11,
                        fontFamily: "monospace", cursor: "pointer", transition: "all 0.2s",
                        background: difficulty === d ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                        border: "1px solid " + (difficulty === d ? dc.border : "rgba(255,255,255,0.07)"),
                        color: difficulty === d ? dc.text : "#b1bad3",
                        boxShadow: difficulty === d ? "0 0 12px " + dc.glow : "none",
                        textAlign: "center",
                      }}
                    >
                      <div>{d.charAt(0).toUpperCase() + d.slice(1)}</div>
                      <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{safePer} safe</div>
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] text-[#b1bad3]">
                Safe tiles per row out of {COLS} columns. {rows} rows to the top.
              </div>
            </div>

            <div className="text-[10px] text-[#b1bad3]">
              First row pays{" "}
              <span className="font-bold text-[#00c2ff]">{towerMultiplier(difficulty, 1).toFixed(2)}×</span>
              {" "}· Top pays{" "}
              <span className="font-bold text-[#ffd23f]">{towerMultiplier(difficulty, rows).toFixed(2)}×</span>
            </div>

            <Button onClick={startGame} disabled={busy || bet <= 0}
              className="w-full h-12 font-black active:scale-[0.98] transition-all"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #ffd23f 50%, #d97706 100%)",
                color: "#000", boxShadow: "0 4px 20px rgba(245,158,11,0.4)",
              }}
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Place Bet"}
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-xl p-3 space-y-2.5" style={{
              background: "linear-gradient(145deg,#100800,#180c00)",
              border: "1px solid rgba(245,158,11,0.25)",
              boxShadow: "0 0 22px rgba(245,158,11,0.1)",
            }}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bad3]">Rows Climbed</span>
                <span className="font-bold tabular-nums" style={{ color: "#f59e0b", textShadow: "0 0 8px rgba(245,158,11,0.6)" }}>
                  {currentRow}/{rows}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bad3]">Current Multiplier</span>
                <span className="font-bold text-white tabular-nums">{state.currentMultiplier.toFixed(2)}×</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bad3]">Next Row</span>
                <span className="font-bold tabular-nums" style={{ color: "#ffd23f" }}>{state.nextMultiplier.toFixed(2)}×</span>
              </div>
              <div className="border-t pt-2" style={{ borderColor: "rgba(245,158,11,0.18)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#b1bad3]">Profit on cashout</span>
                  <span className="font-bold tabular-nums text-xs" style={{ color: "#00c2ff", textShadow: "0 0 8px rgba(0,194,255,0.5)" }}>
                    +{profit.toFixed(6)} {activeAsset}
                  </span>
                </div>
              </div>
            </div>

            <Button onClick={cashout} disabled={busy || currentRow < 1}
              className="w-full h-12 font-black active:scale-[0.98] transition-all"
              style={{
                background: currentRow >= 1
                  ? "linear-gradient(135deg, #f59e0b 0%, #ffd23f 100%)"
                  : "#1a2c38",
                color: "#000",
                boxShadow: currentRow >= 1 ? "0 4px 20px rgba(245,158,11,0.35)" : "none",
                transition: "all 0.3s",
              }}
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cash Out " + potentialPayout.toFixed(4)}
            </Button>
          </>
        )}

        {(state.busted || state.cashedOut) && (
          <Button onClick={reset} variant="outline"
            className="w-full bg-transparent border-[#2f4553] text-white hover:bg-[#213743] h-10">
            New Game
          </Button>
        )}
      </div>

      {/* ── Game Arena ── */}
      <GameArena
        gameId="tower"
        win={state.cashedOut ? true : state.busted ? false : null}
        shake={state.busted}
        className="order-1 lg:order-2 p-3 sm:p-4 flex flex-col justify-between overflow-hidden relative"
      >
        <GameStyles />

        <div className="absolute top-2 w-full flex justify-center z-40">
          <StreakBadge streak={streak} />
        </div>

        {/* Depth atmosphere */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical side rails */}
          {[8, 92].map((pct) => (
            <div key={pct} style={{
              position: "absolute", top: 0, bottom: 0, left: pct + "%", width: "1px",
              background: "linear-gradient(180deg, transparent, rgba(245,158,11,0.18) 20%, rgba(245,158,11,0.12) 80%, transparent)",
            }} />
          ))}
          {/* Floor glow when active */}
          {active && (
            <div style={{
              position: "absolute", bottom: "6%", left: "10%", right: "10%", height: "3px",
              background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.6) 20%, rgba(245,158,11,0.6) 80%, transparent)",
              filter: "blur(3px)",
              animation: "towerFloorGlow 1.5s ease-in-out infinite",
            }} />
          )}
          {/* Rising particles when active */}
          {active && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: (12 + i * 11) + "%",
              bottom: (currentRow / rows * 100) + "%",
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              borderRadius: "50%",
              background: i % 3 === 0 ? "#f59e0b" : i % 3 === 1 ? "#ffd23f" : "#00c2ff",
              opacity: 0.5,
              animation: "towerClimbTrail " + (1.2 + i * 0.2) + "s ease-out " + (i * 0.15) + "s infinite",
            }} />
          ))}
        </div>

        {/* Crown header */}
        <div className="flex items-center justify-center mb-1 z-10">
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            letterSpacing: 2, textTransform: "uppercase",
            background: reachedTop && state.cashedOut ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.05)",
            border: "1px solid " + (reachedTop && state.cashedOut ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.08)"),
            color: reachedTop && state.cashedOut ? "#ffd23f" : "#b1bad3",
            boxShadow: reachedTop && state.cashedOut ? "0 0 14px rgba(245,158,11,0.3)" : "none",
            animation: reachedTop && state.cashedOut ? "towerTopReach 0.6s ease-out" : "none",
          }}>
            <Crown style={{ width: 13, height: 13 }} />
            TOP · {towerMultiplier(difficulty, rows).toFixed(2)}×
          </div>
        </div>

        {/* Tower grid */}
        <div className="flex flex-col gap-1.5 mx-auto z-10 w-full max-w-[560px]"
          style={{ paddingBottom: 40, paddingTop: 8 }}>
          {renderedRows.map((rowIdx) => {
            const climbed = rowIdx < state.picks.length;
            const isCurrent = active && rowIdx === state.picks.length;
            const pickedCol = climbed ? state.picks[rowIdx] : -1;
            const safeCols = state.grid ? state.grid[rowIdx] : null;
            const isFailRow = state.busted && rowIdx === state.failAt;
            const rowMult = towerMultiplier(difficulty, rowIdx + 1);

            return (
              <div key={rowIdx} className="flex items-center gap-1.5" style={{
                borderRadius: 10,
                padding: "2px 4px",
                background: isCurrent ? "rgba(245,158,11,0.06)" : "transparent",
                boxShadow: isCurrent ? "0 0 18px rgba(245,158,11,0.2), inset 0 0 12px rgba(245,158,11,0.04)" : "none",
                transition: "all 0.3s",
                position: "relative", overflow: "hidden",
              }}>
                {/* Row sweep light for current row */}
                {isCurrent && (
                  <div style={{
                    position: "absolute", top: 0, bottom: 0, width: "40%",
                    background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.15), transparent)",
                    animation: "towerRowSweep 1.6s ease-in-out infinite",
                    pointerEvents: "none",
                  }} />
                )}

                {/* Multiplier label */}
                <div className="w-10 shrink-0 text-right">
                  <span style={{
                    fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                    color: climbed && !isFailRow ? "#f59e0b"
                      : isFailRow ? "#ef4444"
                      : isCurrent ? "#ffffff"
                      : "#3a4d5c",
                    textShadow: isCurrent ? "0 0 8px rgba(255,255,255,0.5)"
                      : climbed ? "0 0 8px rgba(245,158,11,0.5)" : "none",
                  }}>
                    {rowMult.toFixed(2)}×
                  </span>
                </div>

                {/* 9-column tile grid */}
                <div className="grid grid-cols-9 gap-1 flex-1">
                  {Array.from({ length: COLS }).map((_, col) => {
                    const isPicked      = climbed && pickedCol === col;
                    const isFailPick    = isFailRow && pickedCol === col;
                    const isSafeReveal  = showGrid && safeCols ? safeCols.includes(col) && !isPicked && !isFailPick : false;
                    const isUnsafeReveal = showGrid && safeCols ? !safeCols.includes(col) && !isPicked && !isFailPick : false;

                    // Tile background
                    let bg = "linear-gradient(145deg,#0d1822 0%,#132030 100%)";
                    let shadow = "0 3px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)";
                    let border = "1px solid rgba(255,255,255,0.05)";
                    let anim = "";

                    if (isPicked && !isFailPick) {
                      bg = "radial-gradient(circle at 38% 32%, #fef08a 0%, #fbbf24 30%, #f59e0b 60%, #d97706 100%)";
                      shadow = "0 0 20px rgba(245,158,11,0.85), 0 0 40px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.4)";
                      border = "1.5px solid #fcd34d";
                      anim = "towerSafePulse 2s ease-in-out infinite";
                    } else if (isFailPick) {
                      bg = "radial-gradient(circle at 38% 32%, #fca5a5 0%, #ef4444 40%, #b91c1c 75%, #7f1d1d 100%)";
                      shadow = "0 0 20px rgba(239,68,68,0.85), 0 0 40px rgba(239,68,68,0.3)";
                      border = "1.5px solid #fca5a5";
                      anim = "towerFailShatter 0.55s ease-out";
                    } else if (isSafeReveal) {
                      bg = "linear-gradient(145deg,#0a1a10,#0d2016)";
                      border = "1px solid rgba(74,222,128,0.22)";
                      shadow = "0 0 8px rgba(74,222,128,0.15)";
                    } else if (isUnsafeReveal) {
                      bg = "linear-gradient(145deg,#1a0808,#200808)";
                      border = "1px solid rgba(239,68,68,0.15)";
                      shadow = "none";
                    } else if (isCurrent) {
                      border = "1px solid rgba(245,158,11,0.3)";
                      shadow = "0 3px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)";
                    }

                    return (
                      <button key={col}
                        onClick={() => isCurrent && pickColumn(col)}
                        disabled={!isCurrent || busy}
                        style={{
                          height: 34, borderRadius: 7,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: bg, boxShadow: shadow, border,
                          cursor: isCurrent && !busy ? "pointer" : "default",
                          animation: anim,
                          transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                          transform: isPicked && !isFailPick ? "translateZ(4px) scale(1.02)"
                            : isCurrent ? "translateZ(4px)" : "none",
                          opacity: (!climbed && !isCurrent && !showGrid) ? 0.55 : 1,
                          position: "relative", overflow: "hidden",
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent || busy) return;
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,194,255,0.65)";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 14px rgba(0,194,255,0.4), inset 0 1px 0 rgba(255,255,255,0.1)";
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateZ(8px) scale(1.04)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent || busy) return;
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.3)";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = shadow;
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateZ(4px)";
                        }}
                      >
                        {/* Specular top glint */}
                        {!isPicked && !isFailPick && !isSafeReveal && !isUnsafeReveal && (
                          <div style={{
                            position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                          }} />
                        )}

                        <AnimatePresence>
                          {isPicked && !isFailPick && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 320, damping: 18 }}
                              style={{ fontSize: 15 }}
                            >
                              ⭐
                            </motion.div>
                          )}
                          {isFailPick && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 280 }}
                              style={{ fontSize: 16 }}
                            >
                              💀
                            </motion.div>
                          )}
                          {isSafeReveal && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 0.8 }} transition={{ delay: 0.05 }}
                              style={{ fontSize: 11, opacity: 0.6 }}>
                              ✓
                            </motion.div>
                          )}
                          {isUnsafeReveal && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 0.7 }} transition={{ delay: 0.05 }}
                              style={{ fontSize: 11, opacity: 0.35 }}>
                              ✕
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
        </div>

        {/* Segmented progress bar */}
        <div className="absolute bottom-3 left-4 right-4 z-40">
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, fontFamily: "monospace", letterSpacing: 2 }}>
              FLOOR {currentRow}
            </span>
            <span style={{ fontSize: 10, color: "#b1bad3", fontFamily: "monospace" }}>{rows}</span>
          </div>
          <div style={{ display: "flex", gap: 2, height: 5 }}>
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} style={{
                flex: 1, borderRadius: 2,
                background: i < currentRow
                  ? "linear-gradient(90deg, #f59e0b, #ffd23f)"
                  : i === currentRow && active
                  ? "rgba(245,158,11,0.35)"
                  : "rgba(255,255,255,0.07)",
                boxShadow: i < currentRow ? "0 0 6px rgba(245,158,11,0.6)" : "none",
                transition: "background 0.3s, box-shadow 0.3s",
              }} />
            ))}
          </div>
        </div>

        {/* Cinematic reveals */}
        <TowerSlowWinReveal
          active={showWin}
          multiplier={state.currentMultiplier}
          profit={profit}
          asset={activeAsset}
          rowsClimbed={currentRow}
        />
        <TowerSlowLoseReveal
          active={showLose}
          failRow={state.failAt}
          difficulty={difficulty}
        />
        <ConfettiRain active={state.cashedOut && showWin} colors={GAME_THEMES.tower.particleColors} />
      </GameArena>
    </div>
  );
}

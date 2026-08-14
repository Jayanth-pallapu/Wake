"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/hooks/use-game";
import { useBetAmount, toRaw } from "./bet-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useWalletStore } from "@/store/wallet";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { minesMultiplier } from "@/lib/provably-fair";
import {
  GameArena, GameStyles, ConfettiRain, GAME_THEMES, StreakBadge,
  MinesSlowWinReveal, MinesSlowLoseReveal,
} from "./game-effects";
import {
  soundMinesBetStart,
  soundMinesGemReveal,
  soundMinesBombExplode,
  soundMinesCashoutStart,
  soundMinesWinFanfare,
  soundMinesWinShimmer,
  soundMinesLoseRumble,
} from "@/hooks/use-sound";

function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("agy_sound_enabled");
  return v === null ? true : v === "true";
}

interface MinesState {
  gameId: string | null;
  mineCount: number;
  picks: number[];
  busted: boolean;
  cashedOut: boolean;
  grid: boolean[] | null;
  currentMultiplier: number;
  nextMultiplier: number;
}

/* ── Gem SVG: multi-facet 3D diamond ── */
function GemIcon({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,2 28,11 16,30 4,11" fill="url(#gemGrad)" />
      <polygon points="16,2 28,11 16,13" fill="rgba(255,255,255,0.55)" />
      <polygon points="4,11 16,13 16,30" fill="rgba(0,0,0,0.18)" />
      <polygon points="16,2 4,11 16,13" fill="rgba(255,255,255,0.22)" />
      <polygon points="28,11 16,30 16,13" fill="rgba(0,0,0,0.1)" />
      <defs>
        <linearGradient id="gemGrad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="45%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Bomb SVG: custom with fuse ── */
function BombIcon({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="18" r="11" fill="url(#bombGrad)" />
      <circle cx="11" cy="14" r="3" fill="rgba(255,255,255,0.25)" />
      <line x1="15" y1="7" x2="20" y2="3" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="21" cy="2" r="2" fill="#fbbf24" style={{ animation: "minesGemShimmer 0.6s linear infinite" }} />
      <defs>
        <radialGradient id="bombGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="60%" stopColor="#374151" />
          <stop offset="100%" stopColor="#111827" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ── Individual tile ── */
function MinesTile({
  index, active, revealed, isMine, isRevealedMine, isRevealedGem,
  showGrid, onClick, disabled, multiplier, revealDelay,
}: {
  index: number; active: boolean; revealed: boolean;
  isMine: boolean; isRevealedMine: boolean; isRevealedGem: boolean;
  showGrid: boolean; onClick: () => void; disabled: boolean;
  multiplier: number; revealDelay?: number;
}) {
  const [hovered, setHovered] = useState(false);

  const tileStyle: React.CSSProperties = {
    position: "absolute", inset: 0, width: "100%", height: "100%",
    borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
    cursor: active && !revealed && !disabled ? "pointer" : "default",
    border: "none", outline: "none",
    transition: "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease",
    transform: hovered && active && !revealed ? "translateY(-5px) scale(1.04)" : "none",
  };

  // Unrevealed tile: 3D bevel
  if (!revealed && !isRevealedMine && !isRevealedGem) {
    tileStyle.background = "linear-gradient(145deg,#1e3040 0%,#243d50 35%,#1a2e3d 65%,#152535 100%)";
    tileStyle.boxShadow = hovered && active
      ? "0 8px 24px rgba(0,194,255,0.35), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1.5px rgba(0,194,255,0.6)"
      : "0 4px 14px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(255,255,255,0.06)";
    tileStyle.filter = hovered && active ? "brightness(1.2)" : "none";
  }

  // Gem (safe picked)
  if (revealed) {
    tileStyle.background = "radial-gradient(circle at 35% 30%, #86efac 0%, #4ade80 40%, #16a34a 75%, #14532d 100%)";
    tileStyle.boxShadow = "0 0 22px rgba(74,222,128,0.8), 0 0 8px rgba(74,222,128,0.4), inset 0 1px 0 rgba(255,255,255,0.35)";
    tileStyle.animation = "minesRevealSweep 0.38s ease-out " + (revealDelay || 0) + "ms both";
  }

  // Mine revealed after bust
  if (isRevealedMine) {
    tileStyle.background = "radial-gradient(circle at 35% 30%, #f87171 0%, #ef4444 40%, #b91c1c 75%, #7f1d1d 100%)";
    tileStyle.boxShadow = "0 0 22px rgba(239,68,68,0.85), 0 0 8px rgba(239,68,68,0.4)";
    tileStyle.animation = "minesRevealSweep 0.38s ease-out " + (revealDelay || 0) + "ms both";
  }

  // Safe tile shown after cashout (ghost)
  if (isRevealedGem) {
    tileStyle.background = "linear-gradient(145deg,#1a2c38,#213743)";
    tileStyle.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.04)";
    tileStyle.opacity = 0.4;
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={tileStyle}
      whileTap={active && !revealed ? { scale: 0.94 } : {}}
    >
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ scale: 0, rotate: -160 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 18, delay: (revealDelay || 0) / 1000 }}
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}
          >
            <GemIcon size={32} />
          </motion.div>
        )}
        {isRevealedMine && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 16, delay: (revealDelay || 0) / 1000 }}
            style={{ animation: "minesBombShake 0.5s ease-out " + ((revealDelay || 0) + 100) + "ms both" }}
          >
            <BombIcon size={30} />
          </motion.div>
        )}
        {isRevealedGem && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 0.7 }} transition={{ delay: 0.08 }}>
            <GemIcon size={24} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Specular top-edge glint on unrevealed */}
      {!revealed && !isRevealedMine && !isRevealedGem && (
        <div style={{
          position: "absolute", top: 0, left: "12%", right: "12%", height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
          borderRadius: "50%",
        }} />
      )}
    </motion.button>
  );
}

export function MinesGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "mines-bet");
  const [mineCount, setMineCount] = useState(3);
  const [state, setState] = useState<MinesState>({
    gameId: null, mineCount: 3, picks: [], busted: false, cashedOut: false,
    grid: null, currentMultiplier: 1, nextMultiplier: minesMultiplier(3, 1),
  });
  const [busy, setBusy] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [showLose, setShowLose] = useState(false);
  const [lastPick, setLastPick] = useState(-1);

  const { play } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);
  const wallet = useWalletStore((s) => s.wallets.find((w) => w.asset === activeAsset));
  const refreshWallet = useWalletStore((s) => s.refresh);
  const user = useAuthStore((s) => s.user);

  const active = state.gameId && !state.busted && !state.cashedOut;

  // Multiplier-based arena glow color
  const mult = state.currentMultiplier;
  const arenaGlowColor = mult >= 10
    ? "rgba(255,210,63,0.22)"
    : mult >= 5
    ? "rgba(74,222,128,0.18)"
    : mult >= 2
    ? "rgba(74,222,128,0.12)"
    : "rgba(74,222,128,0.06)";

  const startGame = async () => {
    if (!user) { useUiStore.getState().setAuthModal(true, "login"); return; }
    setBusy(true);
    setShowWin(false);
    setShowLose(false);
    try {
      const res = await fetch("/api/games/mines/start", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mineCount, asset: activeAsset, betRaw: toRaw(bet) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Start failed"); return; }
      setState({
        gameId: data.gameId, mineCount, picks: [], busted: false, cashedOut: false,
        grid: null, currentMultiplier: 1, nextMultiplier: data.nextMultiplier,
      });
      setLastPick(-1);
      refreshWallet();
      if (isSoundEnabled()) soundMinesBetStart();
    } catch { toast.error("Network error"); }
    finally { setBusy(false); }
  };

  const pickTile = async (tile: number) => {
    if (!state.gameId || state.picks.includes(tile) || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/games/mines/pick", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: state.gameId, tile }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Pick failed"); return; }
      if (data.busted) {
        setState((s) => ({ ...s, busted: true, grid: data.grid, picks: data.picks }));
        setStreak(0);
        setLastPick(tile);
        if (isSoundEnabled()) {
          soundMinesBombExplode();
          setTimeout(() => soundMinesLoseRumble(), 350);
        }
        await new Promise((r) => setTimeout(r, 300));
        setShowLose(true);
        onPlayed?.();
      } else {
        const newMult = data.multiplier as number;
        setState((s) => ({
          ...s, picks: data.picks, currentMultiplier: newMult, nextMultiplier: data.nextMultiplier,
        }));
        setLastPick(tile);
        if (isSoundEnabled()) soundMinesGemReveal(newMult);
      }
    } catch { toast.error("Network error"); }
    finally { setBusy(false); }
  };

  const cashout = async () => {
    if (!state.gameId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/games/mines/cashout", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: state.gameId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Cashout failed"); return; }
      setState((s) => ({ ...s, cashedOut: true, grid: data.grid, currentMultiplier: data.multiplier }));
      setStreak(s => s + 1);
      refreshWallet();
      onPlayed?.();
      if (isSoundEnabled()) {
        soundMinesCashoutStart();
        setTimeout(() => soundMinesWinFanfare(data.multiplier), 350);
        setTimeout(() => soundMinesWinShimmer(), 2900);
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
      gameId: null, mineCount, picks: [], busted: false, cashedOut: false,
      grid: null, currentMultiplier: 1, nextMultiplier: minesMultiplier(mineCount, 1),
    });
  };

  const gemsFound = state.picks.length;
  const potentialPayout = bet * state.currentMultiplier;
  const profit = potentialPayout - bet;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      {/* ── Left panel ── */}
      <div className="space-y-3 order-2 lg:order-1">
        {!active ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Bet Amount</Label>
              <div className="relative">
                <Input
                  type="number" value={bet}
                  onChange={(e) => setBet(Math.max(0, parseFloat(e.target.value) || 0))}
                  min={0} step="0.00000001"
                  className="bg-[#0f212e] border-[#2f4553] text-white pr-16 h-10 tabular-nums"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                  <button onClick={() => setBet(bet / 2)} className="px-1.5 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3]">1/2</button>
                  <button onClick={() => setBet(bet * 2)} className="px-1.5 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3]">2x</button>
                  <button onClick={() => setBet(wallet?.balance || 0)} className="px-1.5 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3]">Max</button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#b1bad3]">Balance</span>
              <span className={"font-bold tabular-nums " + (wallet?.color || "")}>
                {wallet?.icon} {wallet?.balance.toFixed(6)}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Mines</Label>
                <span className="text-xs font-bold text-[#ff5c5c] tabular-nums">{mineCount}</span>
              </div>
              <Slider value={[mineCount]} min={1} max={24} step={1}
                onValueChange={(v) => setMineCount(v[0])}
                className="[&_[role=slider]]:bg-[#ff5c5c] [&_[role=slider]]:border-[#001a2e] [&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
              />
              <div className="flex justify-between text-[10px] text-[#b1bad3]"><span>1</span><span>24</span></div>
            </div>
            <div className="text-[10px] text-[#b1bad3]">
              First pick pays <span className="font-bold text-[#4ade80]">{minesMultiplier(mineCount, 1).toFixed(2)}x</span>
            </div>
            <Button onClick={startGame} disabled={busy || bet <= 0}
              className="w-full h-12 font-black active:scale-[0.98] transition-all"
              style={{
                background: "linear-gradient(135deg, #22c55e 0%, #4ade80 50%, #16a34a 100%)",
                color: "#001a0e",
                boxShadow: "0 4px 20px rgba(74,222,128,0.4)",
              }}
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Bet"}
            </Button>
          </>
        ) : (
          <>
            {/* Active game stats */}
            <div className="rounded-xl p-3 space-y-2.5" style={{
              background: "linear-gradient(145deg,#0a1a10,#0d2016)",
              border: "1px solid rgba(74,222,128,0.2)",
              boxShadow: "0 0 20px rgba(74,222,128,0.08)",
            }}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bad3]">Gems Found</span>
                <span className="font-bold tabular-nums" style={{ color: "#4ade80", textShadow: "0 0 8px rgba(74,222,128,0.6)" }}>
                  {gemsFound}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bad3]">Current Multiplier</span>
                <span className="font-bold tabular-nums text-white">{state.currentMultiplier.toFixed(2)}x</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bad3]">Next Tile</span>
                <span className="font-bold tabular-nums" style={{ color: "#ffd23f" }}>{state.nextMultiplier.toFixed(2)}x</span>
              </div>
              <div className="border-t pt-2" style={{ borderColor: "rgba(74,222,128,0.15)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#b1bad3]">Profit on cashout</span>
                  <span className="font-bold tabular-nums" style={{ color: "#00c2ff", textShadow: "0 0 8px rgba(0,194,255,0.5)" }}>
                    +{profit.toFixed(6)} {activeAsset}
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={cashout} disabled={busy || gemsFound < 1}
              className="w-full h-12 font-black active:scale-[0.98] transition-all"
              style={{
                background: gemsFound >= 1
                  ? "linear-gradient(135deg, #4ade80 0%, #ffd23f 100%)"
                  : "#1a2c38",
                color: "#001a0e", fontWeight: 900,
                boxShadow: gemsFound >= 1 ? "0 4px 20px rgba(74,222,128,0.35)" : "none",
                transition: "all 0.3s ease",
              }}
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : ("Cash Out " + potentialPayout.toFixed(4))}
            </Button>
          </>
        )}

        {(state.busted || state.cashedOut) && (
          <Button onClick={reset} variant="outline"
            className="w-full bg-transparent border-[#2f4553] text-white hover:bg-[#213743] h-10"
          >
            New Game
          </Button>
        )}
      </div>

      {/* ── Game Arena ── */}
      <GameArena
        gameId="mines"
        win={state.cashedOut ? true : state.busted ? false : null}
        shake={state.busted}
        className="order-1 lg:order-2 p-4 flex flex-col items-center justify-center relative overflow-hidden"
      >
        <GameStyles />

        <div className="absolute top-2 w-full flex justify-center z-40">
          <StreakBadge streak={streak} />
        </div>

        {/* Dynamic arena glow that intensifies with multiplier */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-700" style={{
          background: "radial-gradient(circle at 50% 50%, " + arenaGlowColor + " 0%, transparent 68%)",
        }} />

        {/* Subtle gem sparkle dots in bg */}
        {active && gemsFound > 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: Math.min(gemsFound * 3, 18) }).map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                left: (10 + (i * 37) % 80) + "%",
                top: (5 + (i * 23) % 90) + "%",
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                borderRadius: "50%",
                background: i % 3 === 0 ? "#4ade80" : i % 3 === 1 ? "#ffd23f" : "#00c2ff",
                opacity: 0.4 + (i % 4) * 0.12,
                filter: "blur(1px)",
                animation: "gfxStarTwinkle " + (1.2 + (i % 5) * 0.4) + "s ease-in-out " + (i * 0.15) + "s infinite",
              }} />
            ))}
          </div>
        )}

        {/* 5x5 Grid */}
        <div className="relative w-full max-w-[420px] aspect-square mx-auto z-10">
          <div
            className="grid grid-cols-5 gap-2 w-full h-full"
            style={{ perspective: "900px" }}
          >
            {Array.from({ length: 25 }).map((_, i) => {
              const revealed = state.picks.includes(i);
              const isMine = state.grid ? (state.grid as boolean[])[i] : false;
              const showGrid = state.busted || state.cashedOut;
              const isRevealedMine = showGrid && isMine && !revealed;
              const isRevealedGem = showGrid && !isMine && !revealed;
              // Staggered delay for post-game reveal sweep
              const col = i % 5;
              const row = Math.floor(i / 5);
              const delay = showGrid ? (col + row) * 45 : 0;

              return (
                <div key={i} className="relative" style={{ minHeight: 0 }}>
                  <MinesTile
                    index={i}
                    active={!!active}
                    revealed={revealed}
                    isMine={isMine}
                    isRevealedMine={isRevealedMine}
                    isRevealedGem={isRevealedGem}
                    showGrid={showGrid}
                    onClick={() => active && pickTile(i)}
                    disabled={!active || revealed || busy}
                    multiplier={state.currentMultiplier}
                    revealDelay={delay}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Cinematic reveals */}
        <MinesSlowWinReveal
          active={showWin}
          multiplier={state.currentMultiplier}
          profit={profit}
          asset={activeAsset}
          gemCount={gemsFound}
        />
        <MinesSlowLoseReveal
          active={showLose}
          mineCount={state.mineCount}
        />

        <ConfettiRain active={state.cashedOut && showWin} colors={GAME_THEMES.mines.particleColors} />
      </GameArena>
    </div>
  );
}
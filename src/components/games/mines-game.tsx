"use client";

import { useState, useCallback } from "react";
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
import { Gem, Bomb, DollarSign, Loader2 } from "lucide-react";
import { minesMultiplier } from "@/lib/provably-fair";

interface MinesState {
  gameId: string | null;
  mineCount: number;
  picks: number[];
  busted: boolean;
  cashedOut: boolean;
  grid: boolean[] | null; // revealed at end
  currentMultiplier: number;
  nextMultiplier: number;
}

export function MinesGame({ onPlayed }: { onPlayed?: () => void }) {
  const [bet, setBet] = useBetAmount(1, "mines-bet");
  const [mineCount, setMineCount] = useState(3);
  const [state, setState] = useState<MinesState>({
    gameId: null, mineCount: 3, picks: [], busted: false, cashedOut: false,
    grid: null, currentMultiplier: 1, nextMultiplier: minesMultiplier(3, 1),
  });
  const [busy, setBusy] = useState(false);
  const { play } = useGame();
  const activeAsset = useUiStore((s) => s.activeAsset);
  const wallet = useWalletStore((s) => s.wallets.find((w) => w.asset === activeAsset));
  const refreshWallet = useWalletStore((s) => s.refresh);
  const user = useAuthStore((s) => s.user);

  const active = state.gameId && !state.busted && !state.cashedOut;

  const startGame = async () => {
    if (!user) {
      useUiStore.getState().setAuthModal(true, "login");
      return;
    }
    setBusy(true);
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
      refreshWallet();
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
        toast.error(`💥 Hit a mine! Lost ${bet.toFixed(4)} ${activeAsset}`);
        onPlayed?.();
      } else {
        setState((s) => ({
          ...s, picks: data.picks, currentMultiplier: data.multiplier, nextMultiplier: data.nextMultiplier,
        }));
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
      toast.success(`💰 Cashed out ${data.payout.toFixed(4)} ${activeAsset} (${data.multiplier}×)`);
      refreshWallet();
      onPlayed?.();
    } catch { toast.error("Network error"); }
    finally { setBusy(false); }
  };

  const reset = () => {
    setState({
      gameId: null, mineCount, picks: [], busted: false, cashedOut: false,
      grid: null, currentMultiplier: 1, nextMultiplier: minesMultiplier(mineCount, 1),
    });
  };

  const gemsFound = state.picks.length;
  const potentialPayout = bet * state.currentMultiplier;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      {/* Controls */}
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
                  <button onClick={() => setBet(bet / 2)} className="px-1.5 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3]">½</button>
                  <button onClick={() => setBet(bet * 2)} className="px-1.5 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3]">2×</button>
                  <button onClick={() => setBet(wallet?.balance || 0)} className="px-1.5 py-1 text-[10px] font-bold rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3]">Max</button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#b1bad3]">Balance</span>
              <span className={`font-bold tabular-nums ${wallet?.color}`}>{wallet?.icon} {wallet?.balance.toFixed(6)}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Mines</Label>
                <span className="text-xs font-bold text-[#ff5c5c] tabular-nums">{mineCount}</span>
              </div>
              <Slider value={[mineCount]} min={1} max={24} step={1} onValueChange={(v) => setMineCount(v[0])}
                className="[&_[role=slider]]:bg-[#ff5c5c] [&_[role=slider]]:border-[#0a1f12] [&_[role=slider]]:h-5 [&_[role=slider]]:w-5" />
              <div className="flex justify-between text-[10px] text-[#b1bad3]"><span>1</span><span>24</span></div>
            </div>
            <div className="text-[10px] text-[#b1bad3]">
              First pick pays <span className="font-bold text-[#00e701]">{minesMultiplier(mineCount, 1).toFixed(2)}×</span>
            </div>
            <Button onClick={startGame} disabled={busy || bet <= 0}
              className="w-full bg-[#00e701] hover:bg-[#00c701] text-[#0a1f12] font-black h-12 active:scale-[0.98] transition-transform">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Bet"}
            </Button>
          </>
        ) : (
          <>
            <div className="bg-[#0f212e] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bad3]">Gems Found</span>
                <span className="font-bold text-[#00e701] tabular-nums">{gemsFound}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bad3]">Current Multiplier</span>
                <span className="font-bold text-white tabular-nums">{state.currentMultiplier.toFixed(2)}×</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bad3]">Next Tile</span>
                <span className="font-bold text-[#ffd23f] tabular-nums">{state.nextMultiplier.toFixed(2)}×</span>
              </div>
              <div className="border-t border-[#2f4553] pt-2 flex items-center justify-between">
                <span className="text-xs text-[#b1bad3]">Profit on cashout</span>
                <span className="font-bold text-[#00e701] tabular-nums">+{(potentialPayout - bet).toFixed(6)} {activeAsset}</span>
              </div>
            </div>
            <Button onClick={cashout} disabled={busy || gemsFound < 1}
              className="w-full bg-[#00e701] hover:bg-[#00c701] text-[#0a1f12] font-black h-12 active:scale-[0.98] transition-transform">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <><DollarSign className="w-4 h-4 mr-1" /> Cash Out {(potentialPayout).toFixed(4)}</>}
            </Button>
          </>
        )}

        {(state.busted || state.cashedOut) && (
          <Button onClick={reset} variant="outline" className="w-full bg-transparent border-[#2f4553] text-white hover:bg-[#213743] h-10">
            New Game
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="order-1 lg:order-2 bg-[#0f212e] rounded-lg p-4 min-h-[340px] flex items-center justify-center">
        <div className="grid grid-cols-5 gap-2 w-full max-w-[420px] aspect-square">
          {Array.from({ length: 25 }).map((_, i) => {
            const revealed = state.picks.includes(i);
            const isMine = state.grid ? (state.grid as boolean[])[i] : false;
            const showGrid = state.busted || state.cashedOut;
            const isRevealedMine = showGrid && isMine;
            const isRevealedGem = showGrid && !isMine && !revealed;
            return (
              <motion.button
                key={i}
                onClick={() => active && pickTile(i)}
                disabled={!active || revealed || busy}
                initial={false}
                animate={{
                  rotateY: revealed || showGrid ? 0 : 0,
                  scale: revealed ? 1 : 1,
                }}
                className={`relative rounded-lg flex items-center justify-center text-2xl transition-all ${
                  revealed
                    ? "bg-[#0f212e] border-2 border-[#00e701]"
                    : isRevealedMine
                    ? "bg-[#ff5c5c]/20 border-2 border-[#ff5c5c]"
                    : isRevealedGem
                    ? "bg-[#213743] border-2 border-[#2f4553] opacity-50"
                    : "bg-[#1a2c38] border-2 border-[#2f4553] hover:border-[#00e701]/50 hover:bg-[#213743]"
                } ${active && !revealed ? "cursor-pointer" : "cursor-default"}`}
              >
                <AnimatePresence>
                  {revealed && (
                    <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300 }}>
                      <Gem className="w-6 h-6 text-[#00e701]" fill="#00e701" />
                    </motion.div>
                  )}
                  {isRevealedMine && !revealed && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 300 }}>
                      <Bomb className="w-6 h-6 text-[#ff5c5c]" fill="#ff5c5c" />
                    </motion.div>
                  )}
                  {isRevealedGem && !revealed && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.05, type: "spring", stiffness: 300 }}>
                      <Gem className="w-5 h-5 text-[#55657a]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

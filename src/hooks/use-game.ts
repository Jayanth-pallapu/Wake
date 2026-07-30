"use client";

import { useState, useCallback } from "react";
import { api, type PlayResponse } from "@/lib/api-client";
import { useWalletStore } from "@/store/wallet";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";
import { toast } from "sonner";

export interface UseGameResult {
  play: (game: string, params: Record<string, unknown>, betRaw: string) => Promise<PlayResponse | null>;
  playing: boolean;
  lastResult: PlayResponse | null;
  error: string | null;
}

/**
 * Wraps the /api/games/play call. Handles auth gating, balance refresh, toast notifications.
 */
export function useGame(): UseGameResult {
  const [playing, setPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<PlayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const refreshWallet = useWalletStore((s) => s.refresh);
  const updateBalance = useWalletStore((s) => s.updateBalance);
  const setAuthModal = useUiStore((s) => s.setAuthModal);

  const play = useCallback(
    async (game: string, params: Record<string, unknown>, betRaw: string) => {
      if (!user) {
        setAuthModal(true, "login");
        return null;
      }
      setPlaying(true);
      setError(null);
      try {
        const asset = useUiStore.getState().activeAsset;
        const result = await api.post<PlayResponse>("/api/games/play", { game, asset, betRaw, params });
        setLastResult(result);
        // optimistic balance update + full refresh
        updateBalance(asset, result.balanceAfterRaw);
        refreshWallet();
        if (result.bet.win && result.bet.multiplier >= 2) {
          toast.success(`🎉 Won ${result.bet.payout.toFixed(4)} ${asset} (${result.bet.multiplier}x)!`);
        } else if (!result.bet.win) {
          // silent loss
        }
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Bet failed";
        setError(msg);
        if (msg === "Insufficient balance") {
          toast.error("Insufficient balance — deposit more funds");
        } else {
          toast.error(msg);
        }
        return null;
      } finally {
        setPlaying(false);
      }
    },
    [user, setAuthModal, updateBalance, refreshWallet]
  );

  return { play, playing, lastResult, error };
}

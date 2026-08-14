"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useWalletStore } from "@/store/wallet";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";
import { toast } from "sonner";

export interface SlotPlayResult {
  ok: boolean;
  win: boolean;
  multiplier: number;
  symbols: string[][];
  winLines: number[];
  payout: number;
  balanceAfterRaw: string;
}

/** Wrapped response that looks like PlayResponse for component compatibility */
export interface SlotPlayResponse {
  bet: {
    win: boolean;
    multiplier: number;
    payout: number;
    outcome: Record<string, unknown>;
  };
  balanceAfterRaw: string;
}

export interface UseSlotGameResult {
  /** Compatible with useGame().play signature: play(gameId, params, betRaw) */
  play: (slotId: string, params: Record<string, unknown>, betRaw: string) => Promise<SlotPlayResponse | null>;
  playing: boolean;
}

/**
 * Hook for slot games — calls /api/games/slots/play.
 * API-compatible with useGame() for drop-in replacement in slot components.
 */
export function useSlotGame(): UseSlotGameResult {
  const [playing, setPlaying] = useState(false);
  const user = useAuthStore((s) => s.user);
  const refreshWallet = useWalletStore((s) => s.refresh);
  const updateBalance = useWalletStore((s) => s.updateBalance);
  const setAuthModal = useUiStore((s) => s.setAuthModal);

  const play = useCallback(
    async (slotId: string, _params: Record<string, unknown>, betRaw: string): Promise<SlotPlayResponse | null> => {
      if (!user) {
        setAuthModal(true, "login");
        return null;
      }
      setPlaying(true);
      try {
        const asset = useUiStore.getState().activeAsset;
        const raw = await api.post<SlotPlayResult>("/api/games/slots/play", {
          slotId,
          asset,
          betRaw,
        });
        updateBalance(asset, raw.balanceAfterRaw);
        refreshWallet();
        if (raw.win && raw.multiplier >= 2) {
          toast.success(`🎰 Won ${raw.payout.toFixed(4)} ${asset} (${raw.multiplier.toFixed(2)}x)!`);
        }
        // Wrap result to match PlayResponse structure used by slot components
        return {
          bet: {
            win: raw.win,
            multiplier: raw.multiplier,
            payout: raw.payout,
            outcome: { symbols: raw.symbols, winLines: raw.winLines },
          },
          balanceAfterRaw: raw.balanceAfterRaw,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Spin failed";
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

  return { play, playing };
}

/** Alias so slot game components can import { useGame } from "@/hooks/use-slot-game" */
export const useGame = useSlotGame;

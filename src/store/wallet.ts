"use client";

import { create } from "zustand";
import type { WalletEntry } from "@/lib/api-client";

interface WalletState {
  wallets: WalletEntry[];
  totalUsdValue: number;
  lifetimeWagerUsd: number;
  loading: boolean;
  setWallet: (data: { wallets: WalletEntry[]; totalUsdValue: number; lifetimeWagerUsd: number }) => void;
  setLoading: (b: boolean) => void;
  refresh: () => Promise<void>;
  updateBalance: (asset: string, balanceRaw: string) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallets: [],
  totalUsdValue: 0,
  lifetimeWagerUsd: 0,
  loading: false,
  setWallet: (data) => set(data),
  setLoading: (b) => set({ loading: b }),
  refresh: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/wallet", { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ wallets: data.wallets, totalUsdValue: data.totalUsdValue, lifetimeWagerUsd: data.lifetimeWagerUsd, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  updateBalance: (asset, balanceRaw) =>
    set((s) => {
      const wallets = s.wallets.map((w) => {
        if (w.asset !== asset) return w;
        const newBalance = Number(balanceRaw) / 1e8;
        const usdPerUnit = w.balance > 0 ? w.usdValue / w.balance : 0;
        return { ...w, balanceRaw, balance: newBalance, usdValue: newBalance * usdPerUnit };
      });
      const totalUsdValue = wallets.reduce((sum, w) => sum + w.usdValue, 0);
      return { wallets, totalUsdValue };
    }),
}));

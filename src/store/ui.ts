"use client";

import { create } from "zustand";

export type ViewId =
  | { kind: "casino" }
  | { kind: "game"; gameId: string }
  | { kind: "sports" }
  | { kind: "vip" }
  | { kind: "wallet" }
  | { kind: "leaderboard" }
  | { kind: "affiliate" }
  | { kind: "slots"; slotId: string }
  | { kind: "slots-lobby" }
  | { kind: "contests" };

interface UiState {
  view: ViewId;
  activeAsset: string;
  leftSidebarOpen: boolean;
  rightChatOpen: boolean;
  authModalOpen: boolean;
  authModalMode: "login" | "register";
  betSlip: BetSlipItem[];
  setView: (v: ViewId) => void;
  setActiveAsset: (a: string) => void;
  toggleLeftSidebar: () => void;
  toggleRightChat: () => void;
  setAuthModal: (open: boolean, mode?: "login" | "register") => void;
  addBetSlip: (item: BetSlipItem) => void;
  removeBetSlip: (id: string) => void;
  clearBetSlip: () => void;
}

export interface BetSlipItem {
  id: string;
  matchId: string;
  label: string; // "Man City to win"
  odds: number;
  market: string;
}

export const useUiStore = create<UiState>((set) => ({
  view: { kind: "casino" },
  activeAsset: "USDT",
  leftSidebarOpen: true,
  rightChatOpen: true,
  authModalOpen: false,
  authModalMode: "login",
  betSlip: [],
  setView: (v) => set({ view: v }),
  setActiveAsset: (a) => set({ activeAsset: a }),
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightChat: () => set((s) => ({ rightChatOpen: !s.rightChatOpen })),
  setAuthModal: (open, mode) =>
    set((s) => ({ authModalOpen: open, authModalMode: mode ?? s.authModalMode })),
  addBetSlip: (item) =>
    set((s) => ({
      betSlip: [...s.betSlip.filter((b) => b.id !== item.id), item],
    })),
  removeBetSlip: (id) => set((s) => ({ betSlip: s.betSlip.filter((b) => b.id !== id) })),
  clearBetSlip: () => set({ betSlip: [] }),
}));

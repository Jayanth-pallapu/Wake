"use client";

import { create } from "zustand";

export interface ChatMessage {
  id: string;
  username: string;
  avatar: string | null;
  role: string;
  text: string;
  channel: string;
  type: "message" | "system" | "rain" | "tip";
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface BetFeedItem {
  id: string;
  username: string;
  game: string;
  asset: string;
  bet: number;
  multiplier: number;
  payout: number;
  timestamp: string;
}

export interface RainEvent {
  rainId: string;
  amount: number;
  asset: string;
  participants: number;
  expiresAt: string;
}

interface ChatState {
  messages: ChatMessage[];
  betFeed: BetFeedItem[];
  online: number;
  connected: boolean;
  activeRain: RainEvent | null;
  typingUsers: string[];
  addMessage: (m: ChatMessage) => void;
  prependMessages: (ms: ChatMessage[]) => void;
  addBetFeed: (b: BetFeedItem) => void;
  setOnline: (n: number) => void;
  setConnected: (b: boolean) => void;
  setActiveRain: (r: RainEvent | null) => void;
  addTyping: (u: string) => void;
  removeTyping: (u: string) => void;
  clear: () => void;
}

const MAX_MESSAGES = 200;
const MAX_FEED = 50;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  betFeed: [],
  online: 0,
  connected: false,
  activeRain: null,
  typingUsers: [],
  addMessage: (m) =>
    set((s) => {
      const messages = [...s.messages, m].slice(-MAX_MESSAGES);
      return { messages };
    }),
  prependMessages: (ms) =>
    set((s) => {
      const messages = [...ms, ...s.messages].slice(-MAX_MESSAGES);
      return { messages };
    }),
  addBetFeed: (b) =>
    set((s) => ({ betFeed: [b, ...s.betFeed].slice(0, MAX_FEED) })),
  setOnline: (n) => set({ online: n }),
  setConnected: (b) => set({ connected: b }),
  setActiveRain: (r) => set({ activeRain: r }),
  addTyping: (u) =>
    set((s) => (s.typingUsers.includes(u) ? s : { typingUsers: [...s.typingUsers, u].slice(-8) })),
  removeTyping: (u) => set((s) => ({ typingUsers: s.typingUsers.filter((x) => x !== u) })),
  clear: () => set({ messages: [], betFeed: [], online: 0, activeRain: null }),
}));

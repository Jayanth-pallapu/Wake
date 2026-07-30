"use client";

import { create } from "zustand";
import type { AuthUser } from "@/lib/api-client";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (u: AuthUser | null) => void;
  setLoading: (b: boolean) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (u) => set({ user: u }),
  setLoading: (b) => set({ loading: b }),
  refresh: async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      set({ user: data.user || null, loading: false, initialized: true });
    } catch {
      set({ user: null, loading: false, initialized: true });
    }
  },
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    set({ user: null });
  },
}));

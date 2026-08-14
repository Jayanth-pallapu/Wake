"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUiStore } from "@/store/ui";
import { useAuthStore } from "@/store/auth";
import { useWalletStore } from "@/store/wallet";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";

export function AuthModal() {
  const { authModalOpen, authModalMode, setAuthModal } = useUiStore();
  const { refresh: refreshAuth } = useAuthStore();
  const { refresh: refreshWallet } = useWalletStore();
  const [mode, setMode] = useState<"login" | "register">(authModalMode);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", identifier: "" });

  // sync mode when opened
  const open = authModalOpen;
  const effectiveMode = authModalMode;

  const submit = async () => {
    setLoading(true);
    try {
      const endpoint = effectiveMode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body =
        effectiveMode === "register"
          ? { username: form.username, email: form.email, password: form.password }
          : { identifier: form.identifier || form.email, password: form.password };
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Authentication failed");
        return;
      }
      toast.success(effectiveMode === "register" ? "Account created! Welcome 🎉" : "Welcome back!");
      await refreshAuth();
      await refreshWallet();
      setAuthModal(false);
      setForm({ username: "", email: "", password: "", identifier: "" });
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => setAuthModal(o)}>
      <DialogContent className="bg-[#1a2c38] border-[#2f4553] text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00c2ff] to-[#1475e1] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#0f212e]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                {effectiveMode === "register" ? "Create your account" : "Welcome back"}
              </DialogTitle>
              <DialogDescription className="text-[#b1bad3]">
                {effectiveMode === "register"
                  ? "Get free demo crypto to play all games"
                  : "Log in to continue playing"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-2 p-1 bg-[#0f212e] rounded-lg mb-4">
          <button
            onClick={() => useUiStore.setState({ authModalMode: "login" })}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              effectiveMode === "login" ? "bg-[#213743] text-white" : "text-[#b1bad3]"
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => useUiStore.setState({ authModalMode: "register" })}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              effectiveMode === "register" ? "bg-[#213743] text-white" : "text-[#b1bad3]"
            }`}
          >
            Register
          </button>
        </div>

        <motion.div
          key={effectiveMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {effectiveMode === "register" && (
            <div className="space-y-1.5">
              <Label className="text-[#b1bad3] text-xs">Username</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="cryptohunter"
                className="bg-[#213743] border-[#2f4553] text-white placeholder:text-[#55657a] h-10"
              />
            </div>
          )}
          {effectiveMode === "register" ? (
            <div className="space-y-1.5">
              <Label className="text-[#b1bad3] text-xs">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="bg-[#213743] border-[#2f4553] text-white placeholder:text-[#55657a] h-10"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-[#b1bad3] text-xs">Email or username</Label>
              <Input
                value={form.identifier}
                onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                placeholder="you@example.com"
                className="bg-[#213743] border-[#2f4553] text-white placeholder:text-[#55657a] h-10"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[#b1bad3] text-xs">Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
              className="bg-[#213743] border-[#2f4553] text-white placeholder:text-[#55657a] h-10"
            />
          </div>
          <Button
            onClick={submit}
            disabled={loading}
            className="w-full bg-[#00c2ff] hover:bg-[#009fd4] text-[#001a2e] font-bold h-10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : effectiveMode === "register" ? "Create account" : "Log in"}
          </Button>
          <p className="text-[10px] text-center text-[#b1bad3]">
            Demo platform · play money only · provably fair
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

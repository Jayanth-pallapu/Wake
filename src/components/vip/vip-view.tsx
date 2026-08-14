"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api, type VipStatus } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/store/auth";
import { useWalletStore } from "@/store/wallet";
import { toast } from "sonner";
import { Gift, Crown, Star, Zap, Loader2, Check } from "lucide-react";

export function VipView() {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<VipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const refreshWallet = useWalletStore((s) => s.refresh);

  const load = async () => {
    if (!user) return;
    try {
      const s = await api.get<VipStatus>("/api/vip/status");
      setStatus(s);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      // no user → not loading
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const s = await api.get<VipStatus>("/api/vip/status");
        if (!cancelled) setStatus(s);
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const claim = async () => {
    setClaiming(true);
    try {
      const res = await fetch("/api/vip/claim", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        const total = data.claimed.reduce((s: number, c: { amount: number }) => s + c.amount, 0);
        if (total > 0) {
          toast.success(`Claimed ${total.toFixed(4)} USDT in rakeback!`);
          refreshWallet();
          load();
        } else {
          toast.info("No rakeback to claim yet — keep playing!");
        }
      } else toast.error(data.error || "Claim failed");
    } catch { toast.error("Network error"); }
    setClaiming(false);
  };

  if (!user) {
    return <div className="p-8 text-center text-[#b1bad3]">Sign in to view your VIP status.</div>;
  }

  if (loading || !status) {
    return <div className="p-8 text-center text-[#b1bad3]">Loading VIP status…</div>;
  }

  const totalPending = status.rakebacks.reduce((s, r) => s + r.pending, 0);

  return (
    <div className="p-3 sm:p-5 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-5 h-5 text-[#ffd23f]" />
        <h1 className="text-xl font-bold text-white">VIP Club</h1>
      </div>

      {/* Current tier card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`bg-gradient-to-br ${status.currentTier.color} border-[#2f4553] p-5 mb-4`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/70 font-bold">Current Tier</div>
              <div className="text-3xl font-black text-white">{status.currentTier.name}</div>
              <div className="text-xs text-white/80 mt-1">
                {Math.round(status.currentTier.rakebackPct * 100)}% rakeback · {status.lifetimeWagerUsd.toLocaleString()} USD wagered
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/70 font-bold">Rakeback Pending</div>
              <div className="text-2xl font-black text-white tabular-nums">{totalPending.toFixed(4)}</div>
              <div className="text-xs text-white/80">USDT</div>
              <Button onClick={claim} disabled={claiming} size="sm" className="mt-2 bg-white text-[#001a2e] hover:bg-white/90 font-bold h-8">
                {claiming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Gift className="w-3 h-3 mr-1" />} Claim All
              </Button>
            </div>
          </div>
          {status.nextTier && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/80 mb-1">
                <span>Progress to {status.nextTier.name}</span>
                <span>{status.progressPct}%</span>
              </div>
              <Progress value={status.progressPct} className="h-2 bg-black/30 [&>div]:bg-white" />
              <div className="text-[10px] text-white/70 mt-1">
                Wager {(status.nextTier.requiredWagerUsd - status.lifetimeWagerUsd).toLocaleString()} USD more to reach {status.nextTier.name}
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Rakeback breakdown */}
      <Card className="bg-[#1a2c38] border-[#2f4553] p-4 mb-4">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-[#00c2ff]" /> Rakeback by Asset</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {status.rakebacks.filter((r) => r.pending > 0).map((r) => (
            <div key={r.asset} className="bg-[#0f212e] rounded-md p-2">
              <div className="text-[10px] text-[#b1bad3]">{r.asset}</div>
              <div className="text-sm font-bold text-[#00c2ff] tabular-nums">{r.pending.toFixed(6)}</div>
              <div className="text-[9px] text-[#b1bad3]">{Math.round(r.rakebackPct * 100)}% rate</div>
            </div>
          ))}
          {status.rakebacks.every((r) => r.pending <= 0) && (
            <div className="col-span-full text-center text-xs text-[#b1bad3] py-4">No rakeback accrued yet. Place bets to earn!</div>
          )}
        </div>
      </Card>

      {/* Tier ladder */}
      <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-[#ffd23f]" /> Tier Ladder</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {status.allTiers.map((t) => (
          <Card key={t.name} className={`bg-gradient-to-br ${t.color} border-[#2f4553] p-3 relative ${t.reached ? "opacity-100" : "opacity-50"}`}>
            {t.reached && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <div className="text-sm font-black text-white">{t.name}</div>
            <div className="text-[10px] text-white/80 mb-2">
              {t.requiredWagerUsd === 0 ? "Starting tier" : `${t.requiredWagerUsd.toLocaleString()} USD wagered`}
            </div>
            <div className="space-y-0.5 text-[10px] text-white/90">
              <div>Rakeback: {Math.round(t.rakebackPct * 100)}%</div>
              <div>Bonus: ${t.levelUpBonusUsd}</div>
              {t.dedicatedHost && <div>👑 Dedicated host</div>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

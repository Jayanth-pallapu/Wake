"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletStore } from "@/store/wallet";
import { useAuthStore } from "@/store/auth";
import { ASSETS } from "@/lib/constants";
import { toast } from "sonner";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, History, Loader2, Copy } from "lucide-react";

interface LedgerEntry {
  id: string; asset: string; amount: number; balanceAfter: number; type: string; note: string | null; createdAt: string;
}

export function WalletView() {
  const { wallets, totalUsdValue, lifetimeWagerUsd, refresh } = useWalletStore();
  const user = useAuthStore((s) => s.user);
  const [activeAsset, setActiveAsset] = useState("USDT");
  const [depositAmount, setDepositAmount] = useState(10);
  const [withdrawAmount, setWithdrawAmount] = useState(1);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    fetch("/api/wallet/ledger?limit=50", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setLedger(d.entries || []))
      .catch(() => {});
  }, [user?.id]);

  const deposit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset: activeAsset, amount: depositAmount }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Deposited ${depositAmount} ${activeAsset}`);
        refresh();
      } else toast.error(data.error || "Deposit failed");
    } catch { toast.error("Network error"); }
    setBusy(false);
  };

  const withdraw = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset: activeAsset, amount: withdrawAmount, address: withdrawAddress }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Withdrawal ${data.withdrawal.autoApproved ? "auto-approved" : "queued for review"}`);
        refresh();
        setWithdrawAddress("");
      } else toast.error(data.error || "Withdrawal failed");
    } catch { toast.error("Network error"); }
    setBusy(false);
  };

  const wallet = wallets.find((w) => w.asset === activeAsset);

  return (
    <div className="p-3 sm:p-5 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-[#00c2ff]" />
        <h1 className="text-xl font-bold text-white">Wallet</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
          <div className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Total Balance</div>
          <div className="text-2xl font-black text-white tabular-nums">${totalUsdValue.toFixed(2)}</div>
          <div className="text-[10px] text-[#b1bad3]">across {wallets.length} assets</div>
        </Card>
        <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
          <div className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Lifetime Wagered</div>
          <div className="text-2xl font-black text-[#ffd23f] tabular-nums">${lifetimeWagerUsd.toFixed(2)}</div>
          <div className="text-[10px] text-[#b1bad3]">USD equivalent</div>
        </Card>
        <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
          <div className="text-[10px] uppercase tracking-wider text-[#b1bad3]">Games Played</div>
          <div className="text-2xl font-black text-[#00c2ff] tabular-nums">{user?.gamesPlayed || 0}</div>
          <div className="text-[10px] text-[#b1bad3]">all-time</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Asset list */}
        <Card className="bg-[#1a2c38] border-[#2f4553]">
          <div className="px-4 py-3 border-b border-[#2f4553]">
            <h2 className="font-bold text-white text-sm">Assets</h2>
          </div>
          <div className="divide-y divide-[#2f4553]">
            {wallets.map((w) => (
              <button
                key={w.asset}
                onClick={() => setActiveAsset(w.asset)}
                className={`w-full flex items-center justify-between p-3 hover:bg-[#213743] transition-colors ${activeAsset === w.asset ? "bg-[#213743]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${w.color}`}>{w.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">{w.asset}</div>
                    <div className="text-[10px] text-[#b1bad3]">{w.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold tabular-nums ${w.color}`}>{w.balance.toFixed(6)}</div>
                  <div className="text-[10px] text-[#b1bad3]">${w.usdValue.toFixed(2)}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Deposit / Withdraw */}
        <div>
          <Tabs defaultValue="deposit">
            <TabsList className="grid grid-cols-3 bg-[#1a2c38] border-[#2f4553]">
              <TabsTrigger value="deposit" className="data-[state=active]:bg-[#213743] text-[#b1bad3] data-[state=active]:text-white text-xs">
                <ArrowDownToLine className="w-3 h-3 mr-1" /> Deposit
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="data-[state=active]:bg-[#213743] text-[#b1bad3] data-[state=active]:text-white text-xs">
                <ArrowUpFromLine className="w-3 h-3 mr-1" /> Withdraw
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-[#213743] text-[#b1bad3] data-[state=active]:text-white text-xs">
                <History className="w-3 h-3 mr-1" /> History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="mt-2">
              <Card className="bg-[#1a2c38] border-[#2f4553] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl ${wallet?.color}`}>{wallet?.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{activeAsset}</div>
                    <div className="text-[10px] text-[#b1bad3]">Balance: {wallet?.balance.toFixed(6)}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-[#b1bad3]">Amount</Label>
                  <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(Math.max(0, parseFloat(e.target.value) || 0))} className="bg-[#0f212e] border-[#2f4553] text-white" />
                  <div className="flex gap-1">
                    {[10, 50, 100, 500].map((a) => (
                      <button key={a} onClick={() => setDepositAmount(a)} className="flex-1 py-1 text-[10px] rounded bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3]">${a}</button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#0f212e] rounded-md p-2 text-[10px] text-[#b1bad3]">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-semibold text-white">Demo deposit address:</span>
                    <button onClick={() => { navigator.clipboard.writeText(`demo_${activeAsset.toLowerCase()}_${user?.id?.slice(0,8)}`); toast.success("Copied"); }} className="text-[#00c2ff]">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <code className="text-[#dfe5ee] break-all">demo_{activeAsset.toLowerCase()}_{user?.id?.slice(0, 8) || "guest"}</code>
                </div>
                <Button onClick={deposit} disabled={busy || depositAmount <= 0} className="w-full bg-[#00c2ff] hover:bg-[#009fd4] text-[#001a2e] font-bold h-10">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : `Deposit ${depositAmount} ${activeAsset}`}
                </Button>
                <p className="text-[9px] text-center text-[#55657a]">Instant demo credit · no blockchain</p>
              </Card>
            </TabsContent>

            <TabsContent value="withdraw" className="mt-2">
              <Card className="bg-[#1a2c38] border-[#2f4553] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl ${wallet?.color}`}>{wallet?.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{activeAsset}</div>
                    <div className="text-[10px] text-[#b1bad3]">Available: {wallet?.balance.toFixed(6)}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-[#b1bad3]">Amount</Label>
                  <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(Math.max(0, parseFloat(e.target.value) || 0))} className="bg-[#0f212e] border-[#2f4553] text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-[#b1bad3]">Destination address</Label>
                  <Input value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} placeholder="bc1q..." className="bg-[#0f212e] border-[#2f4553] text-white" />
                </div>
                <div className="bg-[#0f212e] rounded-md p-2 text-[10px] text-[#b1bad3]">
                  Withdrawals ≤ $2,000 USD: auto-approved. Larger: manual review.
                </div>
                <Button onClick={withdraw} disabled={busy || withdrawAmount <= 0 || !withdrawAddress} className="w-full bg-[#00c2ff] hover:bg-[#009fd4] text-[#001a2e] font-bold h-10">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : `Withdraw ${withdrawAmount} ${activeAsset}`}
                </Button>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-2">
              <Card className="bg-[#1a2c38] border-[#2f4553]">
                <div className="max-h-[400px] overflow-y-auto">
                  {ledger.length === 0 ? (
                    <div className="p-6 text-center text-[#b1bad3] text-xs">No transactions yet.</div>
                  ) : (
                    ledger.map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-2 border-b border-[#2f4553] last:border-0">
                        <div>
                          <div className="text-xs font-semibold text-white">{e.type.replace(/_/g, " ")}</div>
                          <div className="text-[10px] text-[#b1bad3]">{new Date(e.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-bold tabular-nums ${e.amount >= 0 ? "text-[#00c2ff]" : "text-[#ff5c5c]"}`}>
                            {e.amount >= 0 ? "+" : ""}{e.amount.toFixed(6)} {e.asset}
                          </div>
                          <div className="text-[10px] text-[#b1bad3]">bal: {e.balanceAfter.toFixed(4)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

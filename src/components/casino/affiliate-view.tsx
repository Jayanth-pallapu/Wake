"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { Users, Gift, TrendingUp, Copy } from "lucide-react";
import { toast } from "sonner";

export function AffiliateView() {
  const user = useAuthStore((s) => s.user);
  const refCode = user?.id?.slice(0, 8).toUpperCase() || "GUEST000";

  return (
    <div className="p-3 sm:p-5 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-[#1475e1]" />
        <h1 className="text-xl font-bold text-white">Affiliate Program</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
          <TrendingUp className="w-5 h-5 text-[#00e701] mb-2" />
          <div className="text-2xl font-black text-white tabular-nums">$0.00</div>
          <div className="text-[10px] text-[#b1bad3]">Lifetime commission</div>
        </Card>
        <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
          <Users className="w-5 h-5 text-[#1475e1] mb-2" />
          <div className="text-2xl font-black text-white tabular-nums">0</div>
          <div className="text-[10px] text-[#b1bad3]">Referred users</div>
        </Card>
        <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
          <Gift className="w-5 h-5 text-[#ffd23f] mb-2" />
          <div className="text-2xl font-black text-white tabular-nums">10%</div>
          <div className="text-[10px] text-[#b1bad3]">Commission rate</div>
        </Card>
      </div>

      <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
        <h2 className="text-sm font-bold text-white mb-2">Your Referral Link</h2>
        <div className="flex gap-2">
          <input
            readOnly
            value={`https://stakeforge.demo/r/${refCode}`}
            className="flex-1 bg-[#0f212e] border border-[#2f4553] text-white px-3 py-2 rounded-md text-sm font-mono"
          />
          <Button
            onClick={() => {
              navigator.clipboard.writeText(`https://stakeforge.demo/r/${refCode}`);
              toast.success("Referral link copied!");
            }}
            className="bg-[#00e701] hover:bg-[#00c701] text-[#0a1f12] font-bold"
          >
            <Copy className="w-4 h-4 mr-1" /> Copy
          </Button>
        </div>
        <p className="text-[11px] text-[#b1bad3] mt-3">
          Earn 10% of the house edge on every bet placed by users you refer. Commission is credited in USDT and available instantly.
        </p>
        {!user && (
          <p className="text-[11px] text-[#ffd23f] mt-2">Sign in to activate your referral link.</p>
        )}
      </Card>
    </div>
  );
}

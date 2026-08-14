"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { RecentBet } from "./game-view";
import { GAME_MAP } from "@/lib/constants";

interface RecentBetsProps {
  bets: RecentBet[];
}

export function RecentBets({ bets }: RecentBetsProps) {
  if (bets.length === 0) {
    return (
      <div className="p-6 text-center text-[#b1bad3] text-sm">
        No bets yet. Place your first bet above!
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-[#0f212e] text-[#b1bad3]">
          <tr>
            <th className="text-left py-2 px-3 font-medium">Game</th>
            <th className="text-right py-2 px-3 font-medium">Bet</th>
            <th className="text-right py-2 px-3 font-medium">Multiplier</th>
            <th className="text-right py-2 px-3 font-medium">Payout</th>
            <th className="text-right py-2 px-3 font-medium">Nonce</th>
            <th className="text-right py-2 px-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {bets.map((b) => {
            const meta = GAME_MAP[b.game];
            return (
              <tr key={b.id} className="border-t border-[#2f4553] hover:bg-[#213743]/50">
                <td className="py-2 px-3 text-white">
                  <span className="mr-1">{meta?.emoji}</span>
                  <span className="capitalize">{b.game}</span>
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-[#b1bad3]">
                  {b.bet.toFixed(4)} {b.asset}
                </td>
                <td className={`py-2 px-3 text-right tabular-nums font-bold ${b.win ? "text-[#00c2ff]" : "text-[#ff5c5c]"}`}>
                  {b.multiplier > 0 ? `${b.multiplier.toFixed(2)}×` : "—"}
                </td>
                <td className={`py-2 px-3 text-right tabular-nums ${b.win ? "text-[#00c2ff]" : "text-[#b1bad3]"}`}>
                  {b.payout > 0 ? `${b.payout.toFixed(4)} ${b.asset}` : "—"}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-[#b1bad3]">{b.nonce}</td>
                <td className="py-2 px-3 text-right text-[#b1bad3]">
                  {new Date(b.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

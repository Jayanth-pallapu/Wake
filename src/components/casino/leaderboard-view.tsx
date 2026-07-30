"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api, type LeaderboardResponse } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Flame, Medal } from "lucide-react";
import { GAME_MAP } from "@/lib/constants";

export function LeaderboardView() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<LeaderboardResponse>("/api/leaderboard").then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-[#b1bad3]">Loading leaderboard…</div>;
  if (!data) return <div className="p-8 text-center text-[#b1bad3]">Failed to load.</div>;

  return (
    <div className="p-3 sm:p-5 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-[#ffd23f]" />
        <h1 className="text-xl font-bold text-white">Leaderboard</h1>
      </div>

      <Tabs defaultValue="wagerers">
        <TabsList className="bg-[#1a2c38] border-[#2f4553]">
          <TabsTrigger value="wagerers" className="data-[state=active]:bg-[#213743] text-[#b1bad3] data-[state=active]:text-white text-sm">
            <Medal className="w-3 h-3 mr-1" /> Top Wagerers
          </TabsTrigger>
          <TabsTrigger value="wins" className="data-[state=active]:bg-[#213743] text-[#b1bad3] data-[state=active]:text-white text-sm">
            <Flame className="w-3 h-3 mr-1" /> Recent Big Wins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wagerers" className="mt-3">
          <Card className="bg-[#1a2c38] border-[#2f4553] overflow-hidden">
            <div className="divide-y divide-[#2f4553]">
              {data.wagerers.map((u, i) => (
                <motion.div
                  key={u.username}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 p-3 hover:bg-[#213743]/50"
                >
                  <RankBadge rank={u.rank} />
                  <Avatar className="w-9 h-9 border border-[#2f4553]">
                    <AvatarImage src={u.avatar || undefined} alt={u.username} />
                    <AvatarFallback className="bg-[#213743] text-white text-xs">{u.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{u.username}</div>
                    <div className="text-[10px] text-[#b1bad3]">{u.gamesPlayed.toLocaleString()} games played</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#ffd23f] tabular-nums">${u.lifetimeWagerUsd.toLocaleString()}</div>
                    <div className="text-[10px] text-[#b1bad3]">wagered</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="wins" className="mt-3">
          <Card className="bg-[#1a2c38] border-[#2f4553] overflow-hidden">
            <div className="divide-y divide-[#2f4553]">
              {data.recentWins.map((w, i) => {
                const meta = GAME_MAP[w.game];
                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 p-3 hover:bg-[#213743]/50"
                  >
                    <Avatar className="w-9 h-9 border border-[#2f4553]">
                      <AvatarImage src={w.avatar || undefined} alt={w.username} />
                      <AvatarFallback className="bg-[#213743] text-white text-xs">{w.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{w.username}</div>
                      <div className="text-[10px] text-[#b1bad3]">
                        <span>{meta?.emoji} {w.game}</span> · {w.bet.toFixed(2)} {w.asset}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold tabular-nums ${w.multiplier >= 10 ? "text-[#ff5cb1]" : "text-[#00e701]"}`}>
                        {w.multiplier.toFixed(2)}×
                      </div>
                      <div className="text-[10px] text-[#00e701]">+{w.payout.toFixed(2)} {w.asset}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const color = rank === 1 ? "bg-[#ffd23f] text-[#0a1f12]" : rank === 2 ? "bg-[#b1bad3] text-[#0a1f12]" : rank === 3 ? "bg-[#cd7f32] text-white" : "bg-[#213743] text-[#b1bad3]";
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${color}`}>
      {rank}
    </div>
  );
}

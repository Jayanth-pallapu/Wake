"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Medal, Trophy } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  wagerRaw: string;
  prizeRaw: string;
  isReal?: boolean;
}

interface ContestLeaderboardProps {
  entries: LeaderboardEntry[];
  topRankCount: number;
  loading?: boolean;
}

const INDIAN_PATTERNS = /^(Aarav|Arjun|Vikram|Rahul|Rohit|Amit|Sanjay|Deepak|Manish|Rajesh|Suresh|Dinesh|Mahesh|Ramesh|Naresh|Vikas|Gaurav|Pankaj|Ajay|Vijay|Anil|Kapil|Ravi|Nikhil|Varun|Karan|Ishaan|Rohan|Aditya|Siddharth|Yash|Kunal|Harish|Manoj|Prakash|Priya|Divya|Ananya|Meera|Pooja|Neha|Swati|Sapna|Rekha|Geeta|Sunita|Preeti|Shweta|Komal|Pallavi|Kavya|Nisha|Shreya|Tanvi|Rhea|Anjali|Simran|Riya|Aryan|Karthik|Surya|Vignesh|Balaji|Gopal|Lakshmi|Kavitha|Charan|Pavan|Teja|Krishna|Satish|Prasad|Sourav|Subham|Arnab|Omkar|Akshay|Tejas|Prathamesh|Gurpreet|Harpreet|Jaspreet|Manpreet|Navdeep|Chirag|Harsh|Jatin|Neel|Parth|Rishi|Shrey|Dhruv|Raj|Dev|Bunty|Lucky|Sunny|Shankar|Mohan|Lalit|Yogesh)/i;

function isIndianName(name: string) {
  return INDIAN_PATTERNS.test(name);
}

function formatWager(raw: string): string {
  const usd = Number(BigInt(raw)) / 1e8;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}K`;
  return `$${usd.toFixed(2)}`;
}

function RankBadge({ rank, topRankCount }: { rank: number; topRankCount: number }) {
  if (rank === 1) return <Crown className="w-4 h-4 text-[#ffd23f]" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-[#c0c0c0]" />;
  if (rank === 3) return <Trophy className="w-4 h-4 text-[#cd7f32]" />;
  if (rank <= topRankCount) return <span className="text-[10px] font-bold text-[#00c2ff] w-4 text-center">#{rank}</span>;
  return <span className="text-[10px] text-[#b1bad3] w-4 text-center">#{rank}</span>;
}

function RowBg(rank: number, topRankCount: number): string {
  if (rank === 1) return "bg-gradient-to-r from-[#ffd23f]/10 to-transparent border-[#ffd23f]/20";
  if (rank === 2) return "bg-gradient-to-r from-[#c0c0c0]/10 to-transparent border-[#c0c0c0]/20";
  if (rank === 3) return "bg-gradient-to-r from-[#cd7f32]/10 to-transparent border-[#cd7f32]/20";
  if (rank <= topRankCount) return "bg-[#1a2c38] border-[#00c2ff]/10";
  return "bg-[#0f212e] border-[#2f4553]/30";
}

export function ContestLeaderboard({ entries, topRankCount, loading }: ContestLeaderboardProps) {
  if (loading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-[#1a2c38] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_100px_90px] gap-2 px-3 py-1 text-[10px] uppercase tracking-wider text-[#b1bad3]">
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">Wagered</span>
        <span className="text-right">Prize</span>
      </div>
      <AnimatePresence>
        {entries.map((entry) => (
          <motion.div
            key={`${entry.rank}-${entry.username}`}
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: entry.rank * 0.01 }}
            className={`grid grid-cols-[40px_1fr_100px_90px] gap-2 items-center px-3 py-2 rounded-lg border ${
              RowBg(entry.rank, topRankCount)
            }`}
          >
            <div className="flex items-center justify-center">
              <RankBadge rank={entry.rank} topRankCount={topRankCount} />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  background: `hsl(${(entry.username.charCodeAt(0) * 47) % 360} 60% 35%)`,
                  color: 'white',
                }}
              >
                {entry.username.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-white truncate">
                {entry.username}
              </span>
              {isIndianName(entry.username) && (
                <span className="text-[10px] shrink-0" title="India">🇮🇳</span>
              )}
              {entry.isReal && (
                <span className="text-[8px] px-1 py-0.5 rounded bg-[#00c2ff]/20 text-[#00c2ff] shrink-0">YOU</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-[#b1bad3]">{formatWager(entry.wagerRaw)}</span>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold ${
                entry.rank <= 3 ? 'text-[#ffd23f]' :
                entry.rank <= topRankCount ? 'text-[#00c2ff]' : 'text-[#b1bad3]'
              }`}>{formatWager(entry.prizeRaw)}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

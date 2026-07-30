"use client";

import { Github, Twitter, Send, ShieldCheck } from "lucide-react";
import { useUiStore } from "@/store/ui";

export function Footer() {
  const setView = useUiStore((s) => s.setView);
  return (
    <footer className="mt-auto bg-[#0a1925] border-t border-[#2f4553]">
      <div className="px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Games</h4>
            <ul className="space-y-2 text-xs text-[#b1bad3]">
              <li><button onClick={() => setView({ kind: "game", gameId: "crash" })} className="hover:text-[#00e701]">Crash</button></li>
              <li><button onClick={() => setView({ kind: "game", gameId: "dice" })} className="hover:text-[#00e701]">Dice</button></li>
              <li><button onClick={() => setView({ kind: "game", gameId: "plinko" })} className="hover:text-[#00e701]">Plinko</button></li>
              <li><button onClick={() => setView({ kind: "game", gameId: "mines" })} className="hover:text-[#00e701]">Mines</button></li>
              <li><button onClick={() => setView({ kind: "game", gameId: "limbo" })} className="hover:text-[#00e701]">Limbo</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-[#b1bad3]">
              <li><button onClick={() => setView({ kind: "sports" })} className="hover:text-[#00e701]">Sportsbook</button></li>
              <li><button onClick={() => setView({ kind: "vip" })} className="hover:text-[#00e701]">VIP Club</button></li>
              <li><button onClick={() => setView({ kind: "leaderboard" })} className="hover:text-[#00e701]">Leaderboard</button></li>
              <li><button onClick={() => setView({ kind: "affiliate" })} className="hover:text-[#00e701]">Affiliate</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Support</h4>
            <ul className="space-y-2 text-xs text-[#b1bad3]">
              <li><span className="hover:text-[#00e701] cursor-pointer">Live Chat 24/7</span></li>
              <li><span className="hover:text-[#00e701] cursor-pointer">Help Center</span></li>
              <li><span className="hover:text-[#00e701] cursor-pointer">Provably Fair</span></li>
              <li><span className="hover:text-[#00e701] cursor-pointer">Responsible Gaming</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Community</h4>
            <div className="flex gap-2">
              <a className="w-8 h-8 rounded-md bg-[#1a2c38] hover:bg-[#213743] flex items-center justify-center text-[#b1bad3] hover:text-white" href="#" aria-label="Twitter"><Twitter className="w-4 h-4" /></a>
              <a className="w-8 h-8 rounded-md bg-[#1a2c38] hover:bg-[#213743] flex items-center justify-center text-[#b1bad3] hover:text-white" href="#" aria-label="Telegram"><Send className="w-4 h-4" /></a>
              <a className="w-8 h-8 rounded-md bg-[#1a2c38] hover:bg-[#213743] flex items-center justify-center text-[#b1bad3] hover:text-white" href="#" aria-label="GitHub"><Github className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t border-[#2f4553]">
          <div className="flex items-center gap-2 text-xs text-[#b1bad3]">
            <ShieldCheck className="w-4 h-4 text-[#00e701]" />
            <span>Provably Fair · HMAC-SHA256 verified</span>
          </div>
          <p className="text-[11px] text-[#55657a] text-center md:text-right">
            © {new Date().getFullYear()} StakeForge Demo · Play-money only · Not affiliated with Stake or Hash.game
          </p>
        </div>
      </div>
    </footer>
  );
}

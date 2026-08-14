"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Wallet, Menu, Gift, Trophy, LogOut, User as UserIcon, Copy } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useWalletStore } from "@/store/wallet";
import { useUiStore } from "@/store/ui";
import { ASSETS } from "@/lib/constants";
import { toast } from "sonner";

export function TopBar() {
  const { user, logout } = useAuthStore();
  const { wallets, totalUsdValue } = useWalletStore();
  const { activeAsset, setActiveAsset, setView, toggleLeftSidebar, toggleRightChat, setAuthModal } = useUiStore();
  const viewKind = useUiStore((s) => s.view.kind);
  const [openAsset, setOpenAsset] = useState(false);

  const activeWallet = wallets.find((w) => w.asset === activeAsset) || wallets[0];

  return (
    <header className="sticky top-0 z-40 h-14 bg-[#1a2c38] border-b border-[#2f4553] flex items-center px-2 sm:px-4 gap-2">
      {/* Left: mobile menu + logo */}
      <button
        onClick={toggleLeftSidebar}
        className="lg:hidden p-2 hover:bg-[#213743] rounded-md text-white"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <button
        onClick={() => setView({ kind: "casino" })}
        className="flex items-center gap-2 px-2 group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00c2ff] to-[#1475e1] flex items-center justify-center font-black text-[#0f212e] text-lg">
          ⚡
        </div>
        <span className="hidden sm:block font-bold text-white text-lg tracking-tight">
          Stake<span className="text-[#00c2ff]">Forge</span>
        </span>
      </button>

      {/* Center: nav (desktop) */}
      <nav className="hidden md:flex items-center gap-1 ml-4">
        <NavBtn active={viewKind === "casino"} onClick={() => setView({ kind: "casino" })} icon={<CasinoIcon />} label="Casino" />
        <NavBtn active={viewKind === "sports"} onClick={() => setView({ kind: "sports" })} icon={<SportsIcon />} label="Sports" />
        <NavBtn active={viewKind === "contests"} onClick={() => setView({ kind: "contests" })} icon={<ContestIcon />} label="Contests" />
      </nav>

      <div className="flex-1" />

      {/* Right: wallet / auth */}
      {user ? (
        <>
          {/* Balance switcher */}
          <DropdownMenu open={openAsset} onOpenChange={setOpenAsset}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 bg-[#0f212e] hover:bg-[#213743] border border-[#2f4553] rounded-md px-3 py-1.5 transition-colors">
                <span className={`text-sm font-bold ${activeWallet?.color || "text-white"}`}>
                  {activeWallet?.icon} {activeWallet?.balance.toFixed(2)}
                </span>
                <span className="text-xs text-[#b1bad3] hidden sm:inline">{activeWallet?.asset}</span>
                <ChevronDown className="w-3 h-3 text-[#b1bad3]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 bg-[#1a2c38] border-[#2f4553]">
              <DropdownMenuLabel className="text-[#b1bad3] text-xs">
                Wallets · ${totalUsdValue.toFixed(2)} USD
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2f4553]" />
              {wallets.map((w) => (
                <DropdownMenuItem
                  key={w.asset}
                  onClick={() => setActiveAsset(w.asset)}
                  className="flex items-center justify-between gap-3 py-2 cursor-pointer hover:bg-[#213743]"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${w.color}`}>{w.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{w.asset}</div>
                      <div className="text-[10px] text-[#b1bad3]">{w.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${w.color}`}>{w.balance.toFixed(4)}</div>
                    <div className="text-[10px] text-[#b1bad3]">${w.usdValue.toFixed(2)}</div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-[#2f4553]" />
              <DropdownMenuItem
                onClick={() => setView({ kind: "wallet" })}
                className="cursor-pointer hover:bg-[#213743] text-[#00c2ff] justify-center"
              >
                <Wallet className="w-4 h-4 mr-2" /> Wallet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Wallet quick button */}
          <Button
            onClick={() => setView({ kind: "wallet" })}
            className="hidden sm:flex bg-[#00c2ff] hover:bg-[#009fd4] text-[#001a2e] font-bold h-9 px-3"
          >
            <Wallet className="w-4 h-4 mr-1" /> Wallet
          </Button>

          {/* VIP button */}
          <Button
            onClick={() => setView({ kind: "vip" })}
            variant="ghost"
            className="hidden md:flex text-[#ffd23f] hover:text-[#ffd23f] hover:bg-[#213743] h-9 px-3"
          >
            <Gift className="w-4 h-4" /> VIP
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 pr-2 hover:bg-[#213743] rounded-md transition-colors">
                <Avatar className="w-7 h-7 border border-[#2f4553]">
                  <AvatarImage src={user.avatar || undefined} alt={user.username} />
                  <AvatarFallback className="bg-[#213743] text-white text-xs">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm text-white font-medium max-w-[100px] truncate">
                  {user.username}
                </span>
                {user.vipTier && (
                  <span className="hidden lg:block text-[10px] px-1.5 py-0.5 rounded bg-[#213743] text-[#ffd23f] border border-[#2f4553]">
                    {user.vipTier.name}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1a2c38] border-[#2f4553]">
              <DropdownMenuLabel className="text-[#b1bad3] text-xs">
                <div className="flex flex-col">
                  <span className="text-white font-semibold">{user.username}</span>
                  <span>{user.email}</span>
                  {user.vipTier && (
                    <span className="text-[#ffd23f] mt-1">
                      {user.vipTier.name} · {Math.round(user.vipTier.rakebackPct * 100)}% rakeback
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2f4553]" />
              <DropdownMenuItem onClick={() => setView({ kind: "vip" })} className="cursor-pointer hover:bg-[#213743] text-white">
                <Gift className="w-4 h-4 mr-2" /> VIP Club
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView({ kind: "leaderboard" })} className="cursor-pointer hover:bg-[#213743] text-white">
                <Trophy className="w-4 h-4 mr-2" /> Leaderboard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(user.id);
                  toast.success("User ID copied");
                }}
                className="cursor-pointer hover:bg-[#213743] text-white"
              >
                <Copy className="w-4 h-4 mr-2" /> Copy User ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(user.clientSeed);
                  toast.success("Client seed copied");
                }}
                className="cursor-pointer hover:bg-[#213743] text-white"
              >
                <UserIcon className="w-4 h-4 mr-2" /> Client Seed
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2f4553]" />
              <DropdownMenuItem
                onClick={async () => {
                  await logout();
                  toast.success("Logged out");
                }}
                className="cursor-pointer hover:bg-[#213743] text-[#ff5c5c]"
              >
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            onClick={() => setAuthModal(true, "login")}
            className="text-white hover:bg-[#213743] h-9"
          >
            Log in
          </Button>
          <Button
            onClick={() => setAuthModal(true, "register")}
            className="bg-[#00c2ff] hover:bg-[#009fd4] text-[#001a2e] font-bold h-9 px-4"
          >
            Register
          </Button>
        </>
      )}

      {/* Right chat toggle (mobile) */}
      <button
        onClick={toggleRightChat}
        className="lg:hidden p-2 hover:bg-[#213743] rounded-md text-white"
        aria-label="Toggle chat"
      >
        <Menu className="w-5 h-5 rotate-180" />
      </button>
    </header>
  );
}

function NavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-150 ${
        active
          ? "bg-[#213743] text-white shadow-inner"
          : "text-[#b1bad3] hover:bg-[#213743] hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* Professional Casino icon — playing card / chip hybrid */
function CasinoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Casino chip outer ring */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" fill="none" />
      {/* Chip notches */}
      <path d="M12 2 L12 5M12 19 L12 22M2 12 L5 12M19 12 L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Inner circle */}
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Card suit — diamond in center */}
      <path d="M12 8.5 L14.5 12 L12 15.5 L9.5 12 Z" fill="currentColor" />
    </svg>
  );
}

/* Professional Sports icon — football / stadium */
function SportsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trophy cup */}
      <path d="M6 3h12v8a6 6 0 01-12 0V3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      {/* Trophy handles */}
      <path d="M6 6H3.5a2 2 0 000 4H6M18 6h2.5a2 2 0 010 4H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Trophy stem */}
      <path d="M12 17v3M9 20h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Star inside trophy */}
      <path d="M12 6.5l.9 2.7h2.9l-2.3 1.7.9 2.7L12 12l-2.4 1.6.9-2.7-2.3-1.7h2.9z" fill="currentColor" />
    </svg>
  );
}

function ContestIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Medal circle */}
      <circle cx="12" cy="14" r="6" stroke="currentColor" strokeWidth="1.8" fill="none" />
      {/* Medal ribbon left */}
      <path d="M9 8 L7 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Medal ribbon right */}
      <path d="M15 8 L17 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Ribbon bar */}
      <path d="M7 3 L17 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Star inside medal */}
      <path d="M12 11l.9 2.7h2.9l-2.3 1.7.9 2.7L12 16.5l-2.4 1.6.9-2.7-2.3-1.7h2.9z" fill="currentColor" />
    </svg>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Users, Radio, Gift, X, Trophy } from "lucide-react";
import { useChatStore } from "@/store/chat";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";
import { useChatSocket, sendChatMessage } from "@/hooks/use-chat-socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { seededUsername, randomIndianUsername } from "@/lib/indian-names";

export function RightChatSidebar() {
  const [tab, setTab] = useState<"chat" | "bets">("chat");
  const { rightChatOpen, toggleRightChat } = useUiStore();
  const socketRef = useChatSocket();
  const messages = useChatStore((s) => s.messages);
  const betFeed = useChatStore((s) => s.betFeed);
  const online = useChatStore((s) => s.online);
  const connected = useChatStore((s) => s.connected);
  const activeRain = useChatStore((s) => s.activeRain);
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === "chat" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, tab]);

  const handleSend = () => {
    if (!user) {
      useUiStore.getState().setAuthModal(true, "login");
      return;
    }
    if (!text.trim()) return;
    sendChatMessage(socketRef.current, text);
    setText("");
  };

  const claimRain = async () => {
    if (!user) {
      useUiStore.getState().setAuthModal(true, "login");
      return;
    }
    try {
      const res = await fetch("/api/rain/claim", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rainId: activeRain?.rainId || "default" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`🌧️ Claimed ${data.amount} ${data.asset}!`);
        // refresh wallet using Zustand store method
        const { useWalletStore } = await import("@/store/wallet");
        await useWalletStore.getState().refresh();
      } else {
        toast.error(data.error || "Rain claim failed");
      }
    } catch {
      toast.error("Rain claim failed");
    }
  };

  return (
    <AnimatePresence>
      {rightChatOpen && (
        <motion.aside
          initial={{ x: 340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 340, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="fixed lg:sticky top-14 right-0 z-30 w-full sm:w-80 lg:w-80 h-[calc(100vh-3.5rem)] bg-[#0f212e] border-l border-[#2f4553] flex flex-col"
        >
          {/* Tabs */}
          <div className="flex items-center border-b border-[#2f4553]">
            <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} icon={<Users className="w-4 h-4" />} label="Chat" badge={online > 0 ? online : undefined} />
            <TabBtn active={tab === "bets"} onClick={() => setTab("bets")} icon={<Radio className="w-4 h-4" />} label="Live Bets" />
            <button onClick={toggleRightChat} className="ml-auto p-2 hover:bg-[#213743] text-[#b1bad3]" aria-label="Close chat">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Rain banner */}
          {activeRain && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="m-2 p-3 rounded-lg bg-gradient-to-r from-[#1475e1] to-[#00c2ff] text-[#001a2e]"
            >
              <div className="flex items-center gap-2 mb-1">
                <Gift className="w-4 h-4" />
                <span className="font-bold text-sm">Rain Active!</span>
              </div>
              <p className="text-xs mb-2 font-medium">
                {activeRain.amount} {activeRain.asset} for {activeRain.participants} users
              </p>
              <Button onClick={claimRain} size="sm" className="w-full bg-[#0f212e] hover:bg-[#1a2c38] text-white h-8 text-xs font-bold">
                Claim Rain
              </Button>
            </motion.div>
          )}

          {/* Content */}
          {tab === "chat" ? (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
                {messages.length === 0 && (
                  <div className="text-center text-[#b1bad3] text-xs py-8">
                    {connected ? "Loading messages…" : "Connecting to chat…"}
                  </div>
                )}
                {messages.map((m) => (
                  <ChatLine key={m.id} message={m} />
                ))}
              </div>
              <div className="border-t border-[#2f4553] p-2">
                {user ? (
                  <div className="flex gap-2">
                    <Input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Type a message…"
                      maxLength={280}
                      className="bg-[#213743] border-[#2f4553] text-white placeholder:text-[#55657a] h-9 text-sm"
                    />
                    <Button
                      onClick={handleSend}
                      size="icon"
                      className="bg-[#00c2ff] hover:bg-[#009fd4] text-[#001a2e] h-9 w-9 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => useUiStore.getState().setAuthModal(true, "login")}
                    className="w-full bg-[#213743] hover:bg-[#2f4553] text-white h-9 text-sm"
                  >
                    Log in to chat
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
              {betFeed.length === 0 && (
                <div className="text-center text-[#b1bad3] text-xs py-8">Waiting for live bets…</div>
              )}
              {betFeed.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2 p-2 rounded-md bg-[#1a2c38] hover:bg-[#213743] transition-colors"
                >
                  <Trophy className={cn("w-3.5 h-3.5 shrink-0", b.multiplier >= 2 ? "text-[#00c2ff]" : "text-[#b1bad3]")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white truncate">
                      <span className="font-semibold">{b.username.startsWith("bot_") || b.username.startsWith("Guest_") ? seededUsername(b.username.charCodeAt(0) + b.username.length) : b.username}</span>
                      <span className="text-[#b1bad3]"> · {b.game}</span>
                    </div>
                    <div className="text-[10px] text-[#b1bad3]">
                      {b.bet.toFixed(2)} {b.asset} → {b.payout.toFixed(2)} {b.asset}
                    </div>
                  </div>
                  <div className={cn("text-sm font-bold tabular-nums", b.multiplier >= 2 ? "text-[#00c2ff]" : "text-[#b1bad3]")}>
                    {b.multiplier.toFixed(2)}x
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function TabBtn({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-[#00c2ff] text-white"
          : "border-transparent text-[#b1bad3] hover:text-white"
      )}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#213743] text-[#b1bad3] tabular-nums">
          {badge}
        </span>
      )}
    </button>
  );
}

function ChatLine({ message }: { message: import("@/store/chat").ChatMessage }) {
  if (message.type === "system") {
    return (
      <div className="text-center py-1">
        <span className="text-[11px] text-[#b1bad3] bg-[#1a2c38] px-2 py-0.5 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }
  const dName = message.username.startsWith("bot_") || message.username.startsWith("Guest_") ? seededUsername(message.username.charCodeAt(0) + message.username.length) : message.username;
  return (
    <div className="flex gap-2 p-1.5 rounded hover:bg-[#1a2c38]/50 transition-colors group">
      <Avatar className="w-6 h-6 shrink-0 border border-[#2f4553]">
        <AvatarImage src={message.avatar || undefined} alt={dName} />
        <AvatarFallback className="bg-[#213743] text-white text-[10px]">
          {dName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white truncate">{dName}</span>
          {message.role === "mod" && (
            <span className="text-[9px] px-1 rounded bg-[#1475e1] text-white">MOD</span>
          )}
          {message.role === "admin" && (
            <span className="text-[9px] px-1 rounded bg-[#ff5cb1] text-white">ADMIN</span>
          )}
        </div>
        <p className="text-xs text-[#dfe5ee] break-words leading-snug">{message.text}</p>
      </div>
    </div>
  );
}

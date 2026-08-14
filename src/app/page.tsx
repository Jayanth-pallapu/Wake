"use client";

import { useEffect } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { LeftSidebar, LeftSidebarCollapsed } from "@/components/layout/left-sidebar";
import { RightChatSidebar } from "@/components/layout/right-chat-sidebar";
import { AuthModal } from "@/components/layout/auth-modal";
import { Footer } from "@/components/layout/footer";
import { useAuthStore } from "@/store/auth";
import { useWalletStore } from "@/store/wallet";
import { useUiStore } from "@/store/ui";
import { CasinoLobby } from "@/components/casino/casino-lobby";
import { GameView } from "@/components/games/game-view";
import { SportsbookView } from "@/components/sports/sportsbook-view";
import { VipView } from "@/components/vip/vip-view";
import { WalletView } from "@/components/wallet/wallet-view";
import { LeaderboardView } from "@/components/casino/leaderboard-view";
import { AffiliateView } from "@/components/casino/affiliate-view";
import { SlotsView } from "@/components/slots/slots-view";
import { ContestsView } from "@/components/contests/contests-view";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const refreshAuth = useAuthStore((s) => s.refresh);
  const refreshWallet = useWalletStore((s) => s.refresh);
  const user = useAuthStore((s) => s.user);
  const view = useUiStore((s) => s.view);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    if (user) refreshWallet();
  }, [user, refreshWallet]);

  // Collapse sidebars on small screens (after mount to avoid hydration mismatch)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      useUiStore.setState({ leftSidebarOpen: false, rightChatOpen: false });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0f212e] text-white">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <LeftSidebar />
        <LeftSidebarCollapsed />
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={view.kind + ("gameId" in view ? view.gameId : "")}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="min-h-[calc(100vh-3.5rem)]"
              >
                {renderView(view)}
              </motion.div>
            </AnimatePresence>
          </div>
          <Footer />
        </main>
        <RightChatSidebar />
      </div>
      <AuthModal />
    </div>
  );
}

function renderView(view: import("@/store/ui").ViewId) {
  switch (view.kind) {
    case "casino":
      return <CasinoLobby />;
    case "game":
      return <GameView gameId={view.gameId} />;
    case "sports":
      return <SportsbookView />;
    case "vip":
      return <VipView />;
    case "wallet":
      return <WalletView />;
    case "leaderboard":
      return <LeaderboardView />;
    case "affiliate":
      return <AffiliateView />;
    case "slots":
      return <SlotsView slotId={(view as any).slotId} />;
    case "slots-lobby":
      return <SlotsView slotId={null} />;
    case "contests":
      return <ContestsView />;
    default:
      return <CasinoLobby />;
  }
}

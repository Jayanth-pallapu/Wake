"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, History, RefreshCw, ChevronLeft, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui";
import { GAMES } from "@/lib/constants";
import { api, type SeedInfo } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { useFullscreen } from "@/hooks/use-fullscreen";

interface GameShellProps {
  gameId: string;
  children: React.ReactNode; // full game UI (canvas + controls laid out by game)
  history?: React.ReactNode;
}

export function GameShell({ gameId, children, history }: GameShellProps) {
  const setView = useUiStore((s) => s.setView);
  const meta = GAMES.find((g) => g.id === gameId);
  const user = useAuthStore((s) => s.user);
  const [seeds, setSeeds] = useState<SeedInfo | null>(null);
  const [showFair, setShowFair] = useState(false);
  const [rotating, setRotating] = useState(false);
  const { ref: fsRef, isFullscreen, toggleFullscreen } = useFullscreen();

  const loadSeeds = async () => {
    if (!user) return;
    try {
      const s = await api.get<SeedInfo>("/api/games/seeds");
      setSeeds(s);
    } catch {}
  };

  useEffect(() => {
    loadSeeds();
  }, [user?.id]);

  const rotate = async () => {
    setRotating(true);
    try {
      await api.post("/api/games/seeds", { action: "rotate" });
      await loadSeeds();
      toast.success("Server seed rotated (previous revealed)");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rotate failed");
    } finally {
      setRotating(false);
    }
  };

  return (
    <div ref={fsRef as any} className={isFullscreen ? "bg-[#0f212e] overflow-auto p-4 w-full h-full" : ""}>
      <div className="p-3 sm:p-5 max-w-[1400px] mx-auto">
        <button
        onClick={() => setView({ kind: "casino" })}
        className="flex items-center gap-1 text-xs text-[#b1bad3] hover:text-white mb-3"
      >
        <ChevronLeft className="w-3 h-3" /> Back to lobby
      </button>

      <div className="bg-[#1a2c38] border border-[#2f4553] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2f4553]">
          <div className="flex items-center gap-2">
            <span className="text-xl">{meta?.emoji}</span>
            <h1 className="font-bold text-white text-sm sm:text-base">{meta?.name}</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0f212e] text-[#b1bad3]">{meta?.houseEdgePct}% edge</span>
            {meta?.tag && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00c2ff]/20 text-[#00c2ff] uppercase">{meta.tag}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-[#b1bad3] hover:text-white hover:bg-[#213743] h-8 text-xs">
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFair((s) => !s)}
              className="text-[#b1bad3] hover:text-white hover:bg-[#213743] h-8 text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Fairness
            </Button>
          </div>
        </div>

        {showFair && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="bg-[#0f212e] border-b border-[#2f4553] p-3 space-y-2 text-[11px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[#b1bad3] font-semibold uppercase tracking-wider">Provably Fair · HMAC-SHA256</span>
              <Button onClick={rotate} disabled={rotating} size="sm" variant="outline" className="h-6 text-[10px] bg-transparent border-[#2f4553] text-white hover:bg-[#213743]">
                <RefreshCw className={`w-3 h-3 mr-1 ${rotating ? "animate-spin" : ""}`} /> Rotate seed
              </Button>
            </div>
            {seeds ? (
              <div className="space-y-1.5">
                <FairRow label="Server Seed (hashed)" value={seeds.active.serverSeedHash} />
                <FairRow label="Client Seed" value={seeds.active.clientSeed} />
                <FairRow label="Nonce" value={String(seeds.active.nonce)} />
                {seeds.previous && (
                  <>
                    <div className="pt-1.5 mt-1.5 border-t border-[#2f4553] text-[#00c2ff] font-semibold uppercase tracking-wider">Previous (revealed)</div>
                    <FairRow label="Server Seed" value={seeds.previous.serverSeed} />
                    <FairRow label="Client Seed" value={seeds.previous.clientSeed} />
                    <FairRow label="Nonce" value={String(seeds.previous.nonce)} />
                  </>
                )}
              </div>
            ) : (
              <div className="text-[#b1bad3]">Sign in to view your provably-fair seeds.</div>
            )}
          </motion.div>
        )}

        <div className="p-3 sm:p-4">{children}</div>
      </div>

      {/* History */}
      {history && (
        <div className="mt-4 bg-[#1a2c38] border border-[#2f4553] rounded-xl">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#2f4553]">
            <History className="w-4 h-4 text-[#b1bad3]" />
            <h2 className="font-semibold text-white text-sm">Recent Bets</h2>
          </div>
          {history}
        </div>
      )}
      </div>
    </div>
  );
}

function FairRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
      <span className="text-[#b1bad3]">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <code className="text-[#dfe5ee] truncate font-mono text-[10px] flex-1 break-all">{value}</code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success("Copied");
          }}
          className="text-[#b1bad3] hover:text-white text-[10px] px-1 shrink-0"
        >
          copy
        </button>
      </div>
    </div>
  );
}

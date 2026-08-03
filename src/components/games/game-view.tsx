"use client";

import { useEffect, useState } from "react";
import { GameShell } from "./game-shell";
import { CrashGame } from "./crash-game";
import { DiceGame } from "./dice-game";
import { PlinkoGame } from "./plinko-game";
import { MinesGame } from "./mines-game";
import { LimboGame } from "./limbo-game";
import { WheelGame } from "./wheel-game";
import { TowerGame } from "./tower-game";
import { KenoGame } from "./keno-game";
import { HiloGame } from "./hilo-game";
import { CoinflipGame as CoinFlipGame } from "./coinflip-game";
import { VideopokerGame as VideoPokerGame } from "./videopoker-game";
import { DragontigerGame as DragonTigerGame } from "./dragontiger-game";
import { BlackjackGame } from "./blackjack-game";
import { BaccaratGame } from "./baccarat-game";
import { RouletteGame } from "./roulette-game";
import { FastcrashGame as FastCrashGame } from "./fastcrash-game";
import { TwistGame } from "./twist-game";
import { CavePlunderGame } from "./cave-plunder-game";
import { RecentBets } from "./recent-bets";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth";

interface GameViewProps {
  gameId: string;
}

export function GameView({ gameId }: GameViewProps) {
  const user = useAuthStore((s) => s.user);
  const [bets, setBets] = useState<RecentBet[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.get<{ bets: RecentBet[] }>(`/api/games/history?game=${gameId}&limit=15`).then((d) => setBets(d.bets)).catch(() => {});
  }, [user, gameId, refreshKey]);

  const onPlayed = () => setRefreshKey((k) => k + 1);

  return (
    <GameShell gameId={gameId} history={<RecentBets bets={bets} />}>
      {renderGame(gameId, onPlayed)}
    </GameShell>
  );
}

function renderGame(gameId: string, onPlayed: () => void) {
  switch (gameId) {
    // ── Existing 8 games ──
    case "crash":       return <CrashGame onPlayed={onPlayed} />;
    case "dice":        return <DiceGame onPlayed={onPlayed} />;
    case "plinko":      return <PlinkoGame onPlayed={onPlayed} />;
    case "mines":       return <MinesGame onPlayed={onPlayed} />;
    case "limbo":       return <LimboGame onPlayed={onPlayed} />;
    case "wheel":       return <WheelGame onPlayed={onPlayed} />;
    case "tower":       return <TowerGame onPlayed={onPlayed} />;
    case "keno":        return <KenoGame onPlayed={onPlayed} />;
    // ── 10 new BC Originals ──
    case "hilo":        return <HiloGame onPlayed={onPlayed} />;
    case "coinflip":    return <CoinFlipGame onPlayed={onPlayed} />;
    case "videopoker":  return <VideoPokerGame onPlayed={onPlayed} />;
    case "dragontiger": return <DragonTigerGame onPlayed={onPlayed} />;
    case "blackjack":   return <BlackjackGame onPlayed={onPlayed} />;
    case "baccarat":    return <BaccaratGame onPlayed={onPlayed} />;
    case "roulette":    return <RouletteGame onPlayed={onPlayed} />;
    case "fastcrash":   return <FastCrashGame onPlayed={onPlayed} />;
    case "twist":       return <TwistGame onPlayed={onPlayed} />;
    case "cave":        return <CavePlunderGame onPlayed={onPlayed} />;
    default:
      return <div className="text-center text-[#b1bad3] py-20">Game coming soon.</div>;
  }
}

export interface RecentBet {
  id: string;
  game: string;
  asset: string;
  bet: number;
  payout: number;
  multiplier: number;
  win: boolean;
  outcome: Record<string, unknown>;
  nonce: number;
  clientSeed: string;
  createdAt: string;
}

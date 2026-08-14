import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { initDemoWallets } from "@/lib/wallet";
import { VIP_TIERS, usdToRaw } from "@/lib/constants";
import { generateServerSeed, generateClientSeed, hashServerSeed } from "@/lib/provably-fair";
import { json, err } from "@/lib/api";

/* ─── One-time Seed Endpoint ────────────────────────────────────
   POST /api/seed?secret=<INTERNAL_SECRET>
   - Seeds VIP tiers
   - Creates the demo account (demo / Demo@12345)
   - Creates 20 bot users with wager history
   Idempotent: safe to run multiple times.
──────────────────────────────────────────────────────────────── */

const BOT_NAMES = [
  "SatoshiNak", "WhaleHunter", "DiamondHands", "LuckyChip", "MoonBoy",
  "HODLking", "GreenCandle", "BetMaster99", "CrashQueen", "PlinkoPro",
  "DiceRoller", "BTCbaron", "ETHmaxi", "LimboLegend", "MineSweeperX",
  "TowerClimber", "WheelSpinner", "JackpotJoe", "FOMOfever", "BullRunBetty",
];

const GAMES = ["crash", "dice", "plinko", "mines", "limbo", "wheel", "tower", "keno"];

export async function POST(req: NextRequest) {
  // Secure with INTERNAL_SECRET — only admins can seed
  const secret = process.env.INTERNAL_SECRET;
  const provided = req.nextUrl.searchParams.get("secret")
    || req.headers.get("x-seed-secret");

  if (!secret || provided !== secret) {
    return err("Forbidden", 403);
  }

  const results: string[] = [];

  // ── 1. VIP Tiers ─────────────────────────────────────────────
  for (const t of VIP_TIERS) {
    await db.vipTier.upsert({
      where: { name: t.name },
      create: {
        name: t.name,
        level: t.level,
        requiredWagerRaw: usdToRaw(t.requiredWagerUsd),
        rakebackPct: t.rakebackPct,
        levelUpBonusRaw: usdToRaw(t.levelUpBonusUsd),
        dedicatedHost: t.dedicatedHost,
      },
      update: {
        level: t.level,
        requiredWagerRaw: usdToRaw(t.requiredWagerUsd),
        rakebackPct: t.rakebackPct,
        levelUpBonusRaw: usdToRaw(t.levelUpBonusUsd),
        dedicatedHost: t.dedicatedHost,
      },
    });
  }
  results.push(`✓ ${VIP_TIERS.length} VIP tiers upserted`);

  // ── 2. Demo Account ───────────────────────────────────────────
  const demoEmail = "demo@wake.casino";
  const demoExists = await db.user.findUnique({ where: { email: demoEmail } });
  if (!demoExists) {
    const serverSeed = generateServerSeed();
    const clientSeed = generateClientSeed();
    const demo = await db.user.create({
      data: {
        username: "demo",
        email: demoEmail,
        passwordHash: hashPassword("Demo@12345"),
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=demo",
        serverSeed,
        serverSeedHash: hashServerSeed(serverSeed),
        clientSeed,
        nonce: 0,
      },
    });
    await initDemoWallets(demo.id);
    results.push("✓ Demo account created  →  demo / Demo@12345");
  } else {
    results.push("• Demo account already exists");
  }

  // ── 3. Bot Users ──────────────────────────────────────────────
  let botsCreated = 0;
  for (let i = 0; i < BOT_NAMES.length; i++) {
    const name = BOT_NAMES[i];
    const email = `${name.toLowerCase()}@bot.wake`;
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) continue;

    const serverSeed = generateServerSeed();
    const clientSeed = generateClientSeed();
    const tierIdx = Math.min(VIP_TIERS.length - 1, Math.floor(i / 3));
    const tierCfg = VIP_TIERS[tierIdx];
    const tier = await db.vipTier.findUnique({ where: { name: tierCfg.name } });
    if (!tier) continue;

    const bot = await db.user.create({
      data: {
        username: name,
        email,
        passwordHash: hashPassword("botpassword123"),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
        serverSeed,
        serverSeedHash: hashServerSeed(serverSeed),
        clientSeed,
        nonce: Math.floor(Math.random() * 500),
        vipTierId: tier.id,
        lifetimeWagerRaw: usdToRaw(tierCfg.requiredWagerUsd + Math.random() * 50000),
        gamesPlayed: 100 + Math.floor(Math.random() * 5000),
      },
    });

    // Give bot a wallet with random balance
    await db.wallet.upsert({
      where: { userId_asset: { userId: bot.id, asset: "USDT" } },
      create: { userId: bot.id, asset: "USDT", balance: usdToRaw(100 + Math.random() * 50000) },
      update: {},
    });

    // Seed bet history
    const betCount = 20 + Math.floor(Math.random() * 60);
    for (let b = 0; b < betCount; b++) {
      const game = GAMES[Math.floor(Math.random() * GAMES.length)];
      const betRaw = BigInt(Math.round((1 + Math.random() * 100) * 100_000_000));
      const win = Math.random() > 0.5;
      const mult = win ? Math.round((1.2 + Math.random() * 50) * 100) / 100 : 0;
      const payoutRaw = win ? (betRaw * BigInt(Math.round(mult * 100))) / 100n : 0n;
      const ts = new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000);
      await db.gameBet.create({
        data: {
          userId: bot.id, game, asset: "USDT",
          betAmountRaw: betRaw, payoutRaw, multiplier: mult,
          outcome: JSON.stringify({ seed: "historical" }),
          win, serverSeed, clientSeed, nonce: b, createdAt: ts,
        },
      });
    }
    botsCreated++;
  }
  results.push(`✓ ${botsCreated} bot users created with bet history`);

  return json({ ok: true, results });
}

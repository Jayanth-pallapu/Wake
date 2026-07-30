// Seed script: VIP tiers + demo bot users with wager history.
// Run with: bun run scripts/seed.ts
import { db } from "../src/lib/db";
import { VIP_TIERS, ASSETS, UNIT, usdToRaw } from "../src/lib/constants";
import { hashPassword } from "../src/lib/auth";
import { generateServerSeed, generateClientSeed, hashServerSeed } from "../src/lib/provably-fair";

const BOT_NAMES = [
  "SatoshiNak", "WhaleHunter", "DiamondHands", "LuckyChip", "MoonBoy",
  "HODLking", "GreenCandle", "BetMaster99", "CrashQueen", "PlinkoPro",
  "DiceRoller", "BTCbaron", "ETHmaxi", "LimboLegend", "MineSweeperX",
  "TowerClimber", "WheelSpinner", "JackpotJoe", "FOMOfever", "BullRunBetty",
];

const GAMES = ["crash", "dice", "plinko", "mines", "limbo", "wheel", "tower", "keno"];

async function main() {
  console.log("Seeding VIP tiers...");
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

  console.log("Seeding bot users with wager history...");
  for (let i = 0; i < BOT_NAMES.length; i++) {
    const name = BOT_NAMES[i];
    const email = `${name.toLowerCase()}@bot.demo`;
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) continue;
    const serverSeed = generateServerSeed();
    const clientSeed = generateClientSeed();
    // assign a tier based on index spread
    const tierIdx = Math.min(VIP_TIERS.length - 1, Math.floor(i / 3));
    const tierCfg = VIP_TIERS[tierIdx];
    const tier = await db.vipTier.findUnique({ where: { name: tierCfg.name } });
    if (!tier) continue;
    const user = await db.user.create({
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
        // lifetime wager: scale to roughly fit tier bracket
        lifetimeWagerRaw: usdToRaw(tierCfg.requiredWagerUsd + Math.random() * 50000),
        gamesPlayed: 100 + Math.floor(Math.random() * 5000),
      },
    });
    // give them a fat USDT wallet
    await db.wallet.upsert({
      where: { userId_asset: { userId: user.id, asset: "USDT" } },
      create: { userId: user.id, asset: "USDT", balance: usdToRaw(100 + Math.random() * 50000) },
      update: {},
    });
    // seed some bet history for this user
    const betCount = 20 + Math.floor(Math.random() * 60);
    for (let b = 0; b < betCount; b++) {
      const game = GAMES[Math.floor(Math.random() * GAMES.length)];
      const asset = ASSETS[Math.floor(Math.random() * ASSETS.length)].symbol;
      const betRaw = BigInt(Math.round((1 + Math.random() * 100) * Number(UNIT)));
      const win = Math.random() > 0.5;
      const mult = win ? Math.round((1.2 + Math.random() * 50) * 100) / 100 : 0;
      const payoutRaw = win ? (betRaw * BigInt(Math.round(mult * 100))) / 100n : 0n;
      const ts = new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000);
      await db.gameBet.create({
        data: {
          userId: user.id, game, asset, betAmountRaw: betRaw,
          payoutRaw, multiplier: mult,
          outcome: JSON.stringify({ seed: "historical" }),
          win,
          serverSeed, clientSeed, nonce: b,
          createdAt: ts,
        },
      });
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

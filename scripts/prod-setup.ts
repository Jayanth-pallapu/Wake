// Push Prisma schema + seed demo account to production Neon DB
// Usage: $env:DATABASE_URL="postgresql://..."; npx tsx scripts/prod-setup.ts
import { execSync } from "child_process";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { initDemoWallets } from "../src/lib/wallet";
import { generateServerSeed, generateClientSeed, hashServerSeed } from "../src/lib/provably-fair";
import { VIP_TIERS, usdToRaw } from "../src/lib/constants";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl || !dbUrl.startsWith("postgresql://") && !dbUrl.startsWith("postgres://")) {
  console.error("❌ DATABASE_URL must be a PostgreSQL connection string.");
  console.error("   Set it: $env:DATABASE_URL='postgresql://...'");
  process.exit(1);
}

console.log("🗄️  DATABASE_URL detected:", dbUrl.slice(0, 40) + "...");

async function main() {
  // 1. Seed VIP tiers
  console.log("\n📊 Seeding VIP tiers...");
  for (const t of VIP_TIERS) {
    await db.vipTier.upsert({
      where: { name: t.name },
      create: {
        name: t.name, level: t.level,
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
  console.log(`✅ ${VIP_TIERS.length} VIP tiers ready`);

  // 2. Create demo account
  console.log("\n👤 Creating demo account...");
  const demoEmail = "demo@wake.casino";
  const existing = await db.user.findUnique({ where: { email: demoEmail } });
  if (existing) {
    console.log("✅ Demo account already exists");
  } else {
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
    console.log("✅ Demo account created  →  demo / Demo@12345");
  }

  console.log("\n🎉 Production setup complete!");
  console.log("   Username: demo");
  console.log("   Password: Demo@12345");
}

main()
  .catch(e => { console.error("❌", e.message); process.exit(1); })
  .finally(() => db.$disconnect());

/**
 * Standalone demo account creation script (no bun required).
 * Run with: node scripts/create-demo.mjs
 */
import { createRequire } from "module";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
const envPath = join(__dirname, "../.env");
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
} catch {}

const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();

function hashPassword(password) {
  return createHash("sha256").update(password + "wake_salt_2024").digest("hex");
}

function randomHex(bytes) {
  return Array.from({ length: bytes }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");
}

async function main() {
  console.log("Checking for demo account...");

  const demoEmail = "demo@wake.casino";
  const existing = await db.user.findUnique({ where: { email: demoEmail } });

  if (existing) {
    console.log("✓ Demo account already exists!");
    console.log("  Username: demo");
    console.log("  Email:    demo@wake.casino");
    console.log("  Password: Demo@12345");
    return;
  }

  const serverSeed = randomHex(32);
  const clientSeed = randomHex(16);
  const serverSeedHash = createHash("sha256").update(serverSeed).digest("hex");

  const demo = await db.user.create({
    data: {
      username: "demo",
      email: demoEmail,
      passwordHash: hashPassword("Demo@12345"),
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=demo",
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce: 0,
    },
  });

  // Give demo wallets with play money
  const assets = ["USDT", "BTC", "ETH", "BNB", "SOL", "DOGE", "LTC", "XRP"];
  const startingBalances = {
    USDT: 1000_00000000n,   // $1000 USDT
    BTC:  10_000_000n,       // 0.1 BTC
    ETH:  500_000_000n,      // 0.5 ETH
    BNB:  2_000_000_000n,    // 2 BNB
    SOL:  10_000_000_000n,   // 10 SOL
    DOGE: 10000_00000000n,   // 10000 DOGE
    LTC:  100_000_000n,      // 1 LTC
    XRP:  1000_000_000n,     // 1000 XRP
  };

  for (const asset of assets) {
    const balance = startingBalances[asset] ?? 1000_00000000n;
    await db.wallet.upsert({
      where: { userId_asset: { userId: demo.id, asset } },
      create: { userId: demo.id, asset, balance },
      update: {},
    });
    await db.transaction.create({
      data: {
        userId: demo.id,
        type: "DEPOSIT",
        asset,
        amountRaw: balance,
        note: "Welcome bonus — demo funds",
      },
    });
  }

  console.log("✅ Demo account created successfully!");
  console.log("  Username: demo");
  console.log("  Email:    demo@wake.casino");
  console.log("  Password: Demo@12345");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

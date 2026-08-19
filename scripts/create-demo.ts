// Quick script to create the demo account using the project's actual auth functions.
// Run with: npx tsx scripts/create-demo.ts
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { initDemoWallets } from "../src/lib/wallet";
import { generateServerSeed, generateClientSeed, hashServerSeed } from "../src/lib/provably-fair";

async function main() {
  const demoEmail = "demo@wake.casino";
  const existing = await db.user.findUnique({ where: { email: demoEmail } });

  if (existing) {
    console.log("✓ Demo account already exists!");
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
    console.log("✅ Demo account created!");
  }

  console.log("  Username: demo");
  console.log("  Email:    demo@wake.casino");
  console.log("  Password: Demo@12345");
}

main()
  .catch((e) => { console.error("❌", e.message); process.exit(1); })
  .finally(() => db.$disconnect());

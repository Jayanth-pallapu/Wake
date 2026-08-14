import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { computePrizes, generateBotEntries, CONTEST_TIERS } from '@/lib/contest';

export async function POST(req: NextRequest) {
  // Simple auth: only allow internal calls with a secret
  const auth = req.headers.get('authorization');
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    // Find contests past resultsAt that are still 'open' or 'closed'
    const toSettle = await db.contest.findMany({
      where: { resultsAt: { lte: now }, status: { in: ['open', 'closed'] } },
      include: { entries: { orderBy: { wagerRaw: 'desc' }, take: 2000 } },
    });

    const settled: string[] = [];
    for (const contest of toSettle) {
      const cfg = CONTEST_TIERS.find((t) => t.tier === contest.tier);
      if (!cfg) continue;

      const prizeMap = computePrizes(contest.prizePoolRaw, cfg);
      const bots = generateBotEntries(Math.max(0, cfg.topPoolCount - contest.entries.length), contest.tier, contest.id);

      // Merge real + bot, sort by wager
      const allEntries = [
        ...contest.entries.map((e) => ({ userId: e.userId, username: e.username, wagerRaw: e.wagerRaw, isReal: true })),
        ...bots.map((b) => ({ userId: null, username: b.username, wagerRaw: b.wagerRaw, isReal: false })),
      ].sort((a, b) => (a.wagerRaw > b.wagerRaw ? -1 : 1));

      // Create winner records and pay real users
      for (let i = 0; i < Math.min(cfg.topPoolCount, allEntries.length); i++) {
        const entry = allEntries[i];
        const prizeRaw = prizeMap[i]?.prizeRaw ?? 0n;
        await db.contestWinner.create({
          data: { contestId: contest.id, userId: entry.userId, username: entry.username, rank: i + 1, prizeRaw },
        });
        // Credit real users
        if (entry.userId && prizeRaw > 0n) {
          const wallet = await db.wallet.findUnique({ where: { userId_asset: { userId: entry.userId, asset: 'USDT' } } });
          if (wallet) {
            await db.wallet.update({ where: { userId_asset: { userId: entry.userId, asset: 'USDT' } }, data: { balance: { increment: prizeRaw } } });
            await db.walletLedger.create({
              data: {
                userId: entry.userId, asset: 'USDT', amountRaw: prizeRaw,
                balanceAfterRaw: wallet.balance + prizeRaw,
                transactionType: 'WIN',
                note: `Contest $${contest.tier} ${contest.period} rank #${i + 1} prize`,
                reference: contest.id,
              },
            });
          }
        }
      }

      await db.contest.update({ where: { id: contest.id }, data: { status: 'settled', settledAt: now } });
      settled.push(contest.id);
    }

    return NextResponse.json({ settled, count: settled.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

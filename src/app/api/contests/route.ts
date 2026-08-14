import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CONTEST_TIERS, PARTICIPANT_COUNTS, getNextResultsTime, getClosingTime, getDisplayPrizePool } from '@/lib/contest';
import type { ContestPeriod } from '@/lib/contest';

export const dynamic = 'force-dynamic';

// Ensure contests exist in DB for all active tier+period combos
async function ensureContests() {
  const now = new Date();
  for (const cfg of CONTEST_TIERS) {
    for (const period of cfg.periods) {
      const participantCount = PARTICIPANT_COUNTS[cfg.tier]?.[period] ?? 0;
      if (participantCount === 0) continue;
      
      // Check if open contest exists
      const existing = await db.contest.findFirst({
        where: { tier: cfg.tier, period, status: 'open' },
      });
      if (existing) continue;

      // Create one
      const resultsAt = getNextResultsTime(period as ContestPeriod);
      const closesAt = getClosingTime(resultsAt, period as ContestPeriod);
      const entryFeeRaw = BigInt(cfg.tier) * 100_000_000n;
      // Simulated prize pool based on participant count
      const prizePoolRaw = entryFeeRaw * BigInt(participantCount);

      await db.contest.create({
        data: {
          tier: cfg.tier,
          period,
          status: now < closesAt ? 'open' : 'closed',
          entryFeeRaw,
          prizePoolRaw,
          openAt: now,
          closesAt,
          resultsAt,
        },
      });
    }
  }
}

export async function GET() {
  try {
    await ensureContests();
    const contests = await db.contest.findMany({
      where: { status: { in: ['open', 'closed'] } },
      include: { _count: { select: { entries: true } }, winners: { take: 3, orderBy: { rank: 'asc' } } },
      orderBy: [{ tier: 'asc' }, { period: 'asc' }],
    });

    const now = new Date();
    const result = contests.map((c) => ({
      id: c.id,
      tier: c.tier,
      period: c.period,
      status: c.status,
      entryFeeRaw: c.entryFeeRaw.toString(),
      prizePoolRaw: c.prizePoolRaw.toString(),
      prizePoolDisplay: getDisplayPrizePool(c.tier, c.period as ContestPeriod),
      participantCount: PARTICIPANT_COUNTS[c.tier]?.[c.period as ContestPeriod] ?? 0,
      entryCount: c._count.entries,
      openAt: c.openAt.toISOString(),
      closesAt: c.closesAt.toISOString(),
      resultsAt: c.resultsAt.toISOString(),
      msToClose: c.closesAt.getTime() - now.getTime(),
      msToResults: c.resultsAt.getTime() - now.getTime(),
      recentWinners: c.winners.map((w) => ({ rank: w.rank, username: w.username, prizeRaw: w.prizeRaw.toString() })),
    }));

    return NextResponse.json({ contests: result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

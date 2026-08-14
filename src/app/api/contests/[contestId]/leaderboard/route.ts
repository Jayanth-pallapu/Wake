import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateBotEntries, PARTICIPANT_COUNTS, computePrizes, CONTEST_TIERS } from '@/lib/contest';
import type { ContestPeriod } from '@/lib/contest';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ contestId: string }> }) {
  try {
    const { contestId } = await params;
    const contest = await db.contest.findUnique({ where: { id: contestId } });
    if (!contest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const cfg = CONTEST_TIERS.find((t) => t.tier === contest.tier);
    if (!cfg) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

    // Real entries from DB
    const realEntries = await db.contestEntry.findMany({
      where: { contestId },
      orderBy: { wagerRaw: 'desc' },
      take: 20,
    });

    // Fill remainder with bots (top 100 visible)
    const displayCount = 100;
    const botsNeeded = Math.max(0, displayCount - realEntries.length);
    const bots = generateBotEntries(botsNeeded, contest.tier, contestId);

    // Merge and sort
    const allEntries = [
      ...realEntries.map((e) => ({
        username: e.username,
        wagerRaw: e.wagerRaw.toString(),
        isReal: true,
        avatarSeed: e.userId ?? e.id,
      })),
      ...bots.map((b) => ({
        username: b.username,
        wagerRaw: b.wagerRaw.toString(),
        isReal: false,
        avatarSeed: b.avatarSeed,
      })),
    ].sort((a, b) => (BigInt(b.wagerRaw) > BigInt(a.wagerRaw) ? 1 : -1));

    // Compute prize for each rank
    const prizeMap = computePrizes(contest.prizePoolRaw, cfg);
    const leaderboard = allEntries.slice(0, displayCount).map((e, i) => ({
      rank: i + 1,
      ...e,
      prizeRaw: (prizeMap[i]?.prizeRaw ?? 0n).toString(),
    }));

    const participantCount = PARTICIPANT_COUNTS[contest.tier]?.[contest.period as ContestPeriod] ?? 0;
    return NextResponse.json({ leaderboard, totalParticipants: participantCount });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

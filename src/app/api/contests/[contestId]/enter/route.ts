import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ contestId: string }> }) {
  try {
    const user = await requireUser();
    const { contestId } = await params;

    const contest = await db.contest.findUnique({ where: { id: contestId } });
    if (!contest) return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    if (contest.status !== 'open') return NextResponse.json({ error: 'Contest is closed' }, { status: 400 });
    if (new Date() > contest.closesAt) return NextResponse.json({ error: 'Entry period closed' }, { status: 400 });

    // Check if already entered
    const existing = await db.contestEntry.findUnique({
      where: { contestId_userId: { contestId, userId: user.id } },
    });
    if (existing) return NextResponse.json({ error: 'Already entered', entry: { id: existing.id, username: existing.username } });

    // Deduct entry fee from USDT wallet
    const wallet = await db.wallet.findUnique({
      where: { userId_asset: { userId: user.id, asset: 'USDT' } },
    });
    if (!wallet || wallet.balance < contest.entryFeeRaw) {
      return NextResponse.json({ error: 'Insufficient USDT balance' }, { status: 400 });
    }

    // Deduct + create entry atomically
    const [entry] = await db.$transaction([
      db.contestEntry.create({
        data: { contestId, userId: user.id, username: user.username, wagerRaw: 0n },
      }),
      db.wallet.update({
        where: { userId_asset: { userId: user.id, asset: 'USDT' } },
        data: { balance: { decrement: contest.entryFeeRaw } },
      }),
      db.walletLedger.create({
        data: {
          userId: user.id, asset: 'USDT',
          amountRaw: -contest.entryFeeRaw,
          balanceAfterRaw: wallet.balance - contest.entryFeeRaw,
          transactionType: 'BET',
          note: `Contest $${contest.tier} ${contest.period} entry`,
          reference: contestId,
        },
      }),
    ]);

    return NextResponse.json({ ok: true, entry: { id: entry.id, username: entry.username } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Login required' }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

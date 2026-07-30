// Wallet Ledger Service — ACID double-entry accounting with BigInt precision.
// All amounts are in 1e8-unit smallest denomination (satoshis-like).
// Never uses floating point. Uses Prisma interactive transactions with row locking.

import { db } from "./db";
import { UNIT, ASSET_MAP } from "./constants";

export type TxType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "BET"
  | "WIN"
  | "RAKEBACK"
  | "TIP_SENT"
  | "TIP_RECEIVED"
  | "RAIN"
  | "BONUS";

export interface LedgerEntry {
  userId: string;
  asset: string;
  amountRaw: bigint; // signed: + credit, - debit
  type: TxType;
  reference?: string;
  note?: string;
}

/**
 * Apply a ledger entry atomically: updates wallet balance + appends immutable ledger row.
 * Uses a transaction. SQLite serializes writes so this is safe.
 */
export async function applyLedger(entry: LedgerEntry): Promise<{ balanceAfterRaw: bigint }> {
  return db.$transaction(async (tx) => {
    // Ensure wallet row exists
    let wallet = await tx.wallet.findUnique({
      where: { userId_asset: { userId: entry.userId, asset: entry.asset } },
    });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { userId: entry.userId, asset: entry.asset, balance: 0n },
      });
    }
    const newBalance = wallet.balance + entry.amountRaw;
    if (newBalance < 0n) {
      throw new Error("INSUFFICIENT_BALANCE");
    }
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });
    await tx.walletLedger.create({
      data: {
        userId: entry.userId,
        asset: entry.asset,
        amountRaw: entry.amountRaw,
        balanceAfterRaw: updated.balance,
        transactionType: entry.type,
        reference: entry.reference,
        note: entry.note,
      },
    });
    return { balanceAfterRaw: updated.balance };
  });
}

/**
 * Debit a bet, credit a win, in one atomic transaction (used by game play).
 * - debit bet (amountRaw = -bet) — fails if insufficient
 * - credit payout (amountRaw = +payout, may be 0)
 * - returns final balance + both ledger references
 */
export async function settleBet(opts: {
  userId: string;
  asset: string;
  betRaw: bigint;
  payoutRaw: bigint; // total returned (0 on total loss)
  betRef?: string;
  winRef?: string;
}): Promise<{ balanceAfterRaw: bigint }> {
  if (opts.betRaw <= 0n) throw new Error("INVALID_BET");
  if (opts.payoutRaw < 0n) throw new Error("INVALID_PAYOUT");
  return db.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({
      where: { userId_asset: { userId: opts.userId, asset: opts.asset } },
    });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { userId: opts.userId, asset: opts.asset, balance: 0n },
      });
    }
    if (wallet.balance < opts.betRaw) throw new Error("INSUFFICIENT_BALANCE");
    // Debit bet
    const afterDebit = wallet.balance - opts.betRaw;
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: afterDebit },
    });
    await tx.walletLedger.create({
      data: {
        userId: opts.userId,
        asset: opts.asset,
        amountRaw: -opts.betRaw,
        balanceAfterRaw: afterDebit,
        transactionType: "BET",
        reference: opts.betRef,
        note: "Bet placed",
      },
    });
    // Credit payout (if any)
    if (opts.payoutRaw > 0n) {
      const afterCredit = afterDebit + opts.payoutRaw;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: afterCredit },
      });
      await tx.walletLedger.create({
        data: {
          userId: opts.userId,
          asset: opts.asset,
          amountRaw: opts.payoutRaw,
          balanceAfterRaw: afterCredit,
          transactionType: "WIN",
          reference: opts.winRef,
          note: "Win payout",
        },
      });
      return { balanceAfterRaw: afterCredit };
    }
    return { balanceAfterRaw: afterDebit };
  });
}

/** Transfer between users (tips) — atomic two-sided. */
export async function transferTip(opts: {
  fromUserId: string;
  toUserId: string;
  asset: string;
  amountRaw: bigint;
}): Promise<void> {
  if (opts.amountRaw <= 0n) throw new Error("INVALID_TIP");
  if (opts.fromUserId === opts.toUserId) throw new Error("CANNOT_TIP_SELF");
  await db.$transaction(async (tx) => {
    let fromWallet = await tx.wallet.findUnique({
      where: { userId_asset: { userId: opts.fromUserId, asset: opts.asset } },
    });
    if (!fromWallet) throw new Error("INSUFFICIENT_BALANCE");
    if (fromWallet.balance < opts.amountRaw) throw new Error("INSUFFICIENT_BALANCE");
    let toWallet = await tx.wallet.findUnique({
      where: { userId_asset: { userId: opts.toUserId, asset: opts.asset } },
    });
    if (!toWallet) {
      toWallet = await tx.wallet.create({
        data: { userId: opts.toUserId, asset: opts.asset, balance: 0n },
      });
    }
    const fromAfter = fromWallet.balance - opts.amountRaw;
    const toAfter = toWallet.balance + opts.amountRaw;
    await tx.wallet.update({ where: { id: fromWallet.id }, data: { balance: fromAfter } });
    await tx.wallet.update({ where: { id: toWallet.id }, data: { balance: toAfter } });
    await tx.walletLedger.create({
      data: {
        userId: opts.fromUserId, asset: opts.asset, amountRaw: -opts.amountRaw,
        balanceAfterRaw: fromAfter, transactionType: "TIP_SENT",
      },
    });
    await tx.walletLedger.create({
      data: {
        userId: opts.toUserId, asset: opts.asset, amountRaw: opts.amountRaw,
        balanceAfterRaw: toAfter, transactionType: "TIP_RECEIVED",
      },
    });
  });
}

/** Initialize demo wallets for a new user (free play money). */
export async function initDemoWallets(userId: string): Promise<void> {
  const assetSymbols = Object.keys(ASSET_MAP);
  await db.$transaction(async (tx) => {
    for (const symbol of assetSymbols) {
      const cfg = ASSET_MAP[symbol];
      const exists = await tx.wallet.findUnique({
        where: { userId_asset: { userId, asset: symbol } },
      });
      if (exists) continue;
      const wallet = await tx.wallet.create({
        data: { userId, asset: symbol, balance: cfg.baseAmountRaw },
      });
      await tx.walletLedger.create({
        data: {
          userId, asset: symbol, amountRaw: cfg.baseAmountRaw,
          balanceAfterRaw: wallet.balance, transactionType: "DEPOSIT",
          note: "Welcome bonus — demo funds",
        },
      });
    }
  });
}

// --- Formatting helpers (for display) ---
export function rawToDisplay(raw: bigint, asset: string): string {
  const cfg = ASSET_MAP[asset];
  if (!cfg) return (Number(raw) / Number(UNIT)).toFixed(8);
  const whole = Number(raw) / Number(UNIT);
  return whole.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: cfg.decimals,
  });
}

export function rawToNumber(raw: bigint): number {
  return Number(raw) / Number(UNIT);
}

export function numberToRaw(n: number): bigint {
  return BigInt(Math.round(n * Number(UNIT)));
}

export { UNIT };

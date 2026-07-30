// Seed rotation: provably-fair server seed lifecycle.
// On rotate: current pair → prev (revealed), generate new pair, reset nonce.

import { db } from "./db";
import { generateServerSeed, generateClientSeed, hashServerSeed } from "./provably-fair";

export async function rotateServerSeed(userId: string): Promise<{
  prevServerSeed: string | null;
  prevServerSeedHash: string | null;
  prevClientSeed: string | null;
  prevNonce: number | null;
  newServerSeedHash: string;
}> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");
  const newServerSeed = generateServerSeed();
  const newServerSeedHash = hashServerSeed(newServerSeed);
  await db.user.update({
    where: { id: userId },
    data: {
      prevServerSeed: user.serverSeed,
      prevServerSeedHash: user.serverSeedHash,
      prevClientSeed: user.clientSeed,
      prevNonce: user.nonce,
      serverSeed: newServerSeed,
      serverSeedHash: newServerSeedHash,
      nonce: 0,
    },
  });
  return {
    prevServerSeed: user.serverSeed,
    prevServerSeedHash: user.serverSeedHash,
    prevClientSeed: user.clientSeed,
    prevNonce: user.nonce,
    newServerSeedHash,
  };
}

export async function updateClientSeed(userId: string, clientSeed: string): Promise<void> {
  const trimmed = clientSeed.trim().slice(0, 64);
  if (!trimmed) throw new Error("INVALID_CLIENT_SEED");
  await db.user.update({
    where: { id: userId },
    data: { clientSeed: trimmed, nonce: 0 },
  });
}

/** Bump nonce after each bet (atomic via updateMany returning). */
export async function bumpNonce(userId: string): Promise<number> {
  const updated = await db.user.update({
    where: { id: userId },
    data: { nonce: { increment: 1 } },
    select: { nonce: true, serverSeed: true, clientSeed: true },
  });
  return updated.nonce;
}

export async function ensureSeeds(userId: string): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");
  if (!user.serverSeed || !user.clientSeed) {
    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const clientSeed = user.clientSeed || generateClientSeed();
    await db.user.update({
      where: { id: userId },
      data: { serverSeed, serverSeedHash, clientSeed, nonce: 0 },
    });
  }
}

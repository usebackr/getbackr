import crypto from 'crypto';
import { db } from '@/lib/db';
import { verificationTokens } from '@/db/schema/verificationTokens';
import { eq, and, gt } from 'drizzle-orm';

const TOKEN_TTL_MINUTES = 24 * 60; // 24 hours

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function storeVerificationToken(token: string, userId: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + TOKEN_TTL_MINUTES);

  await db.insert(verificationTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });
}

export async function consumeVerificationToken(token: string): Promise<string | null> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const now = new Date();

  const [record] = await db
    .select({ userId: verificationTokens.userId })
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.tokenHash, tokenHash),
        eq(verificationTokens.used, false),
        gt(verificationTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (record) {
    await db
      .update(verificationTokens)
      .set({ used: true })
      .where(eq(verificationTokens.tokenHash, tokenHash));
    return record.userId;
  }

  return null;
}

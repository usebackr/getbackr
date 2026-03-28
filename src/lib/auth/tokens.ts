import crypto from 'crypto';
import { getRedis } from '@/lib/redis';

const TOKEN_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function storeVerificationToken(token: string, userId: string): Promise<void> {
  const redis = getRedis();
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  await redis.set(`email_verify:${hashedToken}`, userId, 'EX', TOKEN_TTL_SECONDS);
}

export async function consumeVerificationToken(token: string): Promise<string | null> {
  const redis = getRedis();
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const key = `email_verify:${hashedToken}`;
  const userId = await redis.get(key);
  if (userId) {
    await redis.del(key);
  }
  return userId;
}

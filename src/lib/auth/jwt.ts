import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { refreshTokens } from '@/db/schema/refreshTokens';
import { eq, and, gt } from 'drizzle-orm';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET ?? 'access-secret-change-me';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET ?? 'refresh-secret-change-me';

const ACCESS_TOKEN_TTL = '24h';
const REFRESH_TOKEN_TTL_DAYS = 7;

export interface JwtPayload {
  sub: string; // userId
  type: 'access' | 'refresh';
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'access' }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, REFRESH_TOKEN_SECRET, {
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;
}

/** Store refresh token hash in Database with 7-day TTL */
export async function storeRefreshToken(token: string, userId: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });
}

/** Look up userId by refresh token; returns null if not found / expired / revoked */
export async function getRefreshTokenUserId(token: string): Promise<string | null> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const now = new Date();

  const [record] = await db
    .select({ userId: refreshTokens.userId })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        eq(refreshTokens.revoked, false),
        gt(refreshTokens.expiresAt, now),
      ),
    )
    .limit(1);

  return record ? record.userId : null;
}

/** Invalidate a refresh token by revoking it in the Database */
export async function invalidateRefreshToken(token: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

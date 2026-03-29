import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getRedis } from '@/lib/redis';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET ?? 'access-secret-change-me';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET ?? 'refresh-secret-change-me';

const ACCESS_TOKEN_TTL = '24h';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

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
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;
}

/** Store refresh token hash in Redis with 7-day TTL */
export async function storeRefreshToken(token: string, userId: string): Promise<void> {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const redis = getRedis();
  await redis.set(`refresh:${hash}`, userId, 'EX', REFRESH_TOKEN_TTL_SECONDS);
}

/** Look up userId by refresh token; returns null if not found / expired */
export async function getRefreshTokenUserId(token: string): Promise<string | null> {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const redis = getRedis();
  return redis.get(`refresh:${hash}`);
}

/** Invalidate a refresh token by deleting it from Redis */
export async function invalidateRefreshToken(token: string): Promise<void> {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const redis = getRedis();
  await redis.del(`refresh:${hash}`);
}

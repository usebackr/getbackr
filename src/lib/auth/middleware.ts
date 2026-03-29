import { NextRequest } from 'next/server';
import { verifyAccessToken, JwtPayload } from '@/lib/auth/jwt';

export interface AuthContext {
  userId: string;
}

/**
 * Validates the JWT from either the Authorization header (Bearer)
 * or the 'accessToken' cookie.
 * Returns the auth context on success, or null if missing/invalid.
 */
export function requireAuth(req: NextRequest): AuthContext | null {
  // 1. Try Authorization header
  const authHeader = req.headers.get('authorization');
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // 2. Try cookie if header is missing
  if (!token) {
    token = req.cookies.get('accessToken')?.value;
  }

  if (!token) {
    return null;
  }

  try {
    const payload: JwtPayload = verifyAccessToken(token);
    if (payload.type !== 'access' || !payload.sub) {
      return null;
    }
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

import { NextRequest } from 'next/server';
import { verifyAccessToken, JwtPayload } from '@/lib/auth/jwt';

export interface AuthContext {
  userId: string;
}

/**
 * Validates the Bearer JWT from the Authorization header.
 * Returns the auth context on success, or null if missing/invalid.
 */
export function requireAuth(req: NextRequest): AuthContext | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
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

import { NextRequest, NextResponse } from 'next/server';
import { invalidateRefreshToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (refreshToken) {
    try {
      await invalidateRefreshToken(refreshToken);
    } catch (err) {
      console.error('Failed to invalidate refresh token:', err);
    }
  }

  const response = NextResponse.json({ message: 'Logged out successfully' });

  // Clear cookies
  response.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
  response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });

  return response;
}

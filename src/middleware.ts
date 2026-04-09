import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET ?? 'access-secret-change-me';

async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload && payload.type === 'access';
  } catch (err) {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('accessToken')?.value;
  const { pathname } = req.nextUrl;

  // Protected routes
  const protectedPaths = ['/dashboard', '/campaigns/new', '/admin'];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // Auth pages (Redirect to dashboard if already logged in)
  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  let isValidToken = false;
  if (token) {
    isValidToken = await verifyToken(token);
  }

  // Case 1: Accessing protected route without a valid token
  if (isProtectedPath && !isValidToken) {
    const url = new URL('/login', req.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Case 2: Accessing auth pages with a valid token
  if (isAuthPath && isValidToken) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/campaigns/new/:path*',
    '/admin/:path*',
    '/admin',
    '/login',
    '/signup',
  ],
};

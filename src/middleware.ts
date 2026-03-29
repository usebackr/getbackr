import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('accessToken')?.value;
  const { pathname } = req.nextUrl;

  // Protected routes
  const protectedPaths = ['/dashboard', '/campaigns/new', '/admin'];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // Auth pages (Redirect to dashboard if already logged in)
  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath && !token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/campaigns/new/:path*', '/admin/:path*', '/admin', '/login', '/signup'],
};

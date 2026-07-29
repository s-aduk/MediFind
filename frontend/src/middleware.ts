import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/search'];

// Public routes that should redirect authenticated users
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Get the auth token from cookies
  // Since we're using localStorage on client, we'll check for a cookie
  // that can be set by the client for SSR detection
  const hasAuthCookie = request.cookies.has('idToken') ||
    request.cookies.has('medifind_auth');

  // If accessing protected route without auth cookie, redirect to login
  if (isProtectedRoute && !hasAuthCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth route with auth, redirect to search
  if (isAuthRoute && hasAuthCookie) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/search';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
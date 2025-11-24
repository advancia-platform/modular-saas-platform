import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const url = new URL(request.url);

  // Forward API requests to backend service based on environment
  if (url.pathname.startsWith('/api/')) {
    let backendBase;

    // Choose backend based on environment
    // Note: NODE_ENV is only 'development' | 'production' | 'test' in Next.js
    // Use custom env var for staging detection
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_IS_STAGING) {
      backendBase = process.env.BACKEND_URL_PROD;
    } else if (process.env.NEXT_PUBLIC_IS_STAGING === 'true') {
      backendBase = process.env.BACKEND_URL_STAGING;
    } else {
      // Default to local dev
      backendBase =
        process.env.BACKEND_URL_DEV ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        'http://localhost:4000';
    }

    const backendUrl = new URL(url.pathname + url.search, backendBase);
    return NextResponse.rewrite(backendUrl.toString());
  }

  // Set custom headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-url', request.url);

  // Optional site lockdown: redirect all pages to /auth/login except allowlist
  const lockdown = process.env.NEXT_PUBLIC_LOCKDOWN === 'true';
  if (lockdown) {
    const { pathname } = request.nextUrl;
    const allow = ['/auth', '/landing', '/faq', '/status', '/news', '/_next', '/favicon.ico'];
    const isAllowed = allow.some((p) => pathname.startsWith(p));
    if (!isAllowed) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

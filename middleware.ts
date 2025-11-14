/**
 * middleware.ts
 *
 * Next.js middleware for global security checks.
 * Runs on all requests at the edge (before reaching the server).
 *
 * Responsibilities:
 * 1. Validate JWT tokens on protected routes
 * 2. Apply security headers globally
 * 3. Enforce HTTPS in production
 * 4. Log security events
 *
 * CRITICAL: This runs BEFORE route handlers, so token validation
 * is the first layer of defense for protected routes.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Define protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/api/exchanges/',
  '/api/disputes/',
  '/api/ratings/',
  '/api/profiles/',
  '/api/toys/',
  '/api/messages/',
  '/dashboard',
  '/profile',
  '/chat',
];

/**
 * Define public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/password-reset',
  '/api/auth/',
  '/api/health',
  '/',
  '/about',
  '/privacy',
  '/terms',
];

/**
 * Extract JWT token from Authorization header
 */
function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Check if route is protected
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if route is public (bypass auth)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route));
}

/**
 * Validate JWT token format and expiration
 *
 * SECURITY NOTE: This does basic validation only.
 * Full validation (signature, claims) happens in route handlers with Supabase client.
 *
 * @param token - JWT token
 * @returns true if token appears valid
 */
function isValidJWT(token: string): boolean {
  try {
    // Basic JWT structure check: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload (without signature verification)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Check expiration
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return false; // Token expired
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extract client IP from request
 */
function getClientIP(request: NextRequest): string {
  // Trust Cloudflare, Vercel, and X-Forwarded-For headers
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  const xForwarded = request.headers.get('x-forwarded-for');
  if (xForwarded) return xForwarded.split(',')[0].trim();

  const xReal = request.headers.get('x-real-ip');
  if (xReal) return xReal;

  // Fallback to socket address (localhost in dev)
  return request.ip || '0.0.0.0';
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();

  // 1. Apply security headers globally
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self' https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https: wss:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "object-src 'none'; " +
      'upgrade-insecure-requests;'
  );
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // 2. Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production' && request.nextUrl.protocol === 'http:') {
    const secureUrl = new URL(request.url);
    secureUrl.protocol = 'https:';
    return NextResponse.redirect(secureUrl);
  }

  // 3. Check authentication on protected routes
  if (isProtectedRoute(pathname) && !isPublicRoute(pathname)) {
    const token = getToken(request);

    if (!token || !isValidJWT(token)) {
      // Redirect to login for page routes
      if (!pathname.startsWith('/api/')) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Return 401 for API routes
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // 4. Log security-relevant events
  const clientIP = getClientIP(request);

  // Log failed authentication attempts
  if (pathname.startsWith('/api/auth/login') && request.method === 'POST') {
    // Log will happen in route handler with full context
  }

  // Log suspicious patterns
  const suspiciousPatterns = ['../../../', '.../', 'admin', 'sql', 'union select', 'drop table'];
  const urlString = request.nextUrl.toString().toLowerCase();

  for (const pattern of suspiciousPatterns) {
    if (urlString.includes(pattern)) {
      console.warn('[SECURITY] Suspicious URL pattern detected', {
        pattern,
        url: request.nextUrl.pathname,
        ip: clientIP,
      });

      // Block obvious attacks
      if (
        pattern === '../../../' ||
        pattern === '.../' ||
        pattern === 'union select' ||
        pattern === 'drop table'
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
  }

  return response;
}

/**
 * Configure which routes middleware applies to
 *
 * PERFORMANCE NOTE: Middleware runs on every request.
 * Only apply to routes that need it to reduce latency.
 */
export const config = {
  // Match all routes except static files and _next internals
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

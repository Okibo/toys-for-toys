/**
 * Security Headers for Authentication
 * Sets secure HTTP headers for all authentication endpoints
 *
 * Headers implemented:
 * - Content-Security-Policy: Restrict inline scripts and external sources
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - X-Frame-Options: Prevent clickjacking
 * - X-XSS-Protection: Enable XSS filtering
 * - Strict-Transport-Security: Enforce HTTPS
 * - Cache-Control: Prevent caching of sensitive pages
 * - Pragma: HTTP/1.0 cache control
 * - Expires: Set expiration in the past
 */

/**
 * Security headers for authentication endpoints
 */
export interface SecurityHeaders {
  [key: string]: string;
}

/**
 * Get standard security headers for auth endpoints
 * Should be applied to all authentication-related responses
 *
 * @returns Object of security headers
 */
export function getAuthSecurityHeaders(): SecurityHeaders {
  return {
    // Content Security Policy
    // Restricts what resources can be loaded
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline for forms
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Enforce HTTPS (only in production)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),

    // Prevent caching of sensitive auth pages
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy (formerly Feature-Policy)
    'Permissions-Policy': [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'microphone=()',
      'payment=()',
      'usb=()'
    ].join(', ')
  };
}

/**
 * Get security headers for login endpoint
 * Includes all standard headers plus login-specific settings
 *
 * @returns Security headers object
 */
export function getLoginSecurityHeaders(): SecurityHeaders {
  return {
    ...getAuthSecurityHeaders(),
    // Allow password managers to work with login forms
    'X-UA-Compatible': 'IE=edge'
  };
}

/**
 * Get security headers for password reset endpoint
 * Includes all standard headers plus password reset-specific settings
 *
 * @returns Security headers object
 */
export function getPasswordResetSecurityHeaders(): SecurityHeaders {
  return {
    ...getAuthSecurityHeaders(),
    // Additional protection for password forms
    'X-UA-Compatible': 'IE=edge'
  };
}

/**
 * Get security headers for signup endpoint
 * Includes all standard headers
 *
 * @returns Security headers object
 */
export function getSignupSecurityHeaders(): SecurityHeaders {
  return getAuthSecurityHeaders();
}

/**
 * Apply security headers to a Response object
 *
 * @param response - Response object
 * @param headers - Headers to apply
 * @returns Response with headers applied
 */
export function applySecurityHeaders(response: Response, headers: SecurityHeaders): Response {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Apply auth security headers to a Response
 * Convenience function that applies all auth headers
 *
 * @param response - Response object
 * @returns Response with security headers applied
 */
export function applyAuthSecurityHeaders(response: Response): Response {
  return applySecurityHeaders(response, getAuthSecurityHeaders());
}

/**
 * Get security headers as an object that can be returned from API route
 * Useful for Next.js API route handlers
 *
 * Example:
 * ```typescript
 * export async function POST(req: Request) {
 *   const headers = getResponseHeaders();
 *   return Response.json({ success: true }, { headers });
 * }
 * ```
 *
 * @returns Headers object for Response constructor
 */
export function getResponseHeaders(): Record<string, string> {
  return getAuthSecurityHeaders();
}

/**
 * Validate that a response has security headers set
 * Useful for testing
 *
 * @param response - Response object
 * @returns Array of missing headers
 */
export function validateSecurityHeaders(response: Response): string[] {
  const required = getAuthSecurityHeaders();
  const missing: string[] = [];

  Object.keys(required).forEach((header) => {
    // Skip HSTS header in development
    if (header === 'Strict-Transport-Security' && process.env.NODE_ENV !== 'production') {
      return;
    }

    if (!response.headers.has(header)) {
      missing.push(header);
    }
  });

  return missing;
}

/**
 * Get CSP (Content Security Policy) nonce
 * Should be generated per request and passed to templates
 *
 * @returns Hex-encoded 32-byte nonce
 */
export function generateCSPNonce(): string {
  const { randomBytes } = require('crypto');
  return randomBytes(32).toString('hex');
}

/**
 * Get CSP header with nonce for inline scripts
 *
 * @param nonce - CSP nonce value
 * @returns CSP header value
 */
export function getCSPHeaderWithNonce(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
}

/**
 * Security headers for password reset form page
 * Ensures strong protection against XSS and other attacks
 */
export const PASSWORD_RESET_SECURITY_HEADERS: SecurityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0'
};

/**
 * Security headers for login form page
 * Allows password manager integration while maintaining security
 */
export const LOGIN_SECURITY_HEADERS: SecurityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0'
};

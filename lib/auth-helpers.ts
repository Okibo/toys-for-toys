/**
 * lib/auth-helpers.ts
 *
 * Helper utilities for authentication integration.
 * Provides utilities for extracting client IP, validating requests, etc.
 */

import { NextRequest } from 'next/server';

/**
 * Extract client IP from request headers
 *
 * Respects reverse proxy headers (Cloudflare, Vercel, nginx, etc.)
 *
 * @param request - Next.js request object
 * @returns Client IP address
 */
export function getClientIP(request: NextRequest | Request): string {
  // Check various headers in order of priority
  const headers = request.headers as Headers;
  const headerValue =
    headers.get?.('cf-connecting-ip') ||
    headers.get?.('x-forwarded-for') ||
    headers.get?.('x-real-ip');

  if (headerValue) {
    // x-forwarded-for can contain multiple IPs, take first one
    return headerValue.split(',')[0].trim();
  }

  // Fallback for Node.js requests (not available in edge runtime)
  try {
    const socketReq = request as unknown as Record<string, unknown>;
    return ((socketReq.socket as Record<string, unknown>)?.remoteAddress as string) || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Extract user agent from request headers
 *
 * @param request - Next.js request object
 * @returns User agent string
 */
export function getUserAgent(request: NextRequest | Request): string {
  const headers = request.headers as Headers;
  return headers.get?.('user-agent') || 'unknown';
}

/**
 * Validate email format
 *
 * Uses a simple regex - for production, consider using a library
 * like `email-validator` or checking during signup via code
 *
 * @param email - Email to validate
 * @returns true if email format is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize email (lowercase, trim whitespace)
 *
 * @param email - Raw email from user
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Check if error is due to invalid credentials
 *
 * Used to provide consistent error messages without leaking whether
 * email exists (email enumeration attack prevention)
 *
 * @param error - Error from Supabase auth
 * @returns true if error indicates invalid credentials
 */
export function isInvalidCredentialsError(error: unknown): boolean {
  if (!error) return false;

  const message = ((error as Record<string, unknown>).message || '').toString().toLowerCase();
  return (
    message.includes('invalid login credentials') ||
    message.includes('email not confirmed') ||
    message.includes('user not found')
  );
}

/**
 * Check if error is due to email already existing
 *
 * @param error - Error from Supabase auth
 * @returns true if error indicates user already exists
 */
export function isUserAlreadyExistsError(error: unknown): boolean {
  if (!error) return false;

  const message = ((error as Record<string, unknown>).message || '').toString().toLowerCase();
  return message.includes('user already registered') || message.includes('already exists');
}

/**
 * Get generic auth error message for client
 *
 * Never reveals whether email exists or password is incorrect
 * to prevent email enumeration attacks
 *
 * @param error - Error from Supabase
 * @param context - Context (login, signup, reset, etc.)
 * @returns User-friendly error message
 */
export function getGenericAuthErrorMessage(
  error: unknown,
  context: 'login' | 'signup' | 'reset' = 'login'
): string {
  const messages = {
    login: 'Invalid email or password. Please check and try again.',
    signup: 'Unable to create account. Please try again or contact support.',
    reset: 'Unable to process password reset. Please try again or contact support.',
  };

  if (!error) {
    return messages[context];
  }

  // Log actual error server-side for debugging
  const errorObj = error as Record<string, unknown>;
  console.error(`[AUTH_ERROR_${context.toUpperCase()}]`, {
    message: errorObj.message,
    code: errorObj.code,
    status: errorObj.status,
  });

  return messages[context];
}

/**
 * Validate password reset token format
 *
 * Tokens are typically long random strings from Supabase
 *
 * @param token - Token to validate
 * @returns true if token format appears valid
 */
export function isValidResetToken(token: string): boolean {
  // Token should be at least 20 characters
  return Boolean(token && token.length >= 20);
}

/**
 * Check if email is from a disposable/temporary email provider
 *
 * Optional security check to prevent abuse via throw-away emails
 * Comment out if you want to allow disposable emails
 *
 * @param email - Email address to check
 * @returns true if email is from a disposable provider
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com',
    'throwaway.email',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'temp-mail.org',
    'fakeinbox.com',
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}

/**
 * Check if password reset token is expired
 *
 * Tokens are valid for 1 hour (3600 seconds)
 *
 * @param tokenCreatedAt - Timestamp when token was created (ISO string)
 * @returns true if token has expired
 */
export function isTokenExpired(tokenCreatedAt: string): boolean {
  const TOKEN_EXPIRY_HOURS = 1;
  const createdAt = new Date(tokenCreatedAt).getTime();
  const now = Date.now();
  const expiryMs = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

  return now - createdAt > expiryMs;
}

/**
 * Generate a secure random string for use in tokens, nonces, etc.
 *
 * NOT for password generation (use crypto.getRandomValues for that)
 *
 * @param length - Length of random string (default 32)
 * @returns Hex-encoded random string
 */
export function generateRandomString(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

/**
 * Create rate limit error response
 *
 * @param status - Rate limit status
 * @returns Error object for returning to client
 */
export function createRateLimitError(status: RateLimitStatus) {
  return {
    error: 'Too many attempts',
    message: `Please try again in ${status.retryAfter} seconds`,
    retryAfter: status.retryAfter,
    resetAt: status.resetAt.toISOString(),
  };
}

/**
 * Log authentication event asynchronously
 *
 * Non-blocking: doesn't wait for log to complete
 * Critical failures are logged but don't block operations
 *
 * @param event - Event type
 * @param userId - User ID (optional)
 * @param details - Event details
 */
export function logAuthEvent(
  event: string,
  userId: string | null,
  details: Record<string, unknown>
): void {
  // Fire-and-forget logging
  // In production, this should write to audit_log table
  Promise.resolve().then(() => {
    console.log('[AUTH_EVENT]', {
      timestamp: new Date().toISOString(),
      event,
      userId: userId || 'anonymous',
      ...details,
    });
  });
}

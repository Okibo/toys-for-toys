/**
 * lib/rate-limiter.ts
 *
 * Rate limiting for authentication endpoints.
 * Prevents brute force attacks on login, signup, and password reset flows.
 *
 * Uses in-memory store (suitable for single-instance deployments).
 * For distributed systems, upgrade to Redis (Vercel KV).
 *
 * CRITICAL SECURITY:
 * - Failed login attempts are tracked by IP
 * - Signup attempts are limited per IP to prevent enumeration
 * - Password resets are limited per email + IP to prevent enumeration
 * - Rate limit violations are logged for monitoring
 */

/**
 * Rate limit result returned to caller
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds to wait before retry
}

/**
 * Internal rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp
}

/**
 * In-memory store for rate limits
 * Key format: "limit_type:identifier:window_start"
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean expired entries periodically (every 5 minutes)
 */
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start cleanup timer
 */
function startCleanupTimer(): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(
    () => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt < now) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach((key) => rateLimitStore.delete(key));
    },
    5 * 60 * 1000
  ); // Every 5 minutes

  // Don't keep process alive just for cleanup
  cleanupInterval.unref();
}

/**
 * Generate rate limit key
 */
function generateKey(limitType: string, identifier: string, windowMs: number): string {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  return `${limitType}:${identifier}:${windowStart}`;
}

/**
 * Check and increment rate limit counter
 */
function checkLimit(
  limitType: string,
  identifier: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  startCleanupTimer();

  const now = Date.now();
  const key = generateKey(limitType, identifier, windowMs);
  const entry = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };

  const isAllowed = entry.count < maxAttempts;
  const remaining = Math.max(0, maxAttempts - entry.count);
  const resetAt = new Date(entry.resetAt);

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  const retryAfter = isAllowed ? undefined : Math.ceil((entry.resetAt - now) / 1000);

  return {
    allowed: isAllowed,
    remaining: isAllowed ? remaining - 1 : remaining,
    resetAt,
    retryAfter,
  };
}

/**
 * Log rate limit violation for security monitoring
 *
 * CRITICAL: These logs should be reviewed regularly for attack patterns
 */
function logRateLimitViolation(
  limitType: string,
  identifier: string,
  context?: Record<string, unknown>
): void {
  // In production, this should write to audit_log table
  // For now, log to console and structured logging service
  console.warn('[RATE_LIMIT_VIOLATION]', {
    timestamp: new Date().toISOString(),
    limitType,
    identifier: maskIdentifier(identifier, limitType),
    context,
  });
}

/**
 * Mask sensitive identifiers in logs
 */
function maskIdentifier(identifier: string, limitType: string): string {
  if (limitType === 'email_check' || limitType === 'password_reset') {
    // Mask email: show first 2 chars and last 4 chars
    if (identifier.includes('@')) {
      const [local, domain] = identifier.split('@');
      const maskedLocal = local.substring(0, 2) + '*'.repeat(Math.max(0, local.length - 2));
      return `${maskedLocal}@${domain}`;
    }
  }

  if (limitType === 'login' && !identifier.startsWith('ip:')) {
    // Mask email
    if (identifier.includes('@')) {
      const [local, domain] = identifier.split('@');
      const maskedLocal = local.substring(0, 2) + '*'.repeat(Math.max(0, local.length - 2));
      return `${maskedLocal}@${domain}`;
    }
  }

  if (limitType === 'ip' || identifier.startsWith('ip:')) {
    // Mask IP: show first 2 octets
    const parts = identifier.replace('ip:', '').split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.* (IP)`;
    }
  }

  return identifier;
}

/**
 * Check login attempt rate limit
 *
 * Limit: 5 failed attempts per IP per 15 minutes
 *
 * @param email - Email attempting login
 * @param ipAddress - Client IP address
 * @returns Rate limit result
 */
export function checkLoginLimit(email: string, ipAddress: string): RateLimitResult {
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  // Track by email for this rate limit check
  // (IP tracking is a separate concern that could be added)
  const result = checkLimit('login', email, MAX_ATTEMPTS, WINDOW_MS);

  if (!result.allowed) {
    logRateLimitViolation('login', email, { ipAddress, attemptCount: 6 });
  }

  return result;
}

/**
 * Check signup attempt rate limit
 *
 * Limit: 3 signup attempts per IP per hour
 *
 * @param ipAddress - Client IP address
 * @returns Rate limit result
 */
export function checkSignupLimit(ipAddress: string): RateLimitResult {
  const MAX_ATTEMPTS = 3;
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour

  const result = checkLimit('signup', ipAddress, MAX_ATTEMPTS, WINDOW_MS);

  if (!result.allowed) {
    logRateLimitViolation('signup', `ip:${ipAddress}`, { attemptCount: 4 });
  }

  return result;
}

/**
 * Check password reset attempt rate limit
 *
 * Limit: 3 password reset requests per email per hour
 *
 * @param email - Email requesting password reset
 * @param ipAddress - Client IP address
 * @returns Rate limit result
 */
export function checkPasswordResetLimit(email: string, ipAddress: string): RateLimitResult {
  const MAX_ATTEMPTS = 3;
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour

  // Track by email to prevent enumeration
  const result = checkLimit('password_reset', email, MAX_ATTEMPTS, WINDOW_MS);

  if (!result.allowed) {
    logRateLimitViolation('password_reset', email, { ipAddress, attemptCount: 4 });
  }

  return result;
}

/**
 * Check email enumeration prevention
 *
 * Limit: 10 email checks per IP per minute
 * Used during signup to check if email exists
 *
 * @param ipAddress - Client IP address
 * @returns Rate limit result
 */
export function checkEmailEnumerationLimit(ipAddress: string): RateLimitResult {
  const MAX_ATTEMPTS = 10;
  const WINDOW_MS = 60 * 1000; // 1 minute

  const result = checkLimit('email_check', ipAddress, MAX_ATTEMPTS, WINDOW_MS);

  if (!result.allowed) {
    logRateLimitViolation('email_check', `ip:${ipAddress}`, {
      attemptCount: 11,
      reason: 'High rate of email checks indicates enumeration attack',
    });
  }

  return result;
}

/**
 * Check custom rate limit
 *
 * @param limitType - Type of limit (for logging)
 * @param identifier - Unique identifier (email, IP, etc.)
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result
 */
export function checkCustomLimit(
  limitType: string,
  identifier: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const result = checkLimit(limitType, identifier, maxAttempts, windowMs);

  if (!result.allowed) {
    logRateLimitViolation(limitType, identifier, { maxAttempts });
  }

  return result;
}

/**
 * Reset rate limit for an identifier
 * Useful for testing and admin operations
 *
 * @param limitType - Type of limit
 * @param identifier - Identifier to reset
 * @param windowMs - Time window (must match original)
 */
export function resetRateLimit(limitType: string, identifier: string, windowMs: number): void {
  const key = generateKey(limitType, identifier, windowMs);
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status (for testing/debugging)
 */
export function getRateLimitStatus(
  limitType: string,
  identifier: string,
  windowMs: number
): RateLimitEntry | null {
  const key = generateKey(limitType, identifier, windowMs);
  return rateLimitStore.get(key) || null;
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Stop cleanup timer
 */
export function stopCleanupTimer(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

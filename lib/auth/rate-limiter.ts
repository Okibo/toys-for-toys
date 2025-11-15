/**
 * Rate Limiter Module
 * Provides in-memory rate limiting for authentication endpoints
 *
 * Implementation:
 * - Signup: max 5 attempts per minute per IP address
 * - Email verification: max 3 attempts per 24 hours per email
 * - Uses sliding window algorithm
 * - Automatic cleanup of expired entries
 *
 * Note: For production, replace with Redis-based implementation
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
}

/**
 * In-memory rate limiter using sliding window approach
 * Each key has a count and reset time
 */
class InMemoryRateLimiter {
  private stores: Map<string, Map<string, RateLimitEntry>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    if (typeof globalThis !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Check rate limit for a key within a store
   *
   * @param storeName - Logical store name (e.g., 'signup', 'email-verify')
   * @param key - Unique identifier (e.g., IP address or email)
   * @param config - Rate limit configuration
   * @returns Whether the request is allowed
   */
  check(storeName: string, key: string, config: RateLimitConfig): boolean {
    const now = Date.now();

    // Ensure store exists
    if (!this.stores.has(storeName)) {
      this.stores.set(storeName, new Map());
    }

    const store = this.stores.get(storeName)!;

    // Get or create entry
    const entry = store.get(key) || {
      count: 0,
      resetTime: now + config.windowMs
    };

    // Check if reset time has passed
    if (now >= entry.resetTime) {
      // Reset the counter
      entry.count = 1;
      entry.resetTime = now + config.windowMs;
      store.set(key, entry);
      return true;
    }

    // Check if limit exceeded
    if (entry.count >= config.maxAttempts) {
      return false;
    }

    // Increment counter and update
    entry.count++;
    store.set(key, entry);
    return true;
  }

  /**
   * Get remaining attempts for a key
   *
   * @param storeName - Logical store name
   * @param key - Unique identifier
   * @param config - Rate limit configuration
   * @returns Number of remaining attempts, null if store/key doesn't exist
   */
  getRemaining(
    storeName: string,
    key: string,
    config: RateLimitConfig
  ): number | null {
    const store = this.stores.get(storeName);
    if (!store) return null;

    const entry = store.get(key);
    if (!entry) return config.maxAttempts;

    const now = Date.now();
    if (now >= entry.resetTime) {
      return config.maxAttempts;
    }

    return Math.max(0, config.maxAttempts - entry.count);
  }

  /**
   * Get reset time for a key
   *
   * @param storeName - Logical store name
   * @param key - Unique identifier
   * @returns Reset time as Unix timestamp, null if no entry
   */
  getResetTime(storeName: string, key: string): number | null {
    const store = this.stores.get(storeName);
    if (!store) return null;

    const entry = store.get(key);
    return entry?.resetTime || null;
  }

  /**
   * Reset a specific key (for admin purposes)
   *
   * @param storeName - Logical store name
   * @param key - Unique identifier
   */
  reset(storeName: string, key: string): void {
    const store = this.stores.get(storeName);
    if (store) {
      store.delete(key);
    }
  }

  /**
   * Clear all entries in a store
   *
   * @param storeName - Logical store name
   */
  clearStore(storeName: string): void {
    this.stores.delete(storeName);
  }

  /**
   * Clear all stores
   */
  clearAll(): void {
    this.stores.clear();
  }

  /**
   * Cleanup expired entries to prevent memory leaks
   * Called automatically every 5 minutes
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [storeName, store] of this.stores.entries()) {
      for (const [key, entry] of store.entries()) {
        // Delete if entry is expired and has no active requests
        if (now > entry.resetTime) {
          store.delete(key);
        }
      }

      // Delete empty stores
      if (store.size === 0) {
        this.stores.delete(storeName);
      }
    }
  }

  /**
   * Destroy limiter and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.stores.clear();
  }
}

// Singleton instance for the application
let limiterInstance: InMemoryRateLimiter | null = null;

/**
 * Get the global rate limiter instance
 *
 * @returns Rate limiter instance
 */
function getLimiter(): InMemoryRateLimiter {
  if (!limiterInstance) {
    limiterInstance = new InMemoryRateLimiter();
  }
  return limiterInstance;
}

/**
 * Rate limit configuration for signup endpoint
 * Max 5 attempts per minute per IP address
 */
export const SIGNUP_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60 * 1000 // 1 minute
};

/**
 * Rate limit configuration for email verification/resend
 * Max 3 attempts per 24 hours per email
 */
export const EMAIL_VERIFY_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * Rate limit configuration for password reset
 * Max 5 attempts per 15 minutes per IP
 */
export const PASSWORD_RESET_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000 // 15 minutes
};

/**
 * Check if a request is allowed under rate limit
 *
 * @param storeName - Rate limit store name (e.g., 'signup')
 * @param key - Unique identifier (e.g., IP address or email)
 * @param config - Rate limit configuration
 * @returns True if request is allowed, false if rate limited
 */
export function checkRateLimit(
  storeName: string,
  key: string,
  config: RateLimitConfig
): boolean {
  return getLimiter().check(storeName, key, config);
}

/**
 * Get remaining attempts for a key
 *
 * @param storeName - Rate limit store name
 * @param key - Unique identifier
 * @param config - Rate limit configuration
 * @returns Number of remaining attempts
 */
export function getRemainingAttempts(
  storeName: string,
  key: string,
  config: RateLimitConfig
): number {
  return getLimiter().getRemaining(storeName, key, config) ?? config.maxAttempts;
}

/**
 * Get when the rate limit will reset (Unix timestamp)
 *
 * @param storeName - Rate limit store name
 * @param key - Unique identifier
 * @returns Reset time as Unix timestamp, or null if no limit
 */
export function getRateLimitResetTime(
  storeName: string,
  key: string
): number | null {
  return getLimiter().getResetTime(storeName, key);
}

/**
 * Reset rate limit for a specific key
 * Use for admin/testing purposes
 *
 * @param storeName - Rate limit store name
 * @param key - Unique identifier
 */
export function resetRateLimit(storeName: string, key: string): void {
  getLimiter().reset(storeName, key);
}

/**
 * Clear all rate limit entries in a store
 *
 * @param storeName - Rate limit store name
 */
export function clearRateLimitStore(storeName: string): void {
  getLimiter().clearStore(storeName);
}

/**
 * Clear all rate limit entries (testing only)
 */
export function clearAllRateLimits(): void {
  getLimiter().clearAll();
}

/**
 * Destroy the rate limiter (testing/cleanup only)
 */
export function destroyRateLimiter(): void {
  if (limiterInstance) {
    limiterInstance.destroy();
    limiterInstance = null;
  }
}

/**
 * Helper function to check signup rate limit by IP
 *
 * @param ipAddress - Client IP address
 * @returns True if signup is allowed
 */
export function isSignupAllowed(ipAddress: string): boolean {
  return checkRateLimit('signup', ipAddress, SIGNUP_RATE_LIMIT);
}

/**
 * Helper function to check email verification rate limit
 *
 * @param email - User email address
 * @returns True if email verification is allowed
 */
export function isEmailVerifyAllowed(email: string): boolean {
  return checkRateLimit('email-verify', email, EMAIL_VERIFY_RATE_LIMIT);
}

/**
 * Helper function to check password reset rate limit
 *
 * @param ipAddress - Client IP address
 * @returns True if password reset is allowed
 */
export function isPasswordResetAllowed(ipAddress: string): boolean {
  return checkRateLimit('password-reset', ipAddress, PASSWORD_RESET_RATE_LIMIT);
}

/**
 * Get HTTP 429 response headers for rate limited requests
 *
 * @param storeName - Rate limit store name
 * @param key - Unique identifier
 * @param config - Rate limit configuration
 * @returns Headers object for 429 response
 */
export function getRateLimitHeaders(
  storeName: string,
  key: string,
  config: RateLimitConfig
): { [key: string]: string } {
  const resetTime = getRateLimitResetTime(storeName, key);
  const remaining = getRemainingAttempts(storeName, key, config);

  return {
    'X-RateLimit-Limit': config.maxAttempts.toString(),
    'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
    'X-RateLimit-Reset': (resetTime || Date.now() + config.windowMs).toString(),
    'Retry-After': resetTime
      ? Math.ceil((resetTime - Date.now()) / 1000).toString()
      : '60'
  };
}

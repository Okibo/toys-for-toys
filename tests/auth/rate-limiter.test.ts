/**
 * Rate Limiter Tests
 * Comprehensive test suite for rate limiting functionality
 */

import {
  checkRateLimit,
  getRemainingAttempts,
  getRateLimitResetTime,
  resetRateLimit,
  clearRateLimitStore,
  clearAllRateLimits,
  destroyRateLimiter,
  SIGNUP_RATE_LIMIT,
  EMAIL_VERIFY_RATE_LIMIT,
  PASSWORD_RESET_RATE_LIMIT,
  isSignupAllowed,
  isEmailVerifyAllowed,
  isPasswordResetAllowed,
  getRateLimitHeaders
} from '../../lib/auth/rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    clearAllRateLimits();
  });

  afterAll(() => {
    // Cleanup
    destroyRateLimiter();
  });

  describe('checkRateLimit() function', () => {
    it('should allow first request', () => {
      const allowed = checkRateLimit('test-store', 'key1', SIGNUP_RATE_LIMIT);
      expect(allowed).toBe(true);
    });

    it('should allow multiple requests under limit', () => {
      for (let i = 0; i < 5; i++) {
        const allowed = checkRateLimit('test-store', 'key1', SIGNUP_RATE_LIMIT);
        expect(allowed).toBe(true);
      }
    });

    it('should block request when limit exceeded', () => {
      // Make max attempts
      for (let i = 0; i < SIGNUP_RATE_LIMIT.maxAttempts; i++) {
        checkRateLimit('test-store', 'key1', SIGNUP_RATE_LIMIT);
      }

      // Next request should be blocked
      const allowed = checkRateLimit('test-store', 'key1', SIGNUP_RATE_LIMIT);
      expect(allowed).toBe(false);
    });

    it('should isolate rate limits by store name', () => {
      // Fill up store1
      for (let i = 0; i < SIGNUP_RATE_LIMIT.maxAttempts; i++) {
        checkRateLimit('store1', 'key1', SIGNUP_RATE_LIMIT);
      }

      // Store2 should not be affected
      const allowed = checkRateLimit('store2', 'key1', SIGNUP_RATE_LIMIT);
      expect(allowed).toBe(true);
    });

    it('should isolate rate limits by key', () => {
      // Fill up key1
      for (let i = 0; i < SIGNUP_RATE_LIMIT.maxAttempts; i++) {
        checkRateLimit('test-store', 'key1', SIGNUP_RATE_LIMIT);
      }

      // key2 should not be affected
      const allowed = checkRateLimit('test-store', 'key2', SIGNUP_RATE_LIMIT);
      expect(allowed).toBe(true);
    });

    it('should respect different window sizes', () => {
      const config1 = { maxAttempts: 2, windowMs: 100 };
      const config2 = { maxAttempts: 5, windowMs: 100 };

      // Check with config1 (limit 2)
      for (let i = 0; i < 2; i++) {
        checkRateLimit('test-store', 'key1', config1);
      }
      expect(checkRateLimit('test-store', 'key1', config1)).toBe(false);

      // Clear and check with config2 (limit 5)
      clearRateLimitStore('test-store');
      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit('test-store', 'key1', config2)).toBe(true);
      }
      expect(checkRateLimit('test-store', 'key1', config2)).toBe(false);
    });
  });

  describe('Signup rate limit', () => {
    it('should allow max 5 signup attempts per minute per IP', () => {
      const ip = '192.168.1.1';

      for (let i = 0; i < 5; i++) {
        const allowed = checkRateLimit('signup', ip, SIGNUP_RATE_LIMIT);
        expect(allowed).toBe(true);
      }

      // 6th attempt should be blocked
      const allowed = checkRateLimit('signup', ip, SIGNUP_RATE_LIMIT);
      expect(allowed).toBe(false);
    });

    it('should allow 5 attempts for different IPs simultaneously', () => {
      const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];

      for (const ip of ips) {
        const allowed = checkRateLimit('signup', ip, SIGNUP_RATE_LIMIT);
        expect(allowed).toBe(true);
      }
    });

    it('should have 60 second window for signup', () => {
      expect(SIGNUP_RATE_LIMIT.windowMs).toBe(60 * 1000);
    });
  });

  describe('Email verification rate limit', () => {
    it('should allow max 3 email verifications per 24 hours', () => {
      const email = 'user@example.com';

      for (let i = 0; i < 3; i++) {
        const allowed = checkRateLimit(
          'email-verify',
          email,
          EMAIL_VERIFY_RATE_LIMIT
        );
        expect(allowed).toBe(true);
      }

      // 4th attempt should be blocked
      const allowed = checkRateLimit(
        'email-verify',
        email,
        EMAIL_VERIFY_RATE_LIMIT
      );
      expect(allowed).toBe(false);
    });

    it('should have 24 hour window for email verification', () => {
      expect(EMAIL_VERIFY_RATE_LIMIT.windowMs).toBe(24 * 60 * 60 * 1000);
    });

    it('should allow different emails independently', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      // Fill up email1
      for (let i = 0; i < 3; i++) {
        checkRateLimit('email-verify', email1, EMAIL_VERIFY_RATE_LIMIT);
      }

      // email2 should still work
      const allowed = checkRateLimit(
        'email-verify',
        email2,
        EMAIL_VERIFY_RATE_LIMIT
      );
      expect(allowed).toBe(true);
    });
  });

  describe('Password reset rate limit', () => {
    it('should allow max 5 password reset attempts per 15 minutes', () => {
      const ip = '192.168.1.1';

      for (let i = 0; i < 5; i++) {
        const allowed = checkRateLimit(
          'password-reset',
          ip,
          PASSWORD_RESET_RATE_LIMIT
        );
        expect(allowed).toBe(true);
      }

      // 6th attempt should be blocked
      const allowed = checkRateLimit(
        'password-reset',
        ip,
        PASSWORD_RESET_RATE_LIMIT
      );
      expect(allowed).toBe(false);
    });

    it('should have 15 minute window for password reset', () => {
      expect(PASSWORD_RESET_RATE_LIMIT.windowMs).toBe(15 * 60 * 1000);
    });
  });

  describe('getRemainingAttempts() function', () => {
    it('should return max attempts for new key', () => {
      const remaining = getRemainingAttempts(
        'test-store',
        'new-key',
        SIGNUP_RATE_LIMIT
      );
      expect(remaining).toBe(SIGNUP_RATE_LIMIT.maxAttempts);
    });

    it('should decrease remaining attempts with each request', () => {
      const key = 'test-key';

      let remaining = getRemainingAttempts('test-store', key, SIGNUP_RATE_LIMIT);
      expect(remaining).toBe(5);

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      remaining = getRemainingAttempts('test-store', key, SIGNUP_RATE_LIMIT);
      expect(remaining).toBe(4);

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      remaining = getRemainingAttempts('test-store', key, SIGNUP_RATE_LIMIT);
      expect(remaining).toBe(3);
    });

    it('should return 0 when limit exceeded', () => {
      const key = 'test-key';

      for (let i = 0; i < SIGNUP_RATE_LIMIT.maxAttempts; i++) {
        checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      }

      const remaining = getRemainingAttempts('test-store', key, SIGNUP_RATE_LIMIT);
      expect(remaining).toBe(0);
    });
  });

  describe('getRateLimitResetTime() function', () => {
    it('should return reset time after first request', () => {
      const key = 'test-key';

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      const resetTime = getRateLimitResetTime('test-store', key);

      expect(resetTime).not.toBeNull();
      expect(typeof resetTime).toBe('number');
      expect(resetTime! > Date.now()).toBe(true);
    });

    it('should return null for non-existent key', () => {
      const resetTime = getRateLimitResetTime('test-store', 'non-existent');
      expect(resetTime).toBeNull();
    });

    it('should return same reset time for subsequent requests in window', () => {
      const key = 'test-key';

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      const resetTime1 = getRateLimitResetTime('test-store', key);

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      const resetTime2 = getRateLimitResetTime('test-store', key);

      expect(resetTime1).toBe(resetTime2);
    });

    it('should be approximately window duration in future', () => {
      const key = 'test-key';
      const now = Date.now();

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      const resetTime = getRateLimitResetTime('test-store', key)!;

      const duration = resetTime - now;
      // Allow 100ms tolerance
      expect(duration).toBeGreaterThan(SIGNUP_RATE_LIMIT.windowMs - 100);
      expect(duration).toBeLessThanOrEqual(SIGNUP_RATE_LIMIT.windowMs);
    });
  });

  describe('resetRateLimit() function', () => {
    it('should reset rate limit for a key', () => {
      const key = 'test-key';

      // Fill up the limit
      for (let i = 0; i < SIGNUP_RATE_LIMIT.maxAttempts; i++) {
        checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      }

      // Verify limit is exceeded
      expect(checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT)).toBe(false);

      // Reset the limit
      resetRateLimit('test-store', key);

      // Should be allowed again
      expect(checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT)).toBe(true);
    });

    it('should reset remaining attempts to max', () => {
      const key = 'test-key';

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      expect(getRemainingAttempts('test-store', key, SIGNUP_RATE_LIMIT)).toBe(4);

      resetRateLimit('test-store', key);
      expect(getRemainingAttempts('test-store', key, SIGNUP_RATE_LIMIT)).toBe(5);
    });

    it('should not affect other keys in same store', () => {
      const key1 = 'key1';
      const key2 = 'key2';

      // Fill up key1
      for (let i = 0; i < SIGNUP_RATE_LIMIT.maxAttempts; i++) {
        checkRateLimit('test-store', key1, SIGNUP_RATE_LIMIT);
      }

      // Use one attempt for key2
      checkRateLimit('test-store', key2, SIGNUP_RATE_LIMIT);

      // Reset key1
      resetRateLimit('test-store', key1);

      // key2 should be unaffected
      expect(getRemainingAttempts('test-store', key2, SIGNUP_RATE_LIMIT)).toBe(4);
    });
  });

  describe('clearRateLimitStore() function', () => {
    it('should clear all entries in a store', () => {
      const key1 = 'key1';
      const key2 = 'key2';

      // Fill up key1
      for (let i = 0; i < SIGNUP_RATE_LIMIT.maxAttempts; i++) {
        checkRateLimit('test-store', key1, SIGNUP_RATE_LIMIT);
      }

      // Use key2
      checkRateLimit('test-store', key2, SIGNUP_RATE_LIMIT);

      // Clear store
      clearRateLimitStore('test-store');

      // Both keys should be reset
      expect(checkRateLimit('test-store', key1, SIGNUP_RATE_LIMIT)).toBe(true);
      expect(checkRateLimit('test-store', key2, SIGNUP_RATE_LIMIT)).toBe(true);
    });

    it('should not affect other stores', () => {
      const key = 'test-key';

      // Fill up store1
      for (let i = 0; i < SIGNUP_RATE_LIMIT.maxAttempts; i++) {
        checkRateLimit('store1', key, SIGNUP_RATE_LIMIT);
      }

      // Use store2
      checkRateLimit('store2', key, SIGNUP_RATE_LIMIT);

      // Clear store1
      clearRateLimitStore('store1');

      // store1 should be reset, store2 should remain
      expect(checkRateLimit('store1', key, SIGNUP_RATE_LIMIT)).toBe(true);
      expect(getRemainingAttempts('store2', key, SIGNUP_RATE_LIMIT)).toBe(4);
    });
  });

  describe('clearAllRateLimits() function', () => {
    it('should clear all rate limits', () => {
      const key = 'test-key';

      // Fill up multiple stores
      for (let i = 0; i < SIGNUP_RATE_LIMIT.maxAttempts; i++) {
        checkRateLimit('store1', key, SIGNUP_RATE_LIMIT);
        checkRateLimit('store2', key, SIGNUP_RATE_LIMIT);
      }

      // Clear all
      clearAllRateLimits();

      // All should be reset
      expect(getRemainingAttempts('store1', key, SIGNUP_RATE_LIMIT)).toBe(5);
      expect(getRemainingAttempts('store2', key, SIGNUP_RATE_LIMIT)).toBe(5);
    });
  });

  describe('Helper functions', () => {
    describe('isSignupAllowed()', () => {
      it('should check signup rate limit by IP', () => {
        const ip = '192.168.1.1';

        for (let i = 0; i < 5; i++) {
          expect(isSignupAllowed(ip)).toBe(true);
        }

        expect(isSignupAllowed(ip)).toBe(false);
      });
    });

    describe('isEmailVerifyAllowed()', () => {
      it('should check email verify rate limit', () => {
        const email = 'user@example.com';

        for (let i = 0; i < 3; i++) {
          expect(isEmailVerifyAllowed(email)).toBe(true);
        }

        expect(isEmailVerifyAllowed(email)).toBe(false);
      });
    });

    describe('isPasswordResetAllowed()', () => {
      it('should check password reset rate limit by IP', () => {
        const ip = '192.168.1.1';

        for (let i = 0; i < 5; i++) {
          expect(isPasswordResetAllowed(ip)).toBe(true);
        }

        expect(isPasswordResetAllowed(ip)).toBe(false);
      });
    });
  });

  describe('getRateLimitHeaders() function', () => {
    it('should return rate limit headers', () => {
      const key = 'test-key';

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      const headers = getRateLimitHeaders('test-store', key, SIGNUP_RATE_LIMIT);

      expect(headers).toHaveProperty('X-RateLimit-Limit');
      expect(headers).toHaveProperty('X-RateLimit-Remaining');
      expect(headers).toHaveProperty('X-RateLimit-Reset');
      expect(headers).toHaveProperty('Retry-After');
    });

    it('should include correct limit value', () => {
      const key = 'test-key';

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      const headers = getRateLimitHeaders('test-store', key, SIGNUP_RATE_LIMIT);

      expect(headers['X-RateLimit-Limit']).toBe('5');
    });

    it('should decrease remaining count', () => {
      const key = 'test-key';

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      const headers1 = getRateLimitHeaders('test-store', key, SIGNUP_RATE_LIMIT);

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      const headers2 = getRateLimitHeaders('test-store', key, SIGNUP_RATE_LIMIT);

      expect(parseInt(headers1['X-RateLimit-Remaining'])).toBeGreaterThan(
        parseInt(headers2['X-RateLimit-Remaining'])
      );
    });

    it('should include Retry-After value', () => {
      const key = 'test-key';

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);
      const headers = getRateLimitHeaders('test-store', key, SIGNUP_RATE_LIMIT);

      const retryAfter = parseInt(headers['Retry-After']);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe('Multiple stores and keys concurrency', () => {
    it('should handle multiple stores simultaneously', () => {
      for (let store = 1; store <= 5; store++) {
        for (let attempt = 0; attempt < 5; attempt++) {
          const allowed = checkRateLimit(
            `store${store}`,
            'key1',
            SIGNUP_RATE_LIMIT
          );
          expect(allowed).toBe(true);
        }
      }
    });

    it('should handle multiple keys per store', () => {
      for (let key = 1; key <= 10; key++) {
        const allowed = checkRateLimit(
          'test-store',
          `key${key}`,
          SIGNUP_RATE_LIMIT
        );
        expect(allowed).toBe(true);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string as key', () => {
      const allowed = checkRateLimit('test-store', '', SIGNUP_RATE_LIMIT);
      expect(allowed).toBe(true);
    });

    it('should handle very long key strings', () => {
      const longKey = 'k'.repeat(10000);
      const allowed = checkRateLimit('test-store', longKey, SIGNUP_RATE_LIMIT);
      expect(allowed).toBe(true);
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'key!@#$%^&*()[]{}';
      const allowed = checkRateLimit('test-store', specialKey, SIGNUP_RATE_LIMIT);
      expect(allowed).toBe(true);
    });

    it('should be idempotent for read operations', () => {
      const key = 'test-key';

      checkRateLimit('test-store', key, SIGNUP_RATE_LIMIT);

      const remaining1 = getRemainingAttempts(
        'test-store',
        key,
        SIGNUP_RATE_LIMIT
      );
      const remaining2 = getRemainingAttempts(
        'test-store',
        key,
        SIGNUP_RATE_LIMIT
      );

      expect(remaining1).toBe(remaining2);
    });
  });
});

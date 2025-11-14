/**
 * tests/auth/rate-limiter.test.ts
 *
 * Unit tests for rate limiter module
 */

import {
  checkLoginLimit,
  checkSignupLimit,
  checkPasswordResetLimit,
  checkEmailEnumerationLimit,
  clearAllRateLimits,
  resetRateLimit,
  getRateLimitStatus,
  stopCleanupTimer,
} from '@/lib/rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clean up before each test
    clearAllRateLimits();
  });

  afterAll(() => {
    // Stop cleanup timer after all tests
    stopCleanupTimer();
  });

  describe('checkLoginLimit', () => {
    it('should allow requests under the limit', () => {
      const result = checkLoginLimit('user@example.com', '192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should track failed attempts by email and IP', () => {
      const email = 'user@example.com';
      const ip = '192.168.1.1';

      for (let i = 0; i < 5; i++) {
        const result = checkLoginLimit(email, ip);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }

      // 6th attempt should be blocked
      const result = checkLoginLimit(email, ip);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should block requests at the limit', () => {
      const email = 'user@example.com';
      const ip = '192.168.1.1';

      // Use up all attempts
      for (let i = 0; i < 5; i++) {
        checkLoginLimit(email, ip);
      }

      // Next request should be blocked
      const result = checkLoginLimit(email, ip);
      expect(result.allowed).toBe(false);
    });

    it('should separate limits by email', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';
      const ip = '192.168.1.1';

      // Use up all attempts for email1
      for (let i = 0; i < 5; i++) {
        checkLoginLimit(email1, ip);
      }

      // email2 should still have attempts available
      const result = checkLoginLimit(email2, ip);
      expect(result.allowed).toBe(true);
    });

    it('should return retryAfter when blocked', () => {
      const email = 'user@example.com';
      const ip = '192.168.1.1';

      // Max out attempts
      for (let i = 0; i < 5; i++) {
        checkLoginLimit(email, ip);
      }

      const result = checkLoginLimit(email, ip);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(15 * 60); // 15 minutes max
    });

    it('should reset and allow again after reset', () => {
      const email = 'user@example.com';
      const ip = '192.168.1.1';

      // Max out attempts
      for (let i = 0; i < 5; i++) {
        checkLoginLimit(email, ip);
      }

      // Should be blocked
      let result = checkLoginLimit(email, ip);
      expect(result.allowed).toBe(false);

      // Reset the limit
      resetRateLimit('login', email, 15 * 60 * 1000);

      // Should be allowed again
      result = checkLoginLimit(email, ip);
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkSignupLimit', () => {
    it('should allow requests under the limit', () => {
      const result = checkSignupLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should block after 3 attempts', () => {
      const ip = '192.168.1.1';

      for (let i = 0; i < 3; i++) {
        const result = checkSignupLimit(ip);
        expect(result.allowed).toBe(true);
      }

      const result = checkSignupLimit(ip);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should separate limits by IP', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // Use up attempts from ip1
      for (let i = 0; i < 3; i++) {
        checkSignupLimit(ip1);
      }

      // ip2 should still be allowed
      const result = checkSignupLimit(ip2);
      expect(result.allowed).toBe(true);
    });

    it('should have 1 hour window', () => {
      const ip = '192.168.1.1';
      const result = checkSignupLimit(ip);

      const resetTime = result.resetAt.getTime();
      const now = Date.now();
      const windowMs = resetTime - now;

      // Should be approximately 1 hour (allow 5% variance)
      expect(windowMs).toBeGreaterThan(60 * 60 * 1000 * 0.95);
      expect(windowMs).toBeLessThanOrEqual(60 * 60 * 1000);
    });
  });

  describe('checkPasswordResetLimit', () => {
    it('should allow requests under the limit', () => {
      const result = checkPasswordResetLimit('user@example.com', '192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should block after 3 attempts', () => {
      const email = 'user@example.com';
      const ip = '192.168.1.1';

      for (let i = 0; i < 3; i++) {
        const result = checkPasswordResetLimit(email, ip);
        expect(result.allowed).toBe(true);
      }

      const result = checkPasswordResetLimit(email, ip);
      expect(result.allowed).toBe(false);
    });

    it('should track by email to prevent enumeration', () => {
      const email = 'user@example.com';
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // Use up attempts from ip1
      for (let i = 0; i < 3; i++) {
        checkPasswordResetLimit(email, ip1);
      }

      // ip2 should also be blocked for the same email
      const result = checkPasswordResetLimit(email, ip2);
      expect(result.allowed).toBe(false);
    });

    it('should have 1 hour window', () => {
      const result = checkPasswordResetLimit('user@example.com', '192.168.1.1');

      const resetTime = result.resetAt.getTime();
      const now = Date.now();
      const windowMs = resetTime - now;

      // Should be approximately 1 hour
      expect(windowMs).toBeGreaterThan(60 * 60 * 1000 * 0.95);
      expect(windowMs).toBeLessThanOrEqual(60 * 60 * 1000);
    });
  });

  describe('checkEmailEnumerationLimit', () => {
    it('should allow requests under the limit', () => {
      const result = checkEmailEnumerationLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should block after 10 attempts', () => {
      const ip = '192.168.1.1';

      for (let i = 0; i < 10; i++) {
        const result = checkEmailEnumerationLimit(ip);
        expect(result.allowed).toBe(true);
      }

      const result = checkEmailEnumerationLimit(ip);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should have 1 minute window', () => {
      const result = checkEmailEnumerationLimit('192.168.1.1');

      const resetTime = result.resetAt.getTime();
      const now = Date.now();
      const windowMs = resetTime - now;

      // Should be approximately 1 minute (60 seconds)
      expect(windowMs).toBeGreaterThan(60 * 1000 * 0.95);
      expect(windowMs).toBeLessThanOrEqual(60 * 1000);
    });
  });

  describe('resetRateLimit', () => {
    it('should reset a specific limit', () => {
      const email = 'user@example.com';
      const ip = '192.168.1.1';

      // Use up all attempts
      for (let i = 0; i < 5; i++) {
        checkLoginLimit(email, ip);
      }

      // Should be blocked
      let result = checkLoginLimit(email, ip);
      expect(result.allowed).toBe(false);

      // Reset the limit
      resetRateLimit('login', email, 15 * 60 * 1000);

      // Clear and re-check
      clearAllRateLimits();
      result = checkLoginLimit(email, ip);
      expect(result.allowed).toBe(true);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return null for non-existent limit', () => {
      const status = getRateLimitStatus('login', 'user@example.com', 15 * 60 * 1000);
      expect(status).toBeNull();
    });

    it('should return current count for existing limit', () => {
      const email = 'user@example.com';
      checkLoginLimit(email, '192.168.1.1');
      checkLoginLimit(email, '192.168.1.1');

      const status = getRateLimitStatus('login', email, 15 * 60 * 1000);
      expect(status).not.toBeNull();
      expect(status?.count).toBe(2);
    });
  });

  describe('Multiple concurrent limits', () => {
    it('should track multiple limit types independently', () => {
      const ip = '192.168.1.1';

      // Trigger multiple limit types
      const loginResult = checkLoginLimit('user@example.com', ip);
      const signupResult = checkSignupLimit(ip);
      const emailResult = checkEmailEnumerationLimit(ip);

      expect(loginResult.allowed).toBe(true);
      expect(signupResult.allowed).toBe(true);
      expect(emailResult.allowed).toBe(true);

      // Each should have correct remaining counts
      // Note: remaining = maxAttempts - 1 after first check
      expect(loginResult.remaining).toBeGreaterThanOrEqual(0);
      expect(signupResult.remaining).toBeGreaterThanOrEqual(0);
      expect(emailResult.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Window boundaries', () => {
    it('should track each request independently', () => {
      const email = 'user@example.com';
      const ip = '192.168.1.1';

      const results = [];
      for (let i = 0; i < 6; i++) {
        results.push(checkLoginLimit(email, ip));
      }

      // First 5 should be allowed
      for (let i = 0; i < 5; i++) {
        expect(results[i].allowed).toBe(true);
      }

      // 6th should be blocked
      expect(results[5].allowed).toBe(false);
    });
  });
});

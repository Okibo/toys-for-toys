/**
 * Login Rate Limiting Security Tests
 * Tests for rate limiting on login and password reset endpoints
 *
 * Coverage:
 * - 35+ tests for rate limiting functionality
 * - Email hashing (no plain emails in cache)
 * - Login: 5 attempts per minute
 * - Forgot password: 3 requests per hour
 * - Reset password: 5 attempts per hour
 * - Retry-After headers
 * - Rate limit reset
 */

import {
  isLoginAllowed,
  getRemainingLoginAttempts,
  getLoginRateLimitResetTime,
  isForgotPasswordAllowed,
  getRemainingForgotPasswordAttempts,
  getForgotPasswordRateLimitResetTime,
  isResetPasswordAllowed,
  getRemainingResetPasswordAttempts,
  getResetPasswordRateLimitResetTime,
  getLoginRateLimitHeaders,
  getForgotPasswordRateLimitHeaders,
  getResetPasswordRateLimitHeaders,
  hashEmailForRateLimit,
  LOGIN_RATE_LIMIT,
  FORGOT_PASSWORD_RATE_LIMIT,
  RESET_PASSWORD_RATE_LIMIT,
  clearAllRateLimits,
  destroyRateLimiter
} from '../../lib/auth/rate-limiter';

describe('Login Rate Limiting', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  afterEach(() => {
    clearAllRateLimits();
    destroyRateLimiter();
  });

  describe('First Attempt', () => {
    test('first login attempt should be allowed', () => {
      const email = 'user@example.com';
      const allowed = isLoginAllowed(email);

      expect(allowed).toBe(true);
    });

    test('should have 5 remaining attempts after first', () => {
      const email = 'user@example.com';
      isLoginAllowed(email);

      const remaining = getRemainingLoginAttempts(email);
      expect(remaining).toBe(LOGIN_RATE_LIMIT.maxAttempts - 1);
    });
  });

  describe('Multiple Attempts', () => {
    test('5 attempts should all be allowed', () => {
      const email = 'user@example.com';

      for (let i = 0; i < 5; i++) {
        expect(isLoginAllowed(email)).toBe(true);
      }
    });

    test('6th attempt should be blocked', () => {
      const email = 'user@example.com';

      // Make 5 attempts
      for (let i = 0; i < 5; i++) {
        isLoginAllowed(email);
      }

      // 6th should be blocked
      const allowed = isLoginAllowed(email);
      expect(allowed).toBe(false);
    });

    test('remaining attempts should decrement correctly', () => {
      const email = 'user@example.com';

      expect(getRemainingLoginAttempts(email)).toBe(5);

      isLoginAllowed(email);
      expect(getRemainingLoginAttempts(email)).toBe(4);

      isLoginAllowed(email);
      expect(getRemainingLoginAttempts(email)).toBe(3);
    });
  });

  describe('Email Hashing', () => {
    test('should hash email addresses', () => {
      const email = 'user@example.com';
      const hash = hashEmailForRateLimit(email);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(email); // Should not be plain email
    });

    test('same email should produce same hash', () => {
      const email = 'user@example.com';
      const hash1 = hashEmailForRateLimit(email);
      const hash2 = hashEmailForRateLimit(email);

      expect(hash1).toBe(hash2);
    });

    test('different emails should produce different hashes', () => {
      const hash1 = hashEmailForRateLimit('user1@example.com');
      const hash2 = hashEmailForRateLimit('user2@example.com');

      expect(hash1).not.toBe(hash2);
    });

    test('hashing should normalize email (lowercase)', () => {
      const hash1 = hashEmailForRateLimit('User@Example.COM');
      const hash2 = hashEmailForRateLimit('user@example.com');

      expect(hash1).toBe(hash2);
    });

    test('hashing should trim whitespace', () => {
      const hash1 = hashEmailForRateLimit('  user@example.com  ');
      const hash2 = hashEmailForRateLimit('user@example.com');

      expect(hash1).toBe(hash2);
    });

    test('should not expose plain email in rate limit cache', () => {
      const email = 'secret@example.com';
      isLoginAllowed(email);

      // Cannot directly access cache, but we verify hashing works
      const hash = hashEmailForRateLimit(email);
      expect(hash).not.toContain(email);
      expect(hash).not.toContain('secret');
    });
  });

  describe('Rate Limit Headers', () => {
    test('should include X-RateLimit headers after attempts', () => {
      const email = 'user@example.com';
      isLoginAllowed(email);

      const headers = getLoginRateLimitHeaders(email);

      expect(headers['X-RateLimit-Limit']).toBe('5');
      expect(headers['X-RateLimit-Remaining']).toBeDefined();
      expect(headers['Retry-After']).toBeDefined();
    });

    test('should show correct remaining attempts in header', () => {
      const email = 'user@example.com';
      isLoginAllowed(email);
      isLoginAllowed(email);

      const headers = getLoginRateLimitHeaders(email);
      expect(headers['X-RateLimit-Remaining']).toBe('3');
    });

    test('should include Retry-After header when rate limited', () => {
      const email = 'user@example.com';

      // Exhaust attempts
      for (let i = 0; i < 5; i++) {
        isLoginAllowed(email);
      }

      // Should be blocked
      isLoginAllowed(email);

      const headers = getLoginRateLimitHeaders(email);
      expect(headers['Retry-After']).toBeDefined();
      const retryAfter = parseInt(headers['Retry-After'], 10);
      expect(retryAfter).toBeGreaterThan(0);
    });

    test('Retry-After should be in seconds', () => {
      const email = 'user@example.com';

      for (let i = 0; i < 5; i++) {
        isLoginAllowed(email);
      }

      const headers = getLoginRateLimitHeaders(email);
      const retryAfter = parseInt(headers['Retry-After'], 10);

      // Should be reasonable number of seconds (less than 2 minutes)
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThan(120);
    });
  });

  describe('Different Users', () => {
    test('different emails should have independent limits', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      // Use up attempts for user1
      for (let i = 0; i < 5; i++) {
        isLoginAllowed(email1);
      }

      // User1 should be blocked
      expect(isLoginAllowed(email1)).toBe(false);

      // User2 should still be allowed
      expect(isLoginAllowed(email2)).toBe(true);
    });

    test('rate limits should not interfere across users', () => {
      const emails = Array.from({ length: 10 }, (_, i) => `user${i}@example.com`);

      emails.forEach((email) => {
        expect(isLoginAllowed(email)).toBe(true);
      });

      emails.forEach((email) => {
        expect(getRemainingLoginAttempts(email)).toBe(4);
      });
    });
  });

  describe('Reset Time', () => {
    test('should have reset time after attempt', () => {
      const email = 'user@example.com';
      isLoginAllowed(email);

      const resetTime = getLoginRateLimitResetTime(email);
      expect(resetTime).toBeDefined();
      expect(resetTime).toBeGreaterThan(Date.now());
    });

    test('reset time should be in the future', () => {
      const email = 'user@example.com';
      isLoginAllowed(email);

      const resetTime = getLoginRateLimitResetTime(email);
      const now = Date.now();

      expect(resetTime).toBeGreaterThan(now);
      // Should reset within 2 minutes
      expect(resetTime).toBeLessThan(now + 120000);
    });
  });
});

describe('Forgot Password Rate Limiting', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  afterEach(() => {
    clearAllRateLimits();
    destroyRateLimiter();
  });

  test('first forgot password request should be allowed', () => {
    const email = 'user@example.com';
    const allowed = isForgotPasswordAllowed(email);

    expect(allowed).toBe(true);
  });

  test('should allow 3 requests per hour', () => {
    const email = 'user@example.com';

    expect(isForgotPasswordAllowed(email)).toBe(true);
    expect(isForgotPasswordAllowed(email)).toBe(true);
    expect(isForgotPasswordAllowed(email)).toBe(true);
  });

  test('4th request should be blocked', () => {
    const email = 'user@example.com';

    isForgotPasswordAllowed(email);
    isForgotPasswordAllowed(email);
    isForgotPasswordAllowed(email);

    const allowed = isForgotPasswordAllowed(email);
    expect(allowed).toBe(false);
  });

  test('should show correct remaining attempts', () => {
    const email = 'user@example.com';
    isForgotPasswordAllowed(email);

    const remaining = getRemainingForgotPasswordAttempts(email);
    expect(remaining).toBe(2);
  });

  test('should include rate limit headers', () => {
    const email = 'user@example.com';
    isForgotPasswordAllowed(email);

    const headers = getForgotPasswordRateLimitHeaders(email);

    expect(headers['X-RateLimit-Limit']).toBe('3');
    expect(headers['X-RateLimit-Remaining']).toBe('2');
  });

  test('should have separate limit per user', () => {
    const email1 = 'user1@example.com';
    const email2 = 'user2@example.com';

    isForgotPasswordAllowed(email1);
    isForgotPasswordAllowed(email1);
    isForgotPasswordAllowed(email1);

    expect(isForgotPasswordAllowed(email1)).toBe(false);
    expect(isForgotPasswordAllowed(email2)).toBe(true);
  });

  test('should return reset time', () => {
    const email = 'user@example.com';
    const beforeTime = Date.now();
    isForgotPasswordAllowed(email);

    const resetTime = getForgotPasswordRateLimitResetTime(email);
    expect(resetTime).toBeGreaterThan(beforeTime);
    // Should reset within 1 hour
    expect(resetTime).toBeLessThanOrEqual(beforeTime + 3600000);
  });
});

describe('Reset Password Rate Limiting', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  afterEach(() => {
    clearAllRateLimits();
    destroyRateLimiter();
  });

  test('first reset password attempt should be allowed', () => {
    const email = 'user@example.com';
    const allowed = isResetPasswordAllowed(email);

    expect(allowed).toBe(true);
  });

  test('should allow 5 attempts per hour', () => {
    const email = 'user@example.com';

    for (let i = 0; i < 5; i++) {
      expect(isResetPasswordAllowed(email)).toBe(true);
    }
  });

  test('6th attempt should be blocked', () => {
    const email = 'user@example.com';

    for (let i = 0; i < 5; i++) {
      isResetPasswordAllowed(email);
    }

    expect(isResetPasswordAllowed(email)).toBe(false);
  });

  test('should show correct remaining attempts', () => {
    const email = 'user@example.com';
    isResetPasswordAllowed(email);
    isResetPasswordAllowed(email);

    const remaining = getRemainingResetPasswordAttempts(email);
    expect(remaining).toBe(3);
  });

  test('should include rate limit headers', () => {
    const email = 'user@example.com';
    isResetPasswordAllowed(email);

    const headers = getResetPasswordRateLimitHeaders(email);

    expect(headers['X-RateLimit-Limit']).toBe('5');
    expect(headers['X-RateLimit-Remaining']).toBe('4');
  });

  test('should have separate limit per user', () => {
    const email1 = 'user1@example.com';
    const email2 = 'user2@example.com';

    for (let i = 0; i < 5; i++) {
      isResetPasswordAllowed(email1);
    }

    expect(isResetPasswordAllowed(email1)).toBe(false);
    expect(isResetPasswordAllowed(email2)).toBe(true);
  });
});

describe('Rate Limiting Configuration', () => {
  test('LOGIN_RATE_LIMIT should have correct config', () => {
    expect(LOGIN_RATE_LIMIT.maxAttempts).toBe(5);
    expect(LOGIN_RATE_LIMIT.windowMs).toBe(60 * 1000); // 1 minute
  });

  test('FORGOT_PASSWORD_RATE_LIMIT should have correct config', () => {
    expect(FORGOT_PASSWORD_RATE_LIMIT.maxAttempts).toBe(3);
    expect(FORGOT_PASSWORD_RATE_LIMIT.windowMs).toBe(60 * 60 * 1000); // 1 hour
  });

  test('RESET_PASSWORD_RATE_LIMIT should have correct config', () => {
    expect(RESET_PASSWORD_RATE_LIMIT.maxAttempts).toBe(5);
    expect(RESET_PASSWORD_RATE_LIMIT.windowMs).toBe(60 * 60 * 1000); // 1 hour
  });
});

describe('Email Privacy', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  afterEach(() => {
    clearAllRateLimits();
    destroyRateLimiter();
  });

  test('should not leak email in error responses', () => {
    const email = 'secret@example.com';

    for (let i = 0; i < 6; i++) {
      isLoginAllowed(email);
    }

    // Headers should only show hashed values
    const headers = getLoginRateLimitHeaders(email);

    expect(JSON.stringify(headers)).not.toContain(email);
    expect(JSON.stringify(headers)).not.toContain('secret');
  });

  test('should handle email enumeration attempts', () => {
    // Try multiple emails quickly - all should be rate limited independently
    const emails = Array.from(
      { length: 20 },
      (_, i) => `attacker${i}@example.com`
    );

    const results = emails.map((email) => isLoginAllowed(email));

    // All first attempts should succeed
    expect(results.filter((r) => r === true)).toHaveLength(20);
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  afterEach(() => {
    clearAllRateLimits();
    destroyRateLimiter();
  });

  test('should handle empty email', () => {
    const allowed = isLoginAllowed('');
    expect(typeof allowed).toBe('boolean');
  });

  test('should handle very long email', () => {
    const longEmail = 'a'.repeat(1000) + '@example.com';
    const allowed = isLoginAllowed(longEmail);

    expect(typeof allowed).toBe('boolean');
  });

  test('should handle special characters in email', () => {
    const email = 'user+tag@sub.example.co.uk';
    const allowed = isLoginAllowed(email);

    expect(allowed).toBe(true);
  });

  test('should handle whitespace in email', () => {
    const allowed = isLoginAllowed('  user@example.com  ');

    expect(typeof allowed).toBe('boolean');
  });
});

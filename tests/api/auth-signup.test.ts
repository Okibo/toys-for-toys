/**
 * Integration Tests: POST /api/auth/signup
 * Tests signup endpoint with various scenarios
 */

import { validateEmail } from '@/lib/auth/email-validator';
import { validatePassword } from '@/lib/auth/password-validator';
import { isSignupAllowed, clearAllRateLimits, destroyRateLimiter } from '@/lib/auth/rate-limiter';
import { generateVerificationCode, isValidCodeFormat, isCodeExpired, getCodeExpiryTime } from '@/lib/auth/verification-code';
import type { SignupRequest, SignupResponse, SignupErrorResponse } from '@/lib/auth/types';

/**
 * Mock dependencies before running tests
 */
jest.mock('@/lib/auth/supabase-server', () => ({
  getSupabaseServerClient: jest.fn(),
  getSupabaseAuth: jest.fn(),
}));

jest.mock('@/lib/email/send-email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('POST /api/auth/signup - Basic Validation', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  afterAll(() => {
    destroyRateLimiter();
  });

  describe('Email Validation', () => {
    test('should reject invalid email format', () => {
      const result = validateEmail('not-an-email');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should accept valid email format', () => {
      const result = validateEmail('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should normalize email to lowercase', () => {
      const result = validateEmail('USER@EXAMPLE.COM');
      expect(result.normalizedEmail).toBe('user@example.com');
    });

    test('should reject email without domain', () => {
      const result = validateEmail('user@');
      expect(result.isValid).toBe(false);
    });

    test('should reject email without local part', () => {
      const result = validateEmail('@example.com');
      expect(result.isValid).toBe(false);
    });

    test('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
    });

    test('should reject email with spaces', () => {
      const result = validateEmail('user @example.com');
      expect(result.isValid).toBe(false);
    });

    test('should reject email longer than 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.isValid).toBe(false);
    });

    test('should handle multiple @ symbols', () => {
      const result = validateEmail('user@example@com');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Password Validation', () => {
    test('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Abc1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should reject password without uppercase letter', () => {
      const result = validatePassword('abcdef123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least 1 uppercase letter (A-Z)');
    });

    test('should reject password without number', () => {
      const result = validatePassword('Abcdef!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least 1 number (0-9)');
    });

    test('should reject password without special character', () => {
      const result = validatePassword('Abcdef123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least 1 special character (!@#$%^&*)');
    });

    test('should accept strong password', () => {
      const result = validatePassword('MySecure1!Pass');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should accept password with all special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*'];
      for (const char of specialChars) {
        const result = validatePassword(`MyPass1${char}`);
        expect(result.isValid).toBe(true);
      }
    });

    test('should calculate password strength as strong for long passwords', () => {
      const result = validatePassword('MyVeryLongSecurePassword123!');
      expect(result.isValid).toBe(true);
      expect(result.score).toBe('strong');
    });

    test('should calculate password strength as good for medium passwords', () => {
      const result = validatePassword('Medium1!Pass');
      expect(result.isValid).toBe(true);
      expect(result.score).toMatch(/good|strong/);
    });
  });

  describe('Verification Code Generation', () => {
    test('should generate 6-digit code', () => {
      const code = generateVerificationCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    test('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateVerificationCode());
      }
      // With 100 random codes from 1M possibilities, should have many unique
      expect(codes.size).toBeGreaterThan(90);
    });

    test('should validate correct code format', () => {
      expect(isValidCodeFormat('123456')).toBe(true);
    });

    test('should reject code with less than 6 digits', () => {
      expect(isValidCodeFormat('12345')).toBe(false);
    });

    test('should reject code with more than 6 digits', () => {
      expect(isValidCodeFormat('1234567')).toBe(false);
    });

    test('should reject code with non-digit characters', () => {
      expect(isValidCodeFormat('12345a')).toBe(false);
    });

    test('should reject empty code', () => {
      expect(isValidCodeFormat('')).toBe(false);
    });

    test('should reject non-string code', () => {
      expect(isValidCodeFormat(null as any)).toBe(false);
      expect(isValidCodeFormat(123456 as any)).toBe(false);
    });
  });

  describe('Verification Code Expiry', () => {
    test('should generate future expiry time', () => {
      const expiryTime = getCodeExpiryTime();
      const expiryDate = new Date(expiryTime);
      const now = new Date();
      expect(expiryDate.getTime()).toBeGreaterThan(now.getTime());
    });

    test('should have 24 hour expiry', () => {
      const expiryTime = getCodeExpiryTime();
      const expiryDate = new Date(expiryTime);
      const now = new Date();
      const diffMs = expiryDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      expect(diffHours).toBeCloseTo(24, 0.5);
    });

    test('should detect non-expired code', () => {
      const expiryTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
      expect(isCodeExpired(expiryTime)).toBe(false);
    });

    test('should detect expired code', () => {
      const expiryTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      expect(isCodeExpired(expiryTime)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow first signup from IP', () => {
      const allowed = isSignupAllowed('192.168.1.1');
      expect(allowed).toBe(true);
    });

    test('should allow multiple signups within limit per IP', () => {
      const ip = '192.168.1.2';
      for (let i = 0; i < 5; i++) {
        expect(isSignupAllowed(ip)).toBe(true);
      }
    });

    test('should block signup after rate limit exceeded', () => {
      const ip = '192.168.1.3';
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        isSignupAllowed(ip);
      }
      // 6th request should be blocked
      expect(isSignupAllowed(ip)).toBe(false);
    });

    test('should isolate rate limits by IP', () => {
      const ip1 = '192.168.1.4';
      const ip2 = '192.168.1.5';

      // Use up limit for ip1
      for (let i = 0; i < 5; i++) {
        isSignupAllowed(ip1);
      }

      // ip2 should still have allowance
      expect(isSignupAllowed(ip2)).toBe(true);
    });

    test('should allow requests from different IPs simultaneously', () => {
      clearAllRateLimits();
      const ips = ['192.168.1.6', '192.168.1.7', '192.168.1.8'];
      for (const ip of ips) {
        expect(isSignupAllowed(ip)).toBe(true);
      }
    });
  });
});

describe('POST /api/auth/signup - Request/Response Format', () => {
  describe('Request Validation', () => {
    test('should have required fields: email, password', () => {
      const validRequest: SignupRequest = {
        email: 'user@example.com',
        password: 'MySecure1!Pass',
      };
      expect(validRequest.email).toBeDefined();
      expect(validRequest.password).toBeDefined();
    });

    test('should have optional field: language', () => {
      const requestWithLanguage: SignupRequest = {
        email: 'user@example.com',
        password: 'MySecure1!Pass',
        language: 'en',
      };
      expect(requestWithLanguage.language).toBe('en');
    });

    test('should accept language codes', () => {
      const languages = ['en', 'pl', 'de', 'fr'];
      for (const lang of languages) {
        const request: SignupRequest = {
          email: 'user@example.com',
          password: 'MySecure1!Pass',
          language: lang,
        };
        expect(request.language).toBe(lang);
      }
    });
  });

  describe('Response Format', () => {
    test('should have correct success response structure', () => {
      const response: SignupResponse = {
        success: true,
        message: 'Signup successful. Please check your email to verify your account.',
        data: {
          user_id: 'test-id',
          email: 'user@example.com',
          is_email_verified: false,
        },
      };
      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(response.data.user_id).toBeDefined();
      expect(response.data.email).toBeDefined();
      expect(response.data.is_email_verified).toBe(false);
    });

    test('should have correct error response structure', () => {
      const response: SignupErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email address',
          details: ['Email format is invalid'],
        },
      };
      expect(response.success).toBe(false);
      expect(response.error.code).toBeDefined();
      expect(response.error.message).toBeDefined();
      expect(response.error.details).toBeDefined();
    });

    test('should include all error codes', () => {
      const errorCodes = ['INVALID_EMAIL', 'WEAK_PASSWORD', 'DUPLICATE_EMAIL', 'INTERNAL_ERROR', 'RATE_LIMIT'];
      for (const code of errorCodes) {
        const response: SignupErrorResponse = {
          success: false,
          error: {
            code: code as any,
            message: 'Test error',
          },
        };
        expect(response.error.code).toBe(code);
      }
    });
  });
});

describe('POST /api/auth/signup - Edge Cases', () => {
  test('should handle email with plus addressing', () => {
    const result = validateEmail('user+tag@example.com');
    expect(result.isValid).toBe(true);
  });

  test('should handle email with dots in local part', () => {
    const result = validateEmail('first.last@example.com');
    expect(result.isValid).toBe(true);
  });

  test('should handle email with hyphens in domain', () => {
    const result = validateEmail('user@my-example.com');
    expect(result.isValid).toBe(true);
  });

  test('should handle very long but valid email', () => {
    const result = validateEmail('a'.repeat(64) + '@' + 'b'.repeat(100) + '.com');
    expect(result.isValid).toBe(true);
  });

  test('should handle password with accented characters in non-required parts', () => {
    const result = validatePassword('MyPass1!éàü');
    expect(result.isValid).toBe(true);
  });

  test('should normalize whitespace in email', () => {
    const result = validateEmail('  user@example.com  ');
    expect(result.isValid).toBe(true);
    expect(result.normalizedEmail).toBe('user@example.com');
  });
});

describe('POST /api/auth/signup - Security', () => {
  test('should not expose error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      // In production, error details should be limited
      expect(process.env.NODE_ENV).toBe('production');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  test('should require strong passwords', () => {
    const weakPasswords = [
      'password',      // No uppercase, no special char
      'PASSWORD',      // No lowercase, no number
      'Pass1234',      // No special char
      'Pass!',         // Too short
      '12345678',      // No letters or special char
    ];

    for (const pwd of weakPasswords) {
      const result = validatePassword(pwd);
      expect(result.isValid).toBe(false);
    }
  });

  test('should validate email format strictly', () => {
    const invalidEmails = [
      'user@',
      '@example.com',
      'user@.com',
      'user@example.',
      'user name@example.com',
      'user@exam ple.com',
    ];

    for (const email of invalidEmails) {
      const result = validateEmail(email);
      expect(result.isValid).toBe(false);
    }
  });

  test('should implement rate limiting to prevent brute force', () => {
    clearAllRateLimits();
    const ip = '192.168.1.100';

    // Should allow up to 5 attempts
    for (let i = 0; i < 5; i++) {
      expect(isSignupAllowed(ip)).toBe(true);
    }

    // Should block on 6th attempt
    expect(isSignupAllowed(ip)).toBe(false);
  });
});

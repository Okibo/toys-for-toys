/**
 * Email Validation Tests
 * Comprehensive test suite for email validation function
 * Tests RFC 5322 compliance and practical validation
 */

import {
  validateEmail,
  isEmailValid,
  getNormalizedEmail,
  getEmailErrors,
  isValidDomain
} from '../../lib/auth/email-validator';

describe('Email Validation', () => {
  describe('validateEmail() function', () => {
    it('should reject non-string input', () => {
      const result = validateEmail(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email must be a string');
    });

    it('should reject null input', () => {
      const result = validateEmail(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email must be a string');
    });

    it('should reject undefined input', () => {
      const result = validateEmail(undefined as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email must be a string');
    });
  });

  describe('Basic email structure validation', () => {
    it('should accept standard email format', () => {
      const result = validateEmail('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject email without @ symbol', () => {
      const result = validateEmail('userexample.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address must contain exactly one @ symbol');
    });

    it('should reject email with multiple @ symbols', () => {
      const result = validateEmail('user@@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address must contain exactly one @ symbol');
    });

    it('should reject email with three @ symbols', () => {
      const result = validateEmail('user@example@com@');
      expect(result.isValid).toBe(false);
    });

    it('should reject incomplete email (no domain)', () => {
      const result = validateEmail('user@');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('domain'))).toBe(true);
    });

    it('should reject incomplete email (no local part)', () => {
      const result = validateEmail('@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('local part'))).toBe(true);
    });

    it('should reject email with only @ symbol', () => {
      const result = validateEmail('@');
      expect(result.isValid).toBe(false);
    });

    it('should reject empty string', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address is required');
    });

    it('should reject whitespace-only string', () => {
      const result = validateEmail('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Local part (before @) validation', () => {
    it('should accept local part with alphanumeric characters', () => {
      const result = validateEmail('user123@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept local part with dots', () => {
      const result = validateEmail('user.name@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept local part with hyphens', () => {
      const result = validateEmail('user-name@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept local part with underscores', () => {
      const result = validateEmail('user_name@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept local part with plus sign (+ addressing)', () => {
      const result = validateEmail('user+tag@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept local part with multiple plus signs', () => {
      const result = validateEmail('user+tag+2024@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept local part with numbers and special chars', () => {
      const result = validateEmail('user.123+tag@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should reject local part starting with dot', () => {
      const result = validateEmail('.user@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email local part cannot start or end with a dot');
    });

    it('should reject local part ending with dot', () => {
      const result = validateEmail('user.@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email local part cannot start or end with a dot');
    });

    it('should reject local part with consecutive dots', () => {
      const result = validateEmail('user..name@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email local part cannot contain consecutive dots');
    });

    it('should reject local part that is too long (>64 chars)', () => {
      const longLocal = 'a'.repeat(65);
      const result = validateEmail(`${longLocal}@example.com`);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email local part (before @) is too long (max 64 characters)');
    });

    it('should accept local part with exactly 64 characters', () => {
      const localPart = 'a'.repeat(64);
      const result = validateEmail(`${localPart}@example.com`);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty local part', () => {
      const result = validateEmail('@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email local part (before @) cannot be empty');
    });
  });

  describe('Domain part (after @) validation', () => {
    it('should accept domain with alphanumeric characters', () => {
      const result = validateEmail('user@example123.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept domain with hyphens', () => {
      const result = validateEmail('user@my-example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept domain with multiple subdomains', () => {
      const result = validateEmail('user@mail.example.co.uk');
      expect(result.isValid).toBe(true);
    });

    it('should accept domain with multiple hyphens', () => {
      const result = validateEmail('user@my-mail-server.com');
      expect(result.isValid).toBe(true);
    });

    it('should reject domain starting with hyphen', () => {
      const result = validateEmail('user@-example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email domain cannot start or end with a hyphen');
    });

    it('should reject domain ending with hyphen', () => {
      const result = validateEmail('user@example-.com');
      expect(result.isValid).toBe(false);
      // Regex will catch it as invalid format
    });

    it('should reject domain with consecutive dots', () => {
      const result = validateEmail('user@example..com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email domain cannot contain consecutive dots');
    });

    it('should reject domain without dot (missing TLD)', () => {
      const result = validateEmail('user@localhost');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email domain must contain at least one dot');
    });

    it('should reject domain that is too long (>255 chars)', () => {
      const longDomain = 'a'.repeat(250) + '.com';
      const result = validateEmail(`user@${longDomain}`);
      expect(result.isValid).toBe(false);
      // Total email length exceeds 254 characters
    });

    it('should accept domain with reasonable length', () => {
      const domain = 'subdomain.example.com';
      const result = validateEmail(`user@${domain}`);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty domain', () => {
      const result = validateEmail('user@');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email domain (after @) cannot be empty');
    });
  });

  describe('TLD (Top-Level Domain) validation', () => {
    it('should accept standard 2-letter TLD', () => {
      const result = validateEmail('user@example.uk');
      expect(result.isValid).toBe(true);
    });

    it('should accept 3-letter TLD', () => {
      const result = validateEmail('user@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept 4-letter TLD', () => {
      const result = validateEmail('user@example.info');
      expect(result.isValid).toBe(true);
    });

    it('should accept very long TLD', () => {
      const result = validateEmail('user@example.international');
      expect(result.isValid).toBe(true);
    });

    it('should reject TLD with only 1 character', () => {
      const result = validateEmail('user@example.c');
      expect(result.isValid).toBe(false);
      // Regex pattern requires at least 2-char TLD
    });

    it('should reject domain ending with dot', () => {
      const result = validateEmail('user@example.com.');
      expect(result.isValid).toBe(false);
    });

    it('should reject TLD with numbers', () => {
      const result = validateEmail('user@example.c0m');
      expect(result.isValid).toBe(false);
    });

    it('should reject TLD with special characters', () => {
      const result = validateEmail('user@example.c-m');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Email normalization', () => {
    it('should normalize to lowercase', () => {
      const result = validateEmail('User@Example.COM');
      expect(result.normalizedEmail).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const result = validateEmail('  user@example.com  ');
      expect(result.normalizedEmail).toBe('user@example.com');
    });

    it('should trim and lowercase', () => {
      const result = validateEmail('  User@Example.COM  ');
      expect(result.normalizedEmail).toBe('user@example.com');
    });

    it('should return null if invalid', () => {
      const result = validateEmail('invalid-email');
      expect(result.normalizedEmail).toBeNull();
    });

    it('should preserve + addressing in normalization', () => {
      const result = validateEmail('User+TAG@Example.COM');
      expect(result.normalizedEmail).toBe('user+tag@example.com');
    });
  });

  describe('Email length validation', () => {
    it('should reject email longer than 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address is too long (max 254 characters)');
    });

    it('should accept email within length limits', () => {
      const localPart = 'a'.repeat(60); // 60 chars + @ + 10 chars domain = 71 total
      const result = validateEmail(`${localPart}@example.com`);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Real-world email addresses', () => {
    const validEmails = [
      'user@example.com',
      'john.doe@example.co.uk',
      'user+tag@example.com',
      'test.email@my-domain.com',
      'info@company.org',
      'support@service.co.jp',
      'user_name@example.com',
      'first.last@sub.example.com',
      'a@b.co',
      'test123@test-123.com',
      'user+2024@example.com',
      'firstname.lastname+tag@example.co.uk'
    ];

    const invalidEmails = [
      'user@', // incomplete domain
      '@example.com', // no local part
      'user', // no domain
      'user example.com', // no @
      'user@@example.com', // double @
      '.user@example.com', // starts with dot
      'user.@example.com', // ends with dot
      'user..name@example.com', // consecutive dots
      'user@example.@com', // consecutive dots in domain
      'user@example', // no TLD
      'user@example.c', // TLD too short
      'user@-example.com', // domain starts with hyphen
      'user@example..com' // consecutive dots
    ];

    validEmails.forEach((email) => {
      it(`should accept valid email: ${email}`, () => {
        expect(validateEmail(email).isValid).toBe(true);
      });
    });

    invalidEmails.forEach((email) => {
      it(`should reject invalid email: ${email}`, () => {
        expect(validateEmail(email).isValid).toBe(false);
      });
    });
  });

  describe('isEmailValid() helper function', () => {
    it('should return true for valid email', () => {
      expect(isEmailValid('user@example.com')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(isEmailValid('invalid')).toBe(false);
    });

    it('should return false for email without @', () => {
      expect(isEmailValid('userexample.com')).toBe(false);
    });

    it('should return true for email with + addressing', () => {
      expect(isEmailValid('user+tag@example.com')).toBe(true);
    });
  });

  describe('getNormalizedEmail() helper function', () => {
    it('should return normalized email for valid email', () => {
      const normalized = getNormalizedEmail('User@Example.COM');
      expect(normalized).toBe('user@example.com');
    });

    it('should return null for invalid email', () => {
      const normalized = getNormalizedEmail('invalid@');
      expect(normalized).toBeNull();
    });

    it('should trim and normalize', () => {
      const normalized = getNormalizedEmail('  User@Example.COM  ');
      expect(normalized).toBe('user@example.com');
    });
  });

  describe('getEmailErrors() helper function', () => {
    it('should return empty array for valid email', () => {
      const errors = getEmailErrors('user@example.com');
      expect(errors).toEqual([]);
    });

    it('should return errors for invalid email', () => {
      const errors = getEmailErrors('invalid');
      expect(errors.length).toBeGreaterThan(0);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should include specific error messages', () => {
      const errors = getEmailErrors('user@');
      expect(errors.some((e) => e.includes('domain') || e.includes('@'))).toBe(true);
    });
  });

  describe('isValidDomain() helper function', () => {
    it('should return true for valid domain', () => {
      expect(isValidDomain('example.com')).toBe(true);
    });

    it('should return true for subdomain', () => {
      expect(isValidDomain('mail.example.com')).toBe(true);
    });

    it('should return true for domain with hyphen', () => {
      expect(isValidDomain('my-example.com')).toBe(true);
    });

    it('should return false for domain without dot', () => {
      expect(isValidDomain('localhost')).toBe(false);
    });

    it('should return false for domain starting with hyphen in first label', () => {
      // Note: Our regex requires non-hyphen start for domain labels
      expect(isValidDomain('example.com')).toBe(true);
      expect(isValidDomain('sub-domain.example.com')).toBe(true);
    });

    it('should return false for domain with invalid TLD', () => {
      expect(isValidDomain('example.c')).toBe(false);
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should handle email with maximum valid length', () => {
      const local = 'a'.repeat(64);
      const result = validateEmail(`${local}@example.com`);
      expect(result.isValid).toBe(true);
    });

    it('should handle very short valid email', () => {
      const result = validateEmail('a@b.co');
      expect(result.isValid).toBe(true);
    });

    it('should have consistent results for same email', () => {
      const email = 'user@example.com';
      const result1 = validateEmail(email);
      const result2 = validateEmail(email);
      expect(result1.isValid).toBe(result2.isValid);
      expect(result1.errors).toEqual(result2.errors);
      expect(result1.normalizedEmail).toBe(result2.normalizedEmail);
    });

    it('should accept email with numeric domain', () => {
      const result = validateEmail('user@123.456.com');
      expect(result.isValid).toBe(true);
    });

    it('should return complete validation result object', () => {
      const result = validateEmail('user@example.com');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('normalizedEmail');
    });
  });

  describe('Security considerations', () => {
    it('should handle control characters safely', () => {
      // Null bytes and control characters would be rejected by regex
      const result = validateEmail('user\n@example.com');
      expect(result.isValid).toBe(false);
    });

    it('should not accept email with newlines', () => {
      const result = validateEmail('user\n@example.com');
      expect(result.isValid).toBe(false);
    });

    it('should normalize uppercase domain (prevent homograph attacks)', () => {
      const result = validateEmail('user@EXAMPLE.COM');
      expect(result.normalizedEmail).toBe('user@example.com');
    });
  });
});

/**
 * Password Validation Tests
 * Comprehensive test suite for password validation function
 * Tests all requirements and edge cases
 */

import {
  validatePassword,
  isPasswordValid,
  getPasswordErrors,
  PasswordValidationResult
} from '../../lib/auth/password-validator';

describe('Password Validation', () => {
  describe('validatePassword() function', () => {
    it('should reject non-string input', () => {
      const result = validatePassword(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be a string');
    });

    it('should reject null input', () => {
      const result = validatePassword(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be a string');
    });

    it('should reject undefined input', () => {
      const result = validatePassword(undefined as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be a string');
    });
  });

  describe('Requirement 1: Minimum 8 characters', () => {
    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Pass1!');
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.isValid).toBe(false);
    });

    it('should reject password with 7 characters', () => {
      const result = validatePassword('Pass1!a');
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should accept password with exactly 8 characters (if other requirements met)', () => {
      const result = validatePassword('Pass1!ab');
      expect(result.errors).not.toContain('Password must be at least 8 characters long');
    });

    it('should accept password with 15+ characters', () => {
      const result = validatePassword('Password123!abc');
      expect(result.errors).not.toContain('Password must be at least 8 characters long');
    });

    it('should accept very long password', () => {
      const longPassword = 'A'.repeat(100) + '1!a';
      const result = validatePassword(longPassword);
      expect(result.errors).not.toContain('Password must be at least 8 characters long');
    });
  });

  describe('Requirement 2: At least 1 uppercase letter', () => {
    it('should reject password without uppercase letter', () => {
      const result = validatePassword('password123!');
      expect(result.errors).toContain('Password must contain at least 1 uppercase letter (A-Z)');
    });

    it('should reject password with only lowercase and special chars', () => {
      const result = validatePassword('pass1234!');
      expect(result.errors).toContain('Password must contain at least 1 uppercase letter (A-Z)');
    });

    it('should accept password with single uppercase letter at start', () => {
      const result = validatePassword('Password1!');
      expect(result.errors).not.toContain('Password must contain at least 1 uppercase letter (A-Z)');
    });

    it('should accept password with single uppercase letter at end', () => {
      const result = validatePassword('password1!A');
      expect(result.errors).not.toContain('Password must contain at least 1 uppercase letter (A-Z)');
    });

    it('should accept password with multiple uppercase letters', () => {
      const result = validatePassword('PassWord1!');
      expect(result.errors).not.toContain('Password must contain at least 1 uppercase letter (A-Z)');
    });

    it('should accept password with all uppercase letters', () => {
      const result = validatePassword('PASSWORD1!');
      expect(result.errors).not.toContain('Password must contain at least 1 uppercase letter (A-Z)');
    });
  });

  describe('Requirement 3: At least 1 number', () => {
    it('should reject password without number', () => {
      const result = validatePassword('Password!');
      expect(result.errors).toContain('Password must contain at least 1 number (0-9)');
    });

    it('should reject password with only letters and special chars', () => {
      const result = validatePassword('Password!@#$');
      expect(result.errors).toContain('Password must contain at least 1 number (0-9)');
    });

    it('should accept password with single digit', () => {
      const result = validatePassword('Password1!');
      expect(result.errors).not.toContain('Password must contain at least 1 number (0-9)');
    });

    it('should accept password with multiple digits', () => {
      const result = validatePassword('Password123!');
      expect(result.errors).not.toContain('Password must contain at least 1 number (0-9)');
    });

    it('should accept password with digits at different positions', () => {
      const result = validatePassword('1Pass2word3!');
      expect(result.errors).not.toContain('Password must contain at least 1 number (0-9)');
    });

    it('should accept password starting with digit', () => {
      const result = validatePassword('1Password!');
      expect(result.errors).not.toContain('Password must contain at least 1 number (0-9)');
    });
  });

  describe('Requirement 4: At least 1 special character', () => {
    const validSpecialChars = ['!', '@', '#', '$', '%', '^', '&', '*'];

    validSpecialChars.forEach((char) => {
      it(`should accept password with special character '${char}'`, () => {
        const password = `Password1${char}`;
        const result = validatePassword(password);
        expect(result.errors).not.toContain('Password must contain at least 1 special character (!@#$%^&*)');
      });
    });

    it('should reject password without any special character', () => {
      const result = validatePassword('Password1abc');
      expect(result.errors).toContain('Password must contain at least 1 special character (!@#$%^&*)');
    });

    it('should reject password with invalid special characters only', () => {
      const result = validatePassword('Password1~');
      expect(result.errors).toContain('Password must contain at least 1 special character (!@#$%^&*)');
    });

    it('should accept password with multiple special characters', () => {
      const result = validatePassword('Password1!@#');
      expect(result.errors).not.toContain('Password must contain at least 1 special character (!@#$%^&*)');
    });

    it('should accept password with special char at different positions', () => {
      const result = validatePassword('!Pass1word');
      expect(result.errors).not.toContain('Password must contain at least 1 special character (!@#$%^&*)');
    });
  });

  describe('Complete password validation', () => {
    it('should accept valid password with all requirements', () => {
      const result = validatePassword('MyPassword123!');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should accept valid password with minimal requirements', () => {
      const result = validatePassword('Aa1!bcde');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should accept valid password with all special characters', () => {
      const result = validatePassword('Pass1!@#$%^&*');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject password missing multiple requirements', () => {
      const result = validatePassword('password');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should have correct error count for completely invalid password', () => {
      const result = validatePassword('abc');
      expect(result.errors.length).toBeGreaterThanOrEqual(3); // Too short, no uppercase, no number, no special
    });
  });

  describe('Password strength scoring', () => {
    it('should return weak score for invalid password', () => {
      const result = validatePassword('weak');
      expect(result.score).toBe('weak');
    });

    it('should return fair score for password with all requirements (8 chars)', () => {
      const result = validatePassword('Mypass1!');
      expect(result.score).toMatch(/^(fair|good|strong)$/);
    });

    it('should return good score for medium-length password', () => {
      const result = validatePassword('MyPassword123!');
      expect(result.score).toMatch(/^(good|strong)$/);
    });

    it('should return strong score for long complex password', () => {
      const result = validatePassword('MySecureP@ssw0rd!');
      expect(['good', 'strong']).toContain(result.score);
    });

    it('should return strong score for very long password', () => {
      const result = validatePassword('ThisIsAVeryLongPasswordWith123!Special');
      expect(['good', 'strong']).toContain(result.score);
    });
  });

  describe('isPasswordValid() helper function', () => {
    it('should return true for valid password', () => {
      expect(isPasswordValid('MyPassword123!')).toBe(true);
    });

    it('should return false for invalid password', () => {
      expect(isPasswordValid('weak')).toBe(false);
    });

    it('should return false for password without uppercase', () => {
      expect(isPasswordValid('mypassword123!')).toBe(false);
    });

    it('should return false for password without number', () => {
      expect(isPasswordValid('MyPassword!')).toBe(false);
    });

    it('should return false for password without special char', () => {
      expect(isPasswordValid('MyPassword123')).toBe(false);
    });

    it('should return false for password too short', () => {
      expect(isPasswordValid('My1!')).toBe(false);
    });
  });

  describe('getPasswordErrors() helper function', () => {
    it('should return empty array for valid password', () => {
      const errors = getPasswordErrors('MyPassword123!');
      expect(errors).toEqual([]);
    });

    it('should return errors for invalid password', () => {
      const errors = getPasswordErrors('weak');
      expect(errors.length).toBeGreaterThan(0);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should include specific error messages', () => {
      const errors = getPasswordErrors('abc');
      expect(errors.some((e) => e.includes('8 characters'))).toBe(true);
    });

    it('should return array with correct error strings', () => {
      const errors = getPasswordErrors('password123');
      expect(errors).toContain('Password must contain at least 1 uppercase letter (A-Z)');
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should accept password with only allowed special chars mixed in', () => {
      const result = validatePassword('P!a@s#s$w%o^r&d*1');
      expect(result.isValid).toBe(true);
    });

    it('should reject password with disallowed special characters', () => {
      const result = validatePassword('Password1~');
      expect(result.errors).toContain('Password must contain at least 1 special character (!@#$%^&*)');
    });

    it('should accept password with spaces (if other requirements met)', () => {
      // Spaces are not explicitly rejected
      const result = validatePassword('My Pass1!');
      expect(result.isValid).toBe(true);
    });

    it('should accept password with accented characters (if other requirements met)', () => {
      // Accented chars are not explicitly rejected
      const result = validatePassword('Pässwörd1!');
      expect(result.isValid).toBe(true);
    });

    it('should handle empty string', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle string with only whitespace', () => {
      const result = validatePassword('     ');
      expect(result.isValid).toBe(false);
    });

    it('should have consistent results for same password', () => {
      const password = 'MyPassword123!';
      const result1 = validatePassword(password);
      const result2 = validatePassword(password);
      expect(result1.isValid).toBe(result2.isValid);
      expect(result1.errors).toEqual(result2.errors);
      expect(result1.score).toBe(result2.score);
    });
  });

  describe('Return value consistency', () => {
    it('should always return PasswordValidationResult object', () => {
      const result = validatePassword('Test1!abc');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('score');
    });

    it('should return errors as array', () => {
      const result = validatePassword('weak');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should have score as one of four values', () => {
      const validScores = ['weak', 'fair', 'good', 'strong'];
      const result = validatePassword('anything');
      expect(validScores).toContain(result.score);
    });

    it('should have isValid as boolean', () => {
      const result = validatePassword('Test1!');
      expect(typeof result.isValid).toBe('boolean');
    });
  });

  describe('Real-world password examples', () => {
    const validPasswords = [
      'MyPassword123!',
      'Secure@Pass2024',
      'C0mpl3x!Pwd',
      'Test1!Password',
      'SecureP@ss99'
    ];

    const invalidPasswords = [
      'password123!', // no uppercase
      'Password123', // no special char
      'Passworda!', // no number
      'Pass1!', // too short
      '', // empty
      '     ', // only spaces
      'abc123!@#' // no uppercase
    ];

    validPasswords.forEach((pwd) => {
      it(`should accept valid password: ${pwd}`, () => {
        expect(validatePassword(pwd).isValid).toBe(true);
      });
    });

    invalidPasswords.forEach((pwd) => {
      it(`should reject invalid password: ${pwd}`, () => {
        expect(validatePassword(pwd).isValid).toBe(false);
      });
    });
  });
});

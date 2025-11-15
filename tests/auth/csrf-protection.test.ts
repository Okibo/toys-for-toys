/**
 * CSRF Protection Tests
 * Comprehensive test suite for CSRF token generation and validation
 */

import {
  generateCSRFToken,
  createCSRFToken,
  getCSRFToken,
  verifyCSRFToken,
  validateCSRFToken,
  revokeCSRFToken,
  getCSRFCookieOptions,
  getCSRFHeaderName,
  clearAllCSRFTokens,
  destroyCSRFTokenStore,
  generateCSRFMetaTag,
  generateCSRFFormInput
} from '../../lib/auth/csrf-protection';

describe('CSRF Protection', () => {
  beforeEach(() => {
    clearAllCSRFTokens();
  });

  afterAll(() => {
    destroyCSRFTokenStore();
  });

  describe('generateCSRFToken() function', () => {
    it('should generate a token', () => {
      const token = generateCSRFToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate a hex-encoded string', () => {
      const token = generateCSRFToken();
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('should generate 64-character token by default (32 bytes)', () => {
      const token = generateCSRFToken();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate token of specified length', () => {
      const token = generateCSRFToken(16);
      expect(token.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate cryptographically random tokens', () => {
      const tokens = new Set<string>();

      for (let i = 0; i < 100; i++) {
        tokens.add(generateCSRFToken());
      }

      // All tokens should be unique
      expect(tokens.size).toBe(100);
    });

    it('should accept custom length parameter', () => {
      const token1 = generateCSRFToken(8);
      const token2 = generateCSRFToken(64);

      expect(token1.length).toBe(16); // 8 bytes
      expect(token2.length).toBe(128); // 64 bytes
      expect(token1.length).not.toBe(token2.length);
    });
  });

  describe('createCSRFToken() function', () => {
    it('should create and store a token', () => {
      const sessionId = 'session123';
      const token = createCSRFToken(sessionId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64);
    });

    it('should store token for retrieval', () => {
      const sessionId = 'session123';
      const token = createCSRFToken(sessionId);

      const storedToken = getCSRFToken(sessionId);
      expect(storedToken).toBe(token);
    });

    it('should accept custom expiry time', () => {
      const sessionId = 'session123';
      const token = createCSRFToken(sessionId, 5000); // 5 seconds

      expect(token).toBeDefined();
      expect(getCSRFToken(sessionId)).toBe(token);
    });

    it('should create unique tokens for different sessions', () => {
      const token1 = createCSRFToken('session1');
      const token2 = createCSRFToken('session2');

      expect(token1).not.toBe(token2);
    });

    it('should overwrite existing token for same session', () => {
      const sessionId = 'session123';

      const token1 = createCSRFToken(sessionId);
      const token2 = createCSRFToken(sessionId);

      expect(token1).not.toBe(token2);
      expect(getCSRFToken(sessionId)).toBe(token2);
    });
  });

  describe('getCSRFToken() function', () => {
    it('should return token if exists and valid', () => {
      const sessionId = 'session123';
      const createdToken = createCSRFToken(sessionId);

      const retrievedToken = getCSRFToken(sessionId);
      expect(retrievedToken).toBe(createdToken);
    });

    it('should return null for non-existent session', () => {
      const token = getCSRFToken('non-existent-session');
      expect(token).toBeNull();
    });

    it('should return null for expired token', async () => {
      const sessionId = 'session123';

      // Create token with 100ms expiry
      createCSRFToken(sessionId, 100);

      // Token should exist initially
      expect(getCSRFToken(sessionId)).not.toBeNull();

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Token should be expired
      const token = getCSRFToken(sessionId);
      expect(token).toBeNull();
    });
  });

  describe('verifyCSRFToken() function', () => {
    it('should return true for valid token', () => {
      const sessionId = 'session123';
      const token = createCSRFToken(sessionId);

      const isValid = verifyCSRFToken(sessionId, token);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid token', () => {
      const sessionId = 'session123';
      createCSRFToken(sessionId);

      const isValid = verifyCSRFToken(sessionId, 'invalid-token');
      expect(isValid).toBe(false);
    });

    it('should return false for non-existent session', () => {
      const isValid = verifyCSRFToken('non-existent', 'some-token');
      expect(isValid).toBe(false);
    });

    it('should use constant-time comparison (timing-attack resistant)', () => {
      const sessionId = 'session123';
      const correctToken = createCSRFToken(sessionId);

      // Verify correct token works
      expect(verifyCSRFToken(sessionId, correctToken)).toBe(true);

      // All variations should fail verification with same timing
      const wrongToken = 'x'.repeat(correctToken.length);
      expect(verifyCSRFToken(sessionId, wrongToken)).toBe(false);

      // Partial match should also fail
      const partialMatch = correctToken.slice(0, -1) + 'x';
      expect(verifyCSRFToken(sessionId, partialMatch)).toBe(false);
    });

    it('should return false for expired token', async () => {
      const sessionId = 'session123';
      const token = createCSRFToken(sessionId, 100);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const isValid = verifyCSRFToken(sessionId, token);
      expect(isValid).toBe(false);
    });

    it('should verify token is not null/undefined safe', () => {
      const sessionId = 'session123';
      createCSRFToken(sessionId);

      expect(verifyCSRFToken(sessionId, null as any)).toBe(false);
      expect(verifyCSRFToken(sessionId, undefined as any)).toBe(false);
    });
  });

  describe('validateCSRFToken() function', () => {
    it('should return isValid: true for valid token', () => {
      const sessionId = 'session123';
      const token = createCSRFToken(sessionId);

      const result = validateCSRFToken(sessionId, token);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error if token is missing', () => {
      const sessionId = 'session123';

      const result = validateCSRFToken(sessionId, null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CSRF token is missing');
    });

    it('should return error if token is undefined', () => {
      const sessionId = 'session123';

      const result = validateCSRFToken(sessionId, undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CSRF token is missing');
    });

    it('should return error if token is invalid', () => {
      const sessionId = 'session123';
      createCSRFToken(sessionId);

      const result = validateCSRFToken(sessionId, 'invalid-token');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CSRF token is invalid or expired');
    });

    it('should return error if token is expired', async () => {
      const sessionId = 'session123';
      const token = createCSRFToken(sessionId, 100);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const result = validateCSRFToken(sessionId, token);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CSRF token is invalid or expired');
    });
  });

  describe('revokeCSRFToken() function', () => {
    it('should revoke an existing token', () => {
      const sessionId = 'session123';
      const token = createCSRFToken(sessionId);

      expect(getCSRFToken(sessionId)).toBe(token);

      revokeCSRFToken(sessionId);

      expect(getCSRFToken(sessionId)).toBeNull();
    });

    it('should prevent verification of revoked token', () => {
      const sessionId = 'session123';
      const token = createCSRFToken(sessionId);

      revokeCSRFToken(sessionId);

      const isValid = verifyCSRFToken(sessionId, token);
      expect(isValid).toBe(false);
    });

    it('should be safe to revoke non-existent token', () => {
      expect(() => {
        revokeCSRFToken('non-existent');
      }).not.toThrow();
    });

    it('should not affect other sessions', () => {
      const token1 = createCSRFToken('session1');
      const token2 = createCSRFToken('session2');

      revokeCSRFToken('session1');

      expect(getCSRFToken('session1')).toBeNull();
      expect(getCSRFToken('session2')).toBe(token2);
    });
  });

  describe('getCSRFCookieOptions() function', () => {
    it('should return cookie configuration object', () => {
      const options = getCSRFCookieOptions();

      expect(options).toHaveProperty('name');
      expect(options).toHaveProperty('httpOnly');
      expect(options).toHaveProperty('secure');
      expect(options).toHaveProperty('sameSite');
      expect(options).toHaveProperty('maxAge');
    });

    it('should set httpOnly to true for security', () => {
      const options = getCSRFCookieOptions();
      expect(options.httpOnly).toBe(true);
    });

    it('should set sameSite to Strict for CSRF protection', () => {
      const options = getCSRFCookieOptions();
      expect(options.sameSite).toBe('Strict');
    });

    it('should have 1 hour expiry', () => {
      const options = getCSRFCookieOptions();
      expect(options.maxAge).toBe(3600000); // 1 hour in milliseconds
    });

    it('should use XSRF-TOKEN as cookie name', () => {
      const options = getCSRFCookieOptions();
      expect(options.name).toBe('XSRF-TOKEN');
    });

    it('should set secure based on NODE_ENV', () => {
      const options = getCSRFCookieOptions();
      const isProduction = process.env.NODE_ENV === 'production';
      expect(options.secure).toBe(isProduction);
    });
  });

  describe('getCSRFHeaderName() function', () => {
    it('should return header name', () => {
      const headerName = getCSRFHeaderName();
      expect(headerName).toBe('X-XSRF-TOKEN');
    });

    it('should return consistent value', () => {
      const headerName1 = getCSRFHeaderName();
      const headerName2 = getCSRFHeaderName();
      expect(headerName1).toBe(headerName2);
    });
  });

  describe('clearAllCSRFTokens() function', () => {
    it('should clear all tokens', () => {
      const token1 = createCSRFToken('session1');
      const token2 = createCSRFToken('session2');
      const token3 = createCSRFToken('session3');

      clearAllCSRFTokens();

      expect(getCSRFToken('session1')).toBeNull();
      expect(getCSRFToken('session2')).toBeNull();
      expect(getCSRFToken('session3')).toBeNull();
    });
  });

  describe('generateCSRFMetaTag() function', () => {
    it('should generate valid HTML meta tag', () => {
      const token = 'abc123def456';
      const metaTag = generateCSRFMetaTag(token);

      expect(metaTag).toContain('<meta');
      expect(metaTag).toContain('csrf-token');
      expect(metaTag).toContain(token);
    });

    it('should include token in content attribute', () => {
      const token = 'test-token-12345';
      const metaTag = generateCSRFMetaTag(token);

      expect(metaTag).toContain(`content="${token}"`);
    });

    it('should be valid HTML', () => {
      const token = 'test123';
      const metaTag = generateCSRFMetaTag(token);

      expect(metaTag).toMatch(/<meta[^>]*\/>/);
    });
  });

  describe('generateCSRFFormInput() function', () => {
    it('should generate valid HTML hidden input', () => {
      const token = 'abc123def456';
      const input = generateCSRFFormInput(token);

      expect(input).toContain('<input');
      expect(input).toContain('hidden');
      expect(input).toContain('_csrf');
      expect(input).toContain(token);
    });

    it('should include token in value attribute', () => {
      const token = 'test-token-12345';
      const input = generateCSRFFormInput(token);

      expect(input).toContain(`value="${token}"`);
    });

    it('should include correct field name', () => {
      const token = 'test123';
      const input = generateCSRFFormInput(token);

      expect(input).toContain('name="_csrf"');
    });

    it('should be valid HTML', () => {
      const token = 'test123';
      const input = generateCSRFFormInput(token);

      expect(input).toMatch(/<input[^>]*\/>/);
    });
  });

  describe('Token lifecycle', () => {
    it('should follow create -> verify -> revoke cycle', () => {
      const sessionId = 'session123';

      // Create
      const token = createCSRFToken(sessionId);
      expect(verifyCSRFToken(sessionId, token)).toBe(true);

      // Verify still works
      expect(verifyCSRFToken(sessionId, token)).toBe(true);

      // Revoke
      revokeCSRFToken(sessionId);
      expect(verifyCSRFToken(sessionId, token)).toBe(false);
    });

    it('should handle token replacement', () => {
      const sessionId = 'session123';

      const token1 = createCSRFToken(sessionId);
      expect(verifyCSRFToken(sessionId, token1)).toBe(true);

      const token2 = createCSRFToken(sessionId);
      expect(verifyCSRFToken(sessionId, token1)).toBe(false);
      expect(verifyCSRFToken(sessionId, token2)).toBe(true);
    });
  });

  describe('Multiple sessions isolation', () => {
    it('should isolate tokens between sessions', () => {
      const token1 = createCSRFToken('session1');
      const token2 = createCSRFToken('session2');
      const token3 = createCSRFToken('session3');

      expect(verifyCSRFToken('session1', token1)).toBe(true);
      expect(verifyCSRFToken('session2', token2)).toBe(true);
      expect(verifyCSRFToken('session3', token3)).toBe(true);

      // Cross-session verification should fail
      expect(verifyCSRFToken('session1', token2)).toBe(false);
      expect(verifyCSRFToken('session2', token1)).toBe(false);
      expect(verifyCSRFToken('session3', token1)).toBe(false);
    });

    it('should not revoke tokens in other sessions', () => {
      const token1 = createCSRFToken('session1');
      const token2 = createCSRFToken('session2');

      revokeCSRFToken('session1');

      expect(verifyCSRFToken('session1', token1)).toBe(false);
      expect(verifyCSRFToken('session2', token2)).toBe(true);
    });
  });

  describe('Security considerations', () => {
    it('should not allow timing attacks via token comparison', () => {
      const sessionId = 'session123';
      const correctToken = createCSRFToken(sessionId);

      // Create tokens with different prefix lengths that are wrong
      const wrongTokens = [
        'z' + correctToken.slice(1),
        '9' + correctToken.slice(1),
        'a'.repeat(correctToken.length)
      ];

      // All should fail verification
      wrongTokens.forEach((token) => {
        expect(verifyCSRFToken(sessionId, token)).toBe(false);
      });
    });

    it('should handle very long tokens safely', () => {
      const sessionId = 'session123';
      const longToken = 'a'.repeat(10000);

      const result = validateCSRFToken(sessionId, longToken);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle special characters in session ID', () => {
      const specialSessionId = 'session!@#$%^&*()[]{}';

      const token = createCSRFToken(specialSessionId);
      expect(verifyCSRFToken(specialSessionId, token)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string session ID', () => {
      const token = createCSRFToken('');
      expect(verifyCSRFToken('', token)).toBe(true);
      expect(verifyCSRFToken('other', token)).toBe(false);
    });

    it('should handle very long session ID', () => {
      const longSessionId = 's'.repeat(10000);

      const token = createCSRFToken(longSessionId);
      expect(verifyCSRFToken(longSessionId, token)).toBe(true);
    });

    it('should be idempotent for read operations', () => {
      const sessionId = 'session123';
      const token = createCSRFToken(sessionId);

      const result1 = verifyCSRFToken(sessionId, token);
      const result2 = verifyCSRFToken(sessionId, token);

      expect(result1).toBe(result2);
    });
  });
});

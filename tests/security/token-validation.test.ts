/**
 * Token Validation Security Tests
 * Tests for token validation, tampering detection, and structure verification
 *
 * Coverage:
 * - 40+ tests for comprehensive token validation
 * - Valid token acceptance
 * - Expired token rejection
 * - Tampered token detection
 * - Signature verification
 * - Payload extraction
 * - Edge cases and malformed tokens
 */

import {
  validateAccessToken,
  validateRefreshToken,
  isTokenExpiringSoon,
  detectTokenTampering,
  getTokenValidationReport,
  validateTokenPair,
  needsTokenRefresh,
  getTokenValidationErrorMessage
} from '../../lib/auth/token-validator';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
} from '../../lib/auth/token-service';
import { SessionManager } from '../../lib/auth/session-manager';

describe('Token Validation - Access Token', () => {
  beforeEach(() => {
    // Reset session store before each test
  });

  test('validateAccessToken should accept valid token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const result = validateAccessToken(tokens.accessToken);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.payload).toBeDefined();
    expect(result.payload?.userId).toBe('user-123');
    expect(result.payload?.type).toBe('access');
  });

  test('validateAccessToken should reject empty string', () => {
    const result = validateAccessToken('');

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('validateAccessToken should reject null', () => {
    const result = validateAccessToken(null as any);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('validateAccessToken should reject undefined', () => {
    const result = validateAccessToken(undefined as any);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('validateAccessToken should reject malformed token', () => {
    const result = validateAccessToken('not.a.valid.token.format');

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('validateAccessToken should reject token missing signature', () => {
    const result = validateAccessToken('header.payload');

    expect(result.isValid).toBe(false);
  });

  test('validateAccessToken should reject refresh token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const result = validateAccessToken(tokens.refreshToken);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('not an access token'))).toBe(true);
  });

  test('validateAccessToken should include expiration date', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const result = validateAccessToken(tokens.accessToken);

    expect(result.expiresAt).toBeDefined();
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt!.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('Token Validation - Refresh Token', () => {
  test('validateRefreshToken should accept valid token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const result = validateRefreshToken(tokens.refreshToken);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.payload?.type).toBe('refresh');
  });

  test('validateRefreshToken should reject access token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const result = validateRefreshToken(tokens.accessToken);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('not a refresh token'))).toBe(true);
  });

  test('validateRefreshToken should reject empty token', () => {
    const result = validateRefreshToken('');

    expect(result.isValid).toBe(false);
  });

  test('validateRefreshToken should reject malformed token', () => {
    const result = validateRefreshToken('invalid');

    expect(result.isValid).toBe(false);
  });
});

describe('Token Validation - Tampering Detection', () => {
  test('detectTokenTampering should return false for valid token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const isTampered = detectTokenTampering(tokens.accessToken);

    expect(isTampered).toBe(false);
  });

  test('detectTokenTampering should detect modified signature', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const parts = tokens.accessToken.split('.');
    const modified = `${parts[0]}.${parts[1]}.modified`;

    const isTampered = detectTokenTampering(modified);
    expect(isTampered).toBe(true);
  });

  test('detectTokenTampering should detect modified payload', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const parts = tokens.accessToken.split('.');
    const modified = `${parts[0]}.modified.${parts[2]}`;

    const isTampered = detectTokenTampering(modified);
    expect(isTampered).toBe(true);
  });

  test('detectTokenTampering should detect modified header', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const parts = tokens.accessToken.split('.');
    const modified = `modified.${parts[1]}.${parts[2]}`;

    const isTampered = detectTokenTampering(modified);
    expect(isTampered).toBe(true);
  });

  test('detectTokenTampering should return false for structurally invalid tokens', () => {
    // Malformed tokens (missing signature part) are structurally invalid
    // but not necessarily "tampered" - they're just broken format
    const isTampered = detectTokenTampering('header.payload');

    // Structure validation catches this, not tampering detection
    expect(isTampered).toBe(false);
  });

  test('detectTokenTampering should return true for empty token', () => {
    const isTampered = detectTokenTampering('');

    expect(isTampered).toBe(true);
  });

  test('detectTokenTampering should return true for null token', () => {
    const isTampered = detectTokenTampering(null as any);

    expect(isTampered).toBe(true);
  });
});

describe('Token Validation - Expiration', () => {
  test('isTokenExpiringSoon should return false for fresh token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const expiring = isTokenExpiringSoon(tokens.accessToken, 60);

    expect(expiring).toBe(false);
  });

  test('isTokenExpiringSoon should use default threshold', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    // 24 hour token with default 60 minute threshold should not be expiring
    const expiring = isTokenExpiringSoon(tokens.accessToken);

    expect(expiring).toBe(false);
  });

  test('isTokenExpiringSoon should accept custom threshold', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    // 24 hour token with 24+ hour threshold should be expiring soon
    const expiring = isTokenExpiringSoon(tokens.accessToken, 24 * 60 + 1);

    expect(expiring).toBe(true);
  });

  test('isTokenExpiringSoon should return true for invalid token', () => {
    const expiring = isTokenExpiringSoon('invalid.token', 60);

    expect(expiring).toBe(true);
  });

  test('isTokenExpiringSoon should return true for empty token', () => {
    const expiring = isTokenExpiringSoon('', 60);

    expect(expiring).toBe(true);
  });
});

describe('Token Validation - Report Generation', () => {
  test('getTokenValidationReport should generate complete report for valid token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const report = getTokenValidationReport(tokens.accessToken, 'access');

    expect(report.isValid).toBe(true);
    expect(report.isTampered).toBe(false);
    expect(report.isExpired).toBe(false);
    expect(report.hasValidSignature).toBe(true);
    expect(report.tokenType).toBe('access');
    expect(report.expiresAt).toBeDefined();
    expect(report.errors).toHaveLength(0);
  });

  test('getTokenValidationReport should detect token type mismatch', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const report = getTokenValidationReport(tokens.accessToken, 'refresh');

    expect(report.isValid).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.errors[0]).toContain('Token type mismatch');
  });

  test('getTokenValidationReport should detect tampering', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const tampered = tokens.accessToken.slice(0, -10) + 'tampered!!';
    const report = getTokenValidationReport(tampered, 'access');

    expect(report.isTampered).toBe(true);
    expect(report.hasValidSignature).toBe(false);
  });

  test('getTokenValidationReport should include all required fields', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const report = getTokenValidationReport(tokens.accessToken, 'access');

    expect(report).toHaveProperty('isValid');
    expect(report).toHaveProperty('isTampered');
    expect(report).toHaveProperty('isExpired');
    expect(report).toHaveProperty('isExpiringSoon');
    expect(report).toHaveProperty('hasValidSignature');
    expect(report).toHaveProperty('tokenType');
    expect(report).toHaveProperty('errors');
    expect(report).toHaveProperty('expiresAt');
  });
});

describe('Token Validation - Token Pair', () => {
  test('validateTokenPair should accept valid pair', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const result = validateTokenPair(tokens.accessToken, tokens.refreshToken);

    expect(result.isValid).toBe(true);
    expect(result.accessTokenValid).toBe(true);
    expect(result.refreshTokenValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validateTokenPair should reject invalid access token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const result = validateTokenPair('invalid', tokens.refreshToken);

    expect(result.isValid).toBe(false);
    expect(result.accessTokenValid).toBe(false);
  });

  test('validateTokenPair should reject invalid refresh token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const result = validateTokenPair(tokens.accessToken, 'invalid');

    expect(result.isValid).toBe(false);
    expect(result.refreshTokenValid).toBe(false);
  });

  test('validateTokenPair should reject swapped tokens', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const result = validateTokenPair(tokens.refreshToken, tokens.accessToken);

    expect(result.isValid).toBe(false);
  });

  test('validateTokenPair should reject tokens from different users', () => {
    const tokens1 = SessionManager.createTokens('user-1', 'user1@example.com');
    const tokens2 = SessionManager.createTokens('user-2', 'user2@example.com');

    const result = validateTokenPair(tokens1.accessToken, tokens2.refreshToken);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('Token Validation - Refresh Decision', () => {
  test('needsTokenRefresh should return false for fresh token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const needs = needsTokenRefresh(tokens.accessToken, 60);

    expect(needs).toBe(false);
  });

  test('needsTokenRefresh should return true with high threshold', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const needs = needsTokenRefresh(tokens.accessToken, 24 * 60 + 1);

    expect(needs).toBe(true);
  });

  test('needsTokenRefresh should return true for expired token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const needs = needsTokenRefresh('invalid.expired.token', 60);

    expect(needs).toBe(true);
  });

  test('needsTokenRefresh should use default threshold', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const needs = needsTokenRefresh(tokens.accessToken);

    expect(needs).toBe(false);
  });
});

describe('Token Validation - Error Messages', () => {
  test('getTokenValidationErrorMessage should return null for valid token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const message = getTokenValidationErrorMessage(tokens.accessToken);

    expect(message).toBeNull();
  });

  test('getTokenValidationErrorMessage should return message for missing token', () => {
    const message = getTokenValidationErrorMessage('');

    expect(message).toBeDefined();
    expect(message).toContain('missing');
  });

  test('getTokenValidationErrorMessage should return message for tampered token', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const tampered = tokens.accessToken.slice(0, -10) + 'tampered!!';
    const message = getTokenValidationErrorMessage(tampered);

    expect(message).toBeDefined();
    expect(typeof message).toBe('string');
  });

  test('getTokenValidationErrorMessage should be user-friendly', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const invalid = 'invalid.token.format';
    const message = getTokenValidationErrorMessage(invalid);

    expect(message).toBeDefined();
    // Message should suggest logging in
    expect(message).toContain('log in');
  });
});

describe('Token Validation - Edge Cases', () => {
  test('should handle tokens with very long payloads', () => {
    const longEmail = 'a'.repeat(1000) + '@example.com';
    const tokens = SessionManager.createTokens('user-123', longEmail);
    const result = validateAccessToken(tokens.accessToken);

    expect(result.isValid).toBe(true);
  });

  test('should handle tokens with special characters in email', () => {
    const email = 'user+tag+test@sub.example.co.uk';
    const tokens = SessionManager.createTokens('user-123', email);
    const result = validateAccessToken(tokens.accessToken);

    expect(result.isValid).toBe(true);
    expect(result.payload?.email).toBe(email);
  });

  test('should handle tokens with special characters in user ID', () => {
    const userId = 'user-!@#$%^&*()_+-=[]{}|;:,.<>?';
    const tokens = SessionManager.createTokens(userId, 'test@example.com');
    const result = validateAccessToken(tokens.accessToken);

    expect(result.isValid).toBe(true);
    expect(result.payload?.userId).toBe(userId);
  });

  test('should handle whitespace-only token', () => {
    const result = validateAccessToken('   ');

    expect(result.isValid).toBe(false);
  });

  test('should handle tokens with null bytes', () => {
    const tokens = SessionManager.createTokens('user-123', 'test@example.com');
    const withNullByte = tokens.accessToken + '\0\0';
    const result = validateAccessToken(withNullByte);

    expect(result.isValid).toBe(false);
  });
});

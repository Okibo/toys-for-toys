/**
 * Token Validator Module
 * Validates JWT tokens and detects tampering
 *
 * Features:
 * - Access token validation (24-hour expiry)
 * - Refresh token validation (7-day expiry)
 * - Signature verification with timing-attack resistance
 * - Token tampering detection
 * - Expiration checking
 * - Claim validation
 */

import {
  verifyToken,
  isTokenValid,
  isTokenType,
  getTokenExpiration,
  validateTokenStructure,
  TokenPayload
} from './token-service';

/**
 * Access token validation result
 */
export interface AccessTokenValidationResult {
  isValid: boolean;
  errors: string[];
  payload?: TokenPayload;
  expiresAt?: Date;
}

/**
 * Refresh token validation result
 */
export interface RefreshTokenValidationResult {
  isValid: boolean;
  errors: string[];
  payload?: TokenPayload;
  expiresAt?: Date;
}

/**
 * Validate an access token
 * Checks signature, expiration, and token type
 *
 * @param token - JWT access token
 * @returns Validation result
 */
export function validateAccessToken(token: string): AccessTokenValidationResult {
  const errors: string[] = [];

  // Validate structure first
  const structureResult = validateTokenStructure(token);
  if (!structureResult.isValid) {
    return {
      isValid: false,
      errors: structureResult.errors
    };
  }

  // Verify token signature and expiration
  const decoded = verifyToken(token);
  if (!decoded) {
    errors.push('Token signature is invalid or has expired');
    return { isValid: false, errors };
  }

  // Check token type
  if (decoded.type !== 'access') {
    errors.push('Token is not an access token (expected type: access)');
    return { isValid: false, errors };
  }

  // Return successful validation
  return {
    isValid: true,
    errors: [],
    payload: decoded,
    expiresAt: new Date(decoded.exp * 1000)
  };
}

/**
 * Validate a refresh token
 * Checks signature, expiration, and token type
 *
 * @param token - JWT refresh token
 * @returns Validation result
 */
export function validateRefreshToken(token: string): RefreshTokenValidationResult {
  const errors: string[] = [];

  // Validate structure first
  const structureResult = validateTokenStructure(token);
  if (!structureResult.isValid) {
    return {
      isValid: false,
      errors: structureResult.errors
    };
  }

  // Verify token signature and expiration
  const decoded = verifyToken(token);
  if (!decoded) {
    errors.push('Token signature is invalid or has expired');
    return { isValid: false, errors };
  }

  // Check token type
  if (decoded.type !== 'refresh') {
    errors.push('Token is not a refresh token (expected type: refresh)');
    return { isValid: false, errors };
  }

  // Return successful validation
  return {
    isValid: true,
    errors: [],
    payload: decoded,
    expiresAt: new Date(decoded.exp * 1000)
  };
}

/**
 * Check if token will expire within a certain threshold
 * Useful for proactive token refresh
 *
 * @param token - JWT token
 * @param minutesThreshold - Threshold in minutes (default: 60)
 * @returns True if token expires within threshold
 */
export function isTokenExpiringSoon(token: string, minutesThreshold: number = 60): boolean {
  if (!token || typeof token !== 'string') {
    return true; // Treat invalid tokens as expiring soon
  }

  const expiresAt = getTokenExpiration(token);
  if (!expiresAt) {
    return true; // Treat invalid tokens as expiring soon
  }

  const now = new Date();
  const thresholdMs = minutesThreshold * 60 * 1000;
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();

  return timeUntilExpiry < thresholdMs;
}

/**
 * Detect if a token has been tampered with
 * Checks if signature verification fails
 *
 * @param token - JWT token
 * @returns True if tampering is detected
 */
export function detectTokenTampering(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return true; // Treat invalid tokens as tampered
  }

  // If structure validation passes but token verification fails, it's tampered
  const structureResult = validateTokenStructure(token);
  if (!structureResult.isValid) {
    // Check if it's a structure error or tampering
    const structureErrors = structureResult.errors.join('|');
    if (structureErrors.includes('signature is invalid')) {
      return true; // Signature error = tampering
    }
    if (structureErrors.includes('corrupted')) {
      return true; // Corrupted = tampering
    }
  }

  return false;
}

/**
 * Get detailed validation report for a token
 * Useful for debugging authentication issues
 *
 * @param token - JWT token
 * @param expectedType - Expected token type ('access' or 'refresh')
 * @returns Detailed validation report
 */
export function getTokenValidationReport(
  token: string,
  expectedType: 'access' | 'refresh'
): {
  isValid: boolean;
  isTampered: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  hasValidSignature: boolean;
  tokenType: string | null;
  errors: string[];
  expiresAt?: Date;
} {
  const errors: string[] = [];
  const expiresAt = getTokenExpiration(token);

  // Check if tampered
  const isTampered = detectTokenTampering(token);
  if (isTampered) {
    errors.push('Token signature is invalid (possible tampering)');
  }

  // Check structure
  const structureResult = validateTokenStructure(token);
  const hasValidSignature = structureResult.isValid && !isTampered;

  // Determine if expired
  const isExpired = !isTokenValid(token);
  if (isExpired && expiresAt && expiresAt < new Date()) {
    errors.push(`Token expired at ${expiresAt.toISOString()}`);
  }

  // Check if expiring soon
  const isExpiringSoon = isTokenExpiringSoon(token, 60);

  // Get token type
  const decoded = structureResult.payload;
  const tokenType = decoded?.type || null;

  // Check token type matches expected
  if (tokenType && tokenType !== expectedType) {
    errors.push(`Token type mismatch: expected ${expectedType}, got ${tokenType}`);
  }

  return {
    isValid: hasValidSignature && !isExpired && tokenType === expectedType,
    isTampered,
    isExpired,
    isExpiringSoon,
    hasValidSignature,
    tokenType,
    errors,
    expiresAt
  };
}

/**
 * Validate token pair (access + refresh)
 * Checks that both tokens are valid and of correct type
 *
 * @param accessToken - Access token
 * @param refreshToken - Refresh token
 * @returns Validation result
 */
export function validateTokenPair(
  accessToken: string,
  refreshToken: string
): {
  isValid: boolean;
  accessTokenValid: boolean;
  refreshTokenValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const accessValidation = validateAccessToken(accessToken);
  const refreshValidation = validateRefreshToken(refreshToken);

  if (!accessValidation.isValid) {
    errors.push(`Access token invalid: ${accessValidation.errors.join(', ')}`);
  }

  if (!refreshValidation.isValid) {
    errors.push(`Refresh token invalid: ${refreshValidation.errors.join(', ')}`);
  }

  // Verify both tokens belong to same user
  if (accessValidation.payload && refreshValidation.payload) {
    if (accessValidation.payload.userId !== refreshValidation.payload.userId) {
      errors.push('Access and refresh tokens belong to different users');
    }
    if (accessValidation.payload.email !== refreshValidation.payload.email) {
      errors.push('Access and refresh tokens have different email addresses');
    }
  }

  return {
    isValid: accessValidation.isValid && refreshValidation.isValid && errors.length === 0,
    accessTokenValid: accessValidation.isValid,
    refreshTokenValid: refreshValidation.isValid,
    errors
  };
}

/**
 * Check if token needs refresh
 * Returns true if token is expiring soon or already expired
 *
 * @param token - JWT token
 * @param minutesThreshold - Refresh threshold in minutes (default: 60)
 * @returns True if token needs refresh
 */
export function needsTokenRefresh(token: string, minutesThreshold: number = 60): boolean {
  if (!isTokenValid(token)) {
    return true; // Already expired
  }

  return isTokenExpiringSoon(token, minutesThreshold);
}

/**
 * Get human-readable token validation error
 * Converts technical errors to user-friendly messages
 *
 * @param token - JWT token
 * @returns User-friendly error message or null if valid
 */
export function getTokenValidationErrorMessage(token: string): string | null {
  if (!token) {
    return 'Authentication token is missing. Please log in again.';
  }

  const report = getTokenValidationReport(token, 'access');

  if (report.isTampered) {
    return 'Security validation failed. Please log in again.';
  }

  if (report.isExpired) {
    return 'Your session has expired. Please log in again.';
  }

  if (!report.hasValidSignature) {
    return 'Your session is invalid. Please log in again.';
  }

  if (!report.isValid) {
    return 'Authentication failed. Please log in again.';
  }

  return null;
}

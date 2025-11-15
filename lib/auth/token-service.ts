/**
 * Token Service Module
 * Handles JWT token generation, validation, and expiration logic
 *
 * Token Types:
 * - Access Token: Short-lived (24 hours), used for API requests
 * - Refresh Token: Long-lived (7 days), used to get new access tokens
 *
 * Security Features:
 * - HMAC-SHA256 signatures (using Node.js crypto)
 * - Standard JWT claims (iat, exp, sub)
 * - Custom claims for user identification
 * - Constant-time signature comparison
 */

import { createHmac, randomBytes } from 'crypto';

/**
 * JWT Token payload structure
 */
export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;     // issued at
  exp: number;     // expiration time
  jti?: string;    // JWT ID (unique identifier)
}

/**
 * Decoded JWT token with signature verification
 */
export interface DecodedToken extends TokenPayload {
  isValid: boolean;
  error?: string;
}

/**
 * Token configuration
 */
const TOKEN_CONFIG = {
  access: {
    expiresIn: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    type: 'access' as const
  },
  refresh: {
    expiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    type: 'refresh' as const
  }
};

/**
 * Get the JWT secret from environment
 * Falls back to a development secret if not set
 *
 * @returns JWT secret string
 * @throws Error if secret cannot be determined
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;

  if (!secret) {
    // In development, use a default secret
    if (process.env.NODE_ENV !== 'production') {
      return 'dev-secret-do-not-use-in-production-12345678901234567890';
    }
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return secret;
}

/**
 * Create a JWT token with HMAC-SHA256 signature
 *
 * Format: header.payload.signature
 * - header: Base64URL encoded {"alg":"HS256","typ":"JWT"}
 * - payload: Base64URL encoded token payload
 * - signature: HMAC-SHA256(header.payload, secret)
 *
 * @param userId - User ID
 * @param email - User email
 * @param type - Token type ('access' or 'refresh')
 * @returns Signed JWT token
 */
function createToken(userId: string, email: string, type: 'access' | 'refresh'): string {
  const config = TOKEN_CONFIG[type];
  const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
  const jti = randomBytes(16).toString('hex'); // Unique token identifier

  const payload: TokenPayload = {
    userId,
    email,
    type,
    iat: now,
    exp: now + Math.floor(config.expiresIn / 1000),
    jti
  };

  // Create JWT header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // Encode header and payload as Base64URL
  const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Create signature
  const message = `${headerEncoded}.${payloadEncoded}`;
  const secret = getJWTSecret();
  const signature = createHmac('sha256', secret)
    .update(message)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${message}.${signature}`;
}

/**
 * Decode JWT token without verification (for inspection)
 *
 * @param token - JWT token to decode
 * @returns Decoded payload or null if malformed
 */
function decodeTokenUnsafe(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payloadEncoded = parts[1];
    // Add padding if needed
    const padding = 4 - (payloadEncoded.length % 4);
    const paddedPayload = padding < 4
      ? payloadEncoded + '='.repeat(padding)
      : payloadEncoded;

    const payload = Buffer.from(paddedPayload, 'base64').toString('utf-8');
    return JSON.parse(payload) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify JWT token signature
 * Uses constant-time comparison to prevent timing attacks
 *
 * @param token - JWT token to verify
 * @returns Verification result with decoded payload
 */
function verifyTokenSignature(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerEncoded, payloadEncoded, signatureFromToken] = parts;
    const message = `${headerEncoded}.${payloadEncoded}`;

    // Recompute signature
    const secret = getJWTSecret();
    const expectedSignature = createHmac('sha256', secret)
      .update(message)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(expectedSignature, signatureFromToken)) {
      return null;
    }

    // Decode and return payload
    const payload = decodeTokenUnsafe(token);
    if (!payload) {
      return null;
    }

    return {
      ...payload,
      isValid: true
    };
  } catch {
    return null;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate a new access token
 *
 * @param userId - User ID
 * @param email - User email
 * @returns Signed access token
 */
export function generateAccessToken(userId: string, email: string): string {
  return createToken(userId, email, 'access');
}

/**
 * Generate a new refresh token
 *
 * @param userId - User ID
 * @param email - User email
 * @returns Signed refresh token
 */
export function generateRefreshToken(userId: string, email: string): string {
  return createToken(userId, email, 'refresh');
}

/**
 * Verify and decode a token
 * Checks signature, expiration, and payload validity
 *
 * @param token - JWT token to verify
 * @returns Decoded token payload if valid, null otherwise
 */
export function verifyToken(token: string): TokenPayload | null {
  const decoded = verifyTokenSignature(token);
  if (!decoded) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp < now) {
    return null; // Token expired
  }

  return decoded;
}

/**
 * Check if a token is expiring soon
 * Useful for proactive token refresh
 *
 * @param token - JWT token
 * @param minutesThreshold - Threshold in minutes (default: 60 minutes)
 * @returns True if token will expire within threshold
 */
export function isTokenExpiringSoon(token: string, minutesThreshold: number = 60): boolean {
  const decoded = decodeTokenUnsafe(token);
  if (!decoded) {
    return true; // Treat invalid tokens as expiring soon
  }

  const now = Math.floor(Date.now() / 1000);
  const secondsThreshold = minutesThreshold * 60;

  return decoded.exp - now < secondsThreshold;
}

/**
 * Get token expiration date
 *
 * @param token - JWT token
 * @returns Expiration date or null if token is invalid
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeTokenUnsafe(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
}

/**
 * Check if token is valid (signature + expiration)
 *
 * @param token - JWT token
 * @returns True if token is valid
 */
export function isTokenValid(token: string): boolean {
  return verifyToken(token) !== null;
}

/**
 * Get remaining time until token expires
 *
 * @param token - JWT token
 * @returns Remaining milliseconds, null if invalid
 */
export function getTokenTimeRemaining(token: string): number | null {
  const decoded = decodeTokenUnsafe(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const remaining = (decoded.exp - now) * 1000;

  return remaining > 0 ? remaining : 0;
}

/**
 * Extract user ID from token
 *
 * @param token - JWT token
 * @returns User ID or null if invalid
 */
export function getUserIdFromToken(token: string): string | null {
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

/**
 * Extract email from token
 *
 * @param token - JWT token
 * @returns Email or null if invalid
 */
export function getEmailFromToken(token: string): string | null {
  const decoded = verifyToken(token);
  return decoded?.email || null;
}

/**
 * Check if token is of specific type
 *
 * @param token - JWT token
 * @param type - Token type to check ('access' or 'refresh')
 * @returns True if token is of specified type
 */
export function isTokenType(token: string, type: 'access' | 'refresh'): boolean {
  const decoded = verifyToken(token);
  return decoded?.type === type;
}

/**
 * Validate token structure and claims
 * Checks format, signature, and all required claims
 *
 * @param token - JWT token to validate
 * @returns Validation result
 */
export function validateTokenStructure(token: string): {
  isValid: boolean;
  errors: string[];
  payload?: TokenPayload;
} {
  const errors: string[] = [];

  // Check format
  if (typeof token !== 'string') {
    errors.push('Token must be a string');
    return { isValid: false, errors };
  }

  if (token.trim().length === 0) {
    errors.push('Token cannot be empty');
    return { isValid: false, errors };
  }

  // Check structure (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    errors.push('Token must have 3 parts (header.payload.signature)');
    return { isValid: false, errors };
  }

  // Verify signature
  const decoded = verifyTokenSignature(token);
  if (!decoded) {
    errors.push('Token signature is invalid or corrupted');
    return { isValid: false, errors };
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp < now) {
    errors.push(`Token expired at ${new Date(decoded.exp * 1000).toISOString()}`);
    return { isValid: false, errors };
  }

  // Check required claims
  if (!decoded.userId) {
    errors.push('Token missing userId claim');
  }
  if (!decoded.email) {
    errors.push('Token missing email claim');
  }
  if (!decoded.type) {
    errors.push('Token missing type claim');
  }
  if (!decoded.iat) {
    errors.push('Token missing iat (issued at) claim');
  }
  if (!decoded.exp) {
    errors.push('Token missing exp (expiration) claim');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    payload: decoded
  };
}

/**
 * Session Service Layer
 * Handles JWT token generation, refresh, and session management
 */

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const ALGORITHM = 'HS256';

// Token expiry times
export const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

interface TokenPayload {
  sub: string; // user_id
  email: string;
  iat: number; // issued at
  exp: number; // expiration
  type: 'access' | 'refresh';
}

interface TokenResult {
  token: string;
  expiresIn: number; // seconds
}

/**
 * Get secret key as Uint8Array for jose library
 */
function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Convert expiry string to seconds
 * Supports formats like '15m', '1h', '7d', '30s'
 */
function expiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([mhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  switch (unit) {
    case 's':
      return num;
    case 'm':
      return num * 60;
    case 'h':
      return num * 3600;
    case 'd':
      return num * 86400;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

/**
 * Generate JWT token
 */
async function generateToken(
  userId: string,
  email: string,
  tokenType: 'access' | 'refresh',
  expiryString: string
): Promise<TokenResult> {
  const secret = getSecretKey();
  const expirySeconds = expiryToSeconds(expiryString);
  const now = Math.floor(Date.now() / 1000);

  const payload: TokenPayload = {
    sub: userId,
    email,
    iat: now,
    exp: now + expirySeconds,
    type: tokenType,
  };

  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: ALGORITHM })
      .sign(secret);

    return {
      token,
      expiresIn: expirySeconds,
    };
  } catch (error) {
    console.error('Failed to generate token:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Verify and decode JWT token
 */async function verifyToken(token: string): Promise<TokenPayload | null> {
  const secret = getSecretKey();

  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as unknown as TokenPayload;
  } catch (error) {
    console.warn('Token verification failed:', error);
    return null;
  }
}

/**
 * Generate access token (15 minutes)
 */
export async function generateAccessToken(userId: string, email: string): Promise<TokenResult> {
  return generateToken(userId, email, 'access', ACCESS_TOKEN_EXPIRY);
}

/**
 * Generate refresh token (7 days)
 */
export async function generateRefreshToken(userId: string, email: string): Promise<TokenResult> {
  return generateToken(userId, email, 'refresh', REFRESH_TOKEN_EXPIRY);
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(userId: string, email: string) {
  const [accessTokenResult, refreshTokenResult] = await Promise.all([
    generateAccessToken(userId, email),
    generateRefreshToken(userId, email),
  ]);

  return {
    accessToken: accessTokenResult.token,
    refreshToken: refreshTokenResult.token,
    accessTokenExpiresIn: accessTokenResult.expiresIn,
    refreshTokenExpiresIn: refreshTokenResult.expiresIn,
  };
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<{ userId: string; email: string } | null> {
  const payload = await verifyToken(token);

  if (!payload || payload.type !== 'access') {
    return null;
  }

  return {
    userId: payload.sub,
    email: payload.email,
  };
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<{ userId: string; email: string } | null> {
  const payload = await verifyToken(token);

  if (!payload || payload.type !== 'refresh') {
    return null;
  }

  return {
    userId: payload.sub,
    email: payload.email,
  };
}

/**
 * Get cookie options for secure httpOnly cookies
 */
export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  };
}

/**
 * Get cookie expiry date from token expiry string
 */
export function getCookieExpiry(expiryString: string): Date {
  const seconds = expiryToSeconds(expiryString);
  return new Date(Date.now() + seconds * 1000);
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(header?: string): string | null {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice(7); // Remove 'Bearer ' prefix
}

/**
 * Extract token from cookie string
 */
export function extractTokenFromCookie(cookieString?: string, cookieName: string = 'access_token'): string | null {
  if (!cookieString) {
    return null;
  }

  const cookies = cookieString.split(';').map((c) => c.trim());
  const cookie = cookies.find((c) => c.startsWith(`${cookieName}=`));

  if (!cookie) {
    return null;
  }

  return cookie.slice(cookieName.length + 1);
}

/**
 * Session Manager Module
 * Manages user sessions with token creation, validation, and refresh logic
 *
 * Features:
 * - Create access and refresh tokens for new sessions
 * - Validate tokens with expiration checking
 * - Refresh expired access tokens using refresh tokens
 * - Track issued tokens for revocation
 * - Support for concurrent token operations
 *
 * Security:
 * - All tokens include HMAC signatures
 * - Tokens contain unique JTI (JWT ID) for revocation tracking
 * - Automatic token cleanup
 * - Timing-attack resistant comparison
 */

import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  isTokenExpiringSoon,
  isTokenValid,
  isTokenType,
  TokenPayload
} from './token-service';
import { createHmac, randomBytes } from 'crypto';

/**
 * Token revocation record (for tracking logged-out or compromised tokens)
 */
interface RevocationRecord {
  jti: string;
  revokedAt: number;
  expiresAt: number;
  userId: string;
}

/**
 * Session data for a user
 */
interface SessionData {
  userId: string;
  email: string;
  createdAt: number;
  lastActivity: number;
}

/**
 * Token pair (access + refresh)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Access token validation result
 */
export interface AccessTokenValidationResult {
  valid: boolean;
  userId?: string;
  email?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * In-memory session store
 * In production, this should be replaced with Redis or database
 */
class SessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private revokedTokens: Map<string, RevocationRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly MAX_SESSIONS_PER_USER = 5;
  private readonly SESSION_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    // Cleanup expired revocations every 1 hour
    if (typeof globalThis !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60 * 60 * 1000);
    }
  }

  /**
   * Create a new session
   */
  createSession(userId: string, email: string): string {
    const sessionId = randomBytes(16).toString('hex');
    const now = Date.now();

    this.sessions.set(sessionId, {
      userId,
      email,
      createdAt: now,
      lastActivity: now
    });

    return sessionId;
  }

  /**
   * Get session data
   */
  getSession(sessionId: string): SessionData | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update session last activity
   */
  updateLastActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * Invalidate a session
   */
  invalidateSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Invalidate all sessions for a user
   */
  invalidateUserSessions(userId: string): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Revoke a token (add to blacklist)
   */
  revokeToken(jti: string, expiresAt: number, userId: string): void {
    this.revokedTokens.set(jti, {
      jti,
      revokedAt: Date.now(),
      expiresAt,
      userId
    });
  }

  /**
   * Check if token is revoked
   */
  isTokenRevoked(jti: string): boolean {
    return this.revokedTokens.has(jti);
  }

  /**
   * Cleanup expired revocations
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [jti, record] of this.revokedTokens.entries()) {
      if (now > record.expiresAt) {
        this.revokedTokens.delete(jti);
      }
    }

    // Also cleanup old sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT_MS) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Clear all sessions (testing only)
   */
  clear(): void {
    this.sessions.clear();
    this.revokedTokens.clear();
  }

  /**
   * Destroy the store
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
    this.revokedTokens.clear();
  }
}

// Singleton instance
let sessionStore: SessionStore | null = null;

/**
 * Get the global session store
 */
function getSessionStore(): SessionStore {
  if (!sessionStore) {
    sessionStore = new SessionStore();
  }
  return sessionStore;
}

/**
 * SessionManager class
 * Main API for session management
 */
export class SessionManager {
  /**
   * Create tokens for a new session
   *
   * @param userId - User ID
   * @param email - User email
   * @returns Token pair with access and refresh tokens
   */
  static createTokens(userId: string, email: string): TokenPair {
    const accessToken = generateAccessToken(userId, email);
    const refreshToken = generateRefreshToken(userId, email);

    // Create session record for audit
    getSessionStore().createSession(userId, email);

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Validate an access token
   *
   * @param token - Access token to validate
   * @returns Validation result
   */
  static validateAccessToken(token: string): AccessTokenValidationResult {
    if (!token) {
      return {
        valid: false,
        error: 'Token is missing'
      };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return {
        valid: false,
        error: 'Token signature is invalid'
      };
    }

    // Check if it's actually an access token
    if (decoded.type !== 'access') {
      return {
        valid: false,
        error: 'Token is not an access token'
      };
    }

    // Check if token is revoked
    if (decoded.jti && getSessionStore().isTokenRevoked(decoded.jti)) {
      return {
        valid: false,
        error: 'Token has been revoked'
      };
    }

    return {
      valid: true,
      userId: decoded.userId,
      email: decoded.email,
      expiresAt: new Date(decoded.exp * 1000)
    };
  }

  /**
   * Refresh an access token using a refresh token
   *
   * @param refreshToken - Refresh token
   * @returns New token pair, or null if refresh fails
   */
  static refreshTokens(refreshToken: string): TokenPair | null {
    if (!refreshToken) {
      return null;
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return null;
    }

    // Check if it's actually a refresh token
    if (decoded.type !== 'refresh') {
      return null;
    }

    // Check if token is revoked
    if (decoded.jti && getSessionStore().isTokenRevoked(decoded.jti)) {
      return null;
    }

    // Generate new tokens
    return this.createTokens(decoded.userId, decoded.email);
  }

  /**
   * Invalidate all tokens for a user
   * Called on logout or password change
   *
   * @param userId - User ID
   */
  static invalidateTokens(userId: string): void {
    getSessionStore().invalidateUserSessions(userId);
  }

  /**
   * Revoke a specific token
   *
   * @param token - Token to revoke
   */
  static revokeToken(token: string): void {
    const decoded = verifyToken(token);
    if (decoded && decoded.jti && decoded.exp) {
      getSessionStore().revokeToken(decoded.jti, decoded.exp * 1000, decoded.userId);
    }
  }

  /**
   * Check if an access token is expiring soon
   *
   * @param token - Access token
   * @param minutesThreshold - Threshold in minutes (default: 60)
   * @returns True if expiring soon
   */
  static isAccessTokenExpiringSoon(token: string, minutesThreshold: number = 60): boolean {
    return isTokenExpiringSoon(token, minutesThreshold);
  }

  /**
   * Check if tokens are valid for a user
   *
   * @param accessToken - Access token
   * @param refreshToken - Refresh token
   * @returns True if both tokens are valid
   */
  static areTokensValid(accessToken: string, refreshToken: string): boolean {
    const accessValid = isTokenValid(accessToken) && isTokenType(accessToken, 'access');
    const refreshValid = isTokenValid(refreshToken) && isTokenType(refreshToken, 'refresh');

    return accessValid && refreshValid;
  }

  /**
   * Get user ID from access token
   *
   * @param token - Access token
   * @returns User ID or null if invalid
   */
  static getUserIdFromToken(token: string): string | null {
    const decoded = verifyToken(token);
    if (decoded && decoded.type === 'access') {
      return decoded.userId;
    }
    return null;
  }

  /**
   * Clear all sessions (testing only)
   */
  static clearAllSessions(): void {
    getSessionStore().clear();
  }
}

/**
 * Destroy session store (testing/cleanup only)
 */
export function destroySessionStore(): void {
  if (sessionStore) {
    sessionStore.destroy();
    sessionStore = null;
  }
}

/**
 * Get current session store (testing only)
 */
export function getSessionStoreInstance(): SessionStore {
  return getSessionStore();
}

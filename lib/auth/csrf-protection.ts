/**
 * CSRF Protection Module
 * Provides CSRF token generation, validation, and middleware integration
 *
 * Pattern: Double Submit Cookie Pattern with Session-based validation
 * - Tokens are cryptographically random strings
 * - Token stored in httpOnly cookie and session
 * - Client sends token in request header
 * - Server verifies token matches session value
 */

import { randomBytes } from 'crypto';

/**
 * CSRF token metadata
 */
interface CSRFTokenMeta {
  token: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * In-memory CSRF token store
 * Maps session ID to CSRF token metadata
 * In production, this should use Redis or database
 */
class CSRFTokenStore {
  private tokens: Map<string, CSRFTokenMeta> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired tokens every 10 minutes
    if (typeof globalThis !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 10 * 60 * 1000);
    }
  }

  /**
   * Store CSRF token for a session
   *
   * @param sessionId - Session or request ID
   * @param token - CSRF token
   * @param expiryMs - Token expiry time in milliseconds (default: 1 hour)
   */
  set(sessionId: string, token: string, expiryMs: number = 3600000): void {
    const now = Date.now();
    this.tokens.set(sessionId, {
      token,
      createdAt: now,
      expiresAt: now + expiryMs
    });
  }

  /**
   * Get CSRF token for a session
   *
   * @param sessionId - Session or request ID
   * @returns Token metadata or null if not found/expired
   */
  get(sessionId: string): CSRFTokenMeta | null {
    const meta = this.tokens.get(sessionId);

    if (!meta) return null;

    // Check if expired
    if (Date.now() > meta.expiresAt) {
      this.tokens.delete(sessionId);
      return null;
    }

    return meta;
  }

  /**
   * Verify token matches stored token for session
   *
   * @param sessionId - Session or request ID
   * @param token - Token to verify
   * @returns True if token is valid
   */
  verify(sessionId: string, token: string): boolean {
    const meta = this.get(sessionId);
    if (!meta) return false;

    // Use constant-time comparison to prevent timing attacks
    return constantTimeCompare(meta.token, token);
  }

  /**
   * Delete token for a session
   *
   * @param sessionId - Session or request ID
   */
  delete(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  /**
   * Cleanup expired tokens
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [sessionId, meta] of this.tokens.entries()) {
      if (now > meta.expiresAt) {
        this.tokens.delete(sessionId);
      }
    }
  }

  /**
   * Clear all tokens (testing only)
   */
  clear(): void {
    this.tokens.clear();
  }

  /**
   * Destroy the store
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.tokens.clear();
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function constantTimeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  // Handle null/undefined cases
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

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
 * Generate a cryptographically secure random token
 *
 * @param length - Token length in bytes (default: 32)
 * @returns Hex-encoded token string
 */
export function generateCSRFToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

// Singleton instance
let tokenStore: CSRFTokenStore | null = null;

/**
 * Get the global CSRF token store
 *
 * @returns CSRF token store instance
 */
function getTokenStore(): CSRFTokenStore {
  if (!tokenStore) {
    tokenStore = new CSRFTokenStore();
  }
  return tokenStore;
}

/**
 * Create and store a new CSRF token for a session
 *
 * @param sessionId - Session or request ID
 * @param expiryMs - Token expiry time in milliseconds (default: 1 hour)
 * @returns Generated CSRF token
 */
export function createCSRFToken(
  sessionId: string,
  expiryMs: number = 3600000
): string {
  const token = generateCSRFToken();
  getTokenStore().set(sessionId, token, expiryMs);
  return token;
}

/**
 * Get existing CSRF token for a session
 *
 * @param sessionId - Session or request ID
 * @returns CSRF token or null if not found/expired
 */
export function getCSRFToken(sessionId: string): string | null {
  const meta = getTokenStore().get(sessionId);
  return meta?.token || null;
}

/**
 * Verify a CSRF token against stored value
 *
 * @param sessionId - Session or request ID
 * @param token - Token to verify
 * @returns True if token is valid and not expired
 */
export function verifyCSRFToken(sessionId: string, token: string): boolean {
  return getTokenStore().verify(sessionId, token);
}

/**
 * Validate CSRF token from request
 * Checks token in body, header, or query parameter
 *
 * @param sessionId - Session or request ID
 * @param tokenFromRequest - Token from request (body, header, or query)
 * @returns Validation result with error message if invalid
 */
export function validateCSRFToken(
  sessionId: string,
  tokenFromRequest: string | null | undefined
): { isValid: boolean; error?: string } {
  if (!tokenFromRequest) {
    return { isValid: false, error: 'CSRF token is missing' };
  }

  if (!verifyCSRFToken(sessionId, tokenFromRequest)) {
    return { isValid: false, error: 'CSRF token is invalid or expired' };
  }

  return { isValid: true };
}

/**
 * Revoke a CSRF token (for logout or security purposes)
 *
 * @param sessionId - Session or request ID
 */
export function revokeCSRFToken(sessionId: string): void {
  getTokenStore().delete(sessionId);
}

/**
 * Get CSRF cookie configuration
 *
 * @returns Cookie options for Next.js/Express
 */
export function getCSRFCookieOptions() {
  return {
    name: 'XSRF-TOKEN',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict' as const,
    maxAge: 3600000 // 1 hour in milliseconds
  };
}

/**
 * Get CSRF header name for client to use
 *
 * @returns Header name
 */
export function getCSRFHeaderName(): string {
  return 'X-XSRF-TOKEN';
}

/**
 * Clear all CSRF tokens (testing only)
 */
export function clearAllCSRFTokens(): void {
  getTokenStore().clear();
}

/**
 * Destroy CSRF token store (testing/cleanup only)
 */
export function destroyCSRFTokenStore(): void {
  if (tokenStore) {
    tokenStore.destroy();
    tokenStore = null;
  }
}

/**
 * Middleware helper for Next.js API routes
 * Validates CSRF token for POST/PUT/DELETE requests
 *
 * @param req - Next.js API request
 * @param sessionId - Session ID (usually from cookie or auth header)
 * @returns Validation result
 */
export function validateRequestCSRFToken(
  req: any,
  sessionId: string
): { isValid: boolean; error?: string } {
  // Skip validation for GET requests
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return { isValid: true };
  }

  // Get token from multiple sources (in order of preference)
  const tokenFromHeader = req.headers['x-xsrf-token'];
  const tokenFromBody = req.body?.['_csrf'] || req.body?.['csrf'];
  const tokenFromQuery = req.query?.['csrf'];

  const token = tokenFromHeader || tokenFromBody || tokenFromQuery;

  return validateCSRFToken(sessionId, token);
}

/**
 * Generate HTML meta tag for CSRF token (for form rendering)
 *
 * @param token - CSRF token
 * @returns HTML meta tag string
 */
export function generateCSRFMetaTag(token: string): string {
  return `<meta name="csrf-token" content="${token}" />`;
}

/**
 * Generate hidden form input for CSRF token
 *
 * @param token - CSRF token
 * @returns HTML hidden input string
 */
export function generateCSRFFormInput(token: string): string {
  return `<input type="hidden" name="_csrf" value="${token}" />`;
}

/**
 * Create CSRF token for password reset form
 * Password reset forms need special handling because they're accessed via email links
 *
 * @param email - User email (used as session identifier)
 * @returns CSRF token for password reset form
 */
export function createPasswordResetCSRFToken(email: string): string {
  // Use email hash as session ID for password reset forms
  const sessionId = `reset:${Buffer.from(email).toString('base64')}`;
  return createCSRFToken(sessionId, 3600000); // 1 hour expiry
}

/**
 * Verify CSRF token for password reset form
 *
 * @param email - User email
 * @param token - Token to verify
 * @returns Verification result
 */
export function verifyPasswordResetCSRFToken(
  email: string,
  token: string
): { isValid: boolean; error?: string } {
  const sessionId = `reset:${Buffer.from(email).toString('base64')}`;
  return validateCSRFToken(sessionId, token);
}

/**
 * Get CSRF token for password reset form
 *
 * @param email - User email
 * @returns Existing CSRF token or null
 */
export function getPasswordResetCSRFToken(email: string): string | null {
  const sessionId = `reset:${Buffer.from(email).toString('base64')}`;
  return getCSRFToken(sessionId);
}

/**
 * Revoke password reset CSRF token
 * Called after successful password reset
 *
 * @param email - User email
 */
export function revokePasswordResetCSRFToken(email: string): void {
  const sessionId = `reset:${Buffer.from(email).toString('base64')}`;
  revokeCSRFToken(sessionId);
}

/**
 * Validate password reset form submission
 * Checks both token presence and validity
 *
 * @param email - User email
 * @param csrfToken - CSRF token from form
 * @returns Validation result with detailed error message
 */
export function validatePasswordResetForm(
  email: string,
  csrfToken: string | null | undefined
): { isValid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!csrfToken) {
    return { isValid: false, error: 'CSRF token is missing from form' };
  }

  return verifyPasswordResetCSRFToken(email, csrfToken);
}

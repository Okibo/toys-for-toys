/**
 * Verification Code Generation Module
 * Generates and validates 6-digit verification codes
 */

import crypto from 'crypto';

/**
 * Code configuration
 */
const CODE_LENGTH = 6;
const CODE_EXPIRY_HOURS = 24;
const CODE_EXPIRY_MS = CODE_EXPIRY_HOURS * 60 * 60 * 1000;

/**
 * Generate a random 6-digit verification code
 *
 * @returns 6-digit code as string (e.g., '123456')
 */
export function generateVerificationCode(): string {
  // Generate 3 random bytes (24 bits), then convert to number between 0-999999
  const randomBytes = crypto.randomBytes(3);
  const randomNumber = randomBytes.readUintBE(0, 3);
  const code = (randomNumber % 1000000).toString().padStart(6, '0');
  return code;
}

/**
 * Validate verification code format (must be 6 digits)
 *
 * @param code - Code to validate
 * @returns True if code is valid format
 */
export function isValidCodeFormat(code: string): boolean {
  if (typeof code !== 'string') {
    return false;
  }
  // Must be exactly 6 digits
  return /^\d{6}$/.test(code);
}

/**
 * Get code expiry timestamp (24 hours from now)
 *
 * @returns ISO 8601 timestamp string
 */
export function getCodeExpiryTime(): string {
  const expiryDate = new Date(Date.now() + CODE_EXPIRY_MS);
  return expiryDate.toISOString();
}

/**
 * Check if a code has expired
 *
 * @param expiresAt - ISO 8601 expiry timestamp
 * @returns True if code has expired
 */
export function isCodeExpired(expiresAt: string): boolean {
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  return now > expiryTime;
}

/**
 * Get time remaining until code expires (in seconds)
 *
 * @param expiresAt - ISO 8601 expiry timestamp
 * @returns Seconds remaining, or 0 if already expired
 */
export function getCodeExpirySecondsRemaining(expiresAt: string): number {
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const secondsRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
  return secondsRemaining;
}

/**
 * Configuration constants for code
 */
export const VERIFICATION_CODE_CONFIG = {
  LENGTH: CODE_LENGTH,
  EXPIRY_HOURS: CODE_EXPIRY_HOURS,
  EXPIRY_MS: CODE_EXPIRY_MS,
  MAX_ATTEMPTS: 3,
};

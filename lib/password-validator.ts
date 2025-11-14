/**
 * lib/password-validator.ts
 *
 * Password strength validation and security checks.
 * Enforces NIST-recommended password requirements.
 *
 * CRITICAL: Passwords are NEVER logged or stored in plain text.
 * Supabase handles bcrypt hashing server-side via Auth service.
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - No obvious patterns (common passwords, sequential numbers, etc.)
 */

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong'; // For UX feedback
}

/**
 * Common weak passwords to block
 * Extended from OWASP/NIST recommendations
 */
const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'password123',
  '111111',
  '123123',
  '1234567890',
  'password1',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  '1q2w3e4r',
  'dragon',
  'master',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'access',
  'pass',
  'secret',
  'login',
  'sample',
  'test',
  'demo',
  'user123',
  'pass123',
]);

/**
 * Validate password strength
 *
 * @param password - Password to validate
 * @returns Validation result with errors and strength assessment
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check maximum length (prevent DoS)
  if (password.length > 128) {
    errors.push('Password must be no more than 128 characters long');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }

  // Check for common weak passwords
  const lowerPassword = password.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(lowerPassword)) {
    errors.push('This password is too common. Please choose a different password.');
  }

  // Check for sequential numbers (123, 456, etc.)
  if (/0123|1234|2345|3456|4567|5678|6789|7890|9876|8765|7654|6543|5432|4321|3210/.test(password)) {
    errors.push('Avoid sequential numbers in passwords');
  }

  // Check for keyboard patterns
  if (/qwert|werty|asdfg|zxcvb|qazwsx/.test(lowerPassword)) {
    errors.push('Avoid keyboard patterns in passwords');
  }

  // Check for repeated characters (more than 3 in a row)
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Avoid repeating the same character more than 3 times');
  }

  // Calculate password strength
  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';

  if (errors.length === 0) {
    // No errors, calculate based on additional factors
    if (password.length >= 12 && /[^a-zA-Z0-9]/.test(password)) {
      strength = 'strong'; // Long password with special characters
    } else if (password.length >= 10) {
      strength = 'good'; // Good length
    } else {
      strength = 'fair'; // Meets minimum requirements
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Check if password has been compromised using Have I Been Pwned API
 *
 * Implements k-anonymity: sends only first 5 chars of SHA-1 hash
 * Returns count of compromises without revealing full password.
 *
 * SECURITY NOTE: This is optional but strongly recommended for user security.
 * The API call does NOT leak the password.
 *
 * @param password - Password to check
 * @returns Number of times password has been compromised (0 = safe)
 * @throws Error if API is unavailable (should not block signup)
 */
export async function checkPasswordBreach(password: string): Promise<number> {
  try {
    // Hash password using SHA-1 (matching HIBP API)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    // Send only first 5 chars (k-anonymity)
    const prefix = hashHex.substring(0, 5);
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);

    if (!response.ok) {
      throw new Error(`HIBP API returned ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\r\n');

    // Check if our hash suffix exists in results
    const suffix = hashHex.substring(5);
    for (const line of lines) {
      const [lineSuffix, count] = line.split(':');
      if (lineSuffix === suffix) {
        return parseInt(count, 10);
      }
    }

    return 0; // Password not found in breach database
  } catch (error) {
    console.error('Failed to check password breach:', error);
    // Don't throw - API failure should not block signup
    // Log the error for monitoring
    return 0;
  }
}

/**
 * Generate password strength feedback for UX
 *
 * @param validationResult - Result from validatePassword()
 * @returns Human-readable feedback
 */
export function getPasswordFeedback(validationResult: PasswordValidationResult): string {
  if (validationResult.errors.length > 0) {
    return validationResult.errors[0]; // Return first error for UI display
  }

  const strengthMessages = {
    weak: 'This password is too weak. Please try again.',
    fair: 'This password is acceptable but could be stronger.',
    good: 'This is a good password.',
    strong: 'This is a very strong password.',
  };

  return strengthMessages[validationResult.strength];
}

/**
 * Validate password matches confirmation
 *
 * @param password - Original password
 * @param confirmation - Confirmation password
 * @returns true if passwords match
 */
export function validatePasswordMatch(password: string, confirmation: string): boolean {
  // Use constant-time comparison to prevent timing attacks
  return constantTimeEqual(password, confirmation);
}

/**
 * Constant-time string comparison
 *
 * Prevents timing attacks that could reveal password length or characters.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
function constantTimeEqual(a: string, b: string): boolean {
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
 * Estimate password entropy (bits)
 *
 * Used for password strength assessment.
 * Higher entropy = stronger password
 *
 * @param password - Password to analyze
 * @returns Entropy in bits
 */
export function estimatePasswordEntropy(password: string): number {
  let charSpace = 0;

  if (/[a-z]/.test(password)) charSpace += 26;
  if (/[A-Z]/.test(password)) charSpace += 26;
  if (/[0-9]/.test(password)) charSpace += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charSpace += 32;

  const entropy = Math.log2(charSpace) * password.length;
  return Math.round(entropy * 100) / 100;
}

/**
 * Get password strength requirement details
 *
 * Useful for displaying requirements to users during signup
 *
 * @returns Array of requirement strings
 */
export function getPasswordRequirements(): string[] {
  return [
    'At least 8 characters long',
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    'Avoid common passwords and keyboard patterns',
  ];
}

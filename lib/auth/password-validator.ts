/**
 * Password Validation Module
 * Provides secure password validation with detailed error messages
 *
 * Requirements:
 * - Minimum 8 characters
 * - 1 uppercase letter (A-Z)
 * - 1 number (0-9)
 * - 1 special character (!@#$%^&*)
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: 'weak' | 'fair' | 'good' | 'strong';
}

/**
 * Special characters allowed in password
 */
const ALLOWED_SPECIAL_CHARS = /[!@#$%^&*]/;

/**
 * Validates password against security requirements
 *
 * @param password - The password to validate
 * @returns Validation result with errors and strength score
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Check if password is a string
  if (typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password must be a string'],
      score: 'weak'
    };
  }

  // Requirement 1: Minimum 8 characters
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Requirement 2: At least 1 uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter (A-Z)');
  }

  // Requirement 3: At least 1 number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number (0-9)');
  }

  // Requirement 4: At least 1 special character
  if (!ALLOWED_SPECIAL_CHARS.test(password)) {
    errors.push('Password must contain at least 1 special character (!@#$%^&*)');
  }

  // Calculate strength score based on length and complexity
  const score = calculatePasswordStrength(password, errors.length);

  return {
    isValid: errors.length === 0,
    errors,
    score
  };
}

/**
 * Calculate password strength score
 *
 * @param password - The password to evaluate
 * @param errorCount - Number of validation errors
 * @returns Strength score
 */
function calculatePasswordStrength(
  password: string,
  errorCount: number
): 'weak' | 'fair' | 'good' | 'strong' {
  // If validation errors, it's weak
  if (errorCount > 0) {
    return 'weak';
  }

  // Base score if all requirements met
  let score = 0;

  // Length bonus (up to 3 points)
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Complexity bonus
  if (/[a-z]/.test(password)) score++; // lowercase
  if (/[A-Z]/.test(password)) score++; // uppercase
  if (/[0-9]/.test(password)) score++; // numbers
  if (ALLOWED_SPECIAL_CHARS.test(password)) score++; // special chars

  // Entropy check - consecutive identical chars reduce score
  if (/(.)\1{2,}/.test(password)) {
    score--;
  }

  // Return strength based on score
  if (score >= 7) return 'strong';
  if (score >= 5) return 'good';
  if (score >= 3) return 'fair';
  return 'weak';
}

/**
 * Check if password meets minimum requirements (synchronous quick check)
 * Useful for real-time validation in forms
 *
 * @param password - The password to check
 * @returns True if all requirements are met
 */
export function isPasswordValid(password: string): boolean {
  return validatePassword(password).isValid;
}

/**
 * Get human-readable error messages for password validation
 *
 * @param password - The password to validate
 * @returns Array of error messages, empty if valid
 */
export function getPasswordErrors(password: string): string[] {
  return validatePassword(password).errors;
}

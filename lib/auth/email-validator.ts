/**
 * Email Validation Module
 * Provides RFC 5322-compliant email validation with practical limits
 *
 * Validates email format without requiring SMTP verification
 * Uses a regex based on RFC 5322 standard with practical restrictions
 */

/**
 * RFC 5322 simplified but practical regex
 * Supports most common email formats while excluding edge cases
 *
 * Pattern explanation:
 * - Local part: alphanumeric, dots, hyphens, underscores, plus signs
 * - Domain: alphanumeric, hyphens, dots (no leading/trailing hyphens per label)
 * - TLD: at least 2 characters
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._+\-]+@[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/**
 * More permissive regex for edge cases (RFC 5322 compliant)
 * Only used as fallback for unusual but valid formats
 */
const RFC5322_EXTENDED = /^[^\s@]+@[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export interface EmailValidationResult {
  isValid: boolean;
  errors: string[];
  normalizedEmail: string | null;
}

/**
 * Validates email address format
 *
 * @param email - The email address to validate
 * @returns Validation result with errors and normalized email
 */
export function validateEmail(email: string): EmailValidationResult {
  const errors: string[] = [];

  // Check if email is a string
  if (typeof email !== 'string') {
    return {
      isValid: false,
      errors: ['Email must be a string'],
      normalizedEmail: null
    };
  }

  // Normalize email: trim whitespace and convert to lowercase
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email is empty
  if (normalizedEmail.length === 0) {
    return {
      isValid: false,
      errors: ['Email address is required'],
      normalizedEmail: null
    };
  }

  // Check length
  if (normalizedEmail.length > 254) {
    errors.push('Email address is too long (max 254 characters)');
  }

  // Split into local and domain parts
  const parts = normalizedEmail.split('@');

  // Check for exactly one @ symbol
  if (parts.length !== 2) {
    errors.push('Email address must contain exactly one @ symbol');
    return {
      isValid: false,
      errors,
      normalizedEmail: null
    };
  }

  const [localPart, domainPart] = parts;

  // Validate local part (before @)
  if (localPart.length === 0) {
    errors.push('Email local part (before @) cannot be empty');
  }
  if (localPart.length > 64) {
    errors.push('Email local part (before @) is too long (max 64 characters)');
  }
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    errors.push('Email local part cannot start or end with a dot');
  }
  if (localPart.includes('..')) {
    errors.push('Email local part cannot contain consecutive dots');
  }

  // Validate domain part (after @)
  if (domainPart.length === 0) {
    errors.push('Email domain (after @) cannot be empty');
  }
  if (domainPart.length > 255) {
    errors.push('Email domain is too long (max 255 characters)');
  }
  if (domainPart.startsWith('-') || domainPart.endsWith('-')) {
    errors.push('Email domain cannot start or end with a hyphen');
  }
  if (domainPart.includes('..')) {
    errors.push('Email domain cannot contain consecutive dots');
  }
  if (!domainPart.includes('.')) {
    errors.push('Email domain must contain at least one dot');
  }

  // Check TLD (last part after final dot)
  const tldMatch = domainPart.match(/\.([a-zA-Z]{2,})$/);
  if (!tldMatch) {
    errors.push('Email domain must have a valid TLD (top-level domain)');
  } else {
    const tld = tldMatch[1];
    if (tld.length < 2) {
      errors.push('Email TLD must be at least 2 characters');
    }
  }

  // Test against regex patterns
  const matchesBasic = EMAIL_REGEX.test(normalizedEmail);
  const matchesExtended = RFC5322_EXTENDED.test(normalizedEmail);

  if (!matchesBasic && !matchesExtended) {
    errors.push('Email format is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedEmail: errors.length === 0 ? normalizedEmail : null
  };
}

/**
 * Quick check if email is valid (boolean return)
 * Useful for form validation
 *
 * @param email - The email address to check
 * @returns True if email is valid
 */
export function isEmailValid(email: string): boolean {
  return validateEmail(email).isValid;
}

/**
 * Get normalized email address if valid
 *
 * @param email - The email address to normalize
 * @returns Normalized email or null if invalid
 */
export function getNormalizedEmail(email: string): string | null {
  return validateEmail(email).normalizedEmail;
}

/**
 * Get human-readable error messages for email validation
 *
 * @param email - The email address to validate
 * @returns Array of error messages, empty if valid
 */
export function getEmailErrors(email: string): string[] {
  return validateEmail(email).errors;
}

/**
 * Checks if email domain has minimum requirements
 * (internal validation helper)
 *
 * @param domain - The email domain to check
 * @returns True if domain appears valid
 */
export function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(domain);
}

/**
 * lib/auth-validation.ts
 *
 * Zod validation schemas for authentication forms.
 * Used for form validation and API request/response validation.
 */

import { z } from 'zod';

/**
 * Email validation schema
 * - Valid email format
 * - Max 254 characters (RFC 5321)
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(254, 'Email must be less than 254 characters')
  .transform((val) => val.toLowerCase().trim());

/**
 * Password validation schema
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number');

/**
 * Weak password validation schema
 * Used for password strength indicator
 * - If password passes weak schema, at least some requirements are met
 */
const weakPasswordSchema = z.string().min(6, 'Password must be at least 6 characters');

/**
 * Full name validation schema
 * - 2-100 characters
 * - Alphanumeric + spaces only
 */
export const fullNameSchema = z
  .string()
  .min(2, 'Full name must be at least 2 characters')
  .max(100, 'Full name must be less than 100 characters')
  .regex(
    /^[a-zA-Z0-9\s'-]+$/,
    'Full name can only contain letters, numbers, spaces, hyphens, and apostrophes'
  );

/**
 * Login form validation schema
 */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

/**
 * Signup form validation schema
 * Includes all fields for signup process
 */
export const signupFormSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    fullName: fullNameSchema,
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms of service',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupFormSchema>;

/**
 * Password reset request validation schema
 * Only requires email address
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password reset confirmation validation schema
 * Used when resetting password with token
 */
export const passwordResetConfirmSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    token: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordResetConfirmData = z.infer<typeof passwordResetConfirmSchema>;

/**
 * Utility function to check password strength
 * Returns 'weak' | 'medium' | 'strong'
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  // Weak: 6+ characters
  if (!weakPasswordSchema.safeParse(password).success) {
    return 'weak';
  }

  // Check strength criteria
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isLongEnough = password.length >= 12;

  const criteriaCount = [hasUppercase, hasLowercase, hasNumber, hasSpecial, isLongEnough].filter(
    Boolean
  ).length;

  // Strong: 4+ criteria met
  if (criteriaCount >= 4) {
    return 'strong';
  }

  // Medium: 3 criteria met
  if (criteriaCount >= 3) {
    return 'medium';
  }

  // Weak: less than 3 criteria
  return 'weak';
}

/**
 * Get password strength feedback message
 */
export function getPasswordStrengthMessage(strength: 'weak' | 'medium' | 'strong'): string {
  const messages = {
    weak: 'Password is weak. Add uppercase, lowercase, numbers, and special characters.',
    medium: 'Password strength is medium. Consider adding special characters.',
    strong: 'Password is strong.',
  };

  return messages[strength];
}

/**
 * Check if email exists (stub for MVP - always returns false)
 * In production, this would call an API endpoint to check the database
 */
export async function checkEmailExists(_email: string): Promise<boolean> {
  // TODO: Implement actual API call to check if email exists
  // For MVP, stub returns false (email doesn't exist)
  return false;
}

/**
 * Validate reset token format
 * Tokens should be long random strings
 */
export const resetTokenSchema = z.string().min(20, 'Invalid reset token format').optional();

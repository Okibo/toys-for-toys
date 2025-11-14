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

/**
 * Child name validation schema for Step 2
 * - 2-50 characters
 * - Alphanumeric + spaces, hyphens, apostrophes only
 */
export const childNameSchema = z
  .string()
  .min(2, 'Child name must be at least 2 characters')
  .max(50, 'Child name must be less than 50 characters')
  .regex(
    /^[a-zA-Z\s'-]+$/,
    'Child name can only contain letters, spaces, hyphens, and apostrophes'
  );

/**
 * Birth date validation schema for Step 2
 * - Valid date format (YYYY-MM-DD)
 * - Child must be < 18 years old
 */
export const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)')
  .refine((val) => {
    const birthDate = new Date(val);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const hasBirthdayThisYear =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
    const actualAge = hasBirthdayThisYear ? age : age - 1;

    return actualAge >= 0 && actualAge < 18;
  }, 'Child must be under 18 years old');

/**
 * Interests validation schema for Step 2
 * - At least 1 interest required
 * - At most 5 interests allowed
 * - Predefined options
 */
export const interestsSchema = z
  .array(
    z.enum(['toys', 'books', 'sports', 'art', 'music', 'games', 'outdoor', 'educational', 'other'])
  )
  .min(1, 'Select at least 1 interest')
  .max(5, 'Select at most 5 interests');

/**
 * Allergies/Safety notes validation schema for Step 2
 * - Optional (can be empty string)
 * - Max 500 characters
 */
export const allergiesSchema = z.string().max(500, 'Safety notes must be less than 500 characters');

/**
 * Child profile validation schema for Step 2
 */
export const childProfileSchema = z.object({
  name: childNameSchema,
  birthDate: birthDateSchema,
  interests: interestsSchema,
  allergies: allergiesSchema,
});

export type ChildProfile = z.infer<typeof childProfileSchema>;

/**
 * Child profiles array validation schema for Step 2
 * - At least 1 child
 * - At most 5 children
 */
export const childProfilesSchema = z
  .array(childProfileSchema)
  .min(1, 'Add at least 1 child')
  .max(5, 'Maximum 5 children per parent');

/**
 * Step 2 form validation schema (Child Profiles)
 */
export const signupStep2FormSchema = z.object({
  children: childProfilesSchema,
});

export type SignupStep2FormData = z.infer<typeof signupStep2FormSchema>;

/**
 * Consent text in Polish (Phase 1)
 * Store the exact text shown to user for GDPR proof
 */
export const getConsentTextPl = (): string => {
  return `I confirm I am the parent/guardian of the child(ren) listed above and consent to Toy-for-Toy storing their profile for toy matching, age-appropriate recommendations, and our service features. I understand their data will be stored securely and handled according to our Privacy Policy.`;
};

/**
 * Main consent validation schema for Step 3
 * - Must be explicitly checked (true)
 */
export const mainConsentSchema = z.boolean().refine((val) => val === true, {
  message: 'You must accept to proceed',
});

/**
 * Marketing consent validation schema for Step 3
 * - Optional (can be true or false)
 */
export const marketingConsentSchema = z.boolean();

/**
 * Language validation schema for consent
 * - Phase 1: Polish only
 * - Phase 2: Will support German, English
 */
export const consentLanguageSchema = z.enum(['pl']);

/**
 * Step 3 form validation schema (Consent)
 */
export const signupStep3FormSchema = z.object({
  mainConsent: mainConsentSchema,
  marketingConsent: marketingConsentSchema,
  language: consentLanguageSchema,
});

export type SignupStep3FormData = z.infer<typeof signupStep3FormSchema>;

/**
 * Predefined interests for child profiles
 * Used in dropdowns and multi-select components
 */
export const CHILD_INTERESTS = [
  { value: 'toys', label: 'Toys' },
  { value: 'books', label: 'Books' },
  { value: 'sports', label: 'Sports' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'games', label: 'Games' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'educational', label: 'Educational' },
  { value: 'other', label: 'Other' },
] as const;

/**
 * Helper function to calculate child age from birth date
 */
export function calculateChildAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  const hasBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

  if (!hasBirthdayThisYear) {
    age--;
  }

  return age;
}

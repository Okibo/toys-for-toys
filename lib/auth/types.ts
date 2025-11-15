/**
 * Authentication Types Module
 * Defines TypeScript interfaces for auth API requests, responses, and internal data structures
 */

/**
 * Signup request payload
 */
export interface SignupRequest {
  email: string;
  password: string;
  language?: string; // ISO 639-1 code (e.g., 'en', 'pl')
}

/**
 * Signup response (success)
 */
export interface SignupResponse {
  success: true;
  message: string;
  data: {
    user_id: string;
    email: string;
    is_email_verified: false;
  };
}

/**
 * Signup error response
 */
export interface SignupErrorResponse {
  success: false;
  error: {
    code: 'INVALID_EMAIL' | 'WEAK_PASSWORD' | 'DUPLICATE_EMAIL' | 'INTERNAL_ERROR' | 'RATE_LIMIT';
    message: string;
    details?: string[];
  };
}

/**
 * Email verification request payload
 */
export interface VerifyEmailRequest {
  code: string; // 6-digit code
  email: string;
}

/**
 * Email verification response (success)
 */
export interface VerifyEmailResponse {
  success: true;
  message: string;
  data: {
    email: string;
    is_email_verified: true;
  };
}

/**
 * Email verification error response
 */
export interface VerifyEmailErrorResponse {
  success: false;
  error: {
    code: 'INVALID_CODE' | 'EXPIRED_CODE' | 'EMAIL_NOT_FOUND' | 'INTERNAL_ERROR' | 'RATE_LIMIT';
    message: string;
    details?: string[];
  };
}

/**
 * Resend verification email request payload
 */
export interface ResendVerificationRequest {
  email: string;
}

/**
 * Resend verification email response (success)
 */
export interface ResendVerificationResponse {
  success: true;
  message: string;
  data: {
    email: string;
    new_code_sent: true;
  };
}

/**
 * Resend verification email error response
 */
export interface ResendVerificationErrorResponse {
  success: false;
  error: {
    code: 'EMAIL_NOT_FOUND' | 'ALREADY_VERIFIED' | 'INTERNAL_ERROR' | 'RATE_LIMIT';
    message: string;
    details?: string[];
  };
}

/**
 * Verification code record stored in Supabase
 */
export interface VerificationCodeRecord {
  id: string;
  email: string;
  code: string;
  expires_at: string; // ISO 8601 timestamp
  attempts: number;
  created_at: string; // ISO 8601 timestamp
}

/**
 * User profile record
 */
export interface UserProfileRecord {
  id: string; // user_id from auth
  email: string;
  is_email_verified: boolean;
  language?: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Ticket record (initial 10 tickets for new users)
 */
export interface TicketRecord {
  id: string;
  user_id: string;
  balance: number;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * API error response (generic)
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: 'weak' | 'fair' | 'good' | 'strong';
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  isValid: boolean;
  errors: string[];
  normalizedEmail: string | null;
}

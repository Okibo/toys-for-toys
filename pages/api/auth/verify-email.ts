/**
 * POST /api/auth/verify-email
 * Email verification endpoint
 *
 * Accepts: { code, email }
 * Returns: 200 { success, data: { email, is_email_verified } }
 *          400 { success: false, error }
 *          401 { success: false, error }
 *          500 { success: false, error }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getNormalizedEmail, validateEmail } from '@/lib/auth/email-validator';
import { isEmailVerifyAllowed, getRateLimitHeaders, EMAIL_VERIFY_RATE_LIMIT } from '@/lib/auth/rate-limiter';
import { getSupabaseServerClient } from '@/lib/auth/supabase-server';
import { isValidCodeFormat, isCodeExpired } from '@/lib/auth/verification-code';
import type {
  VerifyEmailRequest,
  VerifyEmailResponse,
  VerifyEmailErrorResponse,
} from '@/lib/auth/types';

/**
 * Verify code against stored code in database
 */
async function verifyCode(email: string, code: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('verification_codes')
      .select('code, expires_at, attempts')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No verification code found
      if (error.code === 'PGRST116') {
        return false;
      }
      throw new Error(`Database error: ${error.message}`);
    }

    // Check if code has expired
    if (data && isCodeExpired(data.expires_at)) {
      return false;
    }

    // Check if code matches
    if (data && data.code === code) {
      return true;
    }

    // Increment attempts
    if (data) {
      await supabase
        .from('verification_codes')
        .update({ attempts: (data.attempts || 0) + 1 })
        .eq('email', email);
    }

    return false;
  } catch (error) {
    console.error('Code verification error:', error);
    throw error;
  }
}

/**
 * Mark email as verified in profile
 */
async function markEmailAsVerified(email: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      is_email_verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq('email', email);

  if (error) {
    throw new Error(`Profile update failed: ${error.message}`);
  }
}

/**
 * Delete verification code after successful verification
 */
async function deleteVerificationCode(email: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from('verification_codes').delete().eq('email', email);

  if (error) {
    console.warn('Failed to delete verification code:', error);
    // Don't throw here, as this is cleanup operation
  }
}

/**
 * Handle email verification request
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyEmailResponse | VerifyEmailErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed',
      },
    });
  }

  try {
    const { code, email } = req.body as VerifyEmailRequest;

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email address',
          details: emailValidation.errors,
        },
      });
    }

    const normalizedEmail = getNormalizedEmail(email) || email;

    // Check rate limit by email
    if (!isEmailVerifyAllowed(normalizedEmail)) {
      const headers = getRateLimitHeaders('email-verify', normalizedEmail, EMAIL_VERIFY_RATE_LIMIT);
      return res.status(429).set(headers).json({
        success: false,
        error: {
          code: 'RATE_LIMIT',
          message: 'Too many verification attempts. Please try again later.',
          details: [`Reset in ${headers['Retry-After']} seconds`],
        },
      });
    }

    // Validate code format (must be 6 digits)
    if (!isValidCodeFormat(code)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid verification code format. Code must be 6 digits.',
          details: ['Verification codes must be exactly 6 digits'],
        },
      });
    }

    // Verify code against database
    const isValid = await verifyCode(normalizedEmail, code);

    if (!isValid) {
      // Get the stored code to check if it's expired
      const supabase = getSupabaseServerClient();
      const { data } = await supabase
        .from('verification_codes')
        .select('expires_at')
        .eq('email', normalizedEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && isCodeExpired(data.expires_at)) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'EXPIRED_CODE',
            message: 'Your verification code has expired',
            details: ['Please request a new verification code'],
          },
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid verification code',
          details: ['The code you entered is incorrect'],
        },
      });
    }

    // Mark email as verified
    await markEmailAsVerified(normalizedEmail);

    // Delete verification code
    await deleteVerificationCode(normalizedEmail);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in to your account.',
      data: {
        email: normalizedEmail,
        is_email_verified: true,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during email verification. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? [errorMessage] : undefined,
      },
    });
  }
}

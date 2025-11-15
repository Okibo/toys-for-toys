/**
 * POST /api/auth/resend-verification
 * Resend verification email endpoint
 *
 * Accepts: { email }
 * Returns: 200 { success, data: { email, new_code_sent } }
 *          400 { success: false, error }
 *          404 { success: false, error }
 *          500 { success: false, error }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { validateEmail, getNormalizedEmail } from '@/lib/auth/email-validator';
import { isEmailVerifyAllowed, getRateLimitHeaders, EMAIL_VERIFY_RATE_LIMIT } from '@/lib/auth/rate-limiter';
import { getSupabaseServerClient } from '@/lib/auth/supabase-server';
import { generateVerificationCode, getCodeExpiryTime } from '@/lib/auth/verification-code';
import { generateVerificationEmail, getVerificationEmailSubject } from '@/lib/email/verification-template';
import { sendEmail } from '@/lib/email/send-email';
import type {
  ResendVerificationRequest,
  ResendVerificationResponse,
  ResendVerificationErrorResponse,
} from '@/lib/auth/types';

/**
 * Get user profile by email
 */
async function getUserProfile(email: string): Promise<{ id: string; is_email_verified: boolean; language?: string } | null> {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, is_email_verified, language')
      .eq('email', email)
      .single();

    if (error) {
      // No profile found
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Profile lookup error:', error);
    throw error;
  }
}

/**
 * Update or create verification code
 */
async function updateVerificationCode(email: string, code: string, expiresAt: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  try {
    // Delete old codes for this email
    await supabase.from('verification_codes').delete().eq('email', email);

    // Insert new code
    const { error } = await supabase.from('verification_codes').insert([
      {
        email,
        code,
        expires_at: expiresAt,
        attempts: 0,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      throw new Error(`Verification code storage failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Verification code update error:', error);
    throw error;
  }
}

/**
 * Handle resend verification email request
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResendVerificationResponse | ResendVerificationErrorResponse>
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
    const { email } = req.body as ResendVerificationRequest;

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
          message: 'Too many verification requests. Please try again later.',
          details: [`Reset in ${headers['Retry-After']} seconds`],
        },
      });
    }

    // Check if user exists
    const profile = await getUserProfile(normalizedEmail);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EMAIL_NOT_FOUND',
          message: 'No account found with this email address',
          details: ['Please sign up first'],
        },
      });
    }

    // Check if email is already verified
    if (profile.is_email_verified) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'This email address is already verified',
          details: ['You can now log in to your account'],
        },
      });
    }

    // Generate new verification code
    const code = generateVerificationCode();
    const expiresAt = getCodeExpiryTime();

    // Store new verification code
    await updateVerificationCode(normalizedEmail, code, expiresAt);

    // Send verification email
    const language = profile.language || 'en';
    const emailContent = generateVerificationEmail(code, normalizedEmail, language);
    const subject = getVerificationEmailSubject(language);
    await sendEmail({
      to: normalizedEmail,
      subject,
      html: emailContent.html,
      plainText: emailContent.plainText,
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your email for the code.',
      data: {
        email: normalizedEmail,
        new_code_sent: true,
      },
    });
  } catch (error) {
    console.error('Resend verification error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while resending the verification email. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? [errorMessage] : undefined,
      },
    });
  }
}

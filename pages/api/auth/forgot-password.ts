/**
 * POST /api/auth/forgot-password
 * Password reset request endpoint
 *
 * Accepts: { email }
 * Returns: 200 { success } (always, even if email doesn't exist)
 *          400 { success: false, error }
 *          429 { success: false, error }
 *          500 { success: false, error }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { validateEmail } from '@/lib/auth/email-validator';
import { requestPasswordReset, emailExists } from '@/lib/auth/password-reset-service';
import { generatePasswordResetEmail, getPasswordResetEmailSubject } from '@/lib/email/password-reset-template';
import { sendEmail } from '@/lib/email/send-email';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/auth/rate-limiter';
import { getSupabaseAuth } from '@/lib/auth/supabase-server';

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  success: true;
  message: string;
}

interface ForgotPasswordErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Get client IP address from request
 */
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Rate limit configuration: 3 attempts per hour per email
 */
const FORGOT_PASSWORD_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Generate password reset token via Supabase
 */
async function generateResetToken(email: string): Promise<string | null> {
  const auth = getSupabaseAuth();

  try {
    const { data, error } = await auth.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://toy-for-toy.com'}/auth/reset-password`,
      },
    });

    if (error || !data.properties?.action_link) {
      console.error('Failed to generate reset token:', error);
      return null;
    }

    // Extract token from action link
    const url = new URL(data.properties.action_link);
    const token = url.hash
      .split('&')
      .find((param) => param.startsWith('#access_token='))
      ?.replace('#access_token=', '');

    return token || null;
  } catch (error) {
    console.error('Exception generating reset token:', error);
    return null;
  }
}

/**
 * Handle forgot password request
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ForgotPasswordResponse | ForgotPasswordErrorResponse>
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
    const { email } = req.body as ForgotPasswordRequest;
    const clientIp = getClientIp(req);

    // Validate email format
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Email is required',
        },
      });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email address',
        },
      });
    }

    // Check rate limit (3 attempts per hour per email)
    const normalizedEmail = email.toLowerCase();
    if (!checkRateLimit('forgot-password', normalizedEmail, FORGOT_PASSWORD_RATE_LIMIT)) {
      const headers = getRateLimitHeaders('forgot-password', normalizedEmail, FORGOT_PASSWORD_RATE_LIMIT);
      return res.status(429).set(headers).json({
        success: false,
        error: {
          code: 'RATE_LIMIT',
          message: 'Too many password reset requests. Please try again later.',
        },
      });
    }

    // Process request (but always return success to prevent email enumeration)
    const result = await requestPasswordReset(normalizedEmail, clientIp);

    if (!result.success) {
      console.warn('Password reset request failed for:', normalizedEmail);
    }

    // Check if user exists and send email if they do
    const exists = await emailExists(normalizedEmail);

    if (exists) {
      try {
        // Generate reset token
        const resetToken = await generateResetToken(normalizedEmail);

        if (resetToken) {
          // Generate email content
          const emailContent = generatePasswordResetEmail(resetToken, normalizedEmail, 'en');
          const subject = getPasswordResetEmailSubject('en');

          // Send email
          await sendEmail({
            to: normalizedEmail,
            subject,
            html: emailContent.html,
            plainText: emailContent.plainText,
          });

          console.log('Password reset email sent to:', normalizedEmail);
        }
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email sending fails
        // User can try again later
      }
    }

    // Always return success response (prevents email enumeration)
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    // Still return success to prevent information leakage
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  }
}

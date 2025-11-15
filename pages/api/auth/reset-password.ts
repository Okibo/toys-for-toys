/**
 * POST /api/auth/reset-password
 * Password reset completion endpoint
 *
 * Accepts: { token, email, new_password }
 * Returns: 200 { success }
 *          400 { success: false, error }
 *          401 { success: false, error }
 *          429 { success: false, error }
 *          500 { success: false, error }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { validateEmail } from '@/lib/auth/email-validator';
import { validatePassword } from '@/lib/auth/password-validator';
import { resetPassword, emailExists } from '@/lib/auth/password-reset-service';
import { generatePasswordChangedEmail, getPasswordChangedEmailSubject } from '@/lib/email/password-changed-template';
import { sendEmail } from '@/lib/email/send-email';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/auth/rate-limiter';

interface ResetPasswordRequest {
  token: string;
  email: string;
  new_password: string;
}

interface ResetPasswordSuccessResponse {
  success: true;
  message: string;
}

interface ResetPasswordErrorResponse {
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
 * Rate limit configuration: 5 attempts per hour per email
 */
const RESET_PASSWORD_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Handle password reset request
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResetPasswordSuccessResponse | ResetPasswordErrorResponse>
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
    const { token, email, new_password } = req.body as ResetPasswordRequest;
    const clientIp = getClientIp(req);

    // Validate token
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Password reset token is required',
        },
      });
    }

    // Validate email
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

    const normalizedEmail = email.toLowerCase();

    // Check rate limit (5 attempts per hour per email)
    if (!checkRateLimit('reset-password', normalizedEmail, RESET_PASSWORD_RATE_LIMIT)) {
      const headers = getRateLimitHeaders('reset-password', normalizedEmail, RESET_PASSWORD_RATE_LIMIT);
      return res.status(429).set(headers).json({
        success: false,
        error: {
          code: 'RATE_LIMIT',
          message: 'Too many password reset attempts. Please try again later.',
        },
      });
    }

    // Validate new password
    if (!new_password || typeof new_password !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'New password is required',
        },
      });
    }

    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password does not meet security requirements',
        },
      });
    }

    // Prevent reusing same password
    // Note: This is handled by Supabase Auth, which prevents using the old password

    // Perform password reset
    const result = await resetPassword(token, normalizedEmail, new_password, clientIp);

    if (!result.success) {
      if (result.code === 'INVALID_TOKEN' || result.code === 'EXPIRED_TOKEN') {
        return res.status(401).json({
          success: false,
          error: {
            code: result.code,
            message: result.message,
          },
        });
      }

      if (result.code === 'INVALID_PASSWORD') {
        return res.status(400).json({
          success: false,
          error: {
            code: result.code,
            message: result.message,
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: result.code,
          message: result.message,
        },
      });
    }

    // Send confirmation email
    try {
      const exists = await emailExists(normalizedEmail);

      if (exists) {
        const emailContent = generatePasswordChangedEmail(normalizedEmail, 'en');
        const subject = getPasswordChangedEmailSubject('en');

        await sendEmail({
          to: normalizedEmail,
          subject,
          html: emailContent.html,
          plainText: emailContent.plainText,
        });

        console.log('Password changed confirmation email sent to:', normalizedEmail);
      }
    } catch (emailError) {
      console.error('Failed to send password changed confirmation email:', emailError);
      // Don't fail the password reset if confirmation email fails
    }

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while resetting your password. Please try again later.',
      },
    });
  }
}

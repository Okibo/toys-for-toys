/**
 * POST /api/auth/login
 * User login endpoint
 *
 * Accepts: { email, password }
 * Returns: 200 { success, access_token, refresh_token, user_id, email }
 *          401 { success: false, error }
 *          403 { success: false, error }
 *          429 { success: false, error }
 *          500 { success: false, error }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { validateEmail } from '@/lib/auth/email-validator';
import { loginUser } from '@/lib/auth/login-service';
import { generateTokenPair, getCookieOptions, getCookieExpiry } from '@/lib/auth/session-service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/auth/rate-limiter';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginSuccessResponse {
  success: true;
  access_token: string;
  refresh_token: string;
  user_id: string;
  email: string;
}

interface LoginErrorResponse {
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
 * Rate limit configuration: 5 attempts per minute per email
 */
const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Handle login request
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginSuccessResponse | LoginErrorResponse>
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
    const { email, password } = req.body as LoginRequest;
    const clientIp = getClientIp(req);

    // Validate email format
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Email is required and must be a valid email address',
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

    // Validate password
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Password is required',
        },
      });
    }

    // Check rate limit (5 attempts per minute per email)
    const normalizedEmail = email.toLowerCase();
    if (!checkRateLimit('login', normalizedEmail, LOGIN_RATE_LIMIT)) {
      const headers = getRateLimitHeaders('login', normalizedEmail, LOGIN_RATE_LIMIT);
      return res.status(429).set(headers).json({
        success: false,
        error: {
          code: 'RATE_LIMIT',
          message: 'Too many login attempts. Please try again later.',
        },
      });
    }

    // Attempt login
    const loginResult = await loginUser(normalizedEmail, password, clientIp);

    if (!loginResult.success) {
      // Different error codes get different responses
      if (loginResult.code === 'EMAIL_NOT_VERIFIED') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email address first',
          },
        });
      }

      // For invalid credentials, always return 401 (don't reveal if email exists)
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Generate token pair
    const tokenPair = await generateTokenPair(loginResult.user_id, loginResult.email);

    // Set secure httpOnly cookies for tokens
    const cookieOptions = getCookieOptions();

    res.setHeader('Set-Cookie', [
      `access_token=${tokenPair.accessToken}; Path=/; ${
        cookieOptions.secure ? 'Secure; ' : ''
      }HttpOnly; SameSite=Strict; Max-Age=${tokenPair.accessTokenExpiresIn}`,
      `refresh_token=${tokenPair.refreshToken}; Path=/; ${
        cookieOptions.secure ? 'Secure; ' : ''
      }HttpOnly; SameSite=Strict; Max-Age=${tokenPair.refreshTokenExpiresIn}`,
    ]);

    // Return success response with tokens in body (for client-side access if needed)
    return res.status(200).json({
      success: true,
      access_token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
      user_id: loginResult.user_id,
      email: loginResult.email,
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login. Please try again later.',
      },
    });
  }
}

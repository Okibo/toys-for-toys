/**
 * POST /api/auth/refresh-token
 * Token refresh endpoint
 *
 * Accepts: (no body, uses refresh_token cookie)
 * Returns: 200 { success, access_token }
 *          401 { success: false, error }
 *          429 { success: false, error }
 *          500 { success: false, error }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyRefreshToken, generateAccessToken, extractTokenFromCookie } from '@/lib/auth/session-service';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/auth/rate-limiter';

interface RefreshTokenSuccessResponse {
  success: true;
  access_token: string;
}

interface RefreshTokenErrorResponse {
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
 * Rate limit configuration: 10 attempts per minute per user
 */
const REFRESH_RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Handle token refresh request
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RefreshTokenSuccessResponse | RefreshTokenErrorResponse>
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
    // Extract refresh token from cookies
    const cookieHeader = req.headers.cookie;
    const refreshToken = extractTokenFromCookie(cookieHeader, 'refresh_token');

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token is required',
        },
      });
    }

    // Verify refresh token
    const tokenData = await verifyRefreshToken(refreshToken);

    if (!tokenData) {
      // Clear invalid token
      res.setHeader('Set-Cookie', 'refresh_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');

      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }

    const { userId, email } = tokenData;
    const clientIp = getClientIp(req);

    // Check rate limit (10 per minute per user)
    if (!checkRateLimit('refresh-token', userId, REFRESH_RATE_LIMIT)) {
      const headers = getRateLimitHeaders('refresh-token', userId, REFRESH_RATE_LIMIT);
      return res.status(429).set(headers).json({
        success: false,
        error: {
          code: 'RATE_LIMIT',
          message: 'Too many token refresh attempts. Please try again later.',
        },
      });
    }

    // Generate new access token
    const newAccessTokenResult = await generateAccessToken(userId, email);

    // Set new access token cookie
    const accessTokenExpiresIn = newAccessTokenResult.expiresIn;
    res.setHeader(
      'Set-Cookie',
      `access_token=${newAccessTokenResult.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${accessTokenExpiresIn}`
    );

    return res.status(200).json({
      success: true,
      access_token: newAccessTokenResult.token,
    });
  } catch (error) {
    console.error('Token refresh error:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while refreshing your token. Please try again.',
      },
    });
  }
}

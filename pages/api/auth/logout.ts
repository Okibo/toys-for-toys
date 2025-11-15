/**
 * POST /api/auth/logout
 * User logout endpoint
 *
 * Accepts: (no body, uses cookies)
 * Returns: 200 { success, message }
 *          500 { success: false, error }
 */

import type { NextApiRequest, NextApiResponse } from 'next';

interface LogoutResponse {
  success: true;
  message: string;
}

interface LogoutErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Handle logout request
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse | LogoutErrorResponse>
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
    // Clear authentication cookies by setting them to empty with Max-Age=0
    res.setHeader('Set-Cookie', [
      'access_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
      'refresh_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    ]);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during logout. Please try again.',
      },
    });
  }
}

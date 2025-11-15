/**
 * POST /api/auth/consent
 * Record user consent for GDPR compliance
 *
 * Accepts: {
 *   privacy_policy: boolean (must be true),
 *   terms_of_service: boolean (must be true),
 *   behavioral_analytics?: boolean (optional, defaults to false)
 * }
 *
 * Returns: 200 { success: true, message: "..." }
 *          400 { success: false, error: { code, message, details } }
 *          401 { success: false, error: { code: 'UNAUTHORIZED', ... } }
 *          409 { success: false, error: { code: 'ALREADY_RECORDED', ... } }
 *          429 { success: false, error: { code: 'RATE_LIMIT', ... } }
 *          500 { success: false, error: { code: 'INTERNAL_ERROR', ... } }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { validateConsentPayload, createConsentRecords, hasConsentRecorded, markConsentCompleted } from '@/lib/auth/consent-service';
import { checkRateLimit, getRateLimitHeaders, type RateLimitConfig } from '@/lib/auth/rate-limiter';
import type {
  ConsentRequest,
  ConsentResponse,
  ConsentErrorResponse,
} from '@/lib/auth/types';

/**
 * Rate limit config for consent endpoint
 * Max 5 attempts per 15 minutes per user
 */
const CONSENT_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

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
 * Get user agent from request
 */
function getUserAgent(req: NextApiRequest): string {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Get authenticated user ID from Supabase JWT token
 */
async function getAuthenticatedUserId(req: NextApiRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    // Use Supabase to verify token and get user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not configured');
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    return data.user.id;
  } catch (error) {
    console.error('Error extracting user ID:', error);
    return null;
  }
}

/**
 * Handle consent recording request
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConsentResponse | ConsentErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Only POST requests are allowed',
      },
    });
  }

  const clientIp = getClientIp(req);
  const userAgent = getUserAgent(req);

  try {
    // Authenticate user
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is not authenticated. Please login first.',
          details: ['Valid JWT token required in Authorization header'],
        },
      });
    }

    // Check rate limit per user
    if (!checkRateLimit('consent', userId, CONSENT_RATE_LIMIT)) {
      const headers = getRateLimitHeaders('consent', userId, CONSENT_RATE_LIMIT);
      return res.status(429).set(headers).json({
        success: false,
        error: {
          code: 'RATE_LIMIT',
          message: 'Too many consent submissions. Please try again later.',
          details: [`Reset in ${headers['Retry-After']} seconds`],
        },
      });
    }

    // Validate consent payload
    const { privacy_policy, terms_of_service, behavioral_analytics = false } = req.body;
    const payloadValidation = validateConsentPayload({
      privacy_policy,
      terms_of_service,
      behavioral_analytics,
    });

    if (!payloadValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Consent payload validation failed',
          details: payloadValidation.errors,
        },
      });
    }

    // Check if user has already recorded consent
    const alreadyRecorded = await hasConsentRecorded(userId);
    if (alreadyRecorded) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_RECORDED',
          message: 'User has already recorded consent',
          details: ['Consent can only be recorded once. To change preferences, use the withdrawal endpoint.'],
        },
      });
    }

    // Create consent records
    const records = await createConsentRecords(
      userId,
      privacy_policy,
      terms_of_service,
      behavioral_analytics,
      clientIp,
      userAgent
    );

    // Mark consent as completed in profile (non-critical)
    await markConsentCompleted(userId);

    // Return success response
    return res.status(200).json({
      success: true,
      message: `Consent recorded successfully. ${records.length} consent records created.`,
    });
  } catch (error) {
    console.error('Consent recording error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error types
    if (errorMessage === 'ALREADY_RECORDED') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_RECORDED',
          message: 'User has already recorded consent',
        },
      });
    }

    // Generic internal error
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while recording consent. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? [errorMessage] : undefined,
      },
    });
  }
}

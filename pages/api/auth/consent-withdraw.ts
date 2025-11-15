/**
 * POST /api/auth/consent-withdraw
 * Withdraw user consent for specific types (analytics only)
 *
 * Accepts: {
 *   consent_type: 'behavioral_analytics' | 'privacy_policy' | 'terms_of_service'
 * }
 *
 * Returns: 200 { success: true, message: "...", new_record: { ... } }
 *          400 { success: false, error: { code, message, details } }
 *          401 { success: false, error: { code: 'UNAUTHORIZED', ... } }
 *          409 { success: false, error: { code: 'CANNOT_WITHDRAW', ... } }
 *          404 { success: false, error: { code: 'NOT_FOUND', ... } }
 *          429 { success: false, error: { code: 'RATE_LIMIT', ... } }
 *          500 { success: false, error: { code: 'INTERNAL_ERROR', ... } }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withdrawConsent } from '@/lib/auth/consent-service';
import { checkRateLimit, getRateLimitHeaders, type RateLimitConfig } from '@/lib/auth/rate-limiter';
import type {
  ConsentType,
  ConsentWithdrawRequest,
  ConsentWithdrawResponse,
  ConsentWithdrawErrorResponse,
} from '@/lib/auth/types';

/**
 * Rate limit config for withdrawal endpoint
 * Max 10 attempts per hour per user
 */
const WITHDRAWAL_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Valid consent types
 */
const VALID_CONSENT_TYPES: ConsentType[] = ['privacy_policy', 'terms_of_service', 'behavioral_analytics'];

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
 * Validate withdrawal request payload
 */
function validateWithdrawalPayload(payload: unknown): {
  isValid: boolean;
  errors: string[];
  consent_type?: ConsentType;
} {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('Request payload must be an object');
    return { isValid: false, errors };
  }

  const obj = payload as Record<string, unknown>;

  if (!('consent_type' in obj)) {
    errors.push('consent_type is required');
    return { isValid: false, errors };
  }

  const consentType = obj.consent_type as string;

  if (typeof consentType !== 'string') {
    errors.push('consent_type must be a string');
    return { isValid: false, errors };
  }

  if (!VALID_CONSENT_TYPES.includes(consentType as ConsentType)) {
    errors.push(`consent_type must be one of: ${VALID_CONSENT_TYPES.join(', ')}`);
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors,
    consent_type: consentType as ConsentType,
  };
}

/**
 * Handle consent withdrawal request
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConsentWithdrawResponse | ConsentWithdrawErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'INVALID_TYPE',
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
    if (!checkRateLimit('consent-withdraw', userId, WITHDRAWAL_RATE_LIMIT)) {
      const headers = getRateLimitHeaders('consent-withdraw', userId, WITHDRAWAL_RATE_LIMIT);
      return res.status(429).set(headers).json({
        success: false,
        error: {
          code: 'RATE_LIMIT',
          message: 'Too many withdrawal attempts. Please try again later.',
          details: [`Reset in ${headers['Retry-After']} seconds`],
        },
      });
    }

    // Validate request payload
    const payloadValidation = validateWithdrawalPayload(req.body);

    if (!payloadValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Request validation failed',
          details: payloadValidation.errors,
        },
      });
    }

    const consentType = payloadValidation.consent_type!;

    // Attempt to withdraw consent
    const withdrawalRecord = await withdrawConsent(
      userId,
      consentType,
      clientIp,
      userAgent
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: `Consent withdrawn successfully for ${consentType}`,
      new_record: {
        consent_type: withdrawalRecord.consent_type,
        consent_given: false,
        withdrawn_at: withdrawalRecord.withdrawn_at!,
      },
    });
  } catch (error) {
    console.error('Consent withdrawal error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error types
    if (errorMessage === 'CANNOT_WITHDRAW') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CANNOT_WITHDRAW',
          message: 'This consent type cannot be withdrawn',
          details: ['Only behavioral_analytics consent can be withdrawn. Privacy policy and terms of service are required.'],
        },
      });
    }

    if (errorMessage === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No active consent record found for this type',
          details: ['User must have given consent before it can be withdrawn.'],
        },
      });
    }

    // Generic internal error
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while withdrawing consent. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? [errorMessage] : undefined,
      },
    });
  }
}

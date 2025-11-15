/**
 * GET /api/auth/consent-status
 * Retrieve user's consent history for GDPR compliance
 *
 * Returns: 200 { success: true, consent_records: [...] }
 *          401 { success: false, error: { code: 'UNAUTHORIZED', ... } }
 *          500 { success: false, error: { code: 'INTERNAL_ERROR', ... } }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getConsentHistory } from '@/lib/auth/consent-service';
import type {
  ConsentStatusResponse,
  ConsentStatusErrorResponse,
} from '@/lib/auth/types';

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
 * Handle consent status retrieval request
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConsentStatusResponse | ConsentStatusErrorResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Only GET requests are allowed',
      },
    });
  }

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

    // Get consent history
    const consentRecords = await getConsentHistory(userId);

    // Return success response
    return res.status(200).json({
      success: true,
      consent_records: consentRecords,
    });
  } catch (error) {
    console.error('Consent retrieval error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Generic internal error
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while retrieving consent records. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? [errorMessage] : undefined,
      },
    });
  }
}

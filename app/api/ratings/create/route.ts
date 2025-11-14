/**
 * app/api/ratings/create/route.ts
 *
 * Create a rating for a completed exchange with API-layer verification.
 *
 * SECURITY: This endpoint demonstrates proper implementation for rating operations.
 * Before creating a rating:
 * 1. Verify user is authenticated
 * 2. Verify exchange exists and is completed
 * 3. Verify user is a participant in the exchange
 * 4. Verify no duplicate rating exists
 * 5. Verify mutual rating visibility rules (can show preview of both ratings once mutual)
 * 6. Log the operation for audit trail
 *
 * POST /api/ratings/create
 * Body: {
 *   exchange_id: string,          // UUID of completed exchange
 *   condition_rating: number,     // 1-5 scale
 *   communication_rating: number, // 1-5 scale
 *   review_text?: string          // Optional review (max 500 chars)
 * }
 *
 * Response:
 *   - 201 Created: { rating_id, status, mutual_ratings_visible }
 *   - 400 Bad Request: { error, message, context }
 *   - 401 Unauthorized: { error, message }
 *   - 403 Forbidden: { error, message }
 *   - 404 Not Found: { error, message }
 *   - 500 Internal Server Error: { error, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  VerificationError,
  verifyRatingEligibility,
  verifyMutualRatingVisibility,
} from '@/lib/security/verify-critical-ops';
import {
  logVerificationFailure,
  logOperationSuccess,
  extractClientIp,
  AuditEventType,
} from '@/lib/security/audit-logging';

/**
 * Request body schema
 */
interface CreateRatingRequest {
  exchange_id: string;
  condition_rating: number;
  communication_rating: number;
  review_text?: string;
}

/**
 * Validate rating value is in 1-5 range
 */
function validateRatingValue(value: number, fieldName: string): void {
  if (typeof value !== 'number' || value < 1 || value > 5 || !Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer between 1 and 5`);
  }
}

/**
 * Validate review text is not too long
 */
function validateReviewText(text: string | undefined): void {
  if (text && text.length > 500) {
    throw new Error('Review text must not exceed 500 characters');
  }
}

/**
 * POST /api/ratings/create
 *
 * Create a rating with comprehensive verification
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract authentication header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser?.id) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Invalid or expired authentication token',
        },
        { status: 401 }
      );
    }

    const userId = currentUser.id;
    const clientIp = extractClientIp(request.headers);

    // Parse request body
    let body: CreateRatingRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    const { exchange_id, condition_rating, communication_rating, review_text } = body;

    // Validate required fields
    if (!exchange_id || condition_rating === undefined || communication_rating === undefined) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'exchange_id, condition_rating, and communication_rating are required',
        },
        { status: 400 }
      );
    }

    // Validate rating values
    try {
      validateRatingValue(condition_rating, 'condition_rating');
      validateRatingValue(communication_rating, 'communication_rating');
      validateReviewText(review_text);
    } catch (err) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: (err as Error).message,
        },
        { status: 400 }
      );
    }

    // Step 1: Verify exchange exists and user is eligible to rate
    try {
      await verifyRatingEligibility(exchange_id, userId, supabase);
    } catch (err) {
      if (err instanceof VerificationError) {
        await logVerificationFailure(
          supabase,
          userId,
          err.code,
          err.message,
          { ...err.context, subject_type: 'rating' },
          clientIp
        );

        return NextResponse.json(
          {
            error: err.code,
            message: err.message,
            context: err.context,
          },
          { status: err.statusCode }
        );
      }
      throw err;
    }

    // Step 2: Get exchange to find the rated user (other party)
    const { data: exchange, error: exchangeError } = await supabase
      .from('exchanges')
      .select('requester_id, lister_id')
      .eq('id', exchange_id)
      .single();

    if (exchangeError || !exchange) {
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to retrieve exchange information',
        },
        { status: 500 }
      );
    }

    const ratedUserId =
      exchange.requester_id === userId ? exchange.lister_id : exchange.requester_id;

    // Step 3: All verifications passed - create rating
    const { data: rating, error: createError } = await supabase
      .from('ratings')
      .insert([
        {
          exchange_id,
          rater_id: userId,
          rated_user_id: ratedUserId,
          condition_rating,
          communication_rating,
          review_text: review_text || null,
        },
      ])
      .select('id')
      .single();

    if (createError) {
      console.error('Failed to create rating:', createError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to create rating',
        },
        { status: 500 }
      );
    }

    // Step 4: Check if ratings are now mutually visible
    let mutualRatingsVisible = false;
    try {
      mutualRatingsVisible = await verifyMutualRatingVisibility(exchange_id, userId, supabase);
    } catch {
      // If check fails, continue anyway - mutual visibility is not critical
      mutualRatingsVisible = false;
    }

    // Step 5: Log successful operation
    await logOperationSuccess(
      supabase,
      AuditEventType.RATING_CREATED,
      userId,
      rating.id,
      'rating',
      `Created rating for exchange (condition: ${condition_rating}, communication: ${communication_rating})`,
      {
        exchange_id,
        rated_user_id: ratedUserId,
        condition_rating,
        communication_rating,
        has_review: !!review_text,
        mutual_ratings_visible: mutualRatingsVisible,
      }
    );

    return NextResponse.json(
      {
        rating_id: rating.id,
        status: 'created',
        mutual_ratings_visible: mutualRatingsVisible,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in create rating endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

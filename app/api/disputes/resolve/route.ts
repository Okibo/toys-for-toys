/**
 * app/api/disputes/resolve/route.ts
 *
 * Resolve a dispute with API-layer security verification.
 *
 * SECURITY: This endpoint demonstrates proper implementation for critical operations
 * requiring secondary admin verification. Before resolving a dispute:
 * 1. Verify user is authenticated
 * 2. Verify user is a verified admin (secondary verification beyond JWT)
 * 3. Verify dispute exists and is in valid state
 * 4. Verify resolution action is valid
 * 5. Log the operation for audit trail
 * 6. Execute transaction
 *
 * POST /api/disputes/resolve
 * Body: {
 *   dispute_id: string,           // UUID of dispute to resolve
 *   resolution: 'refund' | 'accepted' | 'rejected' | 'replacement',
 *   admin_notes: string           // Notes from admin review
 * }
 *
 * Response:
 *   - 200 OK: { dispute_id, status, resolution }
 *   - 400 Bad Request: { error, message, context }
 *   - 401 Unauthorized: { error, message }
 *   - 403 Forbidden: { error, message } (not verified admin)
 *   - 404 Not Found: { error, message }
 *   - 500 Internal Server Error: { error, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  VerificationError,
  verifyDisputeState,
  verifyAdminVerified,
} from '@/lib/security/verify-critical-ops';
import {
  logVerificationFailure,
  logOperationSuccess,
  logUnauthorizedAttempt,
  extractClientIp,
  AuditEventType,
} from '@/lib/security/audit-logging';

/**
 * Request body schema
 */
interface ResoluteDisputeRequest {
  dispute_id: string;
  resolution: 'refund' | 'accepted' | 'rejected' | 'replacement';
  admin_notes: string;
}

/**
 * POST /api/disputes/resolve
 *
 * Resolve a dispute with secondary admin verification
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
    let body: ResoluteDisputeRequest;
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

    const { dispute_id, resolution, admin_notes } = body;

    // Validate required fields
    if (!dispute_id || !resolution || !admin_notes) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'dispute_id, resolution, and admin_notes are required',
        },
        { status: 400 }
      );
    }

    // Validate resolution value
    const validResolutions = ['refund', 'accepted', 'rejected', 'replacement'];
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: `resolution must be one of: ${validResolutions.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Step 1: Verify user is a verified admin (secondary verification)
    try {
      await verifyAdminVerified(userId, supabase);
    } catch (err) {
      if (err instanceof VerificationError) {
        // Log unauthorized admin attempt
        await logUnauthorizedAttempt(
          supabase,
          userId,
          'Attempted to resolve dispute without verified admin status',
          err.message,
          { dispute_id, resolution },
          clientIp
        );

        return NextResponse.json(
          {
            error: err.code,
            message: err.message,
          },
          { status: err.statusCode }
        );
      }
      throw err;
    }

    // Step 2: Verify dispute exists and is in valid state for resolution
    let dispute: { id: string; exchange_id: string; status: string; resolution: string | null };
    try {
      dispute = await verifyDisputeState(dispute_id, supabase);
    } catch (err) {
      if (err instanceof VerificationError) {
        await logVerificationFailure(
          supabase,
          userId,
          err.code,
          err.message,
          { ...err.context, subject_type: 'dispute' },
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

    // Step 3: All verifications passed - resolve dispute
    const { data: resolvedDispute, error: updateError } = await supabase
      .from('disputes')
      .update({
        status: 'resolved',
        resolution,
        admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dispute_id)
      .select('id, status, resolution')
      .single();

    if (updateError) {
      console.error('Failed to resolve dispute:', updateError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to resolve dispute',
        },
        { status: 500 }
      );
    }

    // Step 4: If resolution is 'refund', handle ticket refund
    if (resolution === 'refund') {
      const { data: exchange, error: exchangeError } = await supabase
        .from('exchanges')
        .select('requester_id, status')
        .eq('id', dispute.exchange_id)
        .single();

      if (exchangeError || !exchange) {
        console.error('Failed to fetch exchange for refund:', exchangeError);
        return NextResponse.json(
          {
            error: 'Database error',
            message: 'Failed to process refund',
          },
          { status: 500 }
        );
      }

      // Refund 1 ticket to requester via system operation
      // This should be done through an Edge Function or service role operation
      // For now, we'll log that refund is needed
      console.log('Dispute resolution requires ticket refund:', {
        dispute_id,
        exchange_id: dispute.exchange_id,
        requester_id: exchange.requester_id,
        amount: 1,
      });
    }

    // Step 5: Log successful operation
    await logOperationSuccess(
      supabase,
      AuditEventType.DISPUTE_RESOLVED,
      userId,
      dispute_id,
      'dispute',
      `Resolved dispute with resolution: ${resolution}`,
      {
        exchange_id: dispute.exchange_id,
        resolution,
      }
    );

    return NextResponse.json(
      {
        dispute_id: resolvedDispute.id,
        status: resolvedDispute.status,
        resolution: resolvedDispute.resolution,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in resolve dispute endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

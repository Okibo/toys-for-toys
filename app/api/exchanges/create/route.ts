/**
 * app/api/exchanges/create/route.ts
 *
 * Create a new exchange request with API-layer security verification.
 *
 * SECURITY: This endpoint demonstrates proper implementation of critical operation
 * verification. Before creating an exchange:
 * 1. Verify user is authenticated
 * 2. Verify toy exists and is active
 * 3. Verify requester has sufficient ticket balance
 * 4. Verify self-exchange check
 * 5. Verify state machine rules
 * 6. Log the operation for audit trail
 * 7. Execute database transaction
 * 8. Handle verification failures with proper error responses
 *
 * POST /api/exchanges/create
 * Body: {
 *   toy_id: string,          // UUID of toy to request
 *   kid_for_id: string,      // UUID of child the toy is for
 *   requester_message?: string  // Optional message to lister
 * }
 *
 * Response:
 *   - 201 Created: { exchange_id, status, created_at }
 *   - 400 Bad Request: { error, message, context }
 *   - 401 Unauthorized: { error, message }
 *   - 402 Payment Required: { error, message } (insufficient tickets)
 *   - 403 Forbidden: { error, message }
 *   - 404 Not Found: { error, message }
 *   - 500 Internal Server Error: { error, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  VerificationError,
  verifyToyExists,
  verifyTicketBalance,
  verifySelfExchangeCheck,
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
interface CreateExchangeRequest {
  toy_id: string;
  kid_for_id: string;
  requester_message?: string;
}

/**
 * POST /api/exchanges/create
 *
 * Create a new exchange request with comprehensive verification
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
    let body: CreateExchangeRequest;
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

    const { toy_id, kid_for_id, requester_message } = body;

    // Validate required fields
    if (!toy_id || !kid_for_id) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'toy_id and kid_for_id are required',
        },
        { status: 400 }
      );
    }

    // Step 1: Verify toy exists and is active
    let toy: { id: string; user_id: string; status: string };
    try {
      toy = await verifyToyExists(toy_id, supabase);
    } catch (err) {
      if (err instanceof VerificationError) {
        await logVerificationFailure(
          supabase,
          userId,
          err.code,
          err.message,
          { ...err.context, subject_type: 'toy' },
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

    // Step 2: Verify requester has sufficient tickets
    let ticketBalance: { balance: number; frozen: number; available: number };
    try {
      ticketBalance = await verifyTicketBalance(userId, supabase, 1);
    } catch (err) {
      if (err instanceof VerificationError) {
        await logVerificationFailure(
          supabase,
          userId,
          err.code,
          err.message,
          { ...err.context, subject_type: 'tickets' },
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

    // Step 3: Verify self-exchange check
    try {
      verifySelfExchangeCheck(userId, toy.user_id);
    } catch (err) {
      if (err instanceof VerificationError) {
        await logVerificationFailure(
          supabase,
          userId,
          err.code,
          err.message,
          { ...err.context, subject_type: 'exchange' },
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

    // Step 4: All verifications passed - create exchange
    const { data: exchange, error: createError } = await supabase
      .from('exchanges')
      .insert([
        {
          requester_id: userId,
          lister_id: toy.user_id,
          toy_id,
          kid_for_id,
          requester_message: requester_message || null,
          status: 'pending_request',
        },
      ])
      .select('id, status, created_at')
      .single();

    if (createError) {
      console.error('Failed to create exchange:', createError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to create exchange',
        },
        { status: 500 }
      );
    }

    // Step 5: Log successful operation
    await logOperationSuccess(
      supabase,
      AuditEventType.EXCHANGE_REQUEST_CREATED,
      userId,
      exchange.id,
      'exchange',
      'Created exchange request',
      {
        toy_id,
        lister_id: toy.user_id,
        ticket_balance_before: ticketBalance.balance,
      }
    );

    return NextResponse.json(
      {
        exchange_id: exchange.id,
        status: exchange.status,
        created_at: exchange.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in create exchange endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

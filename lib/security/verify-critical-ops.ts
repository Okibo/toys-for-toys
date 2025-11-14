/**
 * lib/security/verify-critical-ops.ts
 *
 * API-layer security verification for critical operations.
 * Implements business logic validation that MUST be enforced in addition to RLS policies.
 *
 * SECURITY NOTE: RLS policies provide row-level filtering at the database level.
 * However, critical operations (escrow, disputes, ratings) require additional API-layer
 * verification to prevent:
 * - Edge Function logic bugs that bypass business rules
 * - Concurrent state race conditions
 * - Trigger failures
 * - Service role key misuse
 *
 * This module provides stateless verification functions that should be called
 * BEFORE any database writes for critical operations.
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Verification error with context for audit logging and client response
 */
export class VerificationError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'VerificationError';
  }
}

/**
 * Valid exchange status transitions for state machine enforcement
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending_request: ['accepted', 'canceled'],
  accepted: ['in_transit', 'canceled', 'disputed'],
  in_transit: ['delivered', 'canceled', 'disputed'],
  delivered: ['confirmed', 'disputed'],
  confirmed: ['completed', 'disputed'],
  completed: [],
  disputed: ['completed', 'canceled'],
  auto_completed: [],
  canceled: [],
};

/**
 * Verify exchange status transition is valid according to state machine rules
 *
 * CRITICAL: This prevents invalid state transitions that could bypass escrow logic.
 *
 * @param currentStatus - Current status of the exchange
 * @param targetStatus - Desired status transition
 * @throws VerificationError if transition is invalid
 */
export function verifyExchangeStateTransition(currentStatus: string, targetStatus: string): void {
  if (!VALID_TRANSITIONS[currentStatus]) {
    throw new VerificationError(
      'INVALID_CURRENT_STATUS',
      `Invalid current exchange status: ${currentStatus}`,
      400,
      { currentStatus, targetStatus }
    );
  }

  if (!VALID_TRANSITIONS[currentStatus].includes(targetStatus)) {
    throw new VerificationError(
      'INVALID_STATUS_TRANSITION',
      `Cannot transition from ${currentStatus} to ${targetStatus}`,
      400,
      { currentStatus, targetStatus, allowedTransitions: VALID_TRANSITIONS[currentStatus] }
    );
  }
}

/**
 * Toy data retrieved for validation
 */
interface ToyData {
  id: string;
  user_id: string;
  status: string;
}

/**
 * Ticket balance information
 */
interface TicketBalance {
  balance: number;
  frozen: number;
  available: number;
}

/**
 * Verify user is participant in exchange (requester or lister)
 *
 * CRITICAL: Prevents non-participants from modifying exchanges
 *
 * @param userId - User ID making the request
 * @param requester_id - Exchange requester ID
 * @param lister_id - Exchange lister ID
 * @throws VerificationError if user is not a participant
 */
export function verifyExchangeParticipant(
  userId: string,
  requester_id: string,
  lister_id: string
): void {
  if (userId !== requester_id && userId !== lister_id) {
    throw new VerificationError(
      'NOT_EXCHANGE_PARTICIPANT',
      'User is not a participant in this exchange',
      403,
      { userId, requester_id, lister_id }
    );
  }
}

/**
 * Verify ticket balance is sufficient for escrow
 *
 * CRITICAL: Prevents double-spending and insufficient balance exploitation
 *
 * @param userId - User ID to check balance for
 * @param supabase - Supabase client with service role or user auth
 * @param requiredTickets - Number of tickets needed (default 1 for standard exchange)
 * @throws VerificationError if insufficient balance
 */
export async function verifyTicketBalance(
  userId: string,
  supabase: SupabaseClient,
  requiredTickets: number = 1
): Promise<TicketBalance> {
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('balance, frozen')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new VerificationError('TICKET_QUERY_FAILED', 'Failed to retrieve ticket balance', 500, {
      userId,
      error: error.message,
    });
  }

  if (!ticket) {
    throw new VerificationError('NO_TICKET_WALLET', 'User does not have a ticket wallet', 400, {
      userId,
    });
  }

  const available = ticket.balance - ticket.frozen;

  if (available < requiredTickets) {
    throw new VerificationError(
      'INSUFFICIENT_TICKETS',
      `Insufficient tickets. Required: ${requiredTickets}, Available: ${available}`,
      402,
      {
        userId,
        required: requiredTickets,
        available,
        balance: ticket.balance,
        frozen: ticket.frozen,
      }
    );
  }

  return {
    balance: ticket.balance,
    frozen: ticket.frozen,
    available,
  };
}

/**
 * Verify toy exists and is active
 *
 * CRITICAL: Prevents exchange creation for non-existent or delisted toys
 *
 * @param toyId - Toy ID to verify
 * @param supabase - Supabase client
 * @throws VerificationError if toy doesn't exist or is inactive
 */
export async function verifyToyExists(toyId: string, supabase: SupabaseClient): Promise<ToyData> {
  const { data: toy, error } = await supabase
    .from('toys')
    .select('id, user_id, status')
    .eq('id', toyId)
    .maybeSingle();

  if (error) {
    throw new VerificationError('TOY_QUERY_FAILED', 'Failed to retrieve toy information', 500, {
      toyId,
      error: error.message,
    });
  }

  if (!toy) {
    throw new VerificationError('TOY_NOT_FOUND', 'Toy does not exist', 404, { toyId });
  }

  if (toy.status !== 'active') {
    throw new VerificationError(
      'TOY_NOT_AVAILABLE',
      `Toy is not available for exchange (status: ${toy.status})`,
      400,
      { toyId, status: toy.status }
    );
  }

  return toy;
}

/**
 * Verify requester and lister are different users
 *
 * CRITICAL: Prevents self-exchange abuse
 *
 * @param requesterId - Requester user ID
 * @param listerId - Lister user ID
 * @throws VerificationError if same user
 */
export function verifySelfExchangeCheck(requesterId: string, listerId: string): void {
  if (requesterId === listerId) {
    throw new VerificationError('SELF_EXCHANGE_ATTEMPTED', 'Cannot exchange with yourself', 400, {
      requesterId,
      listerId,
    });
  }
}

/**
 * Secondary admin verification beyond JWT claims
 *
 * CRITICAL: Prevents compromised JWT tokens from performing admin operations
 * RLS policy checks is_admin() which only validates JWT claims.
 * This function performs secondary verification at the API layer.
 *
 * @param userId - User ID to verify as admin
 * @param supabase - Supabase client (should use service role for verification)
 * @throws VerificationError if user is not verified admin
 */
export async function verifyAdminVerified(userId: string, supabase: SupabaseClient): Promise<void> {
  // Strategy: Check for explicit admin flag in profiles table
  // This is a simple approach - in production, you might use:
  // - Separate admin table with verified records
  // - Admin role in auth system with separate enforcement
  // - Admin session tokens with additional validation

  const { data: adminRecord, error } = await supabase
    .from('admin_users')
    .select('id, verified_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "no rows found" which is acceptable
    throw new VerificationError('ADMIN_VERIFICATION_FAILED', 'Failed to verify admin status', 500, {
      userId,
      error: error.message,
    });
  }

  if (!adminRecord) {
    throw new VerificationError(
      'NOT_VERIFIED_ADMIN',
      'User does not have verified admin privileges',
      403,
      { userId }
    );
  }
}

/**
 * Dispute status information
 */
interface DisputeData {
  id: string;
  exchange_id: string;
  status: string;
  resolution: string | null;
}

/**
 * Verify dispute is in valid state for resolution
 *
 * CRITICAL: Prevents double-resolution and unauthorized state changes
 *
 * @param disputeId - Dispute ID to verify
 * @param supabase - Supabase client
 * @throws VerificationError if dispute is already resolved
 */
export async function verifyDisputeState(
  disputeId: string,
  supabase: SupabaseClient
): Promise<DisputeData> {
  const { data: dispute, error } = await supabase
    .from('disputes')
    .select('id, exchange_id, status, resolution')
    .eq('id', disputeId)
    .maybeSingle();

  if (error) {
    throw new VerificationError(
      'DISPUTE_QUERY_FAILED',
      'Failed to retrieve dispute information',
      500,
      { disputeId, error: error.message }
    );
  }

  if (!dispute) {
    throw new VerificationError('DISPUTE_NOT_FOUND', 'Dispute does not exist', 404, { disputeId });
  }

  if (dispute.status === 'closed') {
    throw new VerificationError(
      'DISPUTE_ALREADY_CLOSED',
      'Dispute is already closed and cannot be modified',
      400,
      { disputeId, status: dispute.status }
    );
  }

  if (dispute.status === 'resolved' && dispute.resolution) {
    throw new VerificationError(
      'DISPUTE_ALREADY_RESOLVED',
      'Dispute has already been resolved',
      400,
      { disputeId, status: dispute.status, resolution: dispute.resolution }
    );
  }

  return dispute;
}

/**
 * Verify resolution amount matches original escrow
 *
 * CRITICAL: Prevents refunding incorrect amounts
 *
 * @param requesterId - User receiving the refund
 * @param requiredTickets - Number of tickets to refund (typically 1)
 * @throws VerificationError if refund amount is invalid
 */
export function verifyRefundAmount(requesterId: string, requiredTickets: number): void {
  if (requiredTickets !== 1) {
    throw new VerificationError(
      'INVALID_REFUND_AMOUNT',
      'Refund amount must match original escrow (1 ticket)',
      400,
      { requesterId, refundAmount: requiredTickets, expectedAmount: 1 }
    );
  }
}

/**
 * Verify user is eligible to rate an exchange
 *
 * CRITICAL: Prevents rating before exchange completion and multiple ratings
 *
 * @param exchangeId - Exchange to rate
 * @param raterId - User attempting to rate
 * @param supabase - Supabase client
 * @throws VerificationError if rating is not eligible
 */
export async function verifyRatingEligibility(
  exchangeId: string,
  raterId: string,
  supabase: SupabaseClient
): Promise<void> {
  // Verify exchange exists and is completed
  const { data: exchange, error: exchangeError } = await supabase
    .from('exchanges')
    .select('id, requester_id, lister_id, status, completed_at')
    .eq('id', exchangeId)
    .maybeSingle();

  if (exchangeError) {
    throw new VerificationError(
      'EXCHANGE_QUERY_FAILED',
      'Failed to retrieve exchange information',
      500,
      { exchangeId, error: exchangeError.message }
    );
  }

  if (!exchange) {
    throw new VerificationError('EXCHANGE_NOT_FOUND', 'Exchange does not exist', 404, {
      exchangeId,
    });
  }

  // Verify user is participant
  if (raterId !== exchange.requester_id && raterId !== exchange.lister_id) {
    throw new VerificationError(
      'NOT_EXCHANGE_PARTICIPANT',
      'User is not a participant in this exchange',
      403,
      { exchangeId, raterId }
    );
  }

  // Verify exchange is completed
  if (exchange.status !== 'completed' && exchange.status !== 'auto_completed') {
    throw new VerificationError(
      'EXCHANGE_NOT_COMPLETED',
      `Cannot rate exchange with status: ${exchange.status}. Exchange must be completed.`,
      400,
      { exchangeId, status: exchange.status }
    );
  }

  // Verify completion timestamp exists and is in the past
  if (!exchange.completed_at) {
    throw new VerificationError(
      'EXCHANGE_NOT_COMPLETED_PROPERLY',
      'Exchange completion time is not set',
      400,
      { exchangeId }
    );
  }

  const completedTime = new Date(exchange.completed_at).getTime();
  const now = Date.now();

  if (completedTime > now) {
    throw new VerificationError(
      'EXCHANGE_COMPLETION_IN_FUTURE',
      'Exchange completion timestamp is in the future (clock skew?)',
      400,
      { exchangeId, completedAt: exchange.completed_at, now: new Date(now).toISOString() }
    );
  }

  // Verify no duplicate rating exists
  const { data: existingRating, error: ratingError } = await supabase
    .from('ratings')
    .select('id')
    .eq('exchange_id', exchangeId)
    .eq('rater_id', raterId)
    .maybeSingle();

  if (ratingError && ratingError.code !== 'PGRST116') {
    throw new VerificationError('RATING_QUERY_FAILED', 'Failed to check for existing rating', 500, {
      exchangeId,
      raterId,
      error: ratingError.message,
    });
  }

  if (existingRating) {
    throw new VerificationError(
      'RATING_ALREADY_EXISTS',
      'User has already rated this exchange',
      400,
      { exchangeId, raterId, existingRatingId: existingRating.id }
    );
  }
}

/**
 * Verify mutual rating visibility (both parties must rate to see each other's ratings)
 *
 * CRITICAL: Prevents one-way ratings from being visible to the other party
 *
 * @param exchangeId - Exchange ID to check
 * @param raterId - User ID asking about visibility
 * @param supabase - Supabase client
 * @returns true if both parties have rated and ratings should be visible
 */
export async function verifyMutualRatingVisibility(
  exchangeId: string,
  raterId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  // Get exchange to find the other party
  const { data: exchange, error: exchangeError } = await supabase
    .from('exchanges')
    .select('requester_id, lister_id')
    .eq('id', exchangeId)
    .maybeSingle();

  if (exchangeError || !exchange) {
    return false;
  }

  const otherPartyId =
    exchange.requester_id === raterId ? exchange.lister_id : exchange.requester_id;

  // Check if both parties have rated
  const { data: ratings, error: ratingError } = await supabase
    .from('ratings')
    .select('rater_id')
    .eq('exchange_id', exchangeId)
    .in('rater_id', [raterId, otherPartyId]);

  if (ratingError) {
    return false;
  }

  // Both parties must have rated
  return ratings.length === 2;
}

/**
 * Optional: Verify concurrent transaction safety using optimistic locking
 *
 * This implements a basic optimistic locking pattern where a version column
 * is checked to detect concurrent modifications.
 *
 * @param tableName - Table name to lock on
 * @param recordId - Record ID to check
 * @param expectedVersion - Expected version number
 * @param supabase - Supabase client
 * @throws VerificationError if version mismatch detected
 */
export async function verifyOptimisticLock(
  tableName: string,
  recordId: string,
  expectedVersion: number,
  supabase: SupabaseClient
): Promise<void> {
  const { data: record, error } = await supabase
    .from(tableName)
    .select('version')
    .eq('id', recordId)
    .maybeSingle();

  if (error) {
    throw new VerificationError('VERSION_CHECK_FAILED', 'Failed to check record version', 500, {
      tableName,
      recordId,
      error: error.message,
    });
  }

  if (!record) {
    throw new VerificationError('RECORD_NOT_FOUND', 'Record not found for version check', 404, {
      tableName,
      recordId,
    });
  }

  if (record.version !== expectedVersion) {
    throw new VerificationError(
      'CONCURRENT_MODIFICATION',
      'Record has been modified by another request. Please refresh and retry.',
      409,
      { tableName, recordId, expectedVersion, currentVersion: record.version }
    );
  }
}

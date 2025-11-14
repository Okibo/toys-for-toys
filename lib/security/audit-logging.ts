/**
 * lib/security/audit-logging.ts
 *
 * Audit logging for critical operations.
 * Enables security incident investigation and compliance auditing.
 *
 * CRITICAL: All failed verification attempts and critical operations
 * should be logged for detection of abuse patterns.
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Audit log event types
 */
export enum AuditEventType {
  EXCHANGE_REQUEST_CREATED = 'exchange_request_created',
  EXCHANGE_ACCEPTED = 'exchange_accepted',
  EXCHANGE_CANCELED = 'exchange_canceled',
  EXCHANGE_COMPLETED = 'exchange_completed',
  ESCROW_CREATED = 'escrow_created',
  ESCROW_RELEASED = 'escrow_released',
  DISPUTE_CREATED = 'dispute_created',
  DISPUTE_RESOLVED = 'dispute_resolved',
  RATING_CREATED = 'rating_created',
  RATING_DELETED = 'rating_deleted',
  VERIFICATION_FAILED = 'verification_failed',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',
  ADMIN_ACTION = 'admin_action',
}

/**
 * Audit severity levels
 */
export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Structured audit log entry
 */
export interface AuditLogEntry {
  timestamp: string;
  event_type: AuditEventType;
  severity: AuditSeverity;
  user_id: string | null;
  subject_id: string | null; // ID of affected resource (exchange, dispute, etc)
  subject_type: string; // Type of affected resource (exchange, rating, etc)
  action: string; // Human-readable action description
  status: 'success' | 'failure';
  error_code?: string;
  error_message?: string;
  context: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log a critical operation to audit trail
 *
 * @param supabase - Supabase client
 * @param entry - Audit log entry
 */
export async function logAuditEvent(supabase: SupabaseClient, entry: AuditLogEntry): Promise<void> {
  try {
    // Insert into audit_log table (must exist in database)
    // This is a system operation, so use service role
    const { error } = await supabase.from('audit_log').insert([entry]);

    if (error) {
      // Log to console if audit logging fails (don't throw, as this shouldn't block operations)
      console.error('Failed to write audit log:', {
        error: error.message,
        entry,
      });
    }
  } catch (err) {
    console.error('Unexpected error writing audit log:', err);
  }
}

/**
 * Log a verification failure for security monitoring
 *
 * @param supabase - Supabase client
 * @param userId - User attempting the operation
 * @param failureCode - Verification error code
 * @param failureMessage - Error message
 * @param context - Additional context (exchange_id, dispute_id, etc)
 * @param ipAddress - Client IP address
 */
export async function logVerificationFailure(
  supabase: SupabaseClient,
  userId: string | null,
  failureCode: string,
  failureMessage: string,
  context: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  const subjectId =
    (typeof context.exchange_id === 'string' ? context.exchange_id : null) ||
    (typeof context.dispute_id === 'string' ? context.dispute_id : null) ||
    (typeof context.rating_id === 'string' ? context.rating_id : null) ||
    null;

  const subjectType = typeof context.subject_type === 'string' ? context.subject_type : 'unknown';

  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    event_type: AuditEventType.VERIFICATION_FAILED,
    severity: AuditSeverity.WARNING,
    user_id: userId,
    subject_id: subjectId,
    subject_type: subjectType,
    action: `Verification failed: ${failureCode}`,
    status: 'failure',
    error_code: failureCode,
    error_message: failureMessage,
    context,
    ip_address: ipAddress,
  };

  await logAuditEvent(supabase, entry);
}

/**
 * Log an unauthorized access attempt
 *
 * @param supabase - Supabase client
 * @param userId - User attempting the operation
 * @param attemptedAction - Description of action attempted
 * @param denialReason - Reason access was denied
 * @param context - Additional context
 * @param ipAddress - Client IP address
 */
export async function logUnauthorizedAttempt(
  supabase: SupabaseClient,
  userId: string | null,
  attemptedAction: string,
  denialReason: string,
  context: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  const subjectId = typeof context.subject_id === 'string' ? context.subject_id : null;
  const subjectType = typeof context.subject_type === 'string' ? context.subject_type : 'unknown';

  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    event_type: AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
    severity: AuditSeverity.WARNING,
    user_id: userId,
    subject_id: subjectId,
    subject_type: subjectType,
    action: attemptedAction,
    status: 'failure',
    error_message: denialReason,
    context,
    ip_address: ipAddress,
  };

  await logAuditEvent(supabase, entry);
}

/**
 * Log a successful critical operation
 *
 * @param supabase - Supabase client
 * @param eventType - Type of event
 * @param userId - User performing action
 * @param subjectId - ID of affected resource
 * @param subjectType - Type of affected resource
 * @param action - Human-readable action description
 * @param context - Additional context
 */
export async function logOperationSuccess(
  supabase: SupabaseClient,
  eventType: AuditEventType,
  userId: string,
  subjectId: string,
  subjectType: string,
  action: string,
  context: Record<string, unknown> = {}
): Promise<void> {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    event_type: eventType,
    severity: AuditSeverity.INFO,
    user_id: userId,
    subject_id: subjectId,
    subject_type: subjectType,
    action,
    status: 'success',
    context,
  };

  await logAuditEvent(supabase, entry);
}

/**
 * Helper to extract client IP from request headers
 *
 * @param headers - Request headers
 * @returns Client IP address or undefined
 */
export function extractClientIp(headers: Headers): string | undefined {
  const cfConnecting = headers.get('cf-connecting-ip');
  if (cfConnecting) return cfConnecting;

  const xForwarded = headers.get('x-forwarded-for');
  if (xForwarded) return xForwarded.split(',')[0];

  const xReal = headers.get('x-real-ip');
  if (xReal) return xReal;

  return undefined;
}

/**
 * Helper to extract user agent from request headers
 *
 * @param headers - Request headers
 * @returns User agent string or undefined
 */
export function extractUserAgent(headers: Headers): string | undefined {
  return headers.get('user-agent') || undefined;
}

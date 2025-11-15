/**
 * Consent Service Module
 * Provides server-side business logic for GDPR consent operations
 *
 * Operations:
 * - Record consent decisions (privacy_policy, terms_of_service, behavioral_analytics)
 * - Retrieve consent history for a user
 * - Withdraw analytics consent (privacy and terms cannot be withdrawn)
 *
 * All operations use service role key for elevated database access.
 * Records are immutable - withdrawal creates a new record with withdrawn_at timestamp.
 */

import { getSupabaseServerClient } from './supabase-server';
import type { ConsentRecord, ConsentType } from './types';

/**
 * Validates consent payload
 */
export function validateConsentPayload(payload: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('Consent payload must be an object');
    return { isValid: false, errors };
  }

  const obj = payload as Record<string, unknown>;

  // Validate privacy_policy
  if (!('privacy_policy' in obj)) {
    errors.push('privacy_policy is required');
  } else if (typeof obj.privacy_policy !== 'boolean') {
    errors.push('privacy_policy must be a boolean');
  } else if (obj.privacy_policy !== true) {
    errors.push('privacy_policy must be true to proceed');
  }

  // Validate terms_of_service
  if (!('terms_of_service' in obj)) {
    errors.push('terms_of_service is required');
  } else if (typeof obj.terms_of_service !== 'boolean') {
    errors.push('terms_of_service must be a boolean');
  } else if (obj.terms_of_service !== true) {
    errors.push('terms_of_service must be true to proceed');
  }

  // Validate behavioral_analytics (optional, defaults to false)
  if ('behavioral_analytics' in obj && typeof obj.behavioral_analytics !== 'boolean') {
    errors.push('behavioral_analytics must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if user has already recorded consent
 */
export async function hasConsentRecorded(
  userId: string
): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('consent_records')
      .select('id')
      .eq('user_id', userId)
      .eq('consent_type', 'privacy_policy')
      .is('withdrawn_at', null)
      .single();

    if (error?.code === 'PGRST116') {
      // No rows found - consent not recorded
      return false;
    }

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return !!data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to check consent status: ${msg}`);
  }
}

/**
 * Create consent records for user
 * Inserts three records: one for each consent type
 *
 * @param userId - User ID from auth
 * @param privacy_policy - Privacy policy consent (must be true)
 * @param terms_of_service - Terms of service consent (must be true)
 * @param behavioral_analytics - Analytics consent (can be true/false)
 * @param ipAddress - Client IP for audit trail
 * @param userAgent - Client user agent for audit trail
 * @returns Array of created consent records
 */
export async function createConsentRecords(
  userId: string,
  privacy_policy: boolean,
  terms_of_service: boolean,
  behavioral_analytics: boolean,
  ipAddress: string,
  userAgent: string
): Promise<ConsentRecord[]> {
  const supabase = getSupabaseServerClient();

  const consentRecords = [
    {
      user_id: userId,
      consent_type: 'privacy_policy' as const,
      consent_given: privacy_policy,
      ip_address: ipAddress,
      user_agent: userAgent,
      withdrawn_at: null,
    },
    {
      user_id: userId,
      consent_type: 'terms_of_service' as const,
      consent_given: terms_of_service,
      ip_address: ipAddress,
      user_agent: userAgent,
      withdrawn_at: null,
    },
    {
      user_id: userId,
      consent_type: 'behavioral_analytics' as const,
      consent_given: behavioral_analytics,
      ip_address: ipAddress,
      user_agent: userAgent,
      withdrawn_at: null,
    },
  ];

  try {
    const { data, error } = await supabase
      .from('consent_records')
      .insert(consentRecords)
      .select('*');

    if (error) {
      // Check if it's a unique constraint violation (consent already recorded)
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        throw new Error('ALREADY_RECORDED');
      }
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to create consent records');
    }

    return data as ConsentRecord[];
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(msg);
  }
}

/**
 * Get all consent records for a user
 *
 * @param userId - User ID from auth
 * @returns Array of consent records (including withdrawn ones)
 */
export async function getConsentHistory(
  userId: string
): Promise<ConsentRecord[]> {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []) as ConsentRecord[];
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to retrieve consent history: ${msg}`);
  }
}

/**
 * Get current active consent for a user and type
 *
 * @param userId - User ID from auth
 * @param consentType - Type of consent
 * @returns Current consent record or null if not found
 */
export async function getActiveConsent(
  userId: string,
  consentType: ConsentType
): Promise<ConsentRecord | null> {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', userId)
      .eq('consent_type', consentType)
      .is('withdrawn_at', null)
      .single();

    if (error?.code === 'PGRST116') {
      // No rows found
      return null;
    }

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as ConsentRecord | null;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (!msg.includes('Database error')) {
      throw new Error(`Failed to retrieve consent: ${msg}`);
    }
    throw error;
  }
}

/**
 * Withdraw consent for a specific type
 * Only behavioral_analytics can be withdrawn; privacy_policy and terms_of_service cannot be withdrawn
 *
 * @param userId - User ID from auth
 * @param consentType - Type of consent to withdraw
 * @param ipAddress - Client IP for audit trail
 * @param userAgent - Client user agent for audit trail
 * @returns New withdrawn consent record
 */
export async function withdrawConsent(
  userId: string,
  consentType: ConsentType,
  ipAddress: string,
  userAgent: string
): Promise<ConsentRecord> {
  const supabase = getSupabaseServerClient();

  // Only behavioral_analytics can be withdrawn
  if (consentType !== 'behavioral_analytics') {
    throw new Error('CANNOT_WITHDRAW');
  }

  try {
    // Get the current active consent record to verify it exists
    const currentConsent = await getActiveConsent(userId, consentType);

    if (!currentConsent) {
      throw new Error('NOT_FOUND');
    }

    // Create a new withdrawal record
    const withdrawalRecord = {
      user_id: userId,
      consent_type: consentType,
      consent_given: false,
      ip_address: ipAddress,
      user_agent: userAgent,
      withdrawn_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('consent_records')
      .insert([withdrawalRecord])
      .select('*')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create withdrawal record');
    }

    return data as ConsentRecord;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(msg);
  }
}

/**
 * Mark consent as completed in user profile
 * This flag indicates user has completed the consent flow
 *
 * @param userId - User ID from auth
 */
export async function markConsentCompleted(userId: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  try {
    // Check if profile has consent_completed field
    // If not, this operation will fail gracefully
    const { error } = await supabase
      .from('profiles')
      .update({ consent_completed: true })
      .eq('user_id', userId);

    if (error) {
      // Log but don't fail - this is a non-critical operation
      console.warn(`Failed to mark consent completed: ${error.message}`);
    }
  } catch (error) {
    // Non-critical operation - log but don't throw
    console.warn('Error marking consent completed:', error);
  }
}

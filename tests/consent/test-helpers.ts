/**
 * Test Helper Functions for Consent Testing
 * Utilities for creating test users, recording consent, and managing consent state
 */

import type { ConsentPayload, ConsentRecord } from '@/lib/types/legal';

/**
 * Create a test user for consent testing
 */
export function createTestUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    ...overrides,
  };
}

/**
 * Create a valid consent payload for testing
 */
export function createValidConsentPayload(
  overrides?: Partial<ConsentPayload>
): ConsentPayload {
  return {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    privacy_policy: true,
    terms_of_service: true,
    behavioral_analytics: false,
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    ...overrides,
  };
}

/**
 * Create an invalid consent payload for testing error handling
 */
export function createInvalidConsentPayload(
  overrides?: Partial<ConsentPayload>
): ConsentPayload {
  return {
    user_id: 'invalid-uuid',
    privacy_policy: false,
    terms_of_service: false,
    behavioral_analytics: false,
    ...overrides,
  } as ConsentPayload;
}

/**
 * Create a consent record for testing
 */
export function createConsentRecord(
  overrides?: Partial<ConsentRecord>
): ConsentRecord {
  return {
    id: 'record-1',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    consent_type: 'privacy_policy',
    consent_given: true,
    recorded_at: new Date().toISOString(),
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    withdrawn_at: null,
    document_version: '1.0.0',
    ...overrides,
  };
}

/**
 * Create multiple consent records for a user
 */
export function createMultipleConsentRecords(
  userId: string = '550e8400-e29b-41d4-a716-446655440000',
  count: number = 3
): ConsentRecord[] {
  const types: Array<'privacy_policy' | 'terms_of_service' | 'behavioral_analytics'> = [
    'privacy_policy',
    'terms_of_service',
    'behavioral_analytics',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `record-${i + 1}`,
    user_id: userId,
    consent_type: types[i % types.length],
    consent_given: i < 2 ? true : false, // First 2 given, rest not
    recorded_at: new Date(Date.now() - i * 1000).toISOString(),
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    withdrawn_at: null,
    document_version: '1.0.0',
  }));
}

/**
 * Mock API response for successful consent recording
 */
export function mockConsentSuccessResponse() {
  return {
    success: true,
    message: 'Consent recorded successfully. 3 consent records created.',
  };
}

/**
 * Mock API response for consent errors
 */
export function mockConsentErrorResponse(code: string, message: string, details?: string[]) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Mock rate limit headers
 */
export function mockRateLimitHeaders() {
  return {
    'X-RateLimit-Limit': '5',
    'X-RateLimit-Remaining': '4',
    'X-RateLimit-Reset': new Date(Date.now() + 900000).getTime().toString(),
    'Retry-After': '900',
  };
}

/**
 * Helper to simulate consent withdrawal
 */
export function createWithdrawalRecord(
  baseRecord: ConsentRecord
): ConsentRecord {
  return {
    ...baseRecord,
    id: `${baseRecord.id}-withdrawal`,
    consent_given: false,
    withdrawn_at: new Date().toISOString(),
  };
}

/**
 * Helper to verify consent records
 */
export function verifyConsentRecords(
  records: ConsentRecord[],
  expectedTypes: string[] = ['privacy_policy', 'terms_of_service', 'behavioral_analytics']
) {
  const recordTypes = new Set(records.map(r => r.consent_type));
  return expectedTypes.every(type => recordTypes.has(type));
}

/**
 * Helper to check if user has completed consent
 */
export function hasCompletedConsent(records: ConsentRecord[]): boolean {
  const requiredTypes = ['privacy_policy', 'terms_of_service'];
  const providedConsents = records
    .filter(r => r.consent_given && !r.withdrawn_at)
    .map(r => r.consent_type);

  return requiredTypes.every(type => providedConsents.includes(type));
}

/**
 * Helper to get consent history for display
 */
export function getConsentHistory(records: ConsentRecord[]) {
  return records
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    .map(record => ({
      type: record.consent_type,
      status: record.withdrawn_at ? 'withdrawn' : record.consent_given ? 'given' : 'declined',
      date: new Date(record.recorded_at).toLocaleDateString(),
      ip: record.ip_address,
    }));
}

/**
 * Helper to mock consent status API response
 */
export function mockConsentStatusResponse(records: ConsentRecord[]) {
  return {
    success: true,
    records: records.map(r => ({
      id: r.id,
      consent_type: r.consent_type,
      consent_given: r.consent_given,
      recorded_at: r.recorded_at,
      withdrawn_at: r.withdrawn_at,
      ip_address: r.ip_address,
      user_agent: r.user_agent,
      document_version: r.document_version,
    })),
  };
}

/**
 * Helper to create test request with proper headers
 */
export function createConsentRequest(
  payload: ConsentPayload,
  options?: {
    token?: string;
    ip?: string;
    userAgent?: string;
  }
) {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options?.token || 'test-token'}`,
      'X-Forwarded-For': options?.ip || '192.168.1.1',
      'User-Agent': options?.userAgent || 'Mozilla/5.0',
    },
    body: JSON.stringify(payload),
  };
}

/**
 * Helper to verify consent audit trail
 */
export function verifyAuditTrail(record: ConsentRecord) {
  return {
    hasTimestamp: !!record.recorded_at,
    hasIp: !!record.ip_address,
    hasUserAgent: !!record.user_agent,
    hasDocumentVersion: !!record.document_version,
    isComplete: !!(record.recorded_at && record.ip_address && record.user_agent),
  };
}

/**
 * Helper to compare consent versions
 */
export function compareConsentVersions(
  record1: ConsentRecord,
  record2: ConsentRecord
): {
  changed: boolean;
  fields: string[];
} {
  const changes: string[] = [];

  if (record1.consent_given !== record2.consent_given) {
    changes.push('consent_given');
  }
  if (record1.document_version !== record2.document_version) {
    changes.push('document_version');
  }

  return {
    changed: changes.length > 0,
    fields: changes,
  };
}

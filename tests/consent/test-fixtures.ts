/**
 * Test Fixtures for Consent Testing
 * Pre-built test data for various scenarios
 */

import type { ConsentPayload, ConsentRecord } from '@/lib/types/legal';

// ============================================================================
// Valid Consent Payloads
// ============================================================================

export const VALID_CONSENT_PAYLOADS = {
  fullConsent: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    privacy_policy: true,
    terms_of_service: true,
    behavioral_analytics: true,
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    document_versions: {
      privacy_policy: '1.0.0',
      terms_of_service: '2.1.0',
      behavioral_analytics: '1.5.0',
    },
  } as ConsentPayload,

  minimalConsent: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    privacy_policy: true,
    terms_of_service: true,
  } as ConsentPayload,

  withoutAnalytics: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    privacy_policy: true,
    terms_of_service: true,
    behavioral_analytics: false,
  } as ConsentPayload,

  mobileUserConsent: {
    user_id: '660e8400-e29b-41d4-a716-446655440001',
    privacy_policy: true,
    terms_of_service: true,
    behavioral_analytics: true,
    ip_address: '203.0.113.45',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
  } as ConsentPayload,

  ipv6UserConsent: {
    user_id: '770e8400-e29b-41d4-a716-446655440002',
    privacy_policy: true,
    terms_of_service: true,
    ip_address: '2001:db8::1',
    user_agent: 'Mozilla/5.0 (X11; Linux x86_64)',
  } as ConsentPayload,
};

// ============================================================================
// Invalid Consent Payloads
// ============================================================================

export const INVALID_CONSENT_PAYLOADS = {
  missingUserId: {
    user_id: '',
    privacy_policy: true,
    terms_of_service: true,
  } as ConsentPayload,

  invalidUuid: {
    user_id: 'not-a-uuid',
    privacy_policy: true,
    terms_of_service: true,
  } as ConsentPayload,

  privacyPolicyFalse: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    privacy_policy: false,
    terms_of_service: true,
  } as ConsentPayload,

  termsOfServiceFalse: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    privacy_policy: true,
    terms_of_service: false,
  } as ConsentPayload,

  bothRequiredFalse: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    privacy_policy: false,
    terms_of_service: false,
  } as ConsentPayload,

  invalidIpAddress: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    privacy_policy: true,
    terms_of_service: true,
    ip_address: '999.999.999.999',
  } as ConsentPayload,

  analyticsTrueAsString: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    privacy_policy: true,
    terms_of_service: true,
    behavioral_analytics: 'true' as unknown as boolean,
  } as ConsentPayload,

  userAgentTooLong: {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    privacy_policy: true,
    terms_of_service: true,
    user_agent: 'x'.repeat(2001),
  } as ConsentPayload,
};

// ============================================================================
// Consent Records
// ============================================================================

export const CONSENT_RECORDS = {
  privacyPolicyRecord: {
    id: 'record-privacy-001',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    consent_type: 'privacy_policy' as const,
    consent_given: true,
    recorded_at: '2024-01-15T10:30:00Z',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    withdrawn_at: null,
    document_version: '1.0.0',
  } as ConsentRecord,

  termsOfServiceRecord: {
    id: 'record-terms-001',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    consent_type: 'terms_of_service' as const,
    consent_given: true,
    recorded_at: '2024-01-15T10:30:00Z',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    withdrawn_at: null,
    document_version: '2.1.0',
  } as ConsentRecord,

  analyticsRecord: {
    id: 'record-analytics-001',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    consent_type: 'behavioral_analytics' as const,
    consent_given: true,
    recorded_at: '2024-01-15T10:30:00Z',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    withdrawn_at: null,
    document_version: '1.5.0',
  } as ConsentRecord,

  analyticsWithdrawnRecord: {
    id: 'record-analytics-001',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    consent_type: 'behavioral_analytics' as const,
    consent_given: true,
    recorded_at: '2024-01-15T10:30:00Z',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    withdrawn_at: '2024-01-20T14:00:00Z',
    document_version: '1.5.0',
  } as ConsentRecord,

  declinedRecord: {
    id: 'record-declined-001',
    user_id: '770e8400-e29b-41d4-a716-446655440002',
    consent_type: 'behavioral_analytics' as const,
    consent_given: false,
    recorded_at: '2024-01-15T10:30:00Z',
    ip_address: '203.0.113.1',
    user_agent: 'Mozilla/5.0',
    withdrawn_at: null,
    document_version: '1.5.0',
  } as ConsentRecord,
};

// ============================================================================
// Consent Record Collections
// ============================================================================

export const CONSENT_RECORD_SETS = {
  fullConsentHistory: [
    CONSENT_RECORDS.privacyPolicyRecord,
    CONSENT_RECORDS.termsOfServiceRecord,
    CONSENT_RECORDS.analyticsRecord,
  ],

  withWithdrawal: [
    CONSENT_RECORDS.privacyPolicyRecord,
    CONSENT_RECORDS.termsOfServiceRecord,
    CONSENT_RECORDS.analyticsRecord,
    CONSENT_RECORDS.analyticsWithdrawnRecord,
  ],

  minimalConsents: [
    CONSENT_RECORDS.privacyPolicyRecord,
    CONSENT_RECORDS.termsOfServiceRecord,
  ],

  declinedAnalytics: [
    CONSENT_RECORDS.privacyPolicyRecord,
    CONSENT_RECORDS.termsOfServiceRecord,
    CONSENT_RECORDS.declinedRecord,
  ],
};

// ============================================================================
// API Responses
// ============================================================================

export const API_RESPONSES = {
  consentSuccess: {
    success: true,
    message: 'Consent recorded successfully. 3 consent records created.',
  },

  consentAlreadyRecorded: {
    success: false,
    error: {
      code: 'ALREADY_RECORDED',
      message: 'User has already recorded consent',
      details: [
        'Consent can only be recorded once. To change preferences, use the withdrawal endpoint.',
      ],
    },
  },

  unauthorizedError: {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'User is not authenticated. Please login first.',
      details: ['Valid JWT token required in Authorization header'],
    },
  },

  invalidPayloadError: {
    success: false,
    error: {
      code: 'INVALID_PAYLOAD',
      message: 'Consent payload validation failed',
      details: [
        'privacy_policy is required',
        'terms_of_service is required',
      ],
    },
  },

  rateLimitError: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many consent submissions. Please try again later.',
      details: ['Reset in 900 seconds'],
    },
  },

  internalServerError: {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while recording consent. Please try again later.',
    },
  },
};

// ============================================================================
// API Request Objects
// ============================================================================

export const API_REQUESTS = {
  validConsentRequest: {
    method: 'POST' as const,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer valid-token-123',
      'X-Forwarded-For': '192.168.1.1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    body: JSON.stringify(VALID_CONSENT_PAYLOADS.fullConsent),
  },

  missingAuthHeader: {
    method: 'POST' as const,
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '192.168.1.1',
      'User-Agent': 'Mozilla/5.0',
    },
    body: JSON.stringify(VALID_CONSENT_PAYLOADS.fullConsent),
  },

  invalidToken: {
    method: 'POST' as const,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token',
      'X-Forwarded-For': '192.168.1.1',
      'User-Agent': 'Mozilla/5.0',
    },
    body: JSON.stringify(VALID_CONSENT_PAYLOADS.fullConsent),
  },
};

// ============================================================================
// Headers for Rate Limiting
// ============================================================================

export const RATE_LIMIT_HEADERS = {
  withinLimit: {
    'X-RateLimit-Limit': '5',
    'X-RateLimit-Remaining': '4',
    'X-RateLimit-Reset': new Date(Date.now() + 900000).getTime().toString(),
  },

  nearLimit: {
    'X-RateLimit-Limit': '5',
    'X-RateLimit-Remaining': '1',
    'X-RateLimit-Reset': new Date(Date.now() + 60000).getTime().toString(),
  },

  exceededLimit: {
    'X-RateLimit-Limit': '5',
    'X-RateLimit-Remaining': '0',
    'X-RateLimit-Reset': new Date(Date.now() + 900000).getTime().toString(),
    'Retry-After': '900',
  },
};

// ============================================================================
// User Data for Testing
// ============================================================================

export const TEST_USERS = {
  user1: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user1@example.com',
    name: 'John Doe',
    birthdate: '2010-06-15',
  },

  user2: {
    id: '660e8400-e29b-41d4-a716-446655440001',
    email: 'user2@example.com',
    name: 'Jane Smith',
    birthdate: '2015-03-22',
  },

  user3: {
    id: '770e8400-e29b-41d4-a716-446655440002',
    email: 'user3@example.com',
    name: 'Bob Johnson',
    birthdate: '2018-11-10',
  },

  parentUser: {
    id: '880e8400-e29b-41d4-a716-446655440003',
    email: 'parent@example.com',
    name: 'Parent Guardian',
    isParent: true,
  },
};

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  missingUserId: 'user_id is required',
  invalidUuid: 'user_id must be a valid UUID',
  privacyPolicyRequired: 'privacy_policy consent is required',
  privacyPolicyMustBeTrue: 'privacy_policy consent must be true (required)',
  termsRequired: 'terms_of_service consent is required',
  termsMustBeTrue: 'terms_of_service consent must be true (required)',
  analyticsNotBoolean: 'behavioral_analytics must be a boolean',
  invalidIp: 'ip_address format is invalid',
  userAgentTooLong: 'user_agent exceeds maximum length of 2000 characters',
};

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  consentRecorded: 'Consent recorded successfully',
  consentWithdrawn: 'Consent withdrawn successfully',
  consentRetrieved: 'Consent records retrieved successfully',
};

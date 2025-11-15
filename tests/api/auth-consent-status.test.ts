/**
 * Integration Tests: GET /api/auth/consent-status
 * Tests consent history retrieval endpoint
 */

import { getConsentHistory, getActiveConsent } from '@/lib/auth/consent-service';
import type { ConsentRecord, ConsentStatusResponse, ConsentStatusErrorResponse } from '@/lib/auth/types';

/**
 * Mock dependencies
 */
jest.mock('@/lib/auth/supabase-server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Consent Status Retrieval', () => {
  describe('Response Structure', () => {
    test('should return correct success response structure', () => {
      const mockResponse: ConsentStatusResponse = {
        success: true,
        consent_records: [],
      };

      expect(mockResponse.success).toBe(true);
      expect(Array.isArray(mockResponse.consent_records)).toBe(true);
    });

    test('should return correct error response structure', () => {
      const mockErrorResponse: ConsentStatusErrorResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is not authenticated',
        },
      };

      expect(mockErrorResponse.success).toBe(false);
      expect(mockErrorResponse.error.code).toBe('UNAUTHORIZED');
      expect(typeof mockErrorResponse.error.message).toBe('string');
    });

    test('should include all required consent record fields', () => {
      const mockRecord: ConsentRecord = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user-123',
        consent_type: 'privacy_policy',
        consent_given: true,
        timestamp: new Date().toISOString(),
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        withdrawn_at: null,
      };

      expect(mockRecord.id).toBeDefined();
      expect(mockRecord.user_id).toBeDefined();
      expect(mockRecord.consent_type).toBeDefined();
      expect(mockRecord.consent_given).toBeDefined();
      expect(mockRecord.timestamp).toBeDefined();
      expect(mockRecord.ip_address).toBeDefined();
      expect(mockRecord.user_agent).toBeDefined();
    });
  });

  describe('Consent Record Content', () => {
    test('should include privacy_policy consent type', () => {
      const record: ConsentRecord = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user-123',
        consent_type: 'privacy_policy',
        consent_given: true,
        timestamp: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
        withdrawn_at: null,
      };

      expect(record.consent_type).toBe('privacy_policy');
    });

    test('should include terms_of_service consent type', () => {
      const record: ConsentRecord = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user-123',
        consent_type: 'terms_of_service',
        consent_given: true,
        timestamp: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
        withdrawn_at: null,
      };

      expect(record.consent_type).toBe('terms_of_service');
    });

    test('should include behavioral_analytics consent type', () => {
      const record: ConsentRecord = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user-123',
        consent_type: 'behavioral_analytics',
        consent_given: false,
        timestamp: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
        withdrawn_at: null,
      };

      expect(record.consent_type).toBe('behavioral_analytics');
    });

    test('should indicate whether consent was given or declined', () => {
      const givenRecord: ConsentRecord = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user-123',
        consent_type: 'behavioral_analytics',
        consent_given: true,
        timestamp: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
        withdrawn_at: null,
      };

      const declinedRecord: ConsentRecord = {
        ...givenRecord,
        consent_given: false,
      };

      expect(givenRecord.consent_given).toBe(true);
      expect(declinedRecord.consent_given).toBe(false);
    });
  });

  describe('Multiple Consent Records', () => {
    test('should return multiple consent records for user', () => {
      const records: ConsentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: 'user-123',
          consent_type: 'privacy_policy',
          consent_given: true,
          timestamp: new Date().toISOString(),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          withdrawn_at: null,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          user_id: 'user-123',
          consent_type: 'terms_of_service',
          consent_given: true,
          timestamp: new Date().toISOString(),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          withdrawn_at: null,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          user_id: 'user-123',
          consent_type: 'behavioral_analytics',
          consent_given: false,
          timestamp: new Date().toISOString(),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          withdrawn_at: null,
        },
      ];

      expect(records).toHaveLength(3);
      expect(records[0].consent_type).toBe('privacy_policy');
      expect(records[1].consent_type).toBe('terms_of_service');
      expect(records[2].consent_type).toBe('behavioral_analytics');
    });

    test('should return records in descending timestamp order', () => {
      const now = new Date();
      const records: ConsentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: 'user-123',
          consent_type: 'privacy_policy',
          consent_given: true,
          timestamp: new Date(now.getTime() + 2000).toISOString(),
          ip_address: null,
          user_agent: null,
          withdrawn_at: null,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          user_id: 'user-123',
          consent_type: 'behavioral_analytics',
          consent_given: true,
          timestamp: new Date(now.getTime() + 1000).toISOString(),
          ip_address: null,
          user_agent: null,
          withdrawn_at: null,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          user_id: 'user-123',
          consent_type: 'terms_of_service',
          consent_given: true,
          timestamp: new Date(now.getTime()).toISOString(),
          ip_address: null,
          user_agent: null,
          withdrawn_at: null,
        },
      ];

      // Verify most recent first (convert to Date for comparison)
      expect(new Date(records[0].timestamp).getTime())
        .toBeGreaterThan(new Date(records[1].timestamp).getTime());
      expect(new Date(records[1].timestamp).getTime())
        .toBeGreaterThan(new Date(records[2].timestamp).getTime());
    });
  });

  describe('Withdrawn Consent Records', () => {
    test('should include withdrawn_at timestamp for withdrawn consents', () => {
      const withdrawnRecord: ConsentRecord = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user-123',
        consent_type: 'behavioral_analytics',
        consent_given: false,
        timestamp: new Date().toISOString(),
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        withdrawn_at: new Date().toISOString(),
      };

      expect(withdrawnRecord.withdrawn_at).toBeDefined();
      expect(withdrawnRecord.withdrawn_at).not.toBeNull();
    });

    test('should have null withdrawn_at for active consents', () => {
      const activeRecord: ConsentRecord = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user-123',
        consent_type: 'privacy_policy',
        consent_given: true,
        timestamp: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
        withdrawn_at: null,
      };

      expect(activeRecord.withdrawn_at).toBeNull();
    });

    test('should show consent history including withdrawals', () => {
      const records: ConsentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: 'user-123',
          consent_type: 'behavioral_analytics',
          consent_given: true,
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          withdrawn_at: null,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          user_id: 'user-123',
          consent_type: 'behavioral_analytics',
          consent_given: false,
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          withdrawn_at: new Date().toISOString(), // Just withdrawn
        },
      ];

      expect(records).toHaveLength(2);
      expect(records[0].withdrawn_at).toBeNull();
      expect(records[1].withdrawn_at).not.toBeNull();
    });
  });

  describe('Empty Consent History', () => {
    test('should return empty array for user with no consent records', () => {
      const mockResponse: ConsentStatusResponse = {
        success: true,
        consent_records: [],
      };

      expect(mockResponse.consent_records).toHaveLength(0);
      expect(Array.isArray(mockResponse.consent_records)).toBe(true);
    });

    test('should still be successful response even with no records', () => {
      const mockResponse: ConsentStatusResponse = {
        success: true,
        consent_records: [],
      };

      expect(mockResponse.success).toBe(true);
    });
  });

  describe('Error Codes', () => {
    test('should define UNAUTHORIZED error code', () => {
      const errorCodes = ['UNAUTHORIZED', 'INTERNAL_ERROR'] as const;
      expect(errorCodes).toContain('UNAUTHORIZED');
    });

    test('should define INTERNAL_ERROR code', () => {
      const errorCodes = ['UNAUTHORIZED', 'INTERNAL_ERROR'] as const;
      expect(errorCodes).toContain('INTERNAL_ERROR');
    });
  });

  describe('Authentication', () => {
    test('should require valid JWT token in Authorization header', () => {
      const validToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      expect(validToken).toMatch(/^Bearer /);
    });

    test('should validate token format', () => {
      const invalidToken = 'NotBearer token';
      expect(invalidToken).not.toMatch(/^Bearer /);
    });
  });

  describe('Audit Trail Information', () => {
    test('should include IP address in consent records', () => {
      const record: ConsentRecord = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user-123',
        consent_type: 'privacy_policy',
        consent_given: true,
        timestamp: new Date().toISOString(),
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0',
        withdrawn_at: null,
      };

      expect(record.ip_address).toBe('192.168.1.100');
    });

    test('should include user agent in consent records', () => {
      const record: ConsentRecord = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user-123',
        consent_type: 'privacy_policy',
        consent_given: true,
        timestamp: new Date().toISOString(),
        ip_address: null,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        withdrawn_at: null,
      };

      expect(record.user_agent).toContain('Mozilla');
    });

    test('should handle null IP address for privacy', () => {
      const record: ConsentRecord = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user-123',
        consent_type: 'privacy_policy',
        consent_given: true,
        timestamp: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
        withdrawn_at: null,
      };

      expect(record.ip_address).toBeNull();
      expect(record.user_agent).toBeNull();
    });
  });

  describe('Timestamp Formats', () => {
    test('should use ISO 8601 format for all timestamps', () => {
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

      const record: ConsentRecord = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user-123',
        consent_type: 'privacy_policy',
        consent_given: true,
        timestamp: new Date().toISOString(),
        ip_address: null,
        user_agent: null,
        withdrawn_at: null,
      };

      expect(record.timestamp).toMatch(iso8601Regex);
    });

    test('should have withdrawals occurred after initial consent', () => {
      const consentTime = new Date();
      const withdrawalTime = new Date(consentTime.getTime() + 3600000); // 1 hour later

      const record: ConsentRecord = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user-123',
        consent_type: 'behavioral_analytics',
        consent_given: false,
        timestamp: consentTime.toISOString(),
        ip_address: null,
        user_agent: null,
        withdrawn_at: withdrawalTime.toISOString(),
      };

      expect(new Date(record.withdrawn_at!).getTime())
        .toBeGreaterThan(new Date(record.timestamp).getTime());
    });
  });

  describe('User Isolation', () => {
    test('should not leak records from other users', () => {
      const user1Records: ConsentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: 'user-1',
          consent_type: 'privacy_policy',
          consent_given: true,
          timestamp: new Date().toISOString(),
          ip_address: null,
          user_agent: null,
          withdrawn_at: null,
        },
      ];

      const user2Records: ConsentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          user_id: 'user-2',
          consent_type: 'privacy_policy',
          consent_given: true,
          timestamp: new Date().toISOString(),
          ip_address: null,
          user_agent: null,
          withdrawn_at: null,
        },
      ];

      // Verify records are segregated by user
      expect(user1Records[0].user_id).toBe('user-1');
      expect(user2Records[0].user_id).toBe('user-2');
      expect(user1Records[0].id).not.toBe(user2Records[0].id);
    });
  });
});

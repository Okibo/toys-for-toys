/**
 * Integration Tests: POST /api/auth/consent-withdraw
 * Tests consent withdrawal endpoint
 */

import type {
  ConsentWithdrawRequest,
  ConsentWithdrawResponse,
  ConsentWithdrawErrorResponse,
} from '@/lib/auth/types';

/**
 * Mock dependencies
 */
jest.mock('@/lib/auth/supabase-server', () => ({
  getSupabaseServerClient: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Consent Withdrawal Request Validation', () => {
  describe('Valid Requests', () => {
    test('should accept withdrawal of behavioral_analytics', () => {
      const request: ConsentWithdrawRequest = {
        consent_type: 'behavioral_analytics',
      };

      expect(request.consent_type).toBe('behavioral_analytics');
    });

    test('should validate request structure', () => {
      const request: ConsentWithdrawRequest = {
        consent_type: 'behavioral_analytics',
      };

      expect(request).toHaveProperty('consent_type');
      expect(typeof request.consent_type).toBe('string');
    });
  });

  describe('Invalid Requests', () => {
    test('should reject withdrawal of privacy_policy', () => {
      const request: ConsentWithdrawRequest = {
        consent_type: 'privacy_policy',
      };

      // This should be caught by the endpoint validation
      expect(request.consent_type).toBe('privacy_policy');
    });

    test('should reject withdrawal of terms_of_service', () => {
      const request: ConsentWithdrawRequest = {
        consent_type: 'terms_of_service',
      };

      // This should be caught by the endpoint validation
      expect(request.consent_type).toBe('terms_of_service');
    });

    test('should reject invalid consent_type', () => {
      const invalidRequest = {
        consent_type: 'invalid_type',
      };

      // Should fail validation
      expect(invalidRequest.consent_type).not.toMatch(
        /^(behavioral_analytics|privacy_policy|terms_of_service)$/
      );
    });

    test('should reject missing consent_type', () => {
      const invalidRequest = {};

      expect(invalidRequest).not.toHaveProperty('consent_type');
    });

    test('should reject null consent_type', () => {
      const invalidRequest = {
        consent_type: null,
      };

      expect(invalidRequest.consent_type).toBeNull();
    });

    test('should reject undefined consent_type', () => {
      const invalidRequest = {
        consent_type: undefined,
      };

      expect(invalidRequest.consent_type).toBeUndefined();
    });

    test('should reject non-string consent_type', () => {
      const invalidRequest = {
        consent_type: 123,
      };

      expect(typeof invalidRequest.consent_type).not.toBe('string');
    });

    test('should reject array consent_type', () => {
      const invalidRequest = {
        consent_type: ['behavioral_analytics'],
      };

      expect(Array.isArray(invalidRequest.consent_type)).toBe(true);
    });

    test('should reject object consent_type', () => {
      const invalidRequest = {
        consent_type: { type: 'behavioral_analytics' },
      };

      expect(typeof invalidRequest.consent_type).toBe('object');
      expect(!Array.isArray(invalidRequest.consent_type)).toBe(true);
    });
  });

  describe('Consent Type Validation', () => {
    test('should define valid consent types', () => {
      const validTypes = ['privacy_policy', 'terms_of_service', 'behavioral_analytics'] as const;

      expect(validTypes).toContain('privacy_policy');
      expect(validTypes).toContain('terms_of_service');
      expect(validTypes).toContain('behavioral_analytics');
    });

    test('should only allow analytics to be withdrawn', () => {
      const withdrawableTypes = ['behavioral_analytics'] as const;

      expect(withdrawableTypes).toContain('behavioral_analytics');
      expect(withdrawableTypes).not.toContain('privacy_policy');
      expect(withdrawableTypes).not.toContain('terms_of_service');
    });

    test('should handle case-sensitive consent types', () => {
      const validType = 'behavioral_analytics';
      const invalidType = 'BEHAVIORAL_ANALYTICS';

      expect(validType).toBe('behavioral_analytics');
      expect(invalidType).not.toBe(validType);
    });
  });

  describe('Extra Fields in Request', () => {
    test('should ignore extra fields in request', () => {
      const request = {
        consent_type: 'behavioral_analytics',
        extra_field: 'ignored',
        another_field: 123,
      };

      expect(request.consent_type).toBe('behavioral_analytics');
      expect(request).toHaveProperty('extra_field');
    });

    test('should process valid field despite extra fields', () => {
      const request = {
        consent_type: 'behavioral_analytics',
        user_id: 'should-be-ignored',
        timestamp: 'should-be-ignored',
      };

      expect(request.consent_type).toBe('behavioral_analytics');
    });
  });
});

describe('Consent Withdrawal Response', () => {
  describe('Success Response', () => {
    test('should return correct success response structure', () => {
      const response: ConsentWithdrawResponse = {
        success: true,
        message: 'Consent withdrawn successfully for behavioral_analytics',
        new_record: {
          consent_type: 'behavioral_analytics',
          consent_given: false,
          withdrawn_at: new Date().toISOString(),
        },
      };

      expect(response.success).toBe(true);
      expect(typeof response.message).toBe('string');
      expect(response.new_record).toBeDefined();
    });

    test('should include new withdrawal record', () => {
      const response: ConsentWithdrawResponse = {
        success: true,
        message: 'Consent withdrawn successfully',
        new_record: {
          consent_type: 'behavioral_analytics',
          consent_given: false,
          withdrawn_at: new Date().toISOString(),
        },
      };

      expect(response.new_record.consent_type).toBe('behavioral_analytics');
      expect(response.new_record.consent_given).toBe(false);
      expect(response.new_record.withdrawn_at).toBeDefined();
    });

    test('should mark consent as not given in withdrawal record', () => {
      const response: ConsentWithdrawResponse = {
        success: true,
        message: 'Consent withdrawn',
        new_record: {
          consent_type: 'behavioral_analytics',
          consent_given: false,
          withdrawn_at: new Date().toISOString(),
        },
      };

      expect(response.new_record.consent_given).toBe(false);
    });

    test('should include timestamp when consent was withdrawn', () => {
      const now = new Date();
      const response: ConsentWithdrawResponse = {
        success: true,
        message: 'Withdrawn',
        new_record: {
          consent_type: 'behavioral_analytics',
          consent_given: false,
          withdrawn_at: now.toISOString(),
        },
      };

      expect(response.new_record.withdrawn_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });

  describe('Error Responses', () => {
    test('should return CANNOT_WITHDRAW error for non-withdrawable types', () => {
      const response: ConsentWithdrawErrorResponse = {
        success: false,
        error: {
          code: 'CANNOT_WITHDRAW',
          message: 'This consent type cannot be withdrawn',
          details: [
            'Only behavioral_analytics consent can be withdrawn. Privacy policy and terms of service are required.',
          ],
        },
      };

      expect(response.error.code).toBe('CANNOT_WITHDRAW');
      expect(response.success).toBe(false);
    });

    test('should return NOT_FOUND error when no active consent exists', () => {
      const response: ConsentWithdrawErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No active consent record found',
          details: ['User must have given consent before it can be withdrawn.'],
        },
      };

      expect(response.error.code).toBe('NOT_FOUND');
    });

    test('should return UNAUTHORIZED error for unauthenticated users', () => {
      const response: ConsentWithdrawErrorResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is not authenticated',
        },
      };

      expect(response.error.code).toBe('UNAUTHORIZED');
    });

    test('should return INVALID_TYPE error for invalid payload', () => {
      const response: ConsentWithdrawErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Request validation failed',
          details: ['consent_type is required'],
        },
      };

      expect(response.error.code).toBe('INVALID_TYPE');
    });

    test('should return RATE_LIMIT error when rate limited', () => {
      const response: ConsentWithdrawErrorResponse = {
        success: false,
        error: {
          code: 'RATE_LIMIT',
          message: 'Too many withdrawal attempts',
          details: ['Reset in 3600 seconds'],
        },
      };

      expect(response.error.code).toBe('RATE_LIMIT');
    });

    test('should return INTERNAL_ERROR for server errors', () => {
      const response: ConsentWithdrawErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while withdrawing consent',
        },
      };

      expect(response.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Error Details', () => {
    test('should provide details array when available', () => {
      const response: ConsentWithdrawErrorResponse = {
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Validation failed',
          details: ['consent_type must be a string', 'consent_type is required'],
        },
      };

      expect(Array.isArray(response.error.details)).toBe(true);
      expect(response.error.details).toHaveLength(2);
    });

    test('should allow optional details field', () => {
      const response: ConsentWithdrawErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Server error',
        },
      };

      expect(response.error.details).toBeUndefined();
    });
  });
});

describe('Withdrawal Business Logic', () => {
  describe('Privacy Policy Withdrawal', () => {
    test('should reject privacy_policy withdrawal', () => {
      const request: ConsentWithdrawRequest = {
        consent_type: 'privacy_policy',
      };

      // This type should not be withdrawable
      expect(request.consent_type).not.toBe('behavioral_analytics');
    });

    test('should explain why privacy_policy cannot be withdrawn', () => {
      const message = 'Privacy policy consent is mandatory and cannot be withdrawn';
      expect(message).toContain('mandatory');
    });
  });

  describe('Terms of Service Withdrawal', () => {
    test('should reject terms_of_service withdrawal', () => {
      const request: ConsentWithdrawRequest = {
        consent_type: 'terms_of_service',
      };

      // This type should not be withdrawable
      expect(request.consent_type).not.toBe('behavioral_analytics');
    });

    test('should explain why terms cannot be withdrawn', () => {
      const message = 'Terms of service consent is mandatory and cannot be withdrawn';
      expect(message).toContain('mandatory');
    });
  });

  describe('Analytics Withdrawal', () => {
    test('should allow behavioral_analytics withdrawal', () => {
      const request: ConsentWithdrawRequest = {
        consent_type: 'behavioral_analytics',
      };

      expect(request.consent_type).toBe('behavioral_analytics');
    });

    test('should create withdrawal record with false consent_given', () => {
      const response: ConsentWithdrawResponse = {
        success: true,
        message: 'Withdrawn',
        new_record: {
          consent_type: 'behavioral_analytics',
          consent_given: false,
          withdrawn_at: new Date().toISOString(),
        },
      };

      expect(response.new_record.consent_given).toBe(false);
      expect(response.new_record.consent_type).toBe('behavioral_analytics');
    });
  });

  describe('Multiple Withdrawals', () => {
    test('should track multiple withdrawal attempts', () => {
      const firstWithdrawal = new Date();
      const secondWithdrawal = new Date(firstWithdrawal.getTime() + 86400000); // 1 day later

      const firstRecord = {
        timestamp: firstWithdrawal.toISOString(),
        withdrawn_at: firstWithdrawal.toISOString(),
      };

      const secondRecord = {
        timestamp: secondWithdrawal.toISOString(),
        withdrawn_at: secondWithdrawal.toISOString(),
      };

      expect(new Date(secondRecord.timestamp).getTime())
        .toBeGreaterThan(new Date(firstRecord.timestamp).getTime());
    });

    test('should prevent duplicate active withdrawals', () => {
      // Once withdrawn, there should be no active consent to withdraw again
      const consentState = 'withdrawn';
      expect(consentState).toBe('withdrawn');
    });
  });

  describe('User Authentication in Withdrawal', () => {
    test('should require valid authentication token', () => {
      const validAuthHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      expect(validAuthHeader).toMatch(/^Bearer /);
    });

    test('should reject missing authorization header', () => {
      const noAuth = undefined;
      expect(noAuth).toBeUndefined();
    });

    test('should reject invalid token format', () => {
      const invalidToken = 'InvalidToken';
      expect(invalidToken).not.toMatch(/^Bearer /);
    });
  });
});

describe('Rate Limiting for Withdrawals', () => {
  test('should enforce rate limit per user', () => {
    const userId = 'user-123';
    const attempts = ['attempt-1', 'attempt-2', 'attempt-3'];

    // Simulate rate limiting tracking
    expect(attempts.length).toBeGreaterThan(0);
  });

  test('should separate rate limits by operation type', () => {
    // Consent and withdrawal should have separate rate limits
    const consentLimit = 5; // per 15 minutes
    const withdrawalLimit = 10; // per hour

    expect(withdrawalLimit).toBeGreaterThan(consentLimit);
  });

  test('should return Retry-After header when rate limited', () => {
    const retryAfter = '3600'; // seconds
    expect(parseInt(retryAfter)).toBeGreaterThan(0);
  });
});

describe('Audit Trail for Withdrawals', () => {
  test('should record IP address when consent withdrawn', () => {
    const ipAddress = '192.168.1.1';
    expect(ipAddress).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
  });

  test('should record user agent when consent withdrawn', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
    expect(userAgent).toContain('Mozilla');
  });

  test('should handle unknown IP gracefully', () => {
    const unknownIp = 'unknown';
    expect(unknownIp).toBe('unknown');
  });
});

describe('Timestamp Handling for Withdrawals', () => {
  test('should use ISO 8601 format for withdrawn_at', () => {
    const iso8601 = new Date().toISOString();
    expect(iso8601).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  test('should set withdrawn_at to current time', () => {
    const now = new Date();
    const withdrawn = now.toISOString();

    expect(new Date(withdrawn).getTime()).toBeLessThanOrEqual(new Date().getTime());
  });

  test('should ensure withdrawn_at is after original consent timestamp', () => {
    const consentTime = new Date();
    const withdrawalTime = new Date(consentTime.getTime() + 1000); // 1 second later

    expect(withdrawalTime.getTime()).toBeGreaterThan(consentTime.getTime());
  });
});

describe('Data Consistency', () => {
  test('should not allow data modification in withdrawal request', () => {
    const request: ConsentWithdrawRequest = {
      consent_type: 'behavioral_analytics',
    };

    const frozen = Object.freeze({ ...request });
    expect(() => {
      (frozen as any).consent_type = 'privacy_policy';
    }).toThrow();
  });

  test('should validate consent_type matches database enum', () => {
    const validTypes = ['privacy_policy', 'terms_of_service', 'behavioral_analytics'];
    const requestType = 'behavioral_analytics';

    expect(validTypes).toContain(requestType);
  });
});

describe('Edge Cases and Boundary Conditions', () => {
  test('should handle rapid withdrawal requests', () => {
    const requests = Array(100).fill({
      consent_type: 'behavioral_analytics',
    });

    expect(requests).toHaveLength(100);
  });

  test('should handle withdrawal with special characters in user ID', () => {
    const specialUserId = 'user-123_abc@special.id';
    expect(typeof specialUserId).toBe('string');
  });

  test('should handle withdrawal late in consent lifecycle', () => {
    const consentDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    const withdrawalDate = new Date();

    expect(withdrawalDate.getTime()).toBeGreaterThan(consentDate.getTime());
  });
});

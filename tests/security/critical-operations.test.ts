/**
 * tests/security/critical-operations.test.ts
 *
 * Jest test suite for critical operations security verification.
 * Tests API-layer verification functions that enforce business rules beyond RLS.
 *
 * COVERAGE:
 * - Exchange state machine transitions
 * - Exchange participant verification
 * - Self-exchange prevention
 * - Refund amount validation
 * - Error structure and context
 *
 * NOTE: These tests focus on synchronous verification logic.
 * Async database tests should be done separately in integration tests.
 *
 * Run: npm test -- critical-operations.test.ts
 */

import {
  VerificationError,
  verifyExchangeStateTransition,
  verifyExchangeParticipant,
  verifySelfExchangeCheck,
  verifyRefundAmount,
} from '@/lib/security/verify-critical-ops';

/**
 * SECTION 1: Exchange State Machine Tests
 */
describe('Exchange State Machine Verification', () => {
  describe('verifyExchangeStateTransition', () => {
    it('should allow valid transition: pending_request -> accepted', () => {
      expect(() => {
        verifyExchangeStateTransition('pending_request', 'accepted');
      }).not.toThrow();
    });

    it('should allow valid transition: accepted -> in_transit', () => {
      expect(() => {
        verifyExchangeStateTransition('accepted', 'in_transit');
      }).not.toThrow();
    });

    it('should allow valid transition: in_transit -> delivered', () => {
      expect(() => {
        verifyExchangeStateTransition('in_transit', 'delivered');
      }).not.toThrow();
    });

    it('should allow valid transition: delivered -> confirmed', () => {
      expect(() => {
        verifyExchangeStateTransition('delivered', 'confirmed');
      }).not.toThrow();
    });

    it('should allow valid transition: confirmed -> completed', () => {
      expect(() => {
        verifyExchangeStateTransition('confirmed', 'completed');
      }).not.toThrow();
    });

    it('should allow cancellation from pending_request', () => {
      expect(() => {
        verifyExchangeStateTransition('pending_request', 'canceled');
      }).not.toThrow();
    });

    it('should allow cancellation from accepted', () => {
      expect(() => {
        verifyExchangeStateTransition('accepted', 'canceled');
      }).not.toThrow();
    });

    it('should reject invalid transition: pending_request -> completed (skip states)', () => {
      expect(() => {
        verifyExchangeStateTransition('pending_request', 'completed');
      }).toThrow(VerificationError);

      expect(() => {
        verifyExchangeStateTransition('pending_request', 'completed');
      }).toThrow('Cannot transition from pending_request to completed');
    });

    it('should reject transition from completed status', () => {
      expect(() => {
        verifyExchangeStateTransition('completed', 'canceled');
      }).toThrow(VerificationError);
    });

    it('should reject invalid current status', () => {
      expect(() => {
        verifyExchangeStateTransition('invalid_status', 'accepted');
      }).toThrow(VerificationError);

      expect(() => {
        verifyExchangeStateTransition('invalid_status', 'accepted');
      }).toThrow('Invalid current exchange status');
    });

    it('should include context in error for debugging', () => {
      try {
        verifyExchangeStateTransition('pending_request', 'invalid_status');
        fail('Expected VerificationError');
      } catch (err) {
        expect(err).toBeInstanceOf(VerificationError);
        const error = err as VerificationError;
        expect(error.context).toEqual({
          currentStatus: 'pending_request',
          targetStatus: 'invalid_status',
          allowedTransitions: ['accepted', 'canceled'],
        });
      }
    });
  });
});

/**
 * SECTION 2: Exchange Participant Verification Tests
 */
describe('Exchange Participant Verification', () => {
  const requesterId = 'user-requester-123';
  const listerId = 'user-lister-456';
  const otherUserId = 'user-other-789';

  describe('verifyExchangeParticipant', () => {
    it('should allow requester to participate', () => {
      expect(() => {
        verifyExchangeParticipant(requesterId, requesterId, listerId);
      }).not.toThrow();
    });

    it('should allow lister to participate', () => {
      expect(() => {
        verifyExchangeParticipant(listerId, requesterId, listerId);
      }).not.toThrow();
    });

    it('should reject non-participant', () => {
      expect(() => {
        verifyExchangeParticipant(otherUserId, requesterId, listerId);
      }).toThrow(VerificationError);

      expect(() => {
        verifyExchangeParticipant(otherUserId, requesterId, listerId);
      }).toThrow('User is not a participant in this exchange');
    });

    it('should include participant IDs in error context', () => {
      try {
        verifyExchangeParticipant(otherUserId, requesterId, listerId);
        fail('Expected VerificationError');
      } catch (err) {
        const error = err as VerificationError;
        expect(error.context).toEqual({
          userId: otherUserId,
          requester_id: requesterId,
          lister_id: listerId,
        });
      }
    });
  });

  describe('verifySelfExchangeCheck', () => {
    it('should reject when requester equals lister', () => {
      expect(() => {
        verifySelfExchangeCheck(requesterId, requesterId);
      }).toThrow(VerificationError);

      expect(() => {
        verifySelfExchangeCheck(requesterId, requesterId);
      }).toThrow('Cannot exchange with yourself');
    });

    it('should allow different users', () => {
      expect(() => {
        verifySelfExchangeCheck(requesterId, listerId);
      }).not.toThrow();
    });
  });
});

/**
 * SECTION 5: Dispute Resolution Tests
 */
describe('Dispute Resolution Verification', () => {
  describe('verifyRefundAmount', () => {
    const requesterId = 'user-123';

    it('should allow refund of 1 ticket', () => {
      expect(() => {
        verifyRefundAmount(requesterId, 1);
      }).not.toThrow();
    });

    it('should reject refund of 0 tickets', () => {
      expect(() => {
        verifyRefundAmount(requesterId, 0);
      }).toThrow(VerificationError);

      expect(() => {
        verifyRefundAmount(requesterId, 0);
      }).toThrow('Refund amount must match original escrow');
    });

    it('should reject refund of multiple tickets', () => {
      expect(() => {
        verifyRefundAmount(requesterId, 2);
      }).toThrow(VerificationError);
    });
  });
});

/**
 * SECTION 8: Error Structure Tests
 */
describe('VerificationError', () => {
  it('should include all required error properties', () => {
    const error = new VerificationError('TEST_CODE', 'Test message', 400, { test: 'context' });

    expect(error.code).toBe('TEST_CODE');
    expect(error.message).toBe('Test message');
    expect(error.statusCode).toBe(400);
    expect(error.context).toEqual({ test: 'context' });
    expect(error.name).toBe('VerificationError');
  });

  it('should have proper inheritance from Error', () => {
    const error = new VerificationError('CODE', 'msg');
    expect(error instanceof Error).toBe(true);
    expect(error.stack).toBeDefined();
  });

  it('should support default status code of 400', () => {
    const error = new VerificationError('CODE', 'msg');
    expect(error.statusCode).toBe(400);
  });
});

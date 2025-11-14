# API-Layer Security Verification for Critical Operations

## Overview

This document describes the security verification architecture for critical operations in the Toy-for-Toy platform. It supplements RLS (Row-Level Security) policies with API-layer verification to prevent exploitation of business logic vulnerabilities.

## Why API-Layer Verification?

RLS policies provide **row-level access control** at the database level. However, they do NOT prevent:

- **Edge Function logic bugs** that bypass business rules
- **Concurrent state race conditions** where multiple requests modify the same resource
- **Trigger failures** that don't execute properly
- **Service role key misuse** by backend operations
- **State machine violations** that transition to invalid states

Therefore, critical operations require **stateless verification functions** that validate business rules BEFORE any database write operation.

## Architecture

### Security Layers

```
User Request
    ↓
[1] Authentication (JWT Token)
    ↓
[2] RLS Policies (Row-Level Filtering)
    ↓
[3] API-Layer Verification (Business Rules) ← THIS DOCUMENT
    ↓
[4] Database Constraints (Triggers)
    ↓
[5] Audit Logging (Investigation Trail)
    ↓
Database Write
```

## Critical Operations

### 1. Exchange Escrow & Ticket Transfers

**File:** `app/api/exchanges/create/route.ts`

**Verification Checks:**

```typescript
import {
  verifyToyExists,
  verifyTicketBalance,
  verifySelfExchangeCheck,
  verifyExchangeStateTransition,
} from '@/lib/security/verify-critical-ops';

// 1. Verify toy exists and is active
const toy = await verifyToyExists(toy_id, supabase);
// Throws: INVALID_CURRENT_STATUS, TOY_NOT_FOUND, TOY_NOT_AVAILABLE

// 2. Verify requester has sufficient tickets
const balance = await verifyTicketBalance(requester_id, supabase, 1);
// Throws: INSUFFICIENT_TICKETS, NO_TICKET_WALLET

// 3. Prevent self-exchange
verifySelfExchangeCheck(requester_id, toy.user_id);
// Throws: SELF_EXCHANGE_ATTEMPTED

// 4. Verify state transition (if updating status)
verifyExchangeStateTransition(current_status, new_status);
// Throws: INVALID_STATUS_TRANSITION
```

**Test Cases:**

- ✅ User A can request User B's toy if sufficient tickets
- ❌ User A cannot request own toy (self-exchange)
- ❌ User A cannot request toy if balance = 0
- ❌ User A cannot request toy if frozen + 1 > balance
- ❌ User A cannot request non-existent toy
- ❌ User A cannot request delisted toy
- ❌ Concurrent requests don't double-spend tickets

**Race Condition Prevention:**

Uses optimistic locking on ticket balance:

```typescript
// Check version before update
verifyOptimisticLock('tickets', user_id, expectedVersion, supabase);
```

---

### 2. Dispute Resolution

**File:** `app/api/disputes/resolve/route.ts`

**Verification Checks:**

```typescript
import {
  verifyAdminVerified,
  verifyDisputeState,
  verifyRefundAmount,
} from '@/lib/security/verify-critical-ops';

// 1. Secondary admin verification (beyond JWT)
await verifyAdminVerified(admin_id, supabase);
// Throws: NOT_VERIFIED_ADMIN

// 2. Verify dispute exists and is resolvable
const dispute = await verifyDisputeState(dispute_id, supabase);
// Throws: DISPUTE_NOT_FOUND, DISPUTE_ALREADY_RESOLVED, DISPUTE_ALREADY_CLOSED

// 3. Verify refund amount matches original escrow
verifyRefundAmount(requester_id, 1);
// Throws: INVALID_REFUND_AMOUNT
```

**Test Cases:**

- ✅ Admin can resolve open dispute
- ❌ Non-admin cannot resolve dispute
- ❌ Admin with compromised JWT cannot resolve (secondary verification)
- ❌ Cannot resolve already-resolved dispute
- ❌ Cannot resolve closed dispute
- ❌ Cannot refund incorrect ticket amount

**Admin Verification Strategy:**

```typescript
// Instead of just checking JWT claims, verify admin record exists
const { data: adminRecord } = await supabase
  .from('admin_users')
  .select('verified_at')
  .eq('user_id', userId)
  .eq('is_active', true)
  .single();

if (!adminRecord) {
  throw new VerificationError('NOT_VERIFIED_ADMIN', ...);
}
```

---

### 3. Rating Visibility & Publication

**File:** `app/api/ratings/create/route.ts`

**Verification Checks:**

```typescript
import {
  verifyRatingEligibility,
  verifyMutualRatingVisibility,
} from '@/lib/security/verify-critical-ops';

// 1. Verify exchange is completed
await verifyRatingEligibility(exchange_id, rater_id, supabase);
// Throws: EXCHANGE_NOT_COMPLETED, EXCHANGE_NOT_FOUND, NOT_EXCHANGE_PARTICIPANT

// 2. Check if both parties have rated (for visibility)
const mutualRatingsVisible = await verifyMutualRatingVisibility(exchange_id, rater_id, supabase);
// Returns: boolean
```

**Test Cases:**

- ✅ User can rate completed exchange they participated in
- ✅ Ratings only visible to both parties once mutual
- ❌ User cannot rate before exchange completion
- ❌ User cannot rate exchange they didn't participate in
- ❌ User cannot rate same exchange twice
- ❌ One-way rating not visible to other party

**Mutual Rating Logic:**

```typescript
// Both parties must have ratings for visibility
const { data: ratings } = await supabase
  .from('ratings')
  .select('rater_id')
  .eq('exchange_id', exchange_id)
  .in('rater_id', [requester_id, lister_id]);

return ratings.length === 2; // Both must have rated
```

---

## Implementation Patterns

### Pattern 1: Synchronous Verification

For simple checks that don't require database queries:

```typescript
// Verify state machine rules
verifyExchangeStateTransition('pending_request', 'accepted'); // OK
verifyExchangeStateTransition('completed', 'canceled'); // Throws

// Verify self-exchange
verifySelfExchangeCheck('user-a', 'user-a'); // Throws
verifySelfExchangeCheck('user-a', 'user-b'); // OK
```

### Pattern 2: Asynchronous Verification

For checks requiring database queries:

```typescript
// Verify ticket balance
const balance = await verifyTicketBalance(userId, supabase, 1);
// Returns: { balance: 10, frozen: 2, available: 8 }

// Verify toy availability
const toy = await verifyToyExists(toyId, supabase);
// Returns: { id, user_id, status }
```

### Pattern 3: Error Handling

All verification functions throw `VerificationError` with structured context:

```typescript
try {
  await verifyTicketBalance(userId, supabase, 5);
} catch (err) {
  if (err instanceof VerificationError) {
    const { code, message, statusCode, context } = err;
    // code: 'INSUFFICIENT_TICKETS'
    // statusCode: 402
    // context: { required: 5, available: 2, ... }

    return NextResponse.json({ error: code, message, context }, { status: statusCode });
  }
  throw err;
}
```

### Pattern 4: Audit Logging

Log all critical operations and failures:

```typescript
import { logVerificationFailure, logOperationSuccess } from '@/lib/security/audit-logging';

// Log verification failure
try {
  await verifyTicketBalance(userId, supabase, 5);
} catch (err) {
  await logVerificationFailure(
    supabase,
    userId,
    err.code,
    err.message,
    { exchange_id, toy_id },
    clientIp
  );
}

// Log success
await logOperationSuccess(
  supabase,
  AuditEventType.EXCHANGE_REQUEST_CREATED,
  userId,
  exchange_id,
  'exchange',
  'Created exchange request',
  { toy_id, lister_id }
);
```

---

## Testing Strategy

### Unit Tests

Test verification functions in isolation:

```bash
npm test -- critical-operations.test.ts
```

**Coverage:**

- ✅ Valid state transitions
- ✅ Invalid state transitions
- ✅ Participant verification
- ✅ Balance verification (sufficient/insufficient)
- ✅ Toy availability checks
- ✅ Admin verification
- ✅ Dispute state checks
- ✅ Rating eligibility
- ✅ Mutual rating visibility
- ✅ Concurrent modification detection

### Integration Tests

Test end-to-end workflows with database:

```bash
npx supabase start
npm test -- api/exchanges/create.test.ts
```

**Scenarios:**

- Create exchange → Accept → In Transit → Delivered → Confirmed → Completed
- Attempt to create exchange with insufficient tickets
- Attempt to create exchange with non-existent toy
- Attempt to self-exchange
- Concurrent exchange requests on same toy

---

## Error Codes & Status Codes

### Verification Errors

| Code                        | Status | Meaning                      |
| --------------------------- | ------ | ---------------------------- |
| `INVALID_CURRENT_STATUS`    | 400    | Unknown status value         |
| `INVALID_STATUS_TRANSITION` | 400    | State transition not allowed |
| `NOT_EXCHANGE_PARTICIPANT`  | 403    | User not in exchange         |
| `SELF_EXCHANGE_ATTEMPTED`   | 400    | Requester = Lister           |
| `INSUFFICIENT_TICKETS`      | 402    | Balance < required           |
| `NO_TICKET_WALLET`          | 400    | User has no ticket wallet    |
| `TOY_NOT_FOUND`             | 404    | Toy doesn't exist            |
| `TOY_NOT_AVAILABLE`         | 400    | Toy not active/available     |
| `DISPUTE_NOT_FOUND`         | 404    | Dispute doesn't exist        |
| `DISPUTE_ALREADY_RESOLVED`  | 400    | Can't re-resolve             |
| `DISPUTE_ALREADY_CLOSED`    | 400    | Can't modify closed          |
| `INVALID_REFUND_AMOUNT`     | 400    | Refund != 1 ticket           |
| `NOT_VERIFIED_ADMIN`        | 403    | Admin verification failed    |
| `EXCHANGE_NOT_COMPLETED`    | 400    | Exchange not finished        |
| `RATING_ALREADY_EXISTS`     | 400    | User already rated           |
| `CONCURRENT_MODIFICATION`   | 409    | Version mismatch             |

---

## Database Schema Requirements

To support these verifications, ensure the following tables exist:

### admin_users table

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### audit_log table

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  user_id UUID REFERENCES profiles(id),
  subject_id UUID,
  subject_type VARCHAR(50),
  action TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_code VARCHAR(50),
  error_message TEXT,
  context JSONB,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
```

---

## Security Checklist

Before deploying, verify:

- ✅ All critical operations have verification checks
- ✅ All verification failures are logged
- ✅ State transitions follow valid machine rules
- ✅ Admin operations have secondary verification
- ✅ Concurrent modifications are detected
- ✅ Error responses don't leak sensitive context
- ✅ All verification functions have unit tests
- ✅ Integration tests cover unhappy paths
- ✅ TypeScript strict mode passes
- ✅ ESLint checks pass

---

## Files

**Core Library:**

- `lib/security/verify-critical-ops.ts` - Verification functions
- `lib/security/audit-logging.ts` - Audit logging utilities

**Example Implementations:**

- `app/api/exchanges/create/route.ts` - Create exchange request
- `app/api/disputes/resolve/route.ts` - Resolve dispute
- `app/api/ratings/create/route.ts` - Create rating

**Tests:**

- `tests/security/critical-operations.test.ts` - Comprehensive test suite

---

## Further Reading

- [RLS Policies](./DATABASE_SECURITY.md) - Row-level security implementation
- [GDPR Compliance](./GDPR.md) - Child data protection
- [Threat Model](./THREAT_MODEL.md) - Attack scenarios

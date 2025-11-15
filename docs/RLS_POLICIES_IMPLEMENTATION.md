# Row-Level Security (RLS) Policies Implementation Guide

## Overview

This document describes the complete Row-Level Security (RLS) implementation for Toy-for-Toy platform. RLS is a PostgreSQL feature that enforces data access control at the database level, ensuring users can only access data they're authorized to see.

**Key Security Principle**: Deny by default, explicitly allow specific operations.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Security Model](#security-model)
3. [Implementation Details](#implementation-details)
4. [Testing Strategy](#testing-strategy)
5. [Common Pitfalls](#common-pitfalls)
6. [Troubleshooting](#troubleshooting)

## Architecture Overview

### RLS Enforcement Model

RLS policies are enforced at the database layer, not the application layer:

```
Application Request
    ↓
Supabase Client (with JWT)
    ↓
PostgreSQL Database
    ↓
RLS Policy Check (auth.uid() in token)
    ↓
Data Access (granted or denied)
```

### Authentication Context

RLS policies use `auth.uid()` function which returns:
- The authenticated user's UUID (from JWT token's `sub` claim)
- `NULL` for unauthenticated requests

```sql
-- Example: Only allow users to see their own data
WHERE auth.uid() = user_id
```

### Service Role Bypass

Backend operations use `SUPABASE_SERVICE_ROLE_KEY` which:
- Bypasses all RLS policies
- Should NEVER be exposed to frontend
- Used only in server-side API routes
- Allows system operations (migrations, batch updates, etc.)

## Security Model

### Denial by Default

All tables have RLS enabled with explicit policies:

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- No policy means NO ACCESS (deny by default)
-- CREATE POLICY statements explicitly grant access
```

### User Isolation

Each user can only access their own data:

```sql
-- Good: User isolation enforced
SELECT * FROM profiles WHERE auth.uid() = user_id

-- Bad: Not checking user identity
SELECT * FROM profiles  -- Would need explicit policy for this
```

### Immutable Audit Trails

Financial transactions and consents cannot be modified:

```sql
-- Ticket transactions: INSERT by system, READ by user, no UPDATE/DELETE
CREATE POLICY "Allow users to read own transaction history"
ON public.ticket_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Deny transaction insertion from users"
ON public.ticket_transactions FOR INSERT
WITH CHECK (FALSE);

CREATE POLICY "Deny transaction updates"
ON public.ticket_transactions FOR UPDATE
USING (FALSE);

CREATE POLICY "Deny transaction deletion"
ON public.ticket_transactions FOR DELETE
USING (FALSE);
```

## Implementation Details

### Table: PROFILES

**Purpose**: User profile information

**Policies**:

| Operation | Policy | Check |
|-----------|--------|-------|
| SELECT | Users read own profile | `auth.uid() = user_id` |
| INSERT | Deny | `FALSE` (auth trigger only) |
| UPDATE | Users update own profile | `auth.uid() = user_id` (both USING and WITH CHECK) |
| DELETE | Deny | `FALSE` (GDPR workflow only) |

**Rationale**: Users must be able to view and update their own profile. Direct insertion/deletion is handled by authentication system.

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny profile deletion"
ON public.profiles FOR DELETE
USING (FALSE);

CREATE POLICY "Deny profile insertion"
ON public.profiles FOR INSERT
WITH CHECK (FALSE);
```

### Table: TICKETS

**Purpose**: Ticket balance (financial ledger)

**Policies**:

| Operation | Policy | Check |
|-----------|--------|-------|
| SELECT | Users read own balance | `auth.uid() = user_id` |
| INSERT | Deny | `FALSE` (system only) |
| UPDATE | Deny | `FALSE` (triggers only) |
| DELETE | Deny | `FALSE` (immutable) |

**Rationale**: Tickets represent value in the system. Only users can view their balance. All modifications happen via triggers (system-controlled).

```sql
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read own ticket balance"
ON public.tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Deny ticket balance updates from users"
ON public.tickets FOR UPDATE
USING (FALSE);

CREATE POLICY "Deny ticket insertion from users"
ON public.tickets FOR INSERT
WITH CHECK (FALSE);

CREATE POLICY "Deny ticket deletion"
ON public.tickets FOR DELETE
USING (FALSE);
```

### Table: TOYS

**Purpose**: Toy listings

**Policies**:

| Operation | Policy | Check |
|-----------|--------|-------|
| SELECT | All active toys + own | `is_active = TRUE OR auth.uid() = user_id` |
| INSERT | Users insert for themselves | `auth.uid() = user_id` |
| UPDATE | Users update own toys | `auth.uid() = user_id` (both directions) |
| DELETE | Deny | `FALSE` (soft delete only) |

**Rationale**: Active toys are public for discovery. Inactive/expired toys only visible to owner. Hard delete is denied; use soft delete via `is_active = false`.

```sql
ALTER TABLE public.toys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to see active toys and own toys"
ON public.toys FOR SELECT
USING (
  is_active = TRUE
  OR auth.uid() = user_id
);

CREATE POLICY "Allow users to insert own toys"
ON public.toys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own toys"
ON public.toys FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny toy deletion - use soft delete"
ON public.toys FOR DELETE
USING (FALSE);
```

### Table: TOY_IMAGES

**Purpose**: References to toy images in Supabase Storage

**Policies**:

| Operation | Policy | Check |
|-----------|--------|-------|
| SELECT | See images for active/own toys | Subquery: toy is active OR user owns toy |
| INSERT | Insert for own toys | Subquery: user owns toy |
| UPDATE | Update own toy images | Subquery: user owns toy |
| DELETE | Delete own toy images | Subquery: user owns toy |

**Rationale**: Image access follows toy access control. Uses subquery to join with toys table and verify ownership.

```sql
ALTER TABLE public.toy_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to see images for active toys and own toys"
ON public.toy_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.toys
    WHERE toys.id = toy_id
    AND (toys.is_active = TRUE OR auth.uid() = toys.user_id)
  )
);

CREATE POLICY "Allow users to insert images for own toys"
ON public.toy_images FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.toys
    WHERE toys.id = toy_id
    AND auth.uid() = toys.user_id
  )
);

CREATE POLICY "Allow users to update own toy image order"
ON public.toy_images FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.toys
    WHERE toys.id = toy_id
    AND auth.uid() = toys.user_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.toys
    WHERE toys.id = toy_id
    AND auth.uid() = toys.user_id
  )
);

CREATE POLICY "Allow users to delete own toy images"
ON public.toy_images FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.toys
    WHERE toys.id = toy_id
    AND auth.uid() = toys.user_id
  )
);
```

### Table: EXCHANGES

**Purpose**: Toy exchange transactions

**Policies**:

| Operation | Policy | Check |
|-----------|--------|-------|
| SELECT | See exchanges they're in | `auth.uid() = requester_id OR auth.uid() = owner_id` |
| INSERT | Auth users create | `auth.uid() IS NOT NULL` |
| UPDATE | Update exchanges they're in | `auth.uid()` is requester or owner |
| DELETE | Deny | `FALSE` (use status archive) |

**Rationale**: Exchanges are private to the two parties involved. Data isolation is critical.

```sql
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to see their exchanges"
ON public.exchanges FOR SELECT
USING (
  auth.uid() = requester_id
  OR auth.uid() = owner_id
);

CREATE POLICY "Allow authenticated users to create exchanges"
ON public.exchanges FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update their exchanges"
ON public.exchanges FOR UPDATE
USING (
  auth.uid() = requester_id
  OR auth.uid() = owner_id
)
WITH CHECK (
  auth.uid() = requester_id
  OR auth.uid() = owner_id
);

CREATE POLICY "Deny exchange deletion - use archive via status"
ON public.exchanges FOR DELETE
USING (FALSE);
```

### Table: CONSENT_RECORDS

**Purpose**: GDPR compliance audit trail

**Policies**:

| Operation | Policy | Check |
|-----------|--------|-------|
| SELECT | Read own records | `auth.uid() = user_id` |
| INSERT | Insert own records | `auth.uid() = user_id` |
| UPDATE | Withdraw consent only | Only `withdrawn_at` can be set |
| DELETE | Deny | `FALSE` (immutable audit trail) |

**Rationale**: Consent decisions must be auditable and immutable. Users can withdraw consent but cannot modify history.

```sql
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read own consent records"
ON public.consent_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own consent records"
ON public.consent_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to withdraw own consents"
ON public.consent_records FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    (OLD.withdrawn_at IS NULL AND (NEW.withdrawn_at IS NULL OR NEW.withdrawn_at > OLD.timestamp))
    OR (OLD.withdrawn_at IS NOT NULL AND NEW.withdrawn_at = OLD.withdrawn_at)
  )
);

CREATE POLICY "Deny consent record deletion - immutable audit trail"
ON public.consent_records FOR DELETE
USING (FALSE);
```

### Table: TICKET_TRANSACTIONS

**Purpose**: Immutable audit log of all ticket changes

**Policies**:

| Operation | Policy | Check |
|-----------|--------|-------|
| SELECT | Read own history | `auth.uid() = user_id` |
| INSERT | Deny | `FALSE` (triggers only) |
| UPDATE | Deny | `FALSE` (immutable) |
| DELETE | Deny | `FALSE` (immutable) |

**Rationale**: Complete immutability. Only system triggers create entries.

```sql
ALTER TABLE public.ticket_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read own transaction history"
ON public.ticket_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Deny transaction insertion from users"
ON public.ticket_transactions FOR INSERT
WITH CHECK (FALSE);

CREATE POLICY "Deny transaction updates"
ON public.ticket_transactions FOR UPDATE
USING (FALSE);

CREATE POLICY "Deny transaction deletion"
ON public.ticket_transactions FOR DELETE
USING (FALSE);
```

## Testing Strategy

### Test Categories

1. **User Isolation**: User A cannot see User B's private data
2. **Permission Denials**: Unauthorized operations return 403 Forbidden
3. **Data Modification**: Only authorized changes are allowed
4. **Service Role Bypass**: Backend can bypass for system operations
5. **Edge Cases**: Null values, concurrent access, joins

### Running Security Tests

```bash
# Run all RLS tests
npm test tests/security/rls-policies.test.ts

# Run with verbose output
npm test tests/security/rls-policies.test.ts -- --verbose

# Run specific test suite
npm test tests/security/rls-policies.test.ts -- -t "PROFILES - User Isolation"
```

### Test File Structure

**File**: `/tests/security/rls-policies.test.ts`

**Coverage**: 60+ test cases including:
- User isolation across all 7 tables
- Permission denials (SELECT, INSERT, UPDATE, DELETE)
- Cross-table security scenarios
- Service role bypass verification
- Edge cases and race conditions
- Comprehensive violation scenarios

**Helper File**: `/tests/security/rls-test-helpers.ts`

**Utilities**:
- `MockSupabaseClientFactory`: Create clients for different users
- `RLSAssertions`: Helper functions for permission testing
- `TestDataGenerator`: Generate test fixtures
- `RLSTestContext`: Manage test users and contexts
- `RLSViolationScenarios`: Pre-built attack scenarios

## Common Pitfalls

### 1. Forgetting WITH CHECK Clause

**Problem**: UPDATE policy without `WITH CHECK` allows modifying any column.

```sql
-- WRONG: Missing WITH CHECK
CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- CORRECT: WITH CHECK ensures update values are valid
CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Impact**: Users could theoretically update other users' records if they knew the IDs.

### 2. Not Enabling RLS on Table

**Problem**: Forgetting `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.

```sql
-- WRONG: RLS not enabled
CREATE POLICY "Allow users to read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- CORRECT: Enable RLS first
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);
```

**Impact**: Policies are ignored if RLS is not enabled.

### 3. Using auth.uid() with NULL User IDs

**Problem**: Tables with nullable user_id columns.

```sql
-- WRONG: What if user_id is NULL?
CREATE POLICY "Allow users to read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);  -- NULL = auth.uid() is always FALSE

-- CORRECT: Handle NULL explicitly
CREATE POLICY "Allow users to read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id AND user_id IS NOT NULL);
```

**Impact**: Data with NULL user_id might be hidden or exposed unexpectedly.

### 4. Exposing Service Role Key

**Problem**: Accidentally committing service role key to repository.

```javascript
// WRONG: Service key in client-side code
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

// CORRECT: Service key only in backend environment
// .env.local: SUPABASE_SERVICE_ROLE_KEY=xxx (not committed)
// Backend only: const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
```

**Impact**: Attacker can bypass all RLS policies.

### 5. Subquery Performance Issues

**Problem**: Complex subqueries in RLS policies can slow queries.

```sql
-- SLOW: Inefficient subquery
CREATE POLICY "Allow users to see images"
ON public.toy_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.toys
    WHERE toys.id = toy_id
    AND (toys.is_active = TRUE OR auth.uid() = toys.user_id)
  )
);

-- FASTER: Use indexed columns
-- Ensure indexes on toy_id and toys.id
CREATE INDEX idx_toy_images_toy_id ON public.toy_images(toy_id);
CREATE INDEX idx_toys_user_active ON public.toys(user_id, is_active);
```

**Impact**: Queries slow down, especially with large datasets.

## Troubleshooting

### Issue: "Policy violation" or 403 Forbidden

**Cause**: RLS policy denied the operation.

**Debug Steps**:

1. Check if RLS is enabled:
   ```sql
   SELECT * FROM pg_tables
   WHERE tablename = 'profiles'
   AND rowsecurity = true;
   ```

2. List all policies on a table:
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'profiles';
   ```

3. Check auth.uid() in policy:
   ```sql
   -- In Supabase Studio, run as a logged-in user:
   SELECT auth.uid();  -- Should return your user UUID
   ```

4. Test policy with raw SQL:
   ```sql
   -- As a user, try:
   SELECT * FROM profiles WHERE auth.uid() = user_id;

   -- With service role, try:
   SET ROLE "authenticated";  -- Switch role
   SELECT * FROM profiles;
   ```

### Issue: Service role operations not working

**Cause**: Not using service role key or using wrong key.

**Solution**:
```typescript
// Always use service role key for backend operations
const serviceClient = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Fetch all profiles (bypass RLS)
const { data } = await serviceClient.from('profiles').select('*');
```

### Issue: Unauthenticated users can see data they shouldn't

**Cause**: RLS not enabled or policy allows public access.

**Solution**:
```sql
-- Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verify policies don't allow NULL auth.uid()
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Test as unauthenticated:
-- The client has no JWT, auth.uid() returns NULL
-- Policies should deny access
```

### Issue: JOIN operations return unexpected empty results

**Cause**: RLS on joined table blocks access.

**Solution**:
```sql
-- RLS is enforced on all tables in a query
-- If you join profiles with toys:
SELECT * FROM toys
JOIN profiles ON toys.user_id = profiles.user_id
WHERE toys.id = ?;

-- RLS on profiles requires: auth.uid() = user_id
-- But toys also has RLS
-- Result might be empty due to interaction of both policies

-- Debug by testing tables separately:
SELECT * FROM toys WHERE id = ?;        -- Works?
SELECT * FROM profiles WHERE user_id = ?;  -- Works?
SELECT * FROM ... JOIN ...;  -- Now try JOIN
```

## Security Checklist

Before deploying to production:

- [ ] All 7 tables have RLS enabled
- [ ] All policies tested with multiple users
- [ ] Service role key not exposed to frontend
- [ ] Immutable tables have no UPDATE/DELETE policies
- [ ] Financial data (tickets) is user-isolated
- [ ] GDPR compliance records are immutable
- [ ] Unauthenticated requests return appropriate 403s
- [ ] Edge cases tested (NULL values, concurrent updates)
- [ ] Performance verified (no slow subqueries)
- [ ] All tests passing in CI/CD pipeline

## Performance Considerations

### Index Recommendations

```sql
-- For user_id filters
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_toys_user_id ON public.toys(user_id);
CREATE INDEX idx_exchanges_requester_id ON public.exchanges(requester_id);
CREATE INDEX idx_exchanges_owner_id ON public.exchanges(owner_id);
CREATE INDEX idx_consent_records_user_id ON public.consent_records(user_id);
CREATE INDEX idx_ticket_transactions_user_id ON public.ticket_transactions(user_id);

-- For subqueries in RLS policies
CREATE INDEX idx_toys_id_user_active ON public.toys(id, user_id, is_active);
CREATE INDEX idx_toy_images_toy_id ON public.toy_images(toy_id);
```

### Query Optimization

```typescript
// SLOW: Multiple separate queries
const profile = await client.from('profiles').select('*').single();
const tickets = await client.from('tickets').select('*').single();
const toys = await client.from('toys').select('*').eq('user_id', userId);

// FASTER: Combine with single query (if RLS allows)
const user = await client
  .from('profiles')
  .select('*, tickets(total_balance), toys(*)')
  .single();
```

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Reference](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- Test file: `/tests/security/rls-policies.test.ts`
- Helper utilities: `/tests/security/rls-test-helpers.ts`
- Migration file: `/supabase/migrations/20241114_0007_create_rls_policies.sql`

## Conclusion

RLS policies form the foundation of Toy-for-Toy's security model. By enforcing data access at the database level, we ensure that even if the application layer is compromised, user data remains protected. Regular security testing and monitoring of RLS policies are essential for maintaining platform security.

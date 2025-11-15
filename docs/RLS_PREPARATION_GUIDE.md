# RLS Preparation Guide

**Document Version:** 1.0
**Task:** P1-W1-SETUP-002 (Preparation for P1-W2-RLS-003)
**Database:** PostgreSQL 14+ (Supabase)
**Status:** RLS Enabled (Deny by Default) - Policies Pending

## Overview

This guide documents the Row-Level Security (RLS) foundation and provides templates for policies that will be created in task P1-W2-RLS-003.

## Current State

RLS has been **ENABLED** on 6 tables with **DENY BY DEFAULT** security posture:

- `profiles` - User account data
- `tickets` - Ticket wallet
- `ticket_transactions` - Audit trail
- `toys` - Toy listings
- `exchanges` - Exchange transactions
- `consent_records` - GDPR compliance

This means:
- All tables reject all access by default
- Service role (admin key) bypasses RLS entirely
- No authenticated users can read/write until policies are created
- Application will return 403 Forbidden until P1-W2-RLS-003 creates policies

## RLS Security Architecture

### Authentication Context

RLS policies use `auth.uid()` to identify current user:

```sql
-- Get current authenticated user's UUID
auth.uid() → UUID

-- Get current authentication role
auth.role() → 'authenticated' | 'anon' | 'service_role'

-- Get full JWT token claims
auth.jwt() → JSON object
```

### Policy Types

Every RLS policy has:

```sql
CREATE POLICY policy_name
  ON table_name
  FOR action           -- SELECT, INSERT, UPDATE, DELETE
  USING (expression)   -- Check condition for existence
  WITH CHECK (expression) -- Check condition for modification
;
```

**Explanation:**

- `FOR action`: Which SQL operation is controlled
- `USING`: Condition checked when reading/deleting (must return TRUE to allow)
- `WITH CHECK`: Condition checked when writing/updating (must return TRUE to allow)

### Policy Evaluation

```
SELECT permission:  USING (condition) must be TRUE
INSERT permission:  WITH CHECK (condition) must be TRUE
UPDATE permission:  USING (OLD row) AND WITH CHECK (NEW row) must be TRUE
DELETE permission:  USING (condition) must be TRUE
```

Example: User updates own profile

```sql
-- RLS policy
CREATE POLICY "users_can_update_own_profile" ON profiles
FOR UPDATE
USING (auth.uid() = user_id)        -- Check OLD row
WITH CHECK (auth.uid() = user_id);  -- Check NEW row

-- User tries:
UPDATE profiles SET full_name = 'John' WHERE user_id = 'abc-123';

-- Evaluation:
1. USING check: Is auth.uid() = profiles.user_id in OLD row? YES → allow read
2. WITH CHECK: Is auth.uid() = profiles.user_id in NEW row? YES → allow write
3. Result: UPDATE succeeds
```

---

## Policy Templates by Table

### 1. PROFILES Table

**Purpose:** User account data (private, user-only access)

**Requirements:**
- Users read their own profile only
- Users update their own profile only
- Service role (admin) has full access (automatic)

**Policies to Create:**

```sql
-- 1.1: User can read own profile
CREATE POLICY "users_own_profile_select"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 1.2: User can update own profile (all columns)
CREATE POLICY "users_own_profile_update"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 1.3: User cannot delete own profile (delete disabled)
-- (No DELETE policy → no one can delete except via CASCADE)

-- 1.4: Admin (service role) has full access (automatic via service_role bypass)
```

**Testing:**

```sql
-- As authenticated user, should see own profile
SELECT * FROM profiles WHERE user_id = auth.uid();

-- As authenticated user, should NOT see other profiles
SELECT * FROM profiles WHERE user_id != auth.uid();  -- Returns 0 rows

-- As service role (admin), sees all
-- (When using SUPABASE_SERVICE_ROLE_KEY)
```

---

### 2. TICKETS Table

**Purpose:** Ticket wallet (private, user-only access)

**Requirements:**
- Users read/update only their own ticket balance
- Tickets are frozen during exchanges (system-controlled)
- Audit trail is immutable (see ticket_transactions)

**Policies to Create:**

```sql
-- 2.1: User can read own ticket balance
CREATE POLICY "users_own_tickets_select"
  ON public.tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2.2: User can update own ticket balance
-- (Careful: In practice, only backend should update)
CREATE POLICY "users_own_tickets_update"
  ON public.tickets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2.3: User cannot insert/delete tickets (system-controlled)
-- (No INSERT/DELETE policies → disabled)
```

**Testing:**

```sql
-- Get own balance
SELECT total_balance, frozen_listing_tickets, frozen_exchange_tickets
FROM tickets
WHERE user_id = auth.uid();

-- Cannot see other users' balances
SELECT * FROM tickets WHERE user_id != auth.uid();  -- Returns 0 rows
```

**Backend Usage (Service Role):**

```typescript
// Only backend should update tickets (uses service role key)
const { data } = await supabase.from('tickets')
  .update({ frozen_listing_tickets: 1 })
  .eq('user_id', user_id)
  .select();
```

---

### 3. TICKET_TRANSACTIONS Table

**Purpose:** Immutable audit trail (read-only, user-private)

**Requirements:**
- Users read only their own transaction history
- No writes allowed (system-controlled, insert via Edge Functions)
- Complete audit trail for disputes

**Policies to Create:**

```sql
-- 3.1: User can read own transactions only
CREATE POLICY "users_own_transactions_select"
  ON public.ticket_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3.2: No INSERT/UPDATE/DELETE (system-controlled)
-- (No other policies → frontend cannot insert)
```

**Testing:**

```sql
-- Get own transaction history
SELECT * FROM ticket_transactions
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Cannot see other users' transactions
SELECT * FROM ticket_transactions
WHERE user_id != auth.uid();  -- Returns 0 rows
```

**Backend Usage (Service Role):**

```typescript
// Only Edge Functions/backend insert transactions
const { data } = await supabase.from('ticket_transactions')
  .insert({
    user_id: user_id,
    transaction_type: 'listing_created',
    amount: -1,
    reference_id: toy_id
  });
```

---

### 4. TOYS Table

**Purpose:** Public toy listings (public read, owner write)

**Requirements:**
- Everyone can read active toys (discovery)
- Only owner can modify/delete own toys
- Deleted toys hidden from view (soft delete via is_active flag)

**Policies to Create:**

```sql
-- 4.1: Everyone can read active toys
CREATE POLICY "public_can_read_active_toys"
  ON public.toys
  FOR SELECT
  USING (is_active = TRUE);

-- 4.2: Owner can read own toys (including inactive)
CREATE POLICY "owner_can_read_own_toys"
  ON public.toys
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4.3: Owner can insert new toys
CREATE POLICY "owner_can_create_toys"
  ON public.toys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4.4: Owner can update own toys
CREATE POLICY "owner_can_update_own_toys"
  ON public.toys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4.5: Owner can delete own toys (soft delete via is_active flag)
CREATE POLICY "owner_can_delete_own_toys"
  ON public.toys
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Testing:**

```sql
-- Anonymous user: sees only active toys
SELECT * FROM toys WHERE is_active = TRUE;

-- Authenticated owner: sees all own toys
SELECT * FROM toys WHERE user_id = auth.uid();

-- Authenticated owner: can create toys
INSERT INTO toys (user_id, category, description, tags, age_group, condition, postal_code)
VALUES (auth.uid(), 'blocks', 'Lego set', ARRAY[]::TEXT[], '6-8', 'good', '10115');

-- Non-owner: cannot update other's toys
UPDATE toys SET description = 'hacked' WHERE user_id != auth.uid();
-- ERROR: new row violates row-level security policy
```

---

### 5. EXCHANGES Table

**Purpose:** Exchange transactions (requester/owner visibility)

**Requirements:**
- Requester can see/modify own requests
- Owner can see/modify own exchanges
- Neither can see other's exchanges
- System updates status/deadlines

**Policies to Create:**

```sql
-- 5.1: Requester can read own requests
CREATE POLICY "requester_can_read_own_exchanges"
  ON public.exchanges
  FOR SELECT
  USING (auth.uid() = requester_id);

-- 5.2: Owner can read own exchanges
CREATE POLICY "owner_can_read_own_exchanges"
  ON public.exchanges
  FOR SELECT
  USING (auth.uid() = owner_id);

-- 5.3: Requester can insert new exchange requests
CREATE POLICY "requester_can_create_exchange"
  ON public.exchanges
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- 5.4: Both requester and owner can update exchange
-- (For changing status, confirming delivery, etc.)
CREATE POLICY "participants_can_update_exchange"
  ON public.exchanges
  FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = owner_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = owner_id);

-- 5.5: Both can delete exchange (soft delete via status=closed)
CREATE POLICY "participants_can_delete_exchange"
  ON public.exchanges
  FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);
```

**Testing:**

```sql
-- Requester: sees own requests only
SELECT * FROM exchanges WHERE requester_id = auth.uid();

-- Owner: sees own exchanges only
SELECT * FROM exchanges WHERE owner_id = auth.uid();

-- Neither sees other's exchanges
SELECT * FROM exchanges WHERE requester_id != auth.uid() AND owner_id != auth.uid();
-- Returns 0 rows

-- Requester can create new exchange
INSERT INTO exchanges (toy_id, requester_id, owner_id, delivery_method, frozen_requester_tickets)
VALUES ('toy-uuid', auth.uid(), 'owner-uuid', 'in_person', 1);

-- Non-participant cannot update
UPDATE exchanges SET status = 'exchange_confirmed' WHERE owner_id != auth.uid();
-- ERROR: new row violates row-level security policy
```

---

### 6. CONSENT_RECORDS Table

**Purpose:** GDPR compliance audit trail (user-private, immutable)

**Requirements:**
- Users read own consent history only
- Backend creates records (no direct insert from frontend)
- Records cannot be deleted (audit trail)
- Withdrawn consents are marked with `withdrawn_at`

**Policies to Create:**

```sql
-- 6.1: User can read own consent records
CREATE POLICY "users_own_consent_records_select"
  ON public.consent_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- 6.2: User can insert own consent records (for consent forms)
CREATE POLICY "users_own_consent_records_insert"
  ON public.consent_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6.3: User can update (withdraw) own consent
-- (Only withdrawn_at column, not consent_given)
CREATE POLICY "users_own_consent_records_update"
  ON public.consent_records
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND withdrawn_at > timestamp);

-- 6.4: User cannot delete consent (audit trail immutable)
-- (No DELETE policy)
```

**Testing:**

```sql
-- Get own active consents
SELECT * FROM consent_records
WHERE user_id = auth.uid() AND withdrawn_at IS NULL;

-- Withdraw consent (update only)
UPDATE consent_records
SET withdrawn_at = NOW()
WHERE user_id = auth.uid()
  AND consent_type = 'behavioral_analytics'
  AND withdrawn_at IS NULL;

-- Cannot see other users' consents
SELECT * FROM consent_records WHERE user_id != auth.uid();
-- Returns 0 rows
```

---

### 7. TOY_IMAGES Table

**Purpose:** Photo references (no RLS, controlled via toy RLS + Storage RLS)

**Status:** RLS DISABLED

**Reason:**
- Images are controlled by parent toy's `user_id`
- Storage bucket has separate RLS policies
- Including toy_images in toy read/write policies via JOIN is sufficient

**No policies needed for toy_images table itself.**

**Example: Images are accessed via toy queries:**

```sql
-- Get toy with images
SELECT t.*, ti.storage_path, ti.image_order
FROM toys t
LEFT JOIN toy_images ti ON t.id = ti.toy_id
WHERE t.id = 'toy-uuid' AND t.is_active = TRUE;

-- Storage RLS handles who can download actual files
-- Database RLS (via toys) handles metadata access
```

---

## Policy Implementation Checklist (for P1-W2-RLS-003)

### Profiles (6 policies)
- [ ] `users_own_profile_select` - Read own
- [ ] `users_own_profile_update` - Update own
- [ ] Service role bypass (automatic)

### Tickets (3 policies)
- [ ] `users_own_tickets_select` - Read own
- [ ] `users_own_tickets_update` - Update own
- [ ] Service role bypass (automatic)

### Ticket Transactions (1 policy)
- [ ] `users_own_transactions_select` - Read own
- [ ] Service role bypass (automatic)

### Toys (5 policies)
- [ ] `public_can_read_active_toys` - Public read active
- [ ] `owner_can_read_own_toys` - Owner read all own
- [ ] `owner_can_create_toys` - Create
- [ ] `owner_can_update_own_toys` - Update own
- [ ] `owner_can_delete_own_toys` - Delete own

### Exchanges (5 policies)
- [ ] `requester_can_read_own_exchanges` - Requester read
- [ ] `owner_can_read_own_exchanges` - Owner read
- [ ] `requester_can_create_exchange` - Create
- [ ] `participants_can_update_exchange` - Update
- [ ] `participants_can_delete_exchange` - Delete

### Consent Records (3 policies)
- [ ] `users_own_consent_records_select` - Read own
- [ ] `users_own_consent_records_insert` - Insert own
- [ ] `users_own_consent_records_update` - Update/withdraw own

**Total Policies to Create: 23**

---

## Security Considerations

### Service Role Key (Admin Access)

The service role key **bypasses all RLS policies entirely**:

```typescript
// Service role admin client
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // SECRET - never expose
);

// This query ignores all RLS
const { data: all_users } = await admin.from('profiles').select('*');
```

**Use Cases:**
- Backend API routes (`.ts` files, not exposed)
- Admin operations
- Batch processing
- Scheduled jobs (Edge Functions)

**Never expose service role key to frontend.**

### Anon Key (Public Access)

The anon key has limited access (only public reads):

```typescript
// Anon client (safe for frontend)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // OK to expose
);

// Can only read public data (toys with is_active=true)
const { data } = await supabase.from('toys').select('*');
```

### Authenticated User (JWT Token)

Authenticated users get limited access per RLS policies:

```typescript
// Get JWT from session
const { data: { session } } = await supabase.auth.getSession();

// Token provides auth.uid() and auth.role() in RLS policies
// Access controlled by "users_own_*" type policies
```

### Attack Prevention

RLS protects against:

```
1. Direct SQL injection (parametrized queries)
   SELECT * FROM toys WHERE id = ?  -- User can't access other rows

2. Unauthorized data access
   User A's JWT can only access User A's profile

3. Horizontal privilege escalation
   User can't escalate to see admin data

4. Vertical privilege escalation
   Requires service role key (kept secure)
```

---

## Testing RLS Policies

### Unit Testing Pattern

```typescript
// Test: User can read own profile
async function testProfileReadOwn() {
  const { data, error } = await supabase_user_a
    .from('profiles')
    .select('*')
    .eq('user_id', user_a.id)
    .single();

  expect(data).toBeDefined();
  expect(error).toBeNull();
}

// Test: User cannot read other's profile
async function testProfileReadOther() {
  const { data, error } = await supabase_user_a
    .from('profiles')
    .select('*')
    .eq('user_id', user_b.id)
    .single();

  expect(data).toBeNull();
  expect(error).toBeDefined();  // 403 Forbidden
}
```

### Integration Testing Pattern

```typescript
// Test: Exchange visible to both parties only
async function testExchangeVisibility() {
  // Create exchange
  const { data: exchange } = await supabase_requester
    .from('exchanges')
    .insert({ requester_id: user_a, owner_id: user_b, ... })
    .single();

  // Requester can see it
  const { data: from_requester } = await supabase_a
    .from('exchanges')
    .select('*')
    .eq('id', exchange.id)
    .single();
  expect(from_requester).toBeDefined();

  // Owner can see it
  const { data: from_owner } = await supabase_b
    .from('exchanges')
    .select('*')
    .eq('id', exchange.id)
    .single();
  expect(from_owner).toBeDefined();

  // Third party cannot see it
  const { data: from_other } = await supabase_c
    .from('exchanges')
    .select('*')
    .eq('id', exchange.id)
    .single();
  expect(from_other).toBeNull();
}
```

---

## Common Pitfalls

### Pitfall 1: Forgetting WITH CHECK

```sql
-- BAD: Only checks old row, not new
CREATE POLICY "bad_update"
  ON toys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- GOOD: Checks both old and new rows
CREATE POLICY "good_update"
  ON toys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Pitfall 2: Too Permissive Policies

```sql
-- BAD: Allows anyone to update anyone's toy
CREATE POLICY "bad"
  ON toys
  FOR UPDATE
  WITH CHECK (TRUE);

-- GOOD: Only owner can update
CREATE POLICY "good"
  ON toys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Pitfall 3: Missing Service Role Bypass

Service role is **automatic** (no need to create a policy). Just don't use it in frontend code:

```typescript
// WRONG: Using service role in frontend
const admin = createClient(URL, SERVICE_ROLE_KEY);
// Don't do this!

// RIGHT: Use service role only in backend
// server-side-only.ts or Edge Function
const admin = createClient(URL, SERVICE_ROLE_KEY);
```

### Pitfall 4: Not Testing Policy Combinations

```sql
-- BAD: Created SELECT policy but forgot INSERT
CREATE POLICY "select_only" ON toys
  FOR SELECT USING (is_active = TRUE);
-- Now nobody can create toys!

-- GOOD: Provide all necessary operations
CREATE POLICY "select_active" ON toys
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "owner_create" ON toys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update" ON toys
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## Next Steps for P1-W2-RLS-003

1. **Create 23 RLS policies** using templates above
2. **Test each policy** with authenticated users
3. **Test policy combinations** (SELECT + INSERT + UPDATE)
4. **Test service role bypass** for backend operations
5. **Test cross-table policies** (e.g., exchanges with toys)
6. **Load test** with realistic data volumes
7. **Document verified behaviors** for developers

---

**Document End**

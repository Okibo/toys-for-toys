# Task P1-W1-SETUP-003: Supabase Row-Level Security (RLS) Policies

## Task ID
P1-W1-SETUP-003

## Epic
Phase 1 Week 1-2: Project Setup & Authentication

## Title
Supabase Row-Level Security (RLS) Policies

## Description
Implement Row-Level Security (RLS) policies for all database tables to enforce data isolation at the database layer. RLS is critical for security - users can only access/modify their own data. Policies must be comprehensive and tested thoroughly.

## Acceptance Criteria

### RLS Policy: Profiles Table
- [ ] Enable RLS on `public.profiles`
- [ ] SELECT policy: Users can only read their own profile AND read public profile fields of other users (for display purposes)
- [ ] UPDATE policy: Users can only update their own profile (email, language, postal code, verified status)
- [ ] DELETE policy: Deny (profiles deleted only via GDPR deletion workflow)
- [ ] INSERT policy: Deny direct inserts; only via auth.users trigger

### RLS Policy: Tickets Table
- [ ] Enable RLS on `public.tickets`
- [ ] SELECT policy: Users can only read their own ticket balance
- [ ] UPDATE policy: Deny direct updates; updates only via database triggers
- [ ] INSERT policy: Deny direct inserts; only via trigger on new user

### RLS Policy: Toys Table
- [ ] Enable RLS on `public.toys`
- [ ] SELECT policy: All authenticated users can read active toys (is_active = true) + own inactive toys
- [ ] INSERT policy: Users can insert toys only for themselves
- [ ] UPDATE policy: Users can only update their own toys (category, description, tags, age_group, condition, is_active)
- [ ] DELETE policy: Users can only soft-delete their own toys (update is_active = false)

### RLS Policy: Toy Images
- [ ] Enable RLS on `public.toy_images`
- [ ] SELECT policy: Authenticated users can read images for active toys; can read all images for own toys
- [ ] INSERT policy: Users can insert images only for their own toys
- [ ] UPDATE policy: Users can update image_order only for own toy images
- [ ] DELETE policy: Users can delete only own toy images

### RLS Policy: Exchanges Table
- [ ] Enable RLS on `public.exchanges`
- [ ] SELECT policy: Users can read exchanges where they are requester_id OR owner_id
- [ ] INSERT policy: Authenticated users can insert exchanges (system creates via API)
- [ ] UPDATE policy: Users can update exchanges they're involved in (accept/decline/confirm delivery)
- [ ] DELETE policy: Deny (exchanges archived, not deleted)

### RLS Policy: Consent Records
- [ ] Enable RLS on `public.consent_records`
- [ ] SELECT policy: Users can only read their own consent records
- [ ] INSERT policy: Users can insert own consent records
- [ ] UPDATE policy: Users can only update withdrawn_at field of own records
- [ ] DELETE policy: Deny (records preserved for audit)

### RLS Policy: Ticket Transactions (Audit Log)
- [ ] Enable RLS on `public.ticket_transactions`
- [ ] SELECT policy: Users can only read their own transaction history
- [ ] INSERT policy: Deny direct inserts; system creates via triggers
- [ ] UPDATE policy: Deny (immutable audit log)
- [ ] DELETE policy: Deny (immutable audit log)

### Anonymous/Public Policies
- [ ] Unauthenticated users can SELECT public toy listings (future: for SEO)
- [ ] Unauthenticated users cannot modify any data
- [ ] Public profile view: name, user_score (when ratings exist) only

### Testing RLS Policies
- [ ] Create test users A, B, C
- [ ] User A can see own toys, cannot see/modify User B's toys
- [ ] User A can see User B's active toys but cannot modify them
- [ ] User A can see exchanges where they're involved but not third-party exchanges
- [ ] Attempt direct SQL update (bypass RLS): should fail with "permission denied" error

### RLS Bypass (Admin/Service Role)
- [ ] Document use of service_role key for:
  - Initial data seeding
  - Automated triggers/functions
  - Admin operations (future)
- [ ] Ensure service_role key is never exposed in frontend code

## Estimated Hours
8-10 hours

## Dependencies
- Task P1-W1-SETUP-002 (Core database schema must exist)

## Testing Requirements

### Policy Verification Tests
- [ ] Enable RLS: `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`
- [ ] Create test users via Supabase Auth
- [ ] Test SELECT policies:
  - User A queries own profile: should return 1 row
  - User A queries User B profile: should return 1 row (public fields only)
  - User A queries all toys: should return all active toys
  - User A queries own toys: should return all (active + inactive)
  - Unauthenticated request: should return public data only
- [ ] Test UPDATE policies:
  - User A updates own profile: should succeed
  - User A updates User B profile: should fail with 403 Forbidden
  - Direct SQL UPDATE bypassing RLS: should succeed (service role)
- [ ] Test INSERT policies:
  - User A inserts toy: should succeed
  - User A inserts toy for User B: should fail
- [ ] Test DELETE policies:
  - User A deletes own toy: should fail (soft delete only via update)
  - System trigger deletes toy: should succeed (service role)

### Edge Cases
- [ ] Null user_id handling (should not occur with proper auth)
- [ ] Deleted users: ensure no orphaned data accessible
- [ ] Concurrent updates: ensure RLS doesn't cause race conditions

## Database/Schema Changes
No schema changes - only policy additions to existing tables.

## Technology Stack
- PostgreSQL Row-Level Security (ENABLE RLS, CREATE POLICY)
- Supabase Auth (auth.users, auth.uid())
- SQL

## Implementation Notes

### RLS Policy Syntax
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_profile ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY update_own_profile ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Testing Helpers
- Use Supabase Studio: switch between user contexts
- Or use API tests with different JWT tokens
- Document test scenarios in `/tests/rls-policies.test.ts`

### Common Mistakes to Avoid
- Forgetting to ENABLE RLS (tables not RLS-protected by default)
- Overly restrictive policies (blocking legitimate operations)
- Policies with performance issues (avoid complex functions in USING clause)
- Not testing unauthenticated access
- Assuming frontend validation is security (RLS is the actual enforcement)

## Success Metrics
- All tables have RLS enabled
- Users can only access/modify their own data
- System accounts (triggers, Edge Functions) can use service role
- No data leakage between users
- Compliance team verifies security posture

## Related Stories (from PRD)
- Story 1: User Registration (profile RLS)
- Story 2: List a Toy (toy/toy_images RLS)
- Story 5: Initiate Exchange Request (exchange RLS)

## Related Functional Requirements
- FR-AUTH-001: Email/Password Registration (security enforcement)
- Security principle: Data isolation at database layer

## Risk Factors
- Overly permissive policies allowing data leakage (mitigate: thorough testing and code review)
- Policies breaking legitimate functionality (mitigate: comprehensive test coverage)
- Performance issues with complex RLS checks (mitigate: profile slow queries, optimize)

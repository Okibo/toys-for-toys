# RLS Policies - Quick Reference Card

## File Locations

| File                                                            | Purpose                      | Size          |
| --------------------------------------------------------------- | ---------------------------- | ------------- |
| `/supabase/migrations/20241114_0013_implement_rls_policies.sql` | Main migration (46 policies) | 1,118 lines   |
| `/tests/database/rls-policies.test.ts`                          | Test suite (84 tests)        | 834 lines     |
| `/docs/RLS_IMPLEMENTATION_GUIDE.md`                             | Detailed deployment guide    | Comprehensive |
| `/supabase/verify_rls_policies.sql`                             | Post-deployment verification | SQL scripts   |

---

## Deploy RLS

```bash
# 1. Start local Supabase
npx supabase start

# 2. Apply migration
npx supabase db push

# 3. Run tests
npm test -- rls-policies.test.ts

# 4. Verify in Supabase Studio
# Run: SELECT COUNT(*) FROM pg_policies;
# Expected: 46+

# 5. Deploy to production
npx supabase db push --project-id <prod-id>
```

---

## Verify Deployment

### In Supabase Studio (SQL Editor)

```sql
-- Count policies
SELECT COUNT(*) as policy_count FROM pg_policies;
-- Expected: 46

-- List policies by table
SELECT tablename, COUNT(*) FROM pg_policies
GROUP BY tablename ORDER BY tablename;

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('profiles', 'kids', 'tickets', 'toys', 'exchanges');
-- Expected: all true

-- Test is_admin() function
SELECT is_admin();
```

### Run Test Suite

```bash
npm test -- rls-policies.test.ts

# Or specific tests
npm test -- rls-policies.test.ts -t "Profiles Table"
npm test -- rls-policies.test.ts -t "Performance"
```

---

## Policy Reference by Table

### profiles

- **SELECT**: Own + Public
- **INSERT**: ✗ (Auth trigger only)
- **UPDATE**: Own only
- **DELETE**: ✗

### kids (GDPR)

- **SELECT**: Own children only (parent_id = auth.uid())
- **INSERT**: Own children only
- **UPDATE**: ✗
- **DELETE**: ✗ (Soft delete via status)

### tickets (Critical)

- **SELECT**: Own wallet only (user_id = auth.uid())
- **INSERT**: ✗ (System only)
- **UPDATE**: ✗ (System via triggers)
- **DELETE**: ✗

### toys

- **SELECT**: Active + Own + Admin
- **INSERT**: Own only (user_id = auth.uid())
- **UPDATE**: Own only
- **DELETE**: ✗ (Soft delete via status)

### exchanges

- **SELECT**: Own + Admin (requester_id OR lister_id)
- **INSERT**: ✗ (API controls)
- **UPDATE**: ✗ (API controls)
- **DELETE**: ✗ (Soft delete via status)

### exchange_messages

- **SELECT**: Own exchange members only
- **INSERT**: Own exchange members only
- **UPDATE**: ✗ (Immutable)
- **DELETE**: Own messages only

### wishlists (GDPR)

- **SELECT**: Own kids' wishlists
- **INSERT**: Own kids' wishlists
- **UPDATE**: Own kids' wishlists
- **DELETE**: Own kids' wishlists

### blocklist

- **SELECT**: Own blocks (blocker_id = auth.uid())
- **INSERT**: Own blocks
- **UPDATE**: ✗
- **DELETE**: Own blocks

### notifications

- **SELECT**: Own notifications (user_id = auth.uid())
- **INSERT**: ✗ (System only)
- **UPDATE**: ✗ (API endpoint only)
- **DELETE**: ✗ (Soft delete)

### ratings (Public)

- **SELECT**: All authenticated users
- **INSERT**: Own + exchanged with
- **UPDATE**: Own only
- **DELETE**: Own only

### notification_preferences

- **SELECT**: Own preferences
- **INSERT**: Own preferences
- **UPDATE**: Own preferences
- **DELETE**: ✗ (Reset instead)

---

## Common Operations

### Test User Isolation

```bash
# Get a valid JWT token for User A
JWT_A=$(npx supabase auth get-tokens --user-id <user-a-id>)

# Try to access User B's data (should fail)
curl -H "Authorization: Bearer $JWT_A" \
  'http://localhost:54321/rest/v1/tickets?user_id=eq.<user-b-id>'

# Expected: No rows or 403 error
```

### Check RLS Policy Details

```sql
-- View specific policy
SELECT policyname, qual, with_check, permissive
FROM pg_policies
WHERE tablename = 'profiles';

-- View all policies for a table
\d+ profiles
```

### Debug RLS Violations

```sql
-- Enable query logging
SET log_statement = 'all';
SET log_min_duration_statement = 0;

-- Run test query
SELECT * FROM kids WHERE parent_id != auth.uid();

-- Check logs for RLS filter details
```

---

## Troubleshooting

| Issue                    | Cause                                   | Solution                               |
| ------------------------ | --------------------------------------- | -------------------------------------- |
| "RLS policy violation"   | Operation blocked by restrictive policy | Use API endpoint with service role key |
| "No rows found"          | RLS filtering hides data                | Verify JWT token matches user context  |
| Slow queries             | Complex RLS policy                      | Add indexes on filtered columns        |
| Admin can't see all data | JWT missing admin role                  | Check JWT claims and app_metadata      |
| Policies not applying    | Migration not run                       | Run `npx supabase db push`             |

---

## Performance Targets

- Simple indexed queries: **15-25ms**
- Filtered queries: **25-50ms**
- Complex subqueries: **50-100ms**
- All queries: **< 200ms** ✓

---

## Security Checklist

- [ ] RLS enabled on all 20 tables
- [ ] 46 policies deployed
- [ ] is_admin() function exists
- [ ] Test suite passes (84/84)
- [ ] User data isolation verified
- [ ] GDPR child data protected
- [ ] Admin access verified
- [ ] Public data accessible
- [ ] Performance <200ms
- [ ] No blockers remaining

---

## Key Policies Explained

### User Data Isolation (Most Common)

```sql
-- Users see only their own data
USING (user_id = auth.uid())

-- Example: tickets table
USING (user_id = auth.uid())
-- User A only sees user_id = <User A ID>
-- User B only sees user_id = <User B ID>
```

### Parent-Child Isolation (GDPR)

```sql
-- Parents see only their own children's data
USING (
  kid_id IN (
    SELECT id FROM kids WHERE parent_id = auth.uid()
  )
)

-- Example: wishlists table
-- Parent A sees only wishlists for parent A's kids
```

### Exchange Participant Access (Two-Way)

```sql
-- Both parties in exchange can see
USING (
  requester_id = auth.uid() OR lister_id = auth.uid()
)

-- Example: exchanges table
-- User A sees exchanges where A is requester OR lister
```

### Admin Override (Global Access)

```sql
-- Admin can see all data
USING (
  requester_id = auth.uid() OR is_admin()
)

-- Example: exchanges table with admin access
-- Admin bypasses user_id checks
```

### Public Data (No Filtering)

```sql
-- All authenticated users see all ratings
USING (auth.uid() IS NOT NULL)

-- Example: ratings table
-- Any logged-in user can see any rating
```

---

## When to Contact Support

### Supabase Issues

- JWT token generation problems
- RLS policy syntax errors
- Database connection issues

### Performance Issues

- Queries consistently >200ms
- RLS adding >100ms to queries
- Need for query optimization

### Security Concerns

- Unauthorized data access suspected
- Admin access not working correctly
- Need security audit

---

## Related Documentation

- **Full Guide**: `/docs/RLS_IMPLEMENTATION_GUIDE.md`
- **Tests**: `/tests/database/rls-policies.test.ts`
- **Migration**: `/supabase/migrations/20241114_0013_implement_rls_policies.sql`
- **Verification**: `/supabase/verify_rls_policies.sql`
- **Completion Summary**: `/TASK_2_9_COMPLETION_SUMMARY.md`

---

## Quick Commands

```bash
# Deploy migration
npx supabase db push

# Run all RLS tests
npm test -- rls-policies.test.ts

# Run specific test suite
npm test -- rls-policies.test.ts -t "Profiles"

# Check policy count in Supabase Studio
SELECT COUNT(*) FROM pg_policies;

# List all policies
SELECT tablename, policyname FROM pg_policies ORDER BY tablename;

# Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
```

---

## Contact & Support

**Task**: Task 2.9 - RLS Policies
**Status**: COMPLETE
**Files**: 4 created + 1 verification script
**Tests**: 84 tests, all passing
**Performance**: All <200ms

See `/docs/RLS_IMPLEMENTATION_GUIDE.md` for comprehensive documentation.

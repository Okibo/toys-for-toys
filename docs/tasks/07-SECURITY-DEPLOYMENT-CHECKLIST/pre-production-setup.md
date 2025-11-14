# Pre-Production Security Setup Checklist

**Status:** Required before deploying Task 2.7-2.9 (RLS & Security) to production

**Effort:** 2-3 hours

**Dependencies:** Tasks 2.7, 2.8, 2.9 completed and in develop branch

---

## Overview

The RLS policies and security verification layer require setup tasks before production deployment. This checklist covers database initialization, configuration, and verification steps.

---

## Pre-Deployment Tasks

### Task 1: Initialize Admin Users

**Description:** Populate the `admin_users` table with verified administrators who can perform sensitive operations (dispute resolution, etc.)

**Steps:**

1. **Identify admins:**
   - List of user emails or user IDs who should be admins
   - Verify their profiles exist in `profiles` table

2. **Populate admin_users table:**

   ```sql
   INSERT INTO public.admin_users (user_id, verified_at, is_active)
   VALUES
     (UUID_OF_USER_1, NOW(), true),
     (UUID_OF_USER_2, NOW(), true);
   ```

3. **Verify in Supabase Studio:**
   - Check `admin_users` table has entries
   - Verify `is_active = true` for production admins

**Acceptance Criteria:**

- ✅ At least 2 verified admins in system
- ✅ All admins have active profiles
- ✅ Verified timestamps are in the past
- ✅ All `is_active = true`

---

### Task 2: Restrict Service Role Key Access

**Description:** Limit service role key usage to backend systems only (API, Edge Functions, cron jobs)

**Steps:**

1. **Document current service role key usage:**
   - Which systems/services have the key?
   - Are they all authorized?

2. **Implement key rotation:**
   - Rotate service role key in Supabase dashboard
   - Update all systems with new key
   - Verify no old key usage in logs

3. **Restrict key access:**
   - Only deploy systems should have key
   - Never expose key in client code
   - Use environment variables (not hardcoded)
   - Rotate quarterly or after team changes

4. **Set up key monitoring:**
   - Enable API logs in Supabase
   - Monitor service role operations
   - Alert on unexpected operations

**Acceptance Criteria:**

- ✅ Service role key rotated
- ✅ Only authorized systems have key
- ✅ All systems use environment variables
- ✅ Monitoring enabled
- ✅ Team trained on key security

---

### Task 3: Configure Environment Variables

**Description:** Set up environment variables for security verification layer

**Required Variables:**

```env
# .env.local or Vercel dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # Restricted access only

# Audit logging configuration
AUDIT_LOG_ENABLED=true
AUDIT_LOG_LEVEL=INFO  # INFO, WARNING, ERROR, CRITICAL

# Admin verification
ENABLE_SECONDARY_ADMIN_VERIFICATION=true
ADMIN_VERIFICATION_TIMEOUT_MS=5000

# Rate limiting (prevent brute force attacks)
RATE_LIMIT_ATTEMPTS=10
RATE_LIMIT_WINDOW_MS=60000
```

**Steps:**

1. Set environment variables in deployment platform (Vercel, Docker, etc.)
2. Verify in local `.env.local` for testing
3. Document sensitive variables in team wiki (not in code)

**Acceptance Criteria:**

- ✅ All variables set in production
- ✅ Service role key is restricted
- ✅ Audit logging enabled
- ✅ Admin verification enabled
- ✅ No secrets in git

---

### Task 4: Test Critical Operations End-to-End

**Description:** Verify all security verification layer is working correctly before production

**Tests to Run:**

```bash
# Unit tests for verification functions
npm test -- lib/security/verify-critical-ops.test.ts

# API endpoint tests
npm test -- tests/api/profiles.test.ts
npm test -- tests/security/critical-operations.test.ts

# Integration tests with real database
npm test -- --testPathPattern=integration

# Manual testing (see below)
```

**Manual Testing Scenarios:**

1. **Exchange Creation:**
   - User A lists toy
   - User B requests toy (should succeed)
   - User B (different session) tries to request as A (should fail)
   - User with insufficient tickets requests (should fail with 402)

2. **Dispute Resolution:**
   - Non-admin tries to resolve dispute (should fail with 403)
   - Admin resolves dispute (should succeed)
   - Try to resolve again (should fail with 409 - already resolved)

3. **Rating Creation:**
   - Try to rate before exchange completion (should fail)
   - Create rating after completion (should succeed)
   - Try to create second rating for same exchange (should fail)
   - Verify rating visibility requires both parties to rate

4. **Concurrent Operations:**
   - 2 users request same toy (escrow should handle one)
   - 2 admins resolve same dispute (should fail on second)
   - Concurrent ticket transfers (balance should not exceed original)

**Acceptance Criteria:**

- ✅ All unit tests passing
- ✅ All API tests passing
- ✅ Manual scenarios work as expected
- ✅ Error codes are correct (402, 403, 409, etc.)
- ✅ Audit logs record all operations

---

### Task 5: Set Up Monitoring & Alerts

**Description:** Configure alerts for suspicious patterns in audit logs

**Setup:**

1. **Create Supabase alert webhook:**

   ```
   Monitor: audit_log table INSERT events
   Alert on:
   - status = 'failure' AND event_type = 'verification_failed'
   - Multiple failures in short time window
   - Errors with code '42501' (RLS violations)
   ```

2. **Configure alert channels:**
   - Email to security team
   - Slack channel #security-alerts
   - PagerDuty for critical events

3. **Set alert thresholds:**
   - 10+ failed verifications per user/hour → WARNING
   - Multiple admin operations by non-admin JWT → CRITICAL
   - Insufficient funds errors (402) → INFO (track patterns)

**Acceptance Criteria:**

- ✅ Monitoring configured in Supabase
- ✅ Alert channels working
- ✅ Test alert received
- ✅ Team trained on alert response

---

### Task 6: Run Security Audit Verification Script

**Description:** Verify all RLS policies are enabled and working

**Script:** `supabase/verify_rls_policies.sql`

**Steps:**

1. Connect to production database
2. Run script: `psql -f supabase/verify_rls_policies.sql`
3. Review output:

   ```
   ✓ RLS enabled on profiles
   ✓ RLS enabled on kids
   ✓ RLS enabled on tickets
   ... (all 20 tables)
   ```

4. Check for any disabled policies:
   - If found, run enable script
   - Investigate why they were disabled

**Acceptance Criteria:**

- ✅ RLS enabled on all 20 tables
- ✅ No missing policies
- ✅ No policy syntax errors
- ✅ Test queries return expected rows

---

## Post-Deployment Verification (Day 1)

Once deployed to production:

### Task 7: Monitor First 24 Hours

**Steps:**

1. **Check audit logs:**

   ```sql
   SELECT * FROM public.audit_log
   WHERE timestamp > NOW() - INTERVAL '24 hours'
   ORDER BY timestamp DESC
   LIMIT 100;
   ```

2. **Verify no unusual errors:**
   - No unexpected 403 (permission denied)
   - No unexpected 409 (race conditions)
   - No RLS violations (42501)

3. **Check admin operations:**
   - Is secondary admin verification working?
   - Are admin operations being logged?

4. **Verify performance:**
   - Query times < 200ms
   - No timeouts
   - No N+1 query patterns

**Acceptance Criteria:**

- ✅ No unexpected errors
- ✅ Operations logging correctly
- ✅ Performance acceptable
- ✅ No security alerts

---

## Rollback Plan

If issues arise in production:

1. **Disable RLS temporarily:**

   ```sql
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.kids DISABLE ROW LEVEL SECURITY;
   -- ... repeat for all tables
   ```

2. **Disable verification layer:**

   ```env
   ENABLE_SECONDARY_ADMIN_VERIFICATION=false
   AUDIT_LOG_ENABLED=false
   ```

3. **Investigate issues:**
   - Check audit logs
   - Run manual tests
   - Review code changes

4. **Fix issues:**
   - Create hotfix branch
   - Deploy patched version
   - Re-enable features incrementally

5. **Document incident:**
   - What went wrong
   - How it was fixed
   - Prevention for future

---

## Team Responsibilities

**Database Admin:**

- Task 1: Initialize admin users
- Task 2: Service role key rotation
- Task 6: RLS verification
- Task 7: Monitor first 24 hours

**DevOps/Backend:**

- Task 3: Environment variables
- Task 5: Monitoring setup
- Task 2: Key rotation automation

**QA/Testing:**

- Task 4: End-to-end testing
- Task 7: Performance verification

**Security:**

- Task 2: Key access restrictions
- Task 5: Alert configuration
- Task 7: Incident response

---

## Resources

- [RLS Implementation Guide](../RLS_IMPLEMENTATION_GUIDE.md)
- [Security Verification Guide](../SECURITY_VERIFICATION.md)
- [Performance Monitoring Guide](../PERFORMANCE_MONITORING.md)
- [Audit Logging Documentation](../SECURITY_VERIFICATION.md#audit-logging)

---

## Sign-Off

- [ ] All 7 tasks completed
- [ ] Security team approval
- [ ] Database admin sign-off
- [ ] Performance verified
- [ ] Team trained

**Estimated Timeline:** 2-3 hours setup, 24 hours monitoring

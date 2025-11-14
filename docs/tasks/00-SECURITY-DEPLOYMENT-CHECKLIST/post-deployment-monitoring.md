# Post-Deployment Monitoring & Maintenance

**Status:** Required after production deployment of Tasks 2.7-2.9

**Frequency:** Daily (first week), then ongoing weekly reviews

**Dependencies:** Pre-Production Setup completed

---

## Overview

After deploying RLS policies and security verification layer, continuous monitoring ensures system health, fraud detection, and performance optimization.

---

## Daily Monitoring Tasks (First Week)

### Task 1: Review Audit Logs

**Frequency:** Daily, every morning

**Steps:**

1. **Query recent failures:**

   ```sql
   SELECT
     event_type,
     COUNT(*) as failure_count,
     status,
     error_code
   FROM public.audit_log
   WHERE
     timestamp > NOW() - INTERVAL '24 hours'
     AND status = 'failure'
   GROUP BY event_type, status, error_code
   ORDER BY failure_count DESC;
   ```

2. **Investigate patterns:**
   - Are failures expected (invalid input)?
   - Or unexpected (security issues)?
   - Any suspicious user IDs?

3. **Verify no RLS violations:**

   ```sql
   SELECT * FROM public.audit_log
   WHERE error_code = '42501'  -- RLS policy violation
   AND timestamp > NOW() - INTERVAL '24 hours';
   ```

   **Action:** If found, investigate which RLS policy is blocking and why.

4. **Check unauthorized attempts:**

   ```sql
   SELECT * FROM public.audit_log
   WHERE event_type = 'unauthorized_attempt'
   AND timestamp > NOW() - INTERVAL '24 hours'
   ORDER BY timestamp DESC;
   ```

   **Action:** If found, verify user credentials are secure.

**Acceptance Criteria:**

- ✅ No unexpected RLS violations
- ✅ No unauthorized access attempts
- ✅ Failure patterns match expected behavior
- ✅ Documented any anomalies

---

### Task 2: Check Admin Operations

**Frequency:** Daily

**Steps:**

1. **Verify admin operations logged:**

   ```sql
   SELECT * FROM public.audit_log
   WHERE event_type LIKE '%admin%'
   AND timestamp > NOW() - INTERVAL '24 hours'
   ORDER BY timestamp DESC;
   ```

2. **Verify secondary admin verification working:**
   - Are disputed resolutions being logged?
   - Is admin user verified in `admin_users` table?
   - Check for any failed verifications

3. **Investigate unusual admin activity:**
   - Multiple failed verification attempts
   - Operations outside business hours
   - Large volume of operations

**Acceptance Criteria:**

- ✅ All admin operations logged
- ✅ Secondary verification working
- ✅ No suspicious patterns

---

### Task 3: Monitor Performance

**Frequency:** Daily

**Steps:**

1. **Check query performance:**

   ```sql
   SELECT
     query,
     calls,
     mean_exec_time,
     max_exec_time
   FROM pg_stat_statements
   WHERE query LIKE '%wishlist%'
     OR query LIKE '%exchange%'
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Verify <200ms target met:**
   - Wishlist queries: <200ms
   - Exchange queries: <200ms
   - Profile queries: <100ms

3. **Look for N+1 query patterns:**
   - Repeated same query?
   - Could be batched differently?

**Action if >200ms:**

- Check if optimization migration applied
- Consider materialized view refresh
- Check for increased data volume
- Alert database admin

**Acceptance Criteria:**

- ✅ All queries <200ms
- ✅ No N+1 patterns
- ✅ Response times consistent

---

## Weekly Maintenance Tasks

### Task 4: Analyze Audit Logs for Patterns

**Frequency:** Weekly (Monday morning recommended)

**Steps:**

1. **Generate weekly failure report:**

   ```sql
   SELECT
     DATE_TRUNC('day', timestamp) as day,
     event_type,
     COUNT(*) as failures,
     COUNT(DISTINCT user_id) as unique_users
   FROM public.audit_log
   WHERE
     status = 'failure'
     AND timestamp > NOW() - INTERVAL '7 days'
   GROUP BY DATE_TRUNC('day', timestamp), event_type
   ORDER BY day DESC, failures DESC;
   ```

2. **Look for trends:**
   - Are failures increasing?
   - Same user repeatedly failing?
   - Same operation type failing?

3. **Identify patterns:**
   - Brute force attempts (many failures, same user)
   - Abuse pattern (many failures, different users)
   - System issue (many failures, same operation)

4. **Document findings:**
   - Anomalies found
   - Severity level
   - Recommended action

**Acceptance Criteria:**

- ✅ Report generated
- ✅ Anomalies documented
- ✅ Action items assigned

---

### Task 5: Test Disaster Recovery

**Frequency:** Weekly

**Purpose:** Ensure audit logs can be restored if corrupted

**Steps:**

1. **Backup audit logs:**

   ```bash
   pg_dump -t public.audit_log DATABASE_URL > audit_logs_backup.sql
   ```

2. **Verify backup integrity:**
   - Check file size > 0
   - Check contains INSERT statements
   - Test restore to staging DB

3. **Document backup location:**
   - Where backups stored
   - Retention policy (365 days?)
   - Recovery procedure

**Acceptance Criteria:**

- ✅ Backup created
- ✅ Backup verified
- ✅ Recovery tested

---

### Task 6: Review RLS Policies

**Frequency:** Weekly

**Steps:**

1. **Verify no policies disabled:**

   ```sql
   SELECT tablename, policyname, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```

2. **Check for policy conflicts:**
   - Multiple policies on same table?
   - Do they conflict?
   - Is logic clear?

3. **Test policy effectiveness:**
   - User A can access own data? YES
   - User A can access User B data? NO
   - Admin can access all? YES

**Action if issues found:**

- Investigate why policy disabled
- Review recent schema changes
- Re-enable and test
- Document incident

**Acceptance Criteria:**

- ✅ All policies enabled
- ✅ No conflicts
- ✅ Tests passing

---

## Monthly Reviews

### Task 7: Performance Optimization

**Frequency:** Monthly (end of month)

**Steps:**

1. **Analyze slow query trends:**
   - Which queries slow down over time?
   - Data growth impacting performance?
   - Need for additional indexes?

2. **Review index usage:**

   ```sql
   SELECT
     schemaname,
     tablename,
     indexname,
     idx_scan,
     idx_tup_read,
     idx_tup_fetch
   FROM pg_stat_user_indexes
   ORDER BY idx_scan DESC;
   ```

3. **Identify unused indexes:**

   ```sql
   SELECT
     schemaname,
     tablename,
     indexname,
     idx_scan
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0
   AND indexname NOT LIKE '%pkey%';
   ```

4. **Optimize:**
   - Drop unused indexes
   - Add new indexes if needed
   - Consider materialized view refresh schedule

**Acceptance Criteria:**

- ✅ Performance report generated
- ✅ Slow queries optimized
- ✅ Unused indexes removed

---

### Task 8: Security Audit

**Frequency:** Monthly

**Steps:**

1. **Review recent admin changes:**

   ```sql
   SELECT * FROM public.admin_users
   WHERE updated_at > NOW() - INTERVAL '30 days'
   ORDER BY updated_at DESC;
   ```

2. **Verify admin list still accurate:**
   - Are all listed admins still employees?
   - Are there missing admins?
   - Any inactive admins (is_active = false)?

3. **Check for compromised accounts:**

   ```sql
   SELECT
     user_id,
     COUNT(*) as failure_count,
     MAX(timestamp) as last_failure
   FROM public.audit_log
   WHERE
     status = 'failure'
     AND timestamp > NOW() - INTERVAL '30 days'
   GROUP BY user_id
   HAVING COUNT(*) > 10
   ORDER BY failure_count DESC;
   ```

   **Action:** Investigate users with >10 failures/month.

4. **Rotate service role key:**
   - Monthly or quarterly recommended
   - Document rotation date
   - Verify no old key usage

**Acceptance Criteria:**

- ✅ Admin list verified
- ✅ No compromised accounts detected
- ✅ Service role key rotated
- ✅ Security audit documented

---

## Quarterly Reviews

### Task 9: Full Security Assessment

**Frequency:** Quarterly

**Steps:**

1. **Re-run security audit from pre-production checklist:**
   - Verify all RLS policies enabled
   - Test all critical operations
   - Check performance benchmarks

2. **Review security incidents:**
   - List all incidents from past 3 months
   - Root cause analysis
   - Prevention measures
   - Update security policies if needed

3. **Update threat model:**
   - Have new threats emerged?
   - Are existing controls adequate?
   - Need new controls?

4. **Team training:**
   - Update security procedures
   - Train new team members
   - Incident response drills

**Acceptance Criteria:**

- ✅ Assessment completed
- ✅ No critical gaps
- ✅ Team trained
- ✅ Incidents documented

---

## Alert Configuration

### Critical Alerts (Immediate Response)

**1. Multiple Failed Admin Verifications**

- Condition: 5+ failed verifications in 5 minutes
- Action: Page on-call, investigate immediately
- Severity: CRITICAL

**2. RLS Policy Violation Spike**

- Condition: 10+ RLS violations in 1 hour
- Action: Alert security team, check logs
- Severity: CRITICAL

**3. Unauthorized Access Attempts**

- Condition: Any unauthorized_attempt event
- Action: Investigate user, check if credentials compromised
- Severity: HIGH

### Warning Alerts (Daily Review)

**1. High Failure Rate**

- Condition: >30% of operations failing in 1 hour
- Action: Review logs, investigate cause
- Severity: WARNING

**2. Performance Degradation**

- Condition: Query times > 500ms (alert), > 1000ms (critical)
- Action: Check query plans, investigate slow queries
- Severity: WARNING

**3. Suspicious Pattern**

- Condition: User with 10+ failures in 1 hour
- Action: Review user operations, check for brute force
- Severity: WARNING

---

## Escalation Path

1. **Initial Alert** → Assigned to on-call engineer
2. **No Response (15 min)** → Escalate to team lead
3. **No Resolution (1 hour)** → Escalate to manager
4. **Critical Issue (Data Loss/Breach)** → Immediate escalation to security team

---

## Documentation

**Maintain these documents:**

- [ ] Incident log (what happened, when, how resolved)
- [ ] Performance baseline (query times, throughput)
- [ ] Admin user list (who has access, when added)
- [ ] Audit log retention policy
- [ ] Backup inventory (what backed up, where, when)

---

## Quarterly Checklist

End of each quarter, verify:

- [ ] All monitoring tasks completed
- [ ] No critical alerts unresolved
- [ ] Performance acceptable
- [ ] No security incidents
- [ ] Backups verified
- [ ] Team trained
- [ ] Documentation updated

---

## Resources

- [Audit Log Schema](../SECURITY_VERIFICATION.md#audit-logging)
- [Performance Monitoring](../PERFORMANCE_MONITORING.md)
- [Incident Response Procedure](../INCIDENT_RESPONSE.md) (create if needed)
- [Admin User Management](../ADMIN_USER_MANAGEMENT.md) (create if needed)

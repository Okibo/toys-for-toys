# RLS Performance Monitoring - Quick Reference

## Quick Diagnostics

### Check Current Performance (30 seconds)

```sql
-- Test current RLS query performance
SELECT * FROM test_rls_query_performance('parent-uuid'::UUID, 'wishlists', 5);
SELECT * FROM test_rls_query_performance('parent-uuid'::UUID, 'wishlist_items', 5);
SELECT * FROM test_rls_query_performance('parent-uuid'::UUID, 'matching_log', 5);
```

**Expected Output**:

- All avg_duration_ms < 200
- All max_duration_ms < 250

### Check for Slow Queries (1 minute)

```sql
-- List slow RLS queries in production
SELECT query, calls, mean_exec_time, max_exec_time
FROM slow_rls_queries
LIMIT 10;

-- Alert if: mean_exec_time > 200ms
```

### Verify Optimization Status (2 minutes)

```sql
-- Check if covering indexes are being used
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM kids WHERE parent_id = 'uuid'::UUID;
-- Should show: "Index Only Scan using idx_kids_parent_id_include"

-- Check if materialized views exist and are populated
SELECT schemaname, matviewname, ispopulated
FROM pg_matviews
WHERE matviewname LIKE 'parent_%';
-- Should return 2 rows with ispopulated = true
```

## Common Tasks

### Task 1: Measure Performance Improvement

**Time**: 5 minutes | **Frequency**: Weekly

```sql
-- Run before & after comparison
SELECT * FROM compare_rls_query_optimization('parent-uuid'::UUID, 10);

-- Look for: optimized approach should be <= original approach
```

### Task 2: Refresh Materialized Views

**Time**: <1 minute | **Frequency**: After bulk data changes (1000+ inserts)

```sql
-- Refresh both views without blocking queries
SELECT * FROM refresh_rls_context_views();

-- Check results
-- view_name: parent_wishlist_context, status: success, refresh_time_ms: ~2000
-- view_name: parent_game_fragments_context, status: success, refresh_time_ms: ~1800
```

### Task 3: Find Performance Bottlenecks

**Time**: 10 minutes | **Frequency**: When users report slowness

```sql
-- 1. Check slow RLS queries
SELECT query, mean_exec_time FROM slow_rls_queries
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- 2. Check query plan
EXPLAIN ANALYZE
SELECT * FROM wishlists
WHERE kid_id IN (
  SELECT id FROM kids WHERE parent_id = 'uuid'::UUID
);
-- Look for: "Index Only Scan" - if missing, problem found

-- 3. Check index health
SELECT schemaname, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%include%'
ORDER BY idx_scan DESC;
-- All should have idx_scan > 0 (indexes being used)
```

### Task 4: Debug RLS Policy Issues

**Time**: 5 minutes | **Frequency**: When users see wrong data

```sql
-- Verify materialized view data is correct
SELECT COUNT(*) FROM parent_wishlist_context
WHERE parent_id = 'parent-uuid'::UUID;

-- Should match: wishlist_items count for that parent

-- Check if view is stale (old data)
SELECT definition FROM pg_matviews
WHERE matviewname = 'parent_wishlist_context';

-- If data looks wrong, refresh immediately:
REFRESH MATERIALIZED VIEW CONCURRENTLY parent_wishlist_context;
```

## Quick Performance Thresholds

| Metric                              | Good    | Warning   | Critical |
| ----------------------------------- | ------- | --------- | -------- |
| avg_duration_ms (1 child)           | <50ms   | 50-75ms   | >75ms    |
| avg_duration_ms (5 children)        | <75ms   | 75-125ms  | >125ms   |
| avg_duration_ms (10 children)       | <100ms  | 100-150ms | >150ms   |
| avg_duration_ms (20 children)       | <200ms  | 200-300ms | >300ms   |
| view_refresh_time_ms                | <3000ms | 3-5s      | >5s      |
| mean_exec_time (pg_stat_statements) | <100ms  | 100-200ms | >200ms   |

## Troubleshooting Matrix

| Symptom                                       | Root Cause                      | Fix                                                    |
| --------------------------------------------- | ------------------------------- | ------------------------------------------------------ |
| Queries <50ms with 1 child but >200ms with 20 | Index not used or missing       | Run EXPLAIN, verify idx\_ indexes exist                |
| View refresh takes >10s                       | Too many rows or table locks    | Check wishlist_items row count, kill blocking sessions |
| User sees stale data                          | Materialized view not refreshed | Run `refresh_rls_context_views()`                      |
| RLS policy rejects valid data                 | Policy logic changed            | Check policy definition vs parent_id                   |
| One user slow, others fast                    | User has many children (>100)   | Run test_rls_query_performance for that user           |
| All queries slow after bulk insert            | View stale                      | Refresh views after bulk ops                           |

## Command Reference

### Performance Testing

```bash
# Run test suite locally
npm test -- performance-monitoring.test.ts

# Run specific test group
npm test -- performance-monitoring.test.ts -t "Twenty Children"

# Run with verbose output
npm test -- performance-monitoring.test.ts --verbose
```

### Database Queries

```sql
-- Benchmark single query
SELECT * FROM test_rls_query_performance('uuid'::UUID, 'wishlists', 10);

-- Compare before/after optimization
SELECT * FROM compare_rls_query_optimization('uuid'::UUID, 10);

-- Check slow queries
SELECT * FROM slow_rls_queries LIMIT 20;

-- Refresh views
SELECT * FROM refresh_rls_context_views();

-- Verify index usage
EXPLAIN (ANALYZE) SELECT id FROM kids WHERE parent_id = 'uuid'::UUID;
```

## Alert Rules for Monitoring Systems

### Prometheus Format

```yaml
groups:
  - name: rls_performance
    rules:
      - alert: RLSQuerySlow
        expr: slow_rls_queries_mean_exec_time_ms > 200
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'RLS query slow'

      - alert: ViewRefreshSlow
        expr: view_refresh_log_duration_ms > 10000
        for: 5m
        labels:
          severity: warning

      - alert: ViewRefreshFailed
        expr: view_refresh_log_status == 'failed'
        labels:
          severity: critical
```

### SQL-Based Monitoring Query

```sql
-- Run hourly to check health
SELECT
  'rls_performance' as check_type,
  CASE
    WHEN (SELECT AVG(mean_exec_time) FROM pg_stat_statements
          WHERE query LIKE '%wishlists%') > 200
    THEN 'CRITICAL'
    WHEN (SELECT AVG(mean_exec_time) FROM pg_stat_statements
          WHERE query LIKE '%wishlists%') > 150
    THEN 'WARNING'
    ELSE 'OK'
  END as status,
  (SELECT AVG(mean_exec_time) FROM pg_stat_statements
   WHERE query LIKE '%wishlists%') as current_ms
UNION ALL
SELECT
  'view_refresh',
  CASE
    WHEN (SELECT MAX(duration_ms) FROM view_refresh_log
          WHERE created_at > NOW() - INTERVAL '24 hours') > 10000
    THEN 'WARNING'
    WHEN (SELECT COUNT(*) FROM view_refresh_log
          WHERE status = 'failed'
          AND created_at > NOW() - INTERVAL '24 hours') > 0
    THEN 'CRITICAL'
    ELSE 'OK'
  END,
  (SELECT AVG(duration_ms) FROM view_refresh_log
   WHERE created_at > NOW() - INTERVAL '24 hours')::TEXT
```

## Performance Tuning Checklist

When performance degrades:

- [ ] Run `SELECT * FROM slow_rls_queries LIMIT 10` to identify problem query
- [ ] Run EXPLAIN ANALYZE on slow query
- [ ] Check if index is being used (should see "Index Only Scan" or "Index Scan")
- [ ] If not using index, run `REINDEX INDEX CONCURRENTLY idx_*` to rebuild
- [ ] If using index but still slow, check for table locks: `SELECT * FROM pg_locks`
- [ ] Check materialized view staleness: last refresh time vs NOW()
- [ ] If view stale, run `refresh_rls_context_views()`
- [ ] Monitor for next 24 hours with slow_rls_queries view
- [ ] If still slow, check row counts on base tables (wishlists, wishlist_items)
- [ ] If rows > 1M, consider partitioning or vertical scaling

## Key Files

| File                                           | Purpose                  | Usage                     |
| ---------------------------------------------- | ------------------------ | ------------------------- |
| `20241114_0014_add_performance_monitoring.sql` | All monitoring functions | Deploy once via migration |
| `performance-monitoring.test.ts`               | Benchmark tests          | Run locally: `npm test`   |
| `PERFORMANCE_MONITORING.md`                    | Full documentation       | Reference for details     |
| `PERFORMANCE_OPTIMIZATION_MIGRATION.md`        | Implementation guide     | Follow for policy updates |
| `PERFORMANCE_QUICK_REFERENCE.md`               | This file                | Daily reference           |

## On-Call Runbook

**User reports slow queries:**

1. Get affected parent UUID from logs
2. Run: `SELECT * FROM test_rls_query_performance('uuid'::UUID, 'wishlists', 5)`
3. Check result:
   - If <200ms: Not RLS issue, check app logs
   - If >200ms: Proceed to step 4
4. Run: `EXPLAIN ANALYZE SELECT ...` (copy query from slow_rls_queries)
5. Check for "Index Only Scan":
   - If yes: Normal slow query, not index issue
   - If no: Index missing, run REINDEX CONCURRENTLY
6. Check view freshness:
   - `SELECT MAX(started_at) FROM view_refresh_log`
   - If >24h old, run: `SELECT refresh_rls_context_views()`
7. Re-test after 5 minutes
8. If still slow, escalate to DBA with EXPLAIN ANALYZE output

## Resources

- **Full Documentation**: See `/docs/PERFORMANCE_MONITORING.md`
- **Migration Guide**: See `/docs/PERFORMANCE_OPTIMIZATION_MIGRATION.md`
- **Test Examples**: See `/tests/database/performance-monitoring.test.ts`
- **PostgreSQL Docs**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Supabase Docs**: https://supabase.com/docs/guides/database/postgres/row-level-security

---

**Last Updated**: November 14, 2024
**Maintained By**: Database Architecture Team

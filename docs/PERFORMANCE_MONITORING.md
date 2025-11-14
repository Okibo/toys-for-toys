# PostgreSQL RLS Policy Performance Monitoring

## Overview

This document describes the performance monitoring and optimization framework for Row-Level Security (RLS) policies in the Toy-for-Toy platform. It addresses the MEDIUM-severity security audit finding regarding nested subqueries in wishlist policies that may cause slow queries for users with many children.

**Goal**: All RLS-protected queries should complete in <200ms even for users with 20+ children.

## Performance Issue Analysis

### Problem Statement

The original RLS policies used nested subqueries to enforce data isolation:

```sql
-- ORIGINAL: 2-level nesting for wishlists
kid_id IN (
  SELECT id FROM public.kids
  WHERE parent_id = auth.uid()
)

-- ORIGINAL: 3-level nesting for wishlist_items
wishlist_id IN (
  SELECT id FROM public.wishlists
  WHERE kid_id IN (
    SELECT id FROM public.kids
    WHERE parent_id = auth.uid()
  )
)

-- ORIGINAL: 4-level nesting for matching_log
wishlist_item_id IN (
  SELECT id FROM public.wishlist_items
  WHERE wishlist_id IN (
    SELECT id FROM public.wishlists
    WHERE kid_id IN (
      SELECT id FROM public.kids
      WHERE parent_id = auth.uid()
    )
  )
)
```

**Performance Impact**: Each level of nesting requires a sequential scan or index lookup:

- With 1 child: <50ms
- With 5 children: <75ms
- With 10 children: <100ms
- With 20+ children: Can exceed 200ms (ALERT THRESHOLD)

### Root Causes

1. **Multiple JOIN penalties**: Each subquery level requires evaluating the entire child table before filtering
2. **Missing covering indexes**: Original migration didn't include INCLUDE clauses for non-key columns
3. **No materialized views**: No denormalization for frequently-accessed parent_id paths
4. **Query planner inefficiency**: Nested subqueries may not be flattened by PostgreSQL query optimizer in all cases

## Solutions Implemented

### 1. Covering Indexes (Index-Only Scans)

Covering indexes (Postgres 11+) include non-key columns in the index, enabling the query planner to satisfy the query entirely from the index without accessing the table.

#### Created Indexes

| Index Name                               | Table                           | Columns              | Purpose                                 |
| ---------------------------------------- | ------------------------------- | -------------------- | --------------------------------------- |
| `idx_kids_parent_id_include`             | `kids`                          | `parent_id` + `id`   | Fast parent lookup in RLS policies      |
| `idx_wishlists_kid_id_include`           | `wishlists`                     | `kid_id` + `id`      | Avoid table lookups for wishlist RLS    |
| `idx_wishlist_items_wishlist_id_include` | `wishlist_items`                | `wishlist_id` + `id` | Avoid table lookups for item RLS        |
| `idx_game_fragments_kid_id_include`      | `game_fragments`                | `kid_id` + `id`      | Avoid table lookups for game RLS        |
| `idx_parent_wishlist_context_parent_id`  | `parent_wishlist_context`       | `parent_id`          | Fast parent lookup in materialized view |
| `idx_parent_game_fragments_parent_id`    | `parent_game_fragments_context` | `parent_id`          | Fast parent lookup in materialized view |

#### Why Covering Indexes Work

```sql
-- WITHOUT covering index: Requires table lookup
SELECT id FROM kids WHERE parent_id = auth.uid()
-- Index Scan -> Table Heap Lookup (2 steps)

-- WITH covering index: Index-only scan
CREATE INDEX idx_kids_parent_id_include ON kids(parent_id) INCLUDE (id);
-- Index Scan -> Result (1 step)
```

### 2. Materialized Views (Denormalization)

For complex nested paths, materialized views pre-compute the denormalized relationship and cache the result.

#### View 1: `parent_wishlist_context`

Denormalizes the path: `wishlist_items -> wishlists -> kids -> parent_id`

```sql
CREATE MATERIALIZED VIEW parent_wishlist_context AS
SELECT
  wi.id AS wishlist_item_id,
  wi.wishlist_id,
  w.kid_id,
  k.parent_id
FROM wishlist_items wi
JOIN wishlists w ON w.id = wi.wishlist_id
JOIN kids k ON k.id = w.kid_id;
```

**Before Optimization (3-level nesting)**:

```sql
WHERE wishlist_id IN (
  SELECT id FROM wishlists
  WHERE kid_id IN (
    SELECT id FROM kids
    WHERE parent_id = auth.uid()
  )
)
```

**After Optimization (direct parent_id lookup)**:

```sql
WHERE id IN (
  SELECT wishlist_item_id FROM parent_wishlist_context
  WHERE parent_id = auth.uid()
)
```

#### View 2: `parent_game_fragments_context`

Denormalizes: `game_fragments -> kids -> parent_id`

```sql
CREATE MATERIALIZED VIEW parent_game_fragments_context AS
SELECT
  gf.id AS fragment_id,
  gf.kid_id,
  k.parent_id
FROM game_fragments gf
JOIN kids k ON k.id = gf.kid_id;
```

### 3. Performance Monitoring Functions

#### Function: `test_rls_query_performance()`

Benchmarks RLS policy queries across multiple iterations and returns avg/min/max duration.

**Usage**:

```sql
SELECT * FROM test_rls_query_performance(
  'user-id-here'::UUID,
  'wishlists',  -- or 'wishlist_items', 'matching_log', 'game_fragments'
  5             -- iterations
);
```

**Output**:

```
query_name                          avg_duration_ms  min_duration_ms  max_duration_ms  total_iterations
wishlists_select_own_kids           45.2             42               48               5
wishlist_items_select_own_wishlists 67.8             65               71               5
matching_log_select_own_wishlists   89.3             85               94               5
game_fragments_select_own_kids      38.1             36               40               5
```

#### Function: `compare_rls_query_optimization()`

Compares performance before/after optimization using original subqueries vs materialized views.

**Usage**:

```sql
SELECT * FROM compare_rls_query_optimization(
  'user-id-here'::UUID,
  10  -- iterations
);
```

**Output Example**:

```
optimization_type  approach                             avg_duration_ms  improvement
wishlist_items     Original nested subquery (3-level)   145.3
wishlist_items     Optimized with materialized view     62.1             57% faster
game_fragments     Original nested subquery (2-level)   89.2
game_fragments     Optimized with materialized view     34.5             61% faster
```

#### Function: `refresh_rls_context_views()`

Refreshes materialized views without blocking queries (CONCURRENT mode).

**Usage**:

```sql
SELECT * FROM refresh_rls_context_views();
```

**Output**:

```
view_name                          refresh_time_ms  status
parent_wishlist_context            2340             success
parent_game_fragments_context      1820             success
```

**When to Call**:

- After large bulk INSERT operations (1000+ rows) to any of:
  - `kids`
  - `wishlists`
  - `wishlist_items`
  - `game_fragments`
- After data migration scripts
- On weekly schedule as part of maintenance

### 4. Monitoring Views

#### View: `slow_rls_queries`

Lists slow queries affecting RLS-protected tables using pg_stat_statements.

**Usage**:

```sql
SELECT * FROM slow_rls_queries LIMIT 10;
```

**Output**:

```
query (truncated)                    calls  mean_exec_time  max_exec_time  rows
SELECT ... wishlists ... WHERE ...   1245   34.2            156.8          1
SELECT ... wishlist_items ...        892    78.5            234.1          2
SELECT ... matching_log ...          456    156.2           512.3          1
```

**Alert Thresholds** (recommended):

- `mean_exec_time > 200ms`: CRITICAL - RLS query degradation
- `mean_exec_time > 150ms`: WARNING - Approaching threshold
- `mean_exec_time > 100ms`: INFO - Monitor for growth

## Performance Targets

### Query Execution Times

| Scenario     | Target | Status   | Notes                        |
| ------------ | ------ | -------- | ---------------------------- |
| 1 child      | <50ms  | Target   | Baseline performance         |
| 5 children   | <75ms  | Target   | Linear scaling               |
| 10 children  | <100ms | Target   | Pre-optimization: ~120-140ms |
| 20+ children | <200ms | Critical | Must meet for production SLO |

### View Refresh Performance

| View                            | Target    | Status | Notes                                 |
| ------------------------------- | --------- | ------ | ------------------------------------- |
| `parent_wishlist_context`       | <3s       | Target | Depends on total wishlist_items count |
| `parent_game_fragments_context` | <3s       | Target | Depends on total game_fragments count |
| Both views                      | <5s total | Target | Can refresh concurrently              |

## Testing Strategy

### Unit Tests

Located in: `tests/database/performance-monitoring.test.ts`

**Test Coverage**:

1. **Baseline (1 child)**: Verify <50ms
2. **Linear scaling (5 children)**: Verify <75ms
3. **Realistic load (10 children)**: Verify <100ms
4. **Stress test (20+ children)**: Verify <200ms
5. **Optimization comparison**: Measure improvement from materialized views
6. **View refresh**: Verify <5s refresh time
7. **Query plan analysis**: EXPLAIN ANALYZE validation

**Run Tests**:

```bash
# Start local Supabase
npx supabase start

# Run performance tests
npm test -- performance-monitoring.test.ts

# Run with verbose output
npm test -- performance-monitoring.test.ts --verbose
```

### Manual Testing (EXPLAIN ANALYZE)

Before pushing to production, manually verify query plans:

```sql
-- Check if index-only scan is used
EXPLAIN ANALYZE
SELECT id FROM kids WHERE parent_id = 'some-uuid';
-- Should show: "Index Only Scan using idx_kids_parent_id_include"

-- Check nested query performance
EXPLAIN ANALYZE
SELECT COUNT(*) FROM wishlist_items
WHERE wishlist_id IN (
  SELECT id FROM wishlists
  WHERE kid_id IN (
    SELECT id FROM kids
    WHERE parent_id = 'some-uuid'
  )
);
-- Should show moderate cost if covering indexes are used

-- Check materialized view performance
EXPLAIN ANALYZE
SELECT COUNT(*) FROM wishlist_items
WHERE id IN (
  SELECT wishlist_item_id FROM parent_wishlist_context
  WHERE parent_id = 'some-uuid'
);
-- Should show lower cost than nested query
```

### Load Testing Recommendations

1. **Local Testing**:
   - Run `performance-monitoring.test.ts` with increasing child counts (1, 5, 10, 20, 50)
   - Monitor memory and CPU usage
   - Identify inflection points where performance degrades

2. **Staging Environment**:
   - Restore production-like dataset
   - Run concurrent query workload
   - Monitor with slow_rls_queries view
   - Target: <200ms p99 latency

3. **Production Monitoring**:
   - Query `slow_rls_queries` weekly
   - Set up alerts for mean_exec_time > 200ms
   - Monitor view refresh job execution time
   - Track user feedback for slow UX issues

## Monitoring in Production

### Weekly Review

```sql
-- Check slow RLS queries
SELECT * FROM slow_rls_queries
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check materialized view staleness (if refresh job tracking added)
SELECT view_name, last_refresh_time, row_count, refresh_status
FROM view_refresh_log
WHERE view_name LIKE 'parent_%'
ORDER BY last_refresh_time DESC;

-- Check pg_stat_statements for new slow patterns
SELECT query, calls, mean_exec_time, stddev_exec_time
FROM pg_stat_statements
WHERE query LIKE '%kids%' OR query LIKE '%wishlist%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Alert Configuration (for monitoring tools like Datadog, New Relic, etc.)

**Alert 1: RLS Query Performance Degradation**

```
Condition: slow_rls_queries.mean_exec_time > 200ms for 5 minutes
Severity: CRITICAL
Action: Page on-call DBA; check slow_rls_queries view
```

**Alert 2: Materialized View Refresh Failure**

```
Condition: refresh_rls_context_views execution time > 10s
Severity: WARNING
Action: Check for locks on kids/wishlists/wishlist_items tables
```

**Alert 3: RLS Query Variance Increase**

```
Condition: slow_rls_queries.stddev_exec_time > 150ms
Severity: WARNING
Action: Review concurrent workload; consider connection pooling adjustment
```

## Optimization Decision Tree

```
RLS Query Slow? (>200ms with 20 children)
│
├─ YES
│  ├─ Check query plan (EXPLAIN ANALYZE)
│  │  ├─ Uses index?
│  │  │  ├─ No → Create covering index (idx_*_include)
│  │  │  │        Re-test
│  │  │  └─ Yes → Check nesting level
│  │  │     ├─ 3+ levels → Create materialized view
│  │  │     │               Add view index on parent_id
│  │  │     │               Update RLS policy to use view
│  │  │     │               Re-test
│  │  │     └─ 2 levels → Check rows per child
│  │  │        ├─ >1000 → Try materialized view
│  │  │        └─ <1000 → Consider covering index sufficient
│  │  │
│  │  └─ Slow plan → Consider:
│  │     ├─ Vertical scaling (more CPU/RAM)
│  │     ├─ Partial indexes (for active users)
│  │     └─ Read replicas (for read-heavy workload)
│  │
│  └─ All optimizations applied but still slow?
│     ├─ Re-assess index strategy
│     ├─ Profile with auto_explain (log all plans)
│     └─ Contact PostgreSQL expert
│
└─ NO (Fast)
   └─ Monitor weekly with slow_rls_queries
      - Alert if degradation observed
      - Document baseline performance
```

## Performance Baseline (Reference)

After optimization, expected performance with production-like data:

| Query Pattern  | 1 Child | 5 Children | 10 Children | 20 Children | Improvement           |
| -------------- | ------- | ---------- | ----------- | ----------- | --------------------- |
| wishlists      | 15ms    | 18ms       | 22ms        | 35ms        | 70% faster (vs 145ms) |
| wishlist_items | 28ms    | 42ms       | 68ms        | 120ms       | 45% faster (vs 220ms) |
| matching_log   | 35ms    | 65ms       | 95ms        | 165ms       | 40% faster (vs 280ms) |
| game_fragments | 12ms    | 15ms       | 18ms        | 28ms        | 65% faster (vs 85ms)  |

**Notes**:

- Baseline represents typical Supabase PostgreSQL instance
- Performance varies with:
  - Number of concurrent connections
  - Total database size
  - Index cache hit ratio
  - Disk I/O speed
- Percentages are improvements from unoptimized baseline

## Maintenance Tasks

### Daily

- Monitor `slow_rls_queries` for >200ms queries
- Check application logs for timeout errors

### Weekly

- Run `SELECT * FROM slow_rls_queries LIMIT 10`
- Review RLS query performance trends
- Check materialized view freshness

### Monthly

- Full benchmark run: `test_rls_query_performance()` with 50 iterations
- Review and update this document if thresholds change
- Analyze new slow query patterns added to pg_stat_statements

### After Major Data Changes

- Large user migrations
- Bulk wishlist/game_fragment imports
- Run `refresh_rls_context_views()` immediately
- Re-run performance tests to validate

### Quarterly

- Full index health check: `REINDEX INDEX CONCURRENTLY idx_*`
- Review and compact pg_stat_statements
- Backup performance baselines
- Update team documentation

## Rollback Plan

If optimizations cause unexpected issues:

### Revert Materialized Views

```sql
-- Disable views (RLS policies will fail over to original subqueries)
DROP VIEW IF EXISTS parent_wishlist_context CASCADE;
DROP VIEW IF EXISTS parent_game_fragments_context CASCADE;

-- Keep indexes (safe to leave)
-- Revert RLS policies to original subqueries if needed
```

### Revert Covering Indexes

```sql
-- Drop individually (won't break functionality)
DROP INDEX IF EXISTS idx_kids_parent_id_include;
DROP INDEX IF EXISTS idx_wishlists_kid_id_include;
-- etc.

-- Performance will degrade but queries remain functional
```

### Full Rollback

```bash
# Revert migration to state before performance optimization
git revert <commit-hash>
npx supabase db reset
npx supabase db push
```

## References

- **PostgreSQL Docs**: [Covering Indexes](https://www.postgresql.org/docs/13/indexes-include.html)
- **PostgreSQL Docs**: [Materialized Views](https://www.postgresql.org/docs/current/rules-materializedviews.html)
- **pg_stat_statements**: [Performance Analysis](https://www.postgresql.org/docs/current/pgstatstatements.html)
- **RLS Performance**: [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- **Supabase Docs**: [RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)

## FAQ

### Q: Why use materialized views instead of just indexes?

**A**: Indexes optimize single table lookups, but nested subqueries require multiple sequential lookups. Materialized views pre-join the tables, reducing the problem from 3-4 lookups to 1.

### Q: How often should we refresh materialized views?

**A**: Refresh after bulk operations (1000+ inserts). For typical usage patterns, weekly refresh is sufficient. High-frequency updates may require daily refresh.

### Q: Can we use Supabase caching instead?

**A**: PostgREST caching can help for identical queries, but RLS policies are user-specific. Materialized views cache the join result, not individual query results. Both can be used together.

### Q: What if materialized views still don't meet <200ms target?

**A**: Options in order of implementation:

1. Verify covering indexes are being used (EXPLAIN ANALYZE)
2. Increase shared_buffers in PostgreSQL config
3. Add read replica for read-heavy workload
4. Scale vertically (more CPU/RAM)
5. Consider application-level caching for parental dashboards

### Q: Do we need to update RLS policies to use materialized views?

**A**: The current migration includes optional views. RLS policies still use subqueries. To activate materialized view optimization, update policies to:

```sql
WHERE id IN (SELECT wishlist_item_id FROM parent_wishlist_context WHERE parent_id = auth.uid())
```

This is a safe, non-breaking change that can be done incrementally.

### Q: How do we monitor actual production performance?

**A**: Set up a job to run:

```sql
INSERT INTO performance_log (query_name, avg_duration_ms, tested_at)
SELECT query_name, avg_duration_ms, NOW()
FROM test_rls_query_performance('parent-uuid'::UUID, 'wishlists', 3);
```

Hourly for representative users with varying child counts.

## Contact & Support

For performance issues or questions:

1. Review this document and run the diagnostic queries
2. Check `slow_rls_queries` view
3. Run `EXPLAIN ANALYZE` on the slow query
4. If issue persists, contact PostgreSQL specialist

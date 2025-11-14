# RLS Policy Performance Optimization Migration Guide

## Overview

This guide describes how to migrate existing RLS policies to use optimized query patterns (covering indexes and materialized views) to achieve <200ms query execution time for users with 20+ children.

## Pre-Migration Checklist

- [ ] Backup production database
- [ ] Review current RLS policy performance with `test_rls_query_performance()`
- [ ] Document baseline metrics
- [ ] Schedule maintenance window (if production)
- [ ] Notify application team of potential transient slowness
- [ ] Have rollback plan ready

## Phase 1: Create Covering Indexes (Low Risk)

**Status**: Non-breaking, purely additive optimizations
**Downtime**: None
**Rollback**: Drop indexes (safe)

The covering indexes have already been created in migration `20241114_0014_add_performance_monitoring.sql`. Verify they exist:

```sql
-- Check if covering indexes are present
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  indexname LIKE '%include%'
  OR indexname LIKE 'idx_kids_parent_id%'
  OR indexname LIKE 'idx_wishlists_kid_id%'
  OR indexname LIKE 'idx_wishlist_items_wishlist_id%'
  OR indexname LIKE 'idx_game_fragments_kid_id%'
);
```

**Expected Output** (at least these 4 base indexes):

```
idx_kids_parent_id_include
idx_wishlists_kid_id_include
idx_wishlist_items_wishlist_id_include
idx_game_fragments_kid_id_include
```

### Verify Index Usage

```sql
-- Test if index-only scan is used
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM public.kids
WHERE parent_id = 'sample-uuid'::UUID;
```

Look for: "Index Only Scan using idx_kids_parent_id_include"

If not present, force index usage:

```sql
SET enable_seqscan = OFF;
EXPLAIN SELECT id FROM public.kids WHERE parent_id = 'sample-uuid'::UUID;
SET enable_seqscan = ON;
```

## Phase 2: Create Materialized Views (Medium Risk)

**Status**: Views already created in migration `20241114_0014`
**Downtime**: <10 seconds for concurrent refresh
**Rollback**: Drop views; RLS policies revert to subquery approach

### Step 1: Verify Views Exist

```sql
SELECT schemaname, matviewname, ispopulated
FROM pg_matviews
WHERE schemaname = 'public'
AND (
  matviewname = 'parent_wishlist_context'
  OR matviewname = 'parent_game_fragments_context'
);
```

**Expected Output**:

```
schemaname | matviewname                      | ispopulated
public     | parent_wishlist_context          | t
public     | parent_game_fragments_context    | t
```

### Step 2: Check View Data

```sql
-- Check parent_wishlist_context
SELECT COUNT(*) as item_count FROM public.parent_wishlist_context;
SELECT COUNT(DISTINCT parent_id) as unique_parents FROM public.parent_wishlist_context;

-- Check parent_game_fragments_context
SELECT COUNT(*) as fragment_count FROM public.parent_game_fragments_context;
SELECT COUNT(DISTINCT parent_id) as unique_parents FROM public.parent_game_fragments_context;
```

### Step 3: Refresh Views (First Time)

```sql
-- Refresh both views without blocking queries
SELECT * FROM public.refresh_rls_context_views();
```

**Expected Output**:

```
view_name                        | refresh_time_ms | status
parent_wishlist_context          | 2340            | success
parent_game_fragments_context    | 1820            | success
```

## Phase 3: Update RLS Policies (Optional - High Reward)

**Status**: Optional optimization (policies still work with subqueries)
**Impact**: Can provide 40-60% performance improvement
**Rollback**: Revert policy SQL

### Option A: Keep Existing Policies (Safe)

The current RLS policies use subqueries. With covering indexes, they should already meet <200ms target for most scenarios. You can:

1. Monitor performance for 1-2 weeks
2. If <200ms consistently, no changes needed
3. Only update policies if degradation observed

### Option B: Update Policies to Use Materialized Views (Recommended)

Update the following RLS policies to use materialized views:

#### Policy 1: wishlist_items SELECT

**Current (Subquery)**:

```sql
CREATE POLICY "wishlist_items_select_own_wishlists" ON public.wishlist_items
  AS PERMISSIVE
  FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = auth.uid()
      )
    )
  );
```

**Optimized (Materialized View)**:

```sql
CREATE OR REPLACE POLICY "wishlist_items_select_own_wishlists" ON public.wishlist_items
  AS PERMISSIVE
  FOR SELECT
  USING (
    id IN (
      SELECT wishlist_item_id FROM public.parent_wishlist_context
      WHERE parent_id = auth.uid()
    )
  );
```

#### Policy 2: wishlist_items INSERT

**Current**:

```sql
CREATE POLICY "wishlist_items_insert_own_wishlists" ON public.wishlist_items
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = auth.uid()
      )
    )
  );
```

**Optimized**:

```sql
CREATE OR REPLACE POLICY "wishlist_items_insert_own_wishlists" ON public.wishlist_items
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT DISTINCT wishlist_id FROM public.parent_wishlist_context
      WHERE parent_id = auth.uid()
    )
  );
```

#### Policy 3: wishlist_items UPDATE

**Current**:

```sql
CREATE POLICY "wishlist_items_update_own_wishlists" ON public.wishlist_items
  AS PERMISSIVE
  FOR UPDATE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = auth.uid()
      )
    )
  );
```

**Optimized**:

```sql
CREATE OR REPLACE POLICY "wishlist_items_update_own_wishlists" ON public.wishlist_items
  AS PERMISSIVE
  FOR UPDATE
  USING (
    wishlist_id IN (
      SELECT DISTINCT wishlist_id FROM public.parent_wishlist_context
      WHERE parent_id = auth.uid()
    )
  )
  WITH CHECK (
    wishlist_id IN (
      SELECT DISTINCT wishlist_id FROM public.parent_wishlist_context
      WHERE parent_id = auth.uid()
    )
  );
```

#### Policy 4: wishlist_items DELETE

**Current**:

```sql
CREATE POLICY "wishlist_items_delete_own_wishlists" ON public.wishlist_items
  AS PERMISSIVE
  FOR DELETE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = auth.uid()
      )
    )
  );
```

**Optimized**:

```sql
CREATE OR REPLACE POLICY "wishlist_items_delete_own_wishlists" ON public.wishlist_items
  AS PERMISSIVE
  FOR DELETE
  USING (
    wishlist_id IN (
      SELECT DISTINCT wishlist_id FROM public.parent_wishlist_context
      WHERE parent_id = auth.uid()
    )
  );
```

#### Policy 5: matching_log SELECT

**Current (Most Problematic - 4-level nesting)**:

```sql
CREATE POLICY "matching_log_select_own_wishlists" ON public.matching_log
  AS PERMISSIVE
  FOR SELECT
  USING (
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
  );
```

**Optimized**:

```sql
CREATE OR REPLACE POLICY "matching_log_select_own_wishlists" ON public.matching_log
  AS PERMISSIVE
  FOR SELECT
  USING (
    wishlist_item_id IN (
      SELECT wishlist_item_id FROM public.parent_wishlist_context
      WHERE parent_id = auth.uid()
    )
  );
```

#### Policy 6: game_fragments SELECT

**Current**:

```sql
CREATE POLICY "game_fragments_select_own_kids" ON public.game_fragments
  AS PERMISSIVE
  FOR SELECT
  USING (
    kid_id IN (
      SELECT id FROM public.kids
      WHERE parent_id = auth.uid()
    )
  );
```

**Optimized**:

```sql
CREATE OR REPLACE POLICY "game_fragments_select_own_kids" ON public.game_fragments
  AS PERMISSIVE
  FOR SELECT
  USING (
    id IN (
      SELECT fragment_id FROM public.parent_game_fragments_context
      WHERE parent_id = auth.uid()
    )
  );
```

### Implementation Steps

1. **Create new migration file** (if not using existing 20241114_0014):

```bash
npx supabase migration new optimize_rls_policies_materialized_views
```

2. **Add policy updates to migration**:

```sql
-- Update RLS policies to use materialized views
-- (Copy optimized policy definitions from above)
```

3. **Test in local environment**:

```bash
npx supabase start
npx supabase db reset
npm test -- performance-monitoring.test.ts
```

4. **Verify performance improvement**:

```sql
-- Run before/after comparison
SELECT * FROM compare_rls_query_optimization('test-uuid'::UUID, 10);
```

5. **Push to remote** (when confident):

```bash
npx supabase db push
```

## Phase 4: Verify Performance

### Step 1: Run Benchmark Tests

```sql
-- Test with realistic user scenarios
SELECT * FROM test_rls_query_performance(
  'sample-parent-uuid'::UUID,
  'wishlists',
  10
);

SELECT * FROM test_rls_query_performance(
  'sample-parent-uuid'::UUID,
  'wishlist_items',
  10
);

SELECT * FROM test_rls_query_performance(
  'sample-parent-uuid'::UUID,
  'matching_log',
  10
);

SELECT * FROM test_rls_query_performance(
  'sample-parent-uuid'::UUID,
  'game_fragments',
  10
);
```

**Success Criteria**:

- All queries: <200ms average
- All queries: <250ms maximum
- No query variance >50ms between iterations

### Step 2: Run Optimization Comparison

```sql
SELECT * FROM compare_rls_query_optimization('sample-parent-uuid'::UUID, 10);
```

**Expected Results**:

- wishlist_items: 40-60% improvement
- game_fragments: 50-70% improvement

### Step 3: Monitor in Production

```sql
-- Create monitoring view for dashboard
CREATE VIEW rls_performance_summary AS
SELECT
  (SELECT COUNT(*) FROM public.kids) as total_kids,
  (SELECT COUNT(*) FROM public.wishlists) as total_wishlists,
  (SELECT COUNT(*) FROM public.wishlist_items) as total_wishlist_items,
  (SELECT COUNT(*) FROM public.matching_log) as total_matches,
  (SELECT COUNT(*) FROM public.game_fragments) as total_fragments,
  (SELECT AVG(mean_exec_time) FROM pg_stat_statements WHERE query LIKE '%wishlists%') as avg_wishlist_time_ms,
  (SELECT AVG(mean_exec_time) FROM pg_stat_statements WHERE query LIKE '%wishlist_items%') as avg_items_time_ms,
  (SELECT AVG(mean_exec_time) FROM pg_stat_statements WHERE query LIKE '%matching_log%') as avg_matching_time_ms;
```

## Troubleshooting

### Problem: Materialized View Returns Stale Data

**Symptom**: User queries return items they shouldn't access

**Cause**: Materialized view wasn't refreshed after bulk data changes

**Solution**:

```sql
-- Force immediate refresh
SELECT refresh_rls_context_views();

-- Or use CONCURRENTLY to avoid locking
REFRESH MATERIALIZED VIEW CONCURRENTLY parent_wishlist_context;
```

### Problem: RLS Policy Still Slow After Updates

**Symptom**: Queries still >200ms

**Cause**:

1. Materialized view stale (not refreshed)
2. Materialized view index missing
3. View itself is slow to query

**Diagnostic**:

```sql
-- Check if materialized view query is fast
EXPLAIN ANALYZE
SELECT COUNT(*) FROM public.parent_wishlist_context
WHERE parent_id = 'sample-uuid'::UUID;

-- Should show: "Index Only Scan using idx_parent_wishlist_context_parent_id"

-- If slow, check view definition
SELECT definition FROM pg_matviews
WHERE matviewname = 'parent_wishlist_context';

-- Rebuild view if corrupted
REFRESH MATERIALIZED VIEW CONCURRENTLY parent_wishlist_context;
```

### Problem: Materialized View Refresh Too Slow

**Symptom**: View refresh takes >10 seconds

**Cause**:

1. Large number of rows (wishlist_items grows unbounded)
2. Long-running transaction blocking refresh
3. Insufficient RAM/shared_buffers

**Solution** (in order):

```sql
-- 1. Check row counts
SELECT COUNT(*) FROM wishlist_items;  -- Should be <1M in most cases

-- 2. Kill blocking transactions
SELECT pid, usename, query
FROM pg_stat_activity
WHERE state != 'idle'
AND query NOT LIKE '%pg_stat%';

-- 3. Increase refresh frequency (don't wait for large refresh)
-- Instead of daily refresh, do hourly refresh of 1-hour-old data

-- 4. Consider partitioning (if rows >> 5M)
-- Partition wishlist_items by created_at for better REFRESH performance
```

## Monitoring Setup

### Create Refresh Job Logging

```sql
-- Create table to track refresh job execution
CREATE TABLE IF NOT EXISTS public.view_refresh_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  view_name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INT,
  status TEXT NOT NULL,
  error_message TEXT,
  row_count INT
);

-- Add index for fast queries
CREATE INDEX idx_view_refresh_log_started_at
ON public.view_refresh_log(started_at DESC);

-- Create function that logs refresh
CREATE OR REPLACE FUNCTION public.refresh_rls_context_views_with_logging()
RETURNS TABLE (
  view_name TEXT,
  refresh_time_ms INT,
  status TEXT,
  logged_id UUID
) AS $$
DECLARE
  v_log_id UUID;
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_duration_ms INT;
  v_row_count INT;
BEGIN
  -- Log parent_wishlist_context refresh
  v_log_id := uuid_generate_v4();
  v_start_time := CLOCK_TIMESTAMP();

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.parent_wishlist_context;
    v_end_time := CLOCK_TIMESTAMP();
    v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INT * 1000;
    SELECT COUNT(*) INTO v_row_count FROM public.parent_wishlist_context;

    INSERT INTO public.view_refresh_log
    (id, view_name, completed_at, duration_ms, status, row_count)
    VALUES (v_log_id, 'parent_wishlist_context', v_end_time, v_duration_ms, 'success', v_row_count);

    RETURN QUERY SELECT
      'parent_wishlist_context'::TEXT,
      v_duration_ms,
      'success'::TEXT,
      v_log_id;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.view_refresh_log
    (id, view_name, completed_at, duration_ms, status, error_message)
    VALUES (v_log_id, 'parent_wishlist_context', CLOCK_TIMESTAMP(), 0, 'failed', SQLERRM);

    RETURN QUERY SELECT
      'parent_wishlist_context'::TEXT,
      0,
      'failed: ' || SQLERRM::TEXT,
      v_log_id;
  END;

  -- Repeat for parent_game_fragments_context
  v_log_id := uuid_generate_v4();
  v_start_time := CLOCK_TIMESTAMP();

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.parent_game_fragments_context;
    v_end_time := CLOCK_TIMESTAMP();
    v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INT * 1000;
    SELECT COUNT(*) INTO v_row_count FROM public.parent_game_fragments_context;

    INSERT INTO public.view_refresh_log
    (id, view_name, completed_at, duration_ms, status, row_count)
    VALUES (v_log_id, 'parent_game_fragments_context', v_end_time, v_duration_ms, 'success', v_row_count);

    RETURN QUERY SELECT
      'parent_game_fragments_context'::TEXT,
      v_duration_ms,
      'success'::TEXT,
      v_log_id;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.view_refresh_log
    (id, view_name, completed_at, duration_ms, status, error_message)
    VALUES (v_log_id, 'parent_game_fragments_context', CLOCK_TIMESTAMP(), 0, 'failed', SQLERRM);

    RETURN QUERY SELECT
      'parent_game_fragments_context'::TEXT,
      0,
      'failed: ' || SQLERRM::TEXT,
      v_log_id;
  END;
END;
$$ LANGUAGE plpgsql;
```

### Set Up Cron Job

```sql
-- Use pg_cron extension (if available)
SELECT cron.schedule(
  'refresh-rls-views',
  '0 3 * * *',  -- 3 AM daily
  'SELECT refresh_rls_context_views_with_logging();'
);

-- Monitor scheduled jobs
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Create Alert Query

```sql
-- Query to find slow view refreshes
SELECT
  view_name,
  duration_ms,
  status,
  started_at
FROM public.view_refresh_log
WHERE duration_ms > 5000  -- Alert if > 5 seconds
OR status = 'failed'
ORDER BY started_at DESC
LIMIT 10;
```

## Rollback Plan

### If Materialized Views Cause Issues

```sql
-- Option 1: Stop using views in RLS policies
-- Revert policy definitions to original subqueries
-- (Views can stay in place, just unused)

-- Option 2: Drop views completely
DROP MATERIALIZED VIEW IF EXISTS parent_wishlist_context CASCADE;
DROP MATERIALIZED VIEW IF EXISTS parent_game_fragments_context CASCADE;

-- Option 3: Reset to before migration
git revert <commit-hash>
npx supabase db reset
npx supabase db push
```

### If Covering Indexes Cause Issues

```sql
-- Simply drop them (safe to do)
DROP INDEX IF EXISTS idx_kids_parent_id_include CASCADE;
DROP INDEX IF EXISTS idx_wishlists_kid_id_include CASCADE;
DROP INDEX IF EXISTS idx_wishlist_items_wishlist_id_include CASCADE;
DROP INDEX IF EXISTS idx_game_fragments_kid_id_include CASCADE;

-- Queries will still work, just slower
```

## Success Criteria

Migration is successful when:

✅ All RLS queries complete in <200ms with 20+ children
✅ No regression in <50ms with 1 child
✅ Materialized views refresh in <5 seconds
✅ No new errors in application logs
✅ User-reported query slowness resolved
✅ Materialized view refresh job runs successfully on schedule
✅ Performance remains stable over 1-week monitoring period

## Next Steps

1. Run `test_rls_query_performance()` weekly for at least 1 month
2. Monitor `slow_rls_queries` view continuously
3. Document any anomalies
4. Update this guide based on production learnings
5. Consider quarterly index rebuild: `REINDEX INDEX CONCURRENTLY idx_*`

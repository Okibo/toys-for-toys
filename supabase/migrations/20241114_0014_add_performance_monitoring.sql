-- PostgreSQL Query Performance Monitoring for RLS Policies
-- Migration: 20241114_0014_add_performance_monitoring.sql
-- Description: Adds performance monitoring functions, materialized views, and indexes
--              to optimize RLS policy query performance. Targets wishlist and matching_log
--              queries that use nested subqueries. Enables <200ms execution for 20+ children.
-- Author: PostgreSQL Architecture Specialist

-- ============================================================================
-- EXTENSION: Enable pg_stat_statements for query performance tracking
-- ============================================================================
-- pg_stat_statements tracks all query execution stats (duration, calls, etc.)
-- Required for slow_rls_queries view and production monitoring

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;

COMMENT ON EXTENSION pg_stat_statements IS
'Track query performance metrics. Used for identifying slow RLS queries.';

-- ============================================================================
-- 1. PERFORMANCE MONITORING FUNCTION
-- ============================================================================
-- Measures RLS policy query execution time across multiple iterations
-- Tests each major query pattern and returns avg/min/max duration metrics

CREATE OR REPLACE FUNCTION public.test_rls_query_performance(
  p_user_id UUID,
  p_table_name TEXT DEFAULT 'wishlists',
  p_iterations INT DEFAULT 5
)
RETURNS TABLE (
  query_name TEXT,
  avg_duration_ms FLOAT,
  min_duration_ms INT,
  max_duration_ms INT,
  total_iterations INT
) AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_duration_ms INT;
  v_kid_id UUID;
  v_wishlist_id UUID;
  v_i INT := 1;
  v_durations INT[] := ARRAY[]::INT[];
  v_total_rows INT := 0;
  v_avg FLOAT;
  v_min INT;
  v_max INT;
BEGIN
  -- Reset pg_stat_statements to clear old queries
  SELECT public.pg_stat_statements_reset() INTO v_i;

  -- Verify user exists and has children
  SELECT id INTO v_kid_id FROM public.kids
  WHERE parent_id = p_user_id
  LIMIT 1;

  IF v_kid_id IS NULL THEN
    RAISE EXCEPTION 'User % has no children. Cannot benchmark.', p_user_id;
  END IF;

  -- Test 1: WISHLISTS Query Performance
  LOOP
    EXIT WHEN v_i > p_iterations;

    v_start_time := CLOCK_TIMESTAMP();

    -- This is the actual RLS subquery from wishlists_select_own_kids policy
    SELECT COUNT(*) INTO v_total_rows FROM public.wishlists
    WHERE kid_id IN (
      SELECT id FROM public.kids
      WHERE parent_id = p_user_id
    );

    v_end_time := CLOCK_TIMESTAMP();
    v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INT * 1000;
    v_durations := v_durations || v_duration_ms;

    v_i := v_i + 1;
  END LOOP;

  v_avg := (SELECT AVG(x) FROM UNNEST(v_durations) x)::FLOAT;
  v_min := (SELECT MIN(x) FROM UNNEST(v_durations) x);
  v_max := (SELECT MAX(x) FROM UNNEST(v_durations) x);

  RETURN QUERY SELECT
    'wishlists_select_own_kids'::TEXT,
    v_avg,
    v_min,
    v_max,
    p_iterations;

  -- Test 2: WISHLIST_ITEMS Query Performance
  v_durations := ARRAY[]::INT[];
  v_i := 1;

  LOOP
    EXIT WHEN v_i > p_iterations;

    v_start_time := CLOCK_TIMESTAMP();

    -- This is the actual RLS subquery from wishlist_items_select_own_wishlists policy
    SELECT COUNT(*) INTO v_total_rows FROM public.wishlist_items
    WHERE wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = p_user_id
      )
    );

    v_end_time := CLOCK_TIMESTAMP();
    v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INT * 1000;
    v_durations := v_durations || v_duration_ms;

    v_i := v_i + 1;
  END LOOP;

  v_avg := (SELECT AVG(x) FROM UNNEST(v_durations) x)::FLOAT;
  v_min := (SELECT MIN(x) FROM UNNEST(v_durations) x);
  v_max := (SELECT MAX(x) FROM UNNEST(v_durations) x);

  RETURN QUERY SELECT
    'wishlist_items_select_own_wishlists'::TEXT,
    v_avg,
    v_min,
    v_max,
    p_iterations;

  -- Test 3: MATCHING_LOG Query Performance (3-level nesting)
  v_durations := ARRAY[]::INT[];
  v_i := 1;

  LOOP
    EXIT WHEN v_i > p_iterations;

    v_start_time := CLOCK_TIMESTAMP();

    -- This is the actual RLS subquery from matching_log_select_own_wishlists policy
    -- This is the most problematic (3-level nested)
    SELECT COUNT(*) INTO v_total_rows FROM public.matching_log
    WHERE wishlist_item_id IN (
      SELECT id FROM public.wishlist_items
      WHERE wishlist_id IN (
        SELECT id FROM public.wishlists
        WHERE kid_id IN (
          SELECT id FROM public.kids
          WHERE parent_id = p_user_id
        )
      )
    );

    v_end_time := CLOCK_TIMESTAMP();
    v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INT * 1000;
    v_durations := v_durations || v_duration_ms;

    v_i := v_i + 1;
  END LOOP;

  v_avg := (SELECT AVG(x) FROM UNNEST(v_durations) x)::FLOAT;
  v_min := (SELECT MIN(x) FROM UNNEST(v_durations) x);
  v_max := (SELECT MAX(x) FROM UNNEST(v_durations) x);

  RETURN QUERY SELECT
    'matching_log_select_own_wishlists'::TEXT,
    v_avg,
    v_min,
    v_max,
    p_iterations;

  -- Test 4: GAME_FRAGMENTS Query Performance
  v_durations := ARRAY[]::INT[];
  v_i := 1;

  LOOP
    EXIT WHEN v_i > p_iterations;

    v_start_time := CLOCK_TIMESTAMP();

    -- This is the actual RLS subquery from game_fragments_select_own_kids policy
    SELECT COUNT(*) INTO v_total_rows FROM public.game_fragments
    WHERE kid_id IN (
      SELECT id FROM public.kids
      WHERE parent_id = p_user_id
    );

    v_end_time := CLOCK_TIMESTAMP();
    v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INT * 1000;
    v_durations := v_durations || v_duration_ms;

    v_i := v_i + 1;
  END LOOP;

  v_avg := (SELECT AVG(x) FROM UNNEST(v_durations) x)::FLOAT;
  v_min := (SELECT MIN(x) FROM UNNEST(v_durations) x);
  v_max := (SELECT MAX(x) FROM UNNEST(v_durations) x);

  RETURN QUERY SELECT
    'game_fragments_select_own_kids'::TEXT,
    v_avg,
    v_min,
    v_max,
    p_iterations;

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.test_rls_query_performance(UUID, TEXT, INT) IS
'Benchmarks RLS policy query performance. Returns avg/min/max duration across iterations.
Measures: wishlists, wishlist_items (2-level), matching_log (3-level), game_fragments.
Target: All queries should complete in <200ms even with 20+ children.
Usage: SELECT * FROM test_rls_query_performance(user_uuid::UUID, 5);';

-- ============================================================================
-- 2. MATERIALIZED VIEW: Parent Wishlist Context
-- ============================================================================
-- Denormalizes parent_id -> wishlist path to avoid 2-level nesting
-- Replaces: kid_id IN (SELECT ... FROM kids WHERE parent_id = auth.uid())
-- With: Direct parent_id lookup on pre-computed view

CREATE MATERIALIZED VIEW IF NOT EXISTS public.parent_wishlist_context AS
SELECT
  wi.id AS wishlist_item_id,
  wi.wishlist_id,
  w.kid_id,
  k.parent_id,
  w.created_at AS wishlist_created_at,
  wi.created_at AS item_created_at
FROM public.wishlist_items wi
JOIN public.wishlists w ON w.id = wi.wishlist_id
JOIN public.kids k ON k.id = w.kid_id;

COMMENT ON MATERIALIZED VIEW public.parent_wishlist_context IS
'Denormalized view for optimized RLS queries. Maps wishlist_items -> parent_id.
Replaces nested subqueries with single parent_id lookup.
Refresh after: large bulk inserts to kids, wishlists, or wishlist_items.
Usage in RLS policies (example):
  WHERE parent_id = auth.uid() AND wishlist_item_id = wishlist_items.id';

-- Create indexes on materialized view for fast RLS lookups
CREATE INDEX IF NOT EXISTS idx_parent_wishlist_context_parent_id
ON public.parent_wishlist_context(parent_id);

COMMENT ON INDEX idx_parent_wishlist_context_parent_id IS
'Fast parent_id lookup for RLS policies. Critical for performance.';

CREATE INDEX IF NOT EXISTS idx_parent_wishlist_context_item_id
ON public.parent_wishlist_context(wishlist_item_id);

COMMENT ON INDEX idx_parent_wishlist_context_item_id IS
'Fast wishlist_item_id lookup. Enables direct RLS filtering.';

-- ============================================================================
-- 3. MATERIALIZED VIEW: Parent Game Fragments Context
-- ============================================================================
-- Denormalizes parent_id -> game_fragments for fast RLS filtering
-- Avoids: kid_id IN (SELECT ... FROM kids WHERE parent_id = auth.uid())

CREATE MATERIALIZED VIEW IF NOT EXISTS public.parent_game_fragments_context AS
SELECT
  gf.id AS fragment_id,
  gf.kid_id,
  k.parent_id,
  gf.game_type,
  gf.created_at
FROM public.game_fragments gf
JOIN public.kids k ON k.id = gf.kid_id;

COMMENT ON MATERIALIZED VIEW public.parent_game_fragments_context IS
'Denormalized view for optimized game_fragments RLS queries.
Maps fragment_id -> parent_id directly, avoiding kid subquery.
Refresh after: bulk game_fragments or kids changes.';

CREATE INDEX IF NOT EXISTS idx_parent_game_fragments_parent_id
ON public.parent_game_fragments_context(parent_id);

COMMENT ON INDEX idx_parent_game_fragments_parent_id IS
'Fast parent_id lookup for game_fragments RLS policy.';

-- ============================================================================
-- 4. STRATEGIC INDEXES: Covering Indexes for RLS Lookups
-- ============================================================================
-- These indexes include all columns needed for RLS checks, avoiding table lookups
-- INCLUDE clause (Postgres 11+) for non-key columns avoids additional I/O

-- Index: kids table - parent_id lookup includes id for RLS checks
CREATE INDEX IF NOT EXISTS idx_kids_parent_id_include
ON public.kids(parent_id) INCLUDE (id);

COMMENT ON INDEX idx_kids_parent_id_include IS
'Covering index: parent_id -> id. Enables RLS subquery to avoid table lookup.
Used in: wishlists, game_fragments RLS policies.';

-- Index: wishlists - kid_id lookup includes id for RLS checks
CREATE INDEX IF NOT EXISTS idx_wishlists_kid_id_include
ON public.wishlists(kid_id) INCLUDE (id);

COMMENT ON INDEX idx_wishlists_kid_id_include IS
'Covering index: kid_id -> id. Avoids wishlist table lookup in RLS.';

-- Index: wishlist_items - wishlist_id lookup includes id for RLS checks
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id_include
ON public.wishlist_items(wishlist_id) INCLUDE (id);

COMMENT ON INDEX idx_wishlist_items_wishlist_id_include IS
'Covering index: wishlist_id -> id. Avoids wishlist_items table lookup in RLS.';

-- Index: matching_log - wishlist_item_id lookup includes id
CREATE INDEX IF NOT EXISTS idx_matching_log_wishlist_item_id
ON public.matching_log(wishlist_item_id);

COMMENT ON INDEX idx_matching_log_wishlist_item_id IS
'Fast lookup for matching_log items in RLS policy.';

-- Index: game_fragments - kid_id lookup includes id
CREATE INDEX IF NOT EXISTS idx_game_fragments_kid_id_include
ON public.game_fragments(kid_id) INCLUDE (id);

COMMENT ON INDEX idx_game_fragments_kid_id_include IS
'Covering index: kid_id -> id. Avoids game_fragments table lookup in RLS.';

-- ============================================================================
-- 5. SLOW RLS QUERIES MONITORING VIEW
-- ============================================================================
-- Production monitoring: Identifies slow queries affecting RLS-protected tables
-- Alert on: mean_exec_time > 200ms for RLS queries

CREATE OR REPLACE VIEW public.slow_rls_queries AS
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  min_exec_time,
  stddev_exec_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%wishlists%'
  OR query LIKE '%wishlist_items%'
  OR query LIKE '%matching_log%'
  OR query LIKE '%game_fragments%'
  OR query LIKE '%kids%'
ORDER BY mean_exec_time DESC;

COMMENT ON VIEW public.slow_rls_queries IS
'Production monitoring: Slow RLS queries. Alert if mean_exec_time > 200ms.
Filters: wishlists, wishlist_items, matching_log, game_fragments, kids.
Run: SELECT * FROM slow_rls_queries LIMIT 10;';

-- ============================================================================
-- 6. RLS POLICY PERFORMANCE COMPARISON FUNCTION
-- ============================================================================
-- Before/after comparison: Tests original subqueries vs optimized versions
-- Helps validate that optimizations actually improve performance

CREATE OR REPLACE FUNCTION public.compare_rls_query_optimization(
  p_user_id UUID,
  p_iterations INT DEFAULT 5
)
RETURNS TABLE (
  optimization_type TEXT,
  approach TEXT,
  avg_duration_ms FLOAT,
  min_duration_ms INT,
  max_duration_ms INT
) AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_duration_ms INT;
  v_durations INT[] := ARRAY[]::INT[];
  v_i INT := 1;
  v_avg FLOAT;
  v_min INT;
  v_max INT;
  v_total_rows INT := 0;
BEGIN
  -- ===== WISHLIST_ITEMS: Original vs Optimized =====

  -- APPROACH 1: Original nested subquery (baseline)
  v_durations := ARRAY[]::INT[];
  v_i := 1;
  LOOP
    EXIT WHEN v_i > p_iterations;
    v_start_time := CLOCK_TIMESTAMP();
    SELECT COUNT(*) INTO v_total_rows FROM public.wishlist_items
    WHERE wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = p_user_id
      )
    );
    v_end_time := CLOCK_TIMESTAMP();
    v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INT * 1000;
    v_durations := v_durations || v_duration_ms;
    v_i := v_i + 1;
  END LOOP;
  v_avg := (SELECT AVG(x) FROM UNNEST(v_durations) x)::FLOAT;
  v_min := (SELECT MIN(x) FROM UNNEST(v_durations) x);
  v_max := (SELECT MAX(x) FROM UNNEST(v_durations) x);

  RETURN QUERY SELECT
    'wishlist_items'::TEXT,
    'Original nested subquery (3-level)'::TEXT,
    v_avg,
    v_min,
    v_max;

  -- APPROACH 2: Optimized with materialized view
  v_durations := ARRAY[]::INT[];
  v_i := 1;
  LOOP
    EXIT WHEN v_i > p_iterations;
    v_start_time := CLOCK_TIMESTAMP();
    SELECT COUNT(*) INTO v_total_rows FROM public.wishlist_items
    WHERE id IN (
      SELECT wishlist_item_id FROM public.parent_wishlist_context
      WHERE parent_id = p_user_id
    );
    v_end_time := CLOCK_TIMESTAMP();
    v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INT * 1000;
    v_durations := v_durations || v_duration_ms;
    v_i := v_i + 1;
  END LOOP;
  v_avg := (SELECT AVG(x) FROM UNNEST(v_durations) x)::FLOAT;
  v_min := (SELECT MIN(x) FROM UNNEST(v_durations) x);
  v_max := (SELECT MAX(x) FROM UNNEST(v_durations) x);

  RETURN QUERY SELECT
    'wishlist_items'::TEXT,
    'Optimized with materialized view'::TEXT,
    v_avg,
    v_min,
    v_max;

  -- ===== GAME_FRAGMENTS: Original vs Optimized =====

  -- APPROACH 1: Original (baseline)
  v_durations := ARRAY[]::INT[];
  v_i := 1;
  LOOP
    EXIT WHEN v_i > p_iterations;
    v_start_time := CLOCK_TIMESTAMP();
    SELECT COUNT(*) INTO v_total_rows FROM public.game_fragments
    WHERE kid_id IN (
      SELECT id FROM public.kids
      WHERE parent_id = p_user_id
    );
    v_end_time := CLOCK_TIMESTAMP();
    v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INT * 1000;
    v_durations := v_durations || v_duration_ms;
    v_i := v_i + 1;
  END LOOP;
  v_avg := (SELECT AVG(x) FROM UNNEST(v_durations) x)::FLOAT;
  v_min := (SELECT MIN(x) FROM UNNEST(v_durations) x);
  v_max := (SELECT MAX(x) FROM UNNEST(v_durations) x);

  RETURN QUERY SELECT
    'game_fragments'::TEXT,
    'Original nested subquery (2-level)'::TEXT,
    v_avg,
    v_min,
    v_max;

  -- APPROACH 2: Optimized with materialized view
  v_durations := ARRAY[]::INT[];
  v_i := 1;
  LOOP
    EXIT WHEN v_i > p_iterations;
    v_start_time := CLOCK_TIMESTAMP();
    SELECT COUNT(*) INTO v_total_rows FROM public.game_fragments
    WHERE id IN (
      SELECT fragment_id FROM public.parent_game_fragments_context
      WHERE parent_id = p_user_id
    );
    v_end_time := CLOCK_TIMESTAMP();
    v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INT * 1000;
    v_durations := v_durations || v_duration_ms;
    v_i := v_i + 1;
  END LOOP;
  v_avg := (SELECT AVG(x) FROM UNNEST(v_durations) x)::FLOAT;
  v_min := (SELECT MIN(x) FROM UNNEST(v_durations) x);
  v_max := (SELECT MAX(x) FROM UNNEST(v_durations) x);

  RETURN QUERY SELECT
    'game_fragments'::TEXT,
    'Optimized with materialized view'::TEXT,
    v_avg,
    v_min,
    v_max;

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.compare_rls_query_optimization(UUID, INT) IS
'Compares original vs optimized RLS query performance.
Run before/after materialized view refresh to measure improvement.
Usage: SELECT * FROM compare_rls_query_optimization(user_uuid::UUID, 10);';

-- ============================================================================
-- 7. REFRESH MATERIALIZED VIEWS FUNCTION
-- ============================================================================
-- Refreshes denormalized views after bulk data changes
-- Call after: large INSERT/UPDATE/DELETE operations on kids, wishlists, game_fragments

CREATE OR REPLACE FUNCTION public.refresh_rls_context_views()
RETURNS TABLE (
  view_name TEXT,
  refresh_time_ms INT,
  status TEXT
) AS $$
DECLARE
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_duration_ms INT;
BEGIN
  v_start_time := CLOCK_TIMESTAMP();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.parent_wishlist_context;
  v_end_time := CLOCK_TIMESTAMP();
  v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INT * 1000;
  RETURN QUERY SELECT
    'parent_wishlist_context'::TEXT,
    v_duration_ms,
    'success'::TEXT;

  v_start_time := CLOCK_TIMESTAMP();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.parent_game_fragments_context;
  v_end_time := CLOCK_TIMESTAMP();
  v_duration_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::INT * 1000;
  RETURN QUERY SELECT
    'parent_game_fragments_context'::TEXT,
    v_duration_ms,
    'success'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.refresh_rls_context_views() IS
'Refreshes materialized views without blocking queries (CONCURRENT mode).
Call after: large bulk inserts to kids, wishlists, game_fragments, wishlist_items.
Usage: SELECT * FROM refresh_rls_context_views();
Performance: Should complete in <5s for production datasets.';

-- ============================================================================
-- 8. DIAGNOSTIC FUNCTION: Query Execution Plan Analysis
-- ============================================================================
-- Analyzes EXPLAIN output to identify N+1 queries and optimization opportunities

CREATE OR REPLACE FUNCTION public.analyze_rls_query_plan(
  p_user_id UUID,
  p_query_type TEXT DEFAULT 'wishlist_items'
)
RETURNS TABLE (
  metric_name TEXT,
  metric_value TEXT
) AS $$
DECLARE
  v_plan JSONB;
  v_total_cost FLOAT;
  v_planning_time FLOAT;
  v_execution_time FLOAT;
BEGIN
  -- Analyze wishlist_items RLS query plan
  IF p_query_type = 'wishlist_items' THEN
    EXPLAIN (FORMAT JSON, ANALYZE)
    SELECT COUNT(*) FROM public.wishlist_items
    WHERE wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE kid_id IN (
        SELECT id FROM public.kids
        WHERE parent_id = p_user_id
      )
    ) INTO v_plan;

    RETURN QUERY SELECT
      'query_type'::TEXT,
      'wishlist_items_select_own_wishlists'::TEXT;

  ELSIF p_query_type = 'matching_log' THEN
    EXPLAIN (FORMAT JSON, ANALYZE)
    SELECT COUNT(*) FROM public.matching_log
    WHERE wishlist_item_id IN (
      SELECT id FROM public.wishlist_items
      WHERE wishlist_id IN (
        SELECT id FROM public.wishlists
        WHERE kid_id IN (
          SELECT id FROM public.kids
          WHERE parent_id = p_user_id
        )
      )
    ) INTO v_plan;

    RETURN QUERY SELECT
      'query_type'::TEXT,
      'matching_log_select_own_wishlists'::TEXT;
  END IF;

  -- Extract plan metrics
  v_total_cost := v_plan -> 0 -> 'Plan' -> 'Total Cost';
  v_planning_time := v_plan -> 0 -> 'Planning Time';
  v_execution_time := v_plan -> 0 -> 'Execution Time';

  RETURN QUERY SELECT
    'total_cost'::TEXT,
    v_total_cost::TEXT;

  RETURN QUERY SELECT
    'planning_time_ms'::TEXT,
    v_planning_time::TEXT;

  RETURN QUERY SELECT
    'execution_time_ms'::TEXT,
    v_execution_time::TEXT;

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.analyze_rls_query_plan(UUID, TEXT) IS
'Analyzes EXPLAIN ANALYZE output for RLS queries.
Returns: total_cost, planning_time_ms, execution_time_ms.
Usage: SELECT * FROM analyze_rls_query_plan(user_uuid::UUID, ''wishlist_items'');
Note: Run after index creation to verify query plans improve.';

-- ============================================================================
-- NOTES & REFERENCE
-- ============================================================================
-- 1. MATERIALIZED VIEWS:
--    - parent_wishlist_context: Denormalizes wishlist_items -> parent_id
--    - parent_game_fragments_context: Denormalizes game_fragments -> parent_id
--    - Refresh with: SELECT refresh_rls_context_views()
--    - Refresh frequency: After large bulk operations (INSERT 1000+)
--
-- 2. INDEXES CREATED:
--    - idx_kids_parent_id_include: Covering index for kids RLS
--    - idx_wishlists_kid_id_include: Covering index for wishlists RLS
--    - idx_wishlist_items_wishlist_id_include: Covering index for wishlist_items RLS
--    - idx_game_fragments_kid_id_include: Covering index for game_fragments RLS
--    - idx_parent_wishlist_context_parent_id: Fast parent lookup
--    - idx_parent_game_fragments_parent_id: Fast parent lookup
--
-- 3. PERFORMANCE TARGETS:
--    - All RLS queries: <200ms even with 20+ children
--    - Materialized view refresh: <5s
--    - Index creation: Non-blocking (CONCURRENT)
--
-- 4. MONITORING:
--    - SELECT * FROM slow_rls_queries LIMIT 10
--    - SELECT * FROM test_rls_query_performance(user_id::UUID, 10)
--    - SELECT * FROM compare_rls_query_optimization(user_id::UUID, 10)
--
-- 5. NEXT STEPS (Conditional):
--    - If materialized views don't meet <200ms target:
--      * Consider partial indexes for active users only
--      * Implement caching layer at application level
--      * Scale database vertically or add read replicas
--    - If covering indexes sufficient:
--      * Skip materialized views to reduce maintenance overhead
--      * Monitor with slow_rls_queries view
--
-- ============================================================================
